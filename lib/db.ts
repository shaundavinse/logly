import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'logs.db');
    db = new Database(dbPath);

    // Create logs table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        origin TEXT,
        message TEXT NOT NULL,
        payload TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for faster filtering
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_logs_origin ON logs(origin);
    `);
  }

  return db;
}

export interface Log {
  id: number;
  origin: string | null;
  message: string;
  payload: string | null;
  created_at: string;
}

export interface CreateLogInput {
  origin?: string;
  message: string;
  payload?: any;
}
