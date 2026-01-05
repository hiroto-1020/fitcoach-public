// lib/training/db.ts
import * as SQLite from "expo-sqlite";

/** ===== DB open (Async API) ===== */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
async function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync("FitGear.db");
  return dbPromise!;
}

/** ===== Helpers ===== */
async function run(sql: string, ...params: any[]) {
  const db = await getDb();
  return db.runAsync(sql, params.length ? params : undefined);
}
async function getAll<T = any>(sql: string, ...params: any[]): Promise<T[]> {
  const db = await getDb();
  return db.getAllAsync<T>(sql, params.length ? params : undefined);
}
async function getFirst<T = any>(sql: string, ...params: any[]): Promise<T | null> {
  const db = await getDb();
  return (await db.getFirstAsync<T>(sql, params.length ? params : undefined)) ?? null;
}

/** ===== Schema & Seed ===== */
export async function initTrainingDb() {
  const db = await getDb();
  await db.execAsync(`PRAGMA foreign_keys = ON;`);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS body_parts(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS exercises(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      body_part_id INTEGER,
      equipment TEXT,
      unit TEXT NOT NULL DEFAULT 'kg',
      is_default INTEGER NOT NULL DEFAULT 1,
      is_archived INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(body_part_id) REFERENCES body_parts(id)
    );

    CREATE TABLE IF NOT EXISTS training_sessions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      start_at TEXT, end_at TEXT, note TEXT,
      total_sets INTEGER NOT NULL DEFAULT 0,
      total_reps INTEGER NOT NULL DEFAULT 0,
      total_load_kg REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS training_sets(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_index INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL,
      rpe REAL, rir REAL,
      is_warmup INTEGER NOT NULL DEFAULT 0,
      tempo TEXT, rest_sec INTEGER,
      FOREIGN KEY(session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(exercise_id) REFERENCES exercises(id)
    );

    -- セッションに紐づくメディア（画像/動画）
    CREATE TABLE IF NOT EXISTS training_session_media(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      uri TEXT NOT NULL,
      thumb_uri TEXT,
      type TEXT NOT NULL CHECK(type IN ('image','video')),
      width INTEGER, height INTEGER, duration_sec REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES training_sessions(id) ON DELETE CASCADE
    );
  `);
  await seedDefaults();
}

async function seedDefaults() {
  const c = await getFirst<{ c: number }>(`SELECT COUNT(1) as c FROM body_parts;`);
  if ((c?.c ?? 0) > 0) return;

  const parts = ["胸", "背中", "肩", "腕", "脚", "お尻", "体幹", "全身"];
  for (let i = 0; i < parts.length; i++) {
    await run(`INSERT INTO body_parts(name, sort_order) VALUES(?, ?)`, parts[i], i);
  }

  const pairs: [string, string][] = [
    // 胸
    ["ベンチプレス", "胸"],
    ["ダンベルフライ", "胸"],
    ["インクラインダンベルプレス", "胸"],
    // 背中
    ["デッドリフト", "背中"],
    ["ラットプルダウン", "背中"],
    ["ベントオーバーロウ", "背中"],
    // 肩
    ["ショルダープレス", "肩"],
    ["サイドレイズ", "肩"],
    ["リアレイズ", "肩"],
    // 腕
    ["バーベルカール", "腕"],
    ["トライセプスプレスダウン", "腕"],
    // 脚
    ["スクワット", "脚"],
    ["レッグプレス", "脚"],
    // お尻
    ["ヒップスラスト", "お尻"],
    ["ブルガリアンスクワット", "お尻"],
    // 体幹
    ["プランク", "体幹"],
    ["ロシアンツイスト", "体幹"],
    // 全身
    ["クリーン", "全身"],
    ["スナッチ", "全身"],
  ];

  for (const [name, part] of pairs) {
    await run(
      `INSERT INTO exercises(name, body_part_id, equipment, unit, is_default, is_archived)
       SELECT ?, id, NULL, 'kg', 1, 0
       FROM body_parts WHERE name=?`,
      name,
      part
    );
  }
}

/** ===== Sessions / Dates ===== */
export async function getOrCreateSession(date: string) {
  const s = await getFirst<{ id: number }>(`SELECT id FROM training_sessions WHERE date=?`, date);
  if (s) return s.id;
  const r = await run(`INSERT INTO training_sessions(date) VALUES(?)`, date);
  return Number(r.lastInsertRowId);
}

export async function findSessionIdByDate(date: string) {
  const s = await getFirst<{ id: number }>(`SELECT id FROM training_sessions WHERE date=?`, date);
  return s?.id ?? null;
}

export async function listSessionDatesInMonth(ym: string) {
  return getAll<{ date: string }>(
    `SELECT date FROM training_sessions WHERE strftime('%Y-%m', date)=? ORDER BY date ASC`,
    ym
  );
}

/** 指定部位に関連する日付（YYYY-MM） */
export async function listSessionDatesInMonthByBodyPart(ym: string, body_part_id: number) {
  await initTrainingDb();
  return getAll<{ date: string }>(
    `
    SELECT DISTINCT s.date
    FROM training_sessions s
    JOIN training_sets ts ON ts.session_id = s.id
    JOIN exercises e   ON e.id = ts.exercise_id
    WHERE strftime('%Y-%m', s.date) = ?
      AND e.body_part_id = ?
      AND e.is_archived = 0
    ORDER BY s.date ASC
  `,
    ym,
    body_part_id
  );
}

export async function listAllSessionDates() {
  const rows = await getAll<{ date: string }>(`SELECT date FROM training_sessions ORDER BY date ASC`);
  return rows.map((r) => r.date);
}

/** ===== Body Parts / Exercises ===== */
export async function listBodyParts() {
  return getAll<{ id: number; name: string; sort_order: number }>(
    `SELECT * FROM body_parts ORDER BY sort_order ASC, name ASC;`
  );
}

export async function insertBodyPart(name: string) {
  await run(
    `INSERT INTO body_parts(name, sort_order) VALUES(?, (SELECT COALESCE(MAX(sort_order),-1)+1 FROM body_parts))`,
    name.trim()
  );
}

export async function deleteBodyPart(body_part_id: number) {
  await initTrainingDb();
  await run(`UPDATE exercises SET body_part_id=NULL WHERE body_part_id=?`, body_part_id);
  await run(`DELETE FROM body_parts WHERE id=?`, body_part_id);
}

export async function listExercisesByBodyPart(body_part_id: number) {
  return getAll<{ id: number; name: string }>(
    `SELECT id,name FROM exercises WHERE is_archived=0 AND body_part_id=? ORDER BY name ASC;`,
    body_part_id
  );
}

export async function listExercisesForPart(body_part_id: number) {
  return getAll<{ id: number; name: string; is_archived: number }>(
    `SELECT id, name, is_archived FROM exercises
     WHERE body_part_id=? ORDER BY is_archived ASC, name ASC`,
    body_part_id
  );
}

export async function insertExercise(name: string, body_part_id: number) {
  await run(
    `INSERT INTO exercises(name, body_part_id, unit, is_default, is_archived) VALUES(?,?,?,?,0)`,
    name.trim(),
    body_part_id,
    "kg",
    0
  );
}

export async function deleteExercise(exercise_id: number): Promise<{ archived: boolean }> {
  await initTrainingDb();
  const ref = await getFirst<{ c: number }>(
    `SELECT COUNT(1) AS c FROM training_sets WHERE exercise_id=?`,
    exercise_id
  );
  if ((ref?.c ?? 0) > 0) {
    await run(`UPDATE exercises SET is_archived=1 WHERE id=?`, exercise_id);
    return { archived: true };
  } else {
    await run(`DELETE FROM exercises WHERE id=?`, exercise_id);
    return { archived: false };
  }
}

/** ===== Sets / Notes ===== */
export async function listSetsBySession(session_id: number) {
  return getAll<any>(
    `
    SELECT ts.*, e.name AS exercise_name, e.unit as unit
    FROM training_sets ts
    JOIN exercises e ON e.id=ts.exercise_id
    WHERE ts.session_id=?
    ORDER BY e.name ASC, set_index ASC;
  `,
    session_id
  );
}

export async function addSet(session_id: number, exercise_id: number, weight_kg: number, reps: number) {
  const last = await getFirst<{ idx: number }>(
    `SELECT COALESCE(MAX(set_index),0) as idx FROM training_sets WHERE session_id=? AND exercise_id=?`,
    session_id,
    exercise_id
  );
  const next = (last?.idx ?? 0) + 1;
  await run(
    `INSERT INTO training_sets(session_id, exercise_id, set_index, weight_kg, reps) VALUES(?,?,?,?,?)`,
    session_id,
    exercise_id,
    next,
    weight_kg,
    reps
  );
}

/** 0kg/0回の空セットを削除（セッション指定 or 全体） */
export async function pruneZeroSets(session_id?: number) {
  await initTrainingDb();
  if (typeof session_id === "number") {
    await run(
      `DELETE FROM training_sets
       WHERE session_id = ?
         AND COALESCE(weight_kg, 0) = 0
         AND COALESCE(reps, 0) = 0`,
      session_id
    );
  } else {
    await run(
      `DELETE FROM training_sets
       WHERE COALESCE(weight_kg, 0) = 0
         AND COALESCE(reps, 0) = 0`
    );
  }
}

/** 明細が空のセッションを削除（メンテ用） */
export async function pruneEmptySessions() {
  await run(`
    DELETE FROM training_sessions
    WHERE id IN (
      SELECT s.id
      FROM training_sessions s
      LEFT JOIN training_sets ts ON ts.session_id = s.id
      GROUP BY s.id
      HAVING COUNT(ts.id) = 0
    );
  `);
}

export async function getSessionNote(session_id: number) {
  const r = await getFirst<{ note: string | null }>(
    `SELECT note FROM training_sessions WHERE id=?`,
    session_id
  );
  return r?.note ?? "";
}
export async function updateSessionNote(session_id: number, note: string) {
  await run(
    `UPDATE training_sessions SET note=? , updated_at=datetime('now') WHERE id=?`,
    note,
    session_id
  );
}

/** ===== Personal Records ===== */
export async function getMaxWeightRecord() {
  return getFirst<{ weight_kg: number; reps: number; exercise_name: string; date: string }>(`
    SELECT ts.weight_kg AS weight_kg, ts.reps AS reps, e.name AS exercise_name, s.date AS date
    FROM training_sets ts
    JOIN training_sessions s ON s.id = ts.session_id
    JOIN exercises e ON e.id = ts.exercise_id
    WHERE ts.is_warmup=0 AND e.is_archived=0
    ORDER BY ts.weight_kg DESC, ts.reps DESC
    LIMIT 1
  `);
}
export async function getMaxRepsRecord() {
  return getFirst<{ reps: number; weight_kg: number; exercise_name: string; date: string }>(`
    SELECT ts.reps AS reps, ts.weight_kg AS weight_kg, e.name AS exercise_name, s.date AS date
    FROM training_sets ts
    JOIN training_sessions s ON s.id = ts.session_id
    JOIN exercises e ON e.id = ts.exercise_id
    WHERE ts.is_warmup=0 AND e.is_archived=0
    ORDER BY ts.reps DESC, ts.weight_kg DESC
    LIMIT 1
  `);
}

/** ===== Session Media ===== */
export type SessionMedia = {
  id: number;
  session_id: number;
  uri: string;
  thumb_uri?: string | null;
  type: "image" | "video";
  width?: number | null;
  height?: number | null;
  duration_sec?: number | null;
  created_at: string;
};

export async function addSessionMedia(
  session_id: number,
  uri: string,
  type: "image" | "video",
  opts?: { thumb_uri?: string | null; width?: number | null; height?: number | null; duration_sec?: number | null }
) {
  const r = await run(
    `INSERT INTO training_session_media(session_id, uri, thumb_uri, type, width, height, duration_sec)
     VALUES(?,?,?,?,?,?,?)`,
    session_id,
    uri,
    opts?.thumb_uri ?? null,
    type,
    opts?.width ?? null,
    opts?.height ?? null,
    opts?.duration_sec ?? null
  );
  return Number(r.lastInsertRowId);
}

export async function listSessionMedia(session_id: number): Promise<SessionMedia[]> {
  return getAll<SessionMedia>(
    `SELECT * FROM training_session_media WHERE session_id=? ORDER BY id DESC`,
    session_id
  );
}

export async function getSessionMediaById(id: number): Promise<SessionMedia | null> {
  return getFirst<SessionMedia>(`SELECT * FROM training_session_media WHERE id=?`, id);
}

export async function deleteSessionMedia(id: number) {
  await run(`DELETE FROM training_session_media WHERE id=?`, id);
}

/** ===== Set CRUD（並び維持版） ===== */
export async function updateSet(id: number, weight_kg: number, reps: number) {
  await run(`UPDATE training_sets SET weight_kg = ?, reps = ? WHERE id = ?`, Number(weight_kg) || 0, Number(reps) || 0, id);
}

export async function updateSetWarmup(id: number, is_warmup: 0 | 1) {
  await run(`UPDATE training_sets SET is_warmup = ? WHERE id = ?`, is_warmup, id);
}

export async function deleteSet(id: number) {
  // 削除後に set_index を詰める
  const row = await getFirst<{ session_id: number; exercise_id: number; set_index: number }>(
    `SELECT session_id, exercise_id, set_index FROM training_sets WHERE id = ?`,
    id
  );
  if (!row) return;
  await run(`DELETE FROM training_sets WHERE id = ?`, id);
  await run(
    `UPDATE training_sets
       SET set_index = set_index - 1
     WHERE session_id = ? AND exercise_id = ? AND set_index > ?`,
    row.session_id,
    row.exercise_id,
    row.set_index
  );
}

export async function insertSetAtIndex(
  session_id: number,
  exercise_id: number,
  set_index: number,
  weight_kg: number,
  reps: number,
  is_warmup: 0 | 1
) {
  // 挿入位置から右を +1 して空きを作る
  await run(
    `UPDATE training_sets
       SET set_index = set_index + 1
     WHERE session_id = ? AND exercise_id = ? AND set_index >= ?`,
    session_id,
    exercise_id,
    set_index
  );
  // 目的位置へ挿入
  await run(
    `INSERT INTO training_sets(session_id, exercise_id, set_index, weight_kg, reps, is_warmup)
     VALUES(?,?,?,?,?,?)`,
    session_id,
    exercise_id,
    set_index,
    Number(weight_kg) || 0,
    Number(reps) || 0,
    is_warmup
  );
}
