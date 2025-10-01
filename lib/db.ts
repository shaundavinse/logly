import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'logs.db');
    db = new Database(dbPath);

    // Create logs table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL DEFAULT 'INFO',
        origin TEXT,
        message TEXT NOT NULL,
        payload TEXT,
        created_at INTEGER DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
      )
    `);

    // Create indexes for faster filtering
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_logs_origin ON logs(origin);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
    `);
  }

  return db;
}

export interface Log {
  id: number;
  level: LogLevel;
  origin: string | null;
  message: string;
  payload: string | null;
  created_at: number;
}

export interface CreateLogInput {
  level?: LogLevel;
  origin?: string;
  message: string;
  payload?: any;
}
