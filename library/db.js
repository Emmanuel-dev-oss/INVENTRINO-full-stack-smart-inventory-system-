import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── resolve __dirname equivalent in ES modules ───
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DB_FILE = path.resolve(__dirname, '../data/db.json');

// ─────────────────────────────────────────────
// Ensure the data directory and file exist
// ─────────────────────────────────────────────
function ensureDB() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ categories: [] }, null, 2), 'utf8');
  }
}

// ─────────────────────────────────────────────
// Read the full database from disk
// ─────────────────────────────────────────────
export function readDB() {
  ensureDB();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { categories: [] };
  }
}

// ─────────────────────────────────────────────
// Persist the full database to disk
// ─────────────────────────────────────────────
export function writeDB(db) {
  ensureDB();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}
