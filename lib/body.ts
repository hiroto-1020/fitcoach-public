// lib/body.ts  ← 完全版（編集/削除対応を強化・安全化）
import { BodyMetric } from './types';
import { run } from './db';

/**
 * 受け付ける列をホワイトリスト化（SQLインジェクション防止 & スキーマ逸脱防止）
 * ※ id は自動採番想定なので含めない
 */
const ALLOWED_FIELDS: (keyof BodyMetric)[] = [
  'ts',
  'weight',
  'bodyFat',
  'muscle',
  'waist',
  'notes',
];

/** パッチから有効なSET句と値配列を生成（undefinedは無視） */
function buildUpdateSetClause(patch: Partial<BodyMetric>): { setSql: string; params: any[] } {
  const sets: string[] = [];
  const params: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (!ALLOWED_FIELDS.includes(k as keyof BodyMetric)) continue;
    sets.push(`${k} = ?`);
    params.push(v);
  }
  return { setSql: sets.join(', '), params };
}

/* =========================
   CREATE / READ
   ========================= */

export async function addBodyMetric(b: BodyMetric) {
  const { insertId } = await run(
    `INSERT INTO body_metrics (ts, weight, bodyFat, muscle, waist, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [b.ts, b.weight, b.bodyFat ?? null, b.muscle ?? null, b.waist ?? null, b.notes ?? null]
  );
  return insertId;
}

/** 新しい順で取得（デフォ100件） */
export async function listBodyMetrics(limit = 100): Promise<BodyMetric[]> {
  const { rows } = await run<BodyMetric>(
    `SELECT * FROM body_metrics
      ORDER BY ts DESC
      LIMIT ?`,
    [limit]
  );
  return rows;
}

/** 期間指定で取得（必要なら） */
export async function listBodyMetricsInRange(fromTs: number, toTs: number): Promise<BodyMetric[]> {
  const { rows } = await run<BodyMetric>(
    `SELECT * FROM body_metrics
      WHERE ts BETWEEN ? AND ?
      ORDER BY ts DESC`,
    [fromTs, toTs]
  );
  return rows;
}

/** 最新1件の weight / bodyFat */
export async function getLatestBodyMetric(): Promise<Pick<BodyMetric, 'weight' | 'bodyFat'> | null> {
  const { rows } = await run<BodyMetric>(
    `SELECT weight, bodyFat FROM body_metrics
      ORDER BY ts DESC
      LIMIT 1`
  );
  return rows[0] ?? null;
}

/** id 指定で1件取得（編集前などに便利） */
export async function getBodyMetricById(id: number): Promise<BodyMetric | null> {
  const { rows } = await run<BodyMetric>(
    `SELECT * FROM body_metrics WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

/** ts 指定で1件取得（ts主キーに近い扱いをする場合に） */
export async function getBodyMetricByTs(ts: number): Promise<BodyMetric | null> {
  const { rows } = await run<BodyMetric>(
    `SELECT * FROM body_metrics WHERE ts = ? LIMIT 1`,
    [ts]
  );
  return rows[0] ?? null;
}

/* =========================
   UPDATE / DELETE  by id
   ========================= */

/**
 * id で更新（空パッチは更新しない）
 * 返り値: rowsAffected
 */
export async function updateBodyMetric(id: number, patch: Partial<BodyMetric>) {
  const { setSql, params } = buildUpdateSetClause(patch);
  if (!setSql) return 0; // 更新項目なし

  const { rowsAffected } = await run(
    `UPDATE body_metrics
        SET ${setSql}
      WHERE id = ?`,
    [...params, id]
  );
  return rowsAffected;
}

/** id で削除。返り値: rowsAffected */
export async function deleteBodyMetric(id: number) {
  const { rowsAffected } = await run(
    `DELETE FROM body_metrics WHERE id = ?`,
    [id]
  );
  return rowsAffected;
}

/* =========================
   UPDATE / DELETE  by ts（必要なら）
   ========================= */

/**
 * ts で更新（ts自体を変更したい場合もOK）
 * 返り値: rowsAffected
 */
export async function updateBodyMetricByTs(originalTs: number, patch: Partial<BodyMetric>) {
  const { setSql, params } = buildUpdateSetClause(patch);
  if (!setSql) return 0;

  const { rowsAffected } = await run(
    `UPDATE body_metrics
        SET ${setSql}
      WHERE ts = ?`,
    [...params, originalTs]
  );
  return rowsAffected;
}

/** ts で削除。返り値: rowsAffected */
export async function deleteBodyMetricByTs(ts: number) {
  const { rowsAffected } = await run(
    `DELETE FROM body_metrics WHERE ts = ?`,
    [ts]
  );
  return rowsAffected;
}
