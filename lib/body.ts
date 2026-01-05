import { BodyMetric } from './types';
import { run } from './db';

const ALLOWED_FIELDS: (keyof BodyMetric)[] = [
  'ts',
  'weight',
  'bodyFat',
  'muscle',
  'waist',
  'notes',
];

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


export async function addBodyMetric(b: BodyMetric) {
  const { insertId } = await run(
    `INSERT INTO body_metrics (ts, weight, bodyFat, muscle, waist, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [b.ts, b.weight, b.bodyFat ?? null, b.muscle ?? null, b.waist ?? null, b.notes ?? null]
  );
  return insertId;
}

export async function listBodyMetrics(limit = 100): Promise<BodyMetric[]> {
  const { rows } = await run<BodyMetric>(
    `SELECT * FROM body_metrics
      ORDER BY ts DESC
      LIMIT ?`,
    [limit]
  );
  return rows;
}

export async function listBodyMetricsInRange(fromTs: number, toTs: number): Promise<BodyMetric[]> {
  const { rows } = await run<BodyMetric>(
    `SELECT * FROM body_metrics
      WHERE ts BETWEEN ? AND ?
      ORDER BY ts DESC`,
    [fromTs, toTs]
  );
  return rows;
}

export async function getLatestBodyMetric(): Promise<Pick<BodyMetric, 'weight' | 'bodyFat'> | null> {
  const { rows } = await run<BodyMetric>(
    `SELECT weight, bodyFat FROM body_metrics
      ORDER BY ts DESC
      LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function getBodyMetricById(id: number): Promise<BodyMetric | null> {
  const { rows } = await run<BodyMetric>(
    `SELECT * FROM body_metrics WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getBodyMetricByTs(ts: number): Promise<BodyMetric | null> {
  const { rows } = await run<BodyMetric>(
    `SELECT * FROM body_metrics WHERE ts = ? LIMIT 1`,
    [ts]
  );
  return rows[0] ?? null;
}


export async function updateBodyMetric(id: number, patch: Partial<BodyMetric>) {
  const { setSql, params } = buildUpdateSetClause(patch);
  if (!setSql) return 0;

  const { rowsAffected } = await run(
    `UPDATE body_metrics
        SET ${setSql}
      WHERE id = ?`,
    [...params, id]
  );
  return rowsAffected;
}

export async function deleteBodyMetric(id: number) {
  const { rowsAffected } = await run(
    `DELETE FROM body_metrics WHERE id = ?`,
    [id]
  );
  return rowsAffected;
}


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

export async function deleteBodyMetricByTs(ts: number) {
  const { rowsAffected } = await run(
    `DELETE FROM body_metrics WHERE ts = ?`,
    [ts]
  );
  return rowsAffected;
}
