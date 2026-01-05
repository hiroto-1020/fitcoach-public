import { openDatabaseSync } from 'expo-sqlite';

export const db = openDatabaseSync('FitGear.db');

type RunResult<T> = { rows: T[]; rowsAffected: number; insertId?: number };

export async function run<T = any>(sql: string, params: any[] = []): Promise<RunResult<T>> {
  const isSelect = /^\s*select/i.test(sql);
  if (isSelect) {
    const rows = await db.getAllAsync<T>(sql, params);
    return { rows, rowsAffected: 0 };
  } else {
    const r = await db.runAsync(sql, params);
    return { rows: [], rowsAffected: r.changes, insertId: r.lastInsertRowId };
  }
}

export async function initDb() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      name TEXT,
      calories INTEGER
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS body_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      weight REAL NOT NULL,
      bodyFat REAL,
      muscle REAL,
      waist REAL,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_body_metrics_ts ON body_metrics (ts DESC);
  `);
}

