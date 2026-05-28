import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dataDir = process.env.DATA_DIR || './data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'ledger.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Single key-value table mirrors the artifact's window.storage interface
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      tx_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      uploaded_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_tx ON attachments(tx_id);
  `);

  return db;
}

export function kvGet(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function kvSet(key: string, value: string): void {
  getDb()
    .prepare('INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at')
    .run(key, value, Date.now());
}

export function kvDelete(key: string): void {
  getDb().prepare('DELETE FROM kv WHERE key = ?').run(key);
}

export function kvList(prefix: string = ''): string[] {
  const rows = getDb().prepare('SELECT key FROM kv WHERE key LIKE ? ORDER BY key').all(`${prefix}%`) as { key: string }[];
  return rows.map(r => r.key);
}
