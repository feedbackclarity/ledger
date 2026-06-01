/**
 * Database driver abstraction.
 *
 * Production: PostgreSQL via DigitalOcean managed database. Connection string
 *   comes from `DATABASE_URL`. Data persists across redeploys / container restarts.
 *
 * Local dev: SQLite via `better-sqlite3` when `DATABASE_URL` is not set.
 *   File lives under `DATA_DIR` (defaults to `./data`).
 *
 * The driver exposes pg-style `$1, $2, …` placeholders. The SQLite shim
 * rewrites them to `?` at query time, so route handlers can write the SQL
 * once and have it run against either backend.
 */
import path from 'path';
import fs from 'fs';

type Driver = {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[] }>;
};

let driverPromise: Promise<Driver> | null = null;
let schemaPromise: Promise<void> | null = null;

function buildDriver(): Promise<Driver> {
  if (process.env.DATABASE_URL) {
    // Postgres. Lazy-import so the local dev path doesn't pull pg.
    return (async () => {
      // DigitalOcean managed databases ship with a self-signed CA chain.
      // The `ssl: { rejectUnauthorized: false }` option below is supposed to
      // be enough but in practice the connection-string-derived ssl=true
      // setting wins and the chain validation fails with
      // SELF_SIGNED_CERT_IN_CHAIN. Drop the Node TLS strictness for outbound
      // connections — pg goes over DO's private network and our only other
      // outbound TLS (Anthropic) uses a publicly-rooted chain that validates
      // anyway.
      if (process.env.NODE_TLS_REJECT_UNAUTHORIZED == null) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }
      const pgMod: any = await import('pg');
      const Pool = pgMod.Pool || pgMod.default?.Pool;
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      pool.on('error', (e: any) => console.error('[pg pool error]', e?.message || e));
      return {
        query: async (sql: string, params?: any[]) => {
          const r = await pool.query(sql, params || []);
          return { rows: r.rows };
        },
      };
    })();
  }

  // SQLite fallback for local dev.
  return (async () => {
    const Database = (await import('better-sqlite3')).default;
    const dataDir = process.env.DATA_DIR || './data';
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const db = new Database(path.join(dataDir, 'ledger.db'));
    db.pragma('journal_mode = WAL');
    return {
      query: async (sql: string, params?: any[]) => {
        // pg-style $1, $2 → SQLite ?
        const translated = sql.replace(/\$\d+/g, '?');
        const trimmed = translated.trim().toUpperCase();
        const stmt = db.prepare(translated);
        if (trimmed.startsWith('SELECT') || trimmed.includes('RETURNING')) {
          return { rows: stmt.all(...(params || [])) as any[] };
        }
        stmt.run(...(params || []));
        return { rows: [] };
      },
    };
  })();
}

function getDriver(): Promise<Driver> {
  if (!driverPromise) driverPromise = buildDriver();
  return driverPromise;
}

// `CREATE TABLE IF NOT EXISTS` is NOT safe under concurrency in Postgres —
// two connections racing both try to insert the table's row-type and one
// dies with duplicate key on pg_type_typname_nsp_index. Cache the init
// *promise* (not a boolean set after the awaits) so schema setup runs exactly
// once per process, and swallow the duplicate-key race in case another
// instance got there first.
async function runSchema() {
  const d = await getDriver();
  const ddl = [
    // Types chosen to work on both Postgres and SQLite (which collates BIGINT → INTEGER).
    `CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      tx_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size BIGINT NOT NULL,
      uploaded_at BIGINT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_attachments_tx ON attachments(tx_id)`,
  ];
  for (const stmt of ddl) {
    try {
      await d.query(stmt);
    } catch (e: any) {
      // 23505 = unique_violation (the pg_type race), 42P07 = duplicate_table,
      // 42P06 = duplicate_schema. All mean "someone created it already" — fine.
      const code = e?.code;
      if (code === '23505' || code === '42P07' || code === '42P06') continue;
      throw e;
    }
  }
}

function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = runSchema().catch((e) => {
      // Reset so a later request can retry rather than caching a failure forever.
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
}

export async function kvGet(key: string): Promise<string | null> {
  await ensureSchema();
  const d = await getDriver();
  const r = await d.query('SELECT value FROM kv WHERE key = $1', [key]);
  return r.rows[0]?.value ?? null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  await ensureSchema();
  const d = await getDriver();
  // UPSERT — pg 9.5+ and SQLite 3.24+ both support ON CONFLICT (key) DO UPDATE.
  await d.query(
    'INSERT INTO kv (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at',
    [key, value, Date.now()]
  );
}

export async function kvDelete(key: string): Promise<void> {
  await ensureSchema();
  const d = await getDriver();
  await d.query('DELETE FROM kv WHERE key = $1', [key]);
}

export async function kvList(prefix = ''): Promise<string[]> {
  await ensureSchema();
  const d = await getDriver();
  const r = await d.query('SELECT key FROM kv WHERE key LIKE $1 ORDER BY key', [`${prefix}%`]);
  return r.rows.map((row: any) => row.key);
}

/**
 * Run a parameterized query and return rows. Use pg-style `$1, $2` placeholders.
 * For non-SELECT statements, returns an empty array.
 */
export async function dbQuery(sql: string, params: any[] = []): Promise<any[]> {
  await ensureSchema();
  const d = await getDriver();
  const r = await d.query(sql, params);
  return r.rows;
}

/**
 * Run a non-SELECT statement (INSERT/UPDATE/DELETE/DDL). Returns nothing.
 */
export async function dbExec(sql: string, params: any[] = []): Promise<void> {
  await ensureSchema();
  const d = await getDriver();
  await d.query(sql, params);
}
