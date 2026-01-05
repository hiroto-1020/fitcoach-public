// lib/bodyView.ts
import { BodyMetric } from './types';
import dayjs from './dayjs';

export type Period = 'day' | 'week' | 'month';
export type Metric = 'weight' | 'bodyFat' | 'both';

export type BucketPoint = {
  key: string;        // 例: '2025-10-15' / '2025-W42' / '2025-10'
  label: string;      // 例: '10/15' / '2025週42' / '2025/10'
  weightAvg: number|null;
  bodyFatAvg: number|null;
  count: number;
  dateForSort: string; // ソート用 'YYYY-MM-DD'
};

type Norm = {
  ts: number;               // ms
  date: string;             // 'YYYY-MM-DD'
  weight: number|null;
  bodyFat: number|null;
};

/** DBレコード → 表示用の正規化（tsは秒/文字列にも耐性） */
export function normalize(list: BodyMetric[]): Norm[] {
  return list.map(m => {
    const tsMs = typeof m.ts === 'number'
      ? (m.ts < 1e12 ? m.ts * 1000 : m.ts) // 秒ならmsに
      : dayjs(m.ts as any).valueOf();
    return {
      ts: tsMs,
      date: dayjs(tsMs).format('YYYY-MM-DD'),
      weight: m.weight ?? null,
      bodyFat: (m as any).bodyFat ?? null, // types側がoptionalでもOKに
    };
  });
}

/** 同一日の複数は最新(ts最大)のみ採用 */
export function pickLatestPerDay(norms: Norm[]): Norm[] {
  const map = new Map<string, Norm>();
  // ts昇順で回し、同日は最後（最新）で上書き
  norms.sort((a,b)=>a.ts - b.ts).forEach(n => map.set(n.date, n));
  return Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date));
}

export function bucketByDay(list: BodyMetric[]): BucketPoint[] {
  const d = pickLatestPerDay(normalize(list));
  return d.map(n => ({
    key: n.date,
    label: dayjs(n.date).format('M/D'),
    weightAvg: to1(n.weight),
    bodyFatAvg: to1(n.bodyFat),
    count: 1,
    dateForSort: n.date,
  }));
}

export function bucketByWeek(list: BodyMetric[]): BucketPoint[] {
  const norms = normalize(list);
  const map = new Map<string, Norm[]>();
  for (const n of norms) {
    const wYear = dayjs(n.date).isoWeekYear();
    const w = dayjs(n.date).isoWeek();
    const key = `${wYear}-W${String(w).padStart(2,'0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  const out: BucketPoint[] = [];
  map.forEach((arr, key) => {
    out.push({
      key,
      label: key.replace('-W','週'),
      weightAvg: avg(arr.map(a=>a.weight)),
      bodyFatAvg: avg(arr.map(a=>a.bodyFat)),
      count: arr.length,
      dateForSort: dayjs(arr[0].date).startOf('week').format('YYYY-MM-DD'),
    });
  });
  return out.sort((a,b)=>a.dateForSort.localeCompare(b.dateForSort));
}

export function bucketByMonth(list: BodyMetric[]): BucketPoint[] {
  const norms = normalize(list);
  const map = new Map<string, Norm[]>();
  for (const n of norms) {
    const key = dayjs(n.date).format('YYYY-MM');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  const out: BucketPoint[] = [];
  map.forEach((arr, key) => {
    out.push({
      key,
      label: dayjs(key).format('YYYY/MM'),
      weightAvg: avg(arr.map(a=>a.weight)),
      bodyFatAvg: avg(arr.map(a=>a.bodyFat)),
      count: arr.length,
      dateForSort: dayjs(key).format('YYYY-MM-01'),
    });
  });
  return out.sort((a,b)=>a.dateForSort.localeCompare(b.dateForSort));
}

/** 7点移動平均（nullは除外、全null区間はnull） */
export function rollingAvg(series: (number|null)[], window=7): (number|null)[] {
  const out: (number|null)[] = [];
  for (let i=0;i<series.length;i++){
    const start = Math.max(0, i-window+1);
    const slice = series.slice(start, i+1).filter(v=>v!=null) as number[];
    out.push(slice.length? to1(slice.reduce((a,b)=>a+b,0)/slice.length) : null);
  }
  return out;
}

export function calcSummary(points: BucketPoint[]) {
  const w = points.map(p=>p.weightAvg).filter(n=>n!=null) as number[];
  const f = points.map(p=>p.bodyFatAvg).filter(n=>n!=null) as number[];
  const avgW = avg(w), avgF = avg(f);
  const minW = min(w), maxW = max(w);
  const minF = min(f), maxF = max(f);
  return { avgW, avgF, minW, maxW, minF, maxF };
}

export function weeklyTrend(pts: BucketPoint[]) {
  const w = pts.map(p=>p.weightAvg).filter(v=>v!=null) as number[];
  if (w.length < 8) return null;
  const recent = w.slice(-7), before = w.slice(-14, -7);
  const avg = (a:number[])=> a.reduce((x,y)=>x+y,0)/a.length;
  return Number((avg(recent)-avg(before)).toFixed(2)); // +なら増
}

// helpers
function avg(arr:(number|null|undefined)[]){ 
  const v = arr.filter(a=>a!=null) as number[];
  return v.length ? to1(v.reduce((a,b)=>a+b,0)/v.length) : null;
}
function min(arr:number[]){ return arr.length? Math.min(...arr): null; }
function max(arr:number[]){ return arr.length? Math.max(...arr): null; }
function to1(n:number|null){ return n==null? null : Number(n.toFixed(1)); }
