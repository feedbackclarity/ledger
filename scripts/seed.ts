// Run with: npx tsx scripts/seed.ts path/to/ledger-backup.json
// Or: node --import tsx/esm scripts/seed.ts path/to/ledger-backup.json
//
// Imports a JSON backup (exported from the artifact's Settings → Export Backup)
// into the local SQLite database.

import fs from 'fs';
import path from 'path';
import { kvSet } from '../lib/db';

const file = process.argv[2];
if (!file) {
  console.error('Usage: tsx scripts/seed.ts path/to/ledger-backup.json');
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);

(async () => {
  const keys = ['categories', 'rules', 'transactions', 'income', 'settings', 'importLog', 'snapshotIndex'];
  let count = 0;
  for (const key of keys) {
    if (data[key] !== undefined) {
      await kvSet(key, JSON.stringify(data[key]));
      count++;
      console.log(`✓ Imported ${key}`);
    }
  }
  console.log(`\nDone. Imported ${count} keys from ${path.basename(file)}.`);
})();
