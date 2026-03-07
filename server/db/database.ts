import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), 'data', 'telly.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable foreign keys and WAL mode for better performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Run migrations for existing databases
function runMigrations(): void {
  // Check if prototypes table has current_version column
  const columns = db.prepare("PRAGMA table_info(prototypes)").all() as { name: string }[];
  const columnNames = columns.map(c => c.name);

  if (!columnNames.includes('current_version')) {
    db.exec('ALTER TABLE prototypes ADD COLUMN current_version INTEGER DEFAULT 1');
    console.log('Migration: Added current_version column to prototypes');
  }

  if (!columnNames.includes('total_versions')) {
    db.exec('ALTER TABLE prototypes ADD COLUMN total_versions INTEGER DEFAULT 1');
    console.log('Migration: Added total_versions column to prototypes');
  }

  if (!columnNames.includes('led_settings')) {
    db.exec('ALTER TABLE prototypes ADD COLUMN led_settings TEXT');
    console.log('Migration: Added led_settings column to prototypes');
  }
}

// Initialize schema
export function initializeDatabase(): void {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  // Run any pending migrations
  runMigrations();

  console.log('Database initialized at:', DB_PATH);
}

export default db;
