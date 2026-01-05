import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Meal } from "./meals";

// 既存プロジェクトで使っているキー名があるならそれを優先してください。
// 不明な場合は下記の候補を順に試します。
const MEALS_KEYS_CANDIDATES = ["MEALS_V2", "meals_v2", "meals_v1", "meals"];

type MealsIndex = Meal[];

/* ---------- ユーティリティ ---------- */
function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function genId(prefix = "meal") {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

/* ---------- 低レベル：読み書き（内部用） ---------- */
async function readFirstExistingKey(): Promise<string> {
  // 既に保存があるキーを優先して使う
  for (const k of MEALS_KEYS_CANDIDATES) {
    const raw = await AsyncStorage.getItem(k);
    if (raw) return k;
  }
  // なければ先頭を使う
  return MEALS_KEYS_CANDIDATES[0];
}

async function loadAll(): Promise<MealsIndex> {
  try {
    const key = await readFirstExistingKey();
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as MealsIndex) : [];
  } catch {
    return [];
  }
}

async function saveAll(items: MealsIndex): Promise<void> {
  const key = await readFirstExistingKey();
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

/* ---------- 公開API：食事 CRUD ---------- */
export async function saveMeal(meal: Meal): Promise<void> {
  const all = await loadAll();
  const idx = all.findIndex((m) => m.id === meal.id);
  if (idx >= 0) all[idx] = meal;
  else all.push(meal);
  await saveAll(all);
}

export async function getMeal(id: string): Promise<Meal | undefined> {
  const all = await loadAll();
  return all.find((m) => m.id === id);
}

export async function deleteMeal(id: string): Promise<void> {
  const all = await loadAll();
  await saveAll(all.filter((m) => m.id !== id));
}

export async function listMealsInMonth(year: number, month0: number): Promise<Meal[]> {
  const all = await loadAll();
  const prefix = `${year}-${String(month0 + 1).padStart(2, "0")}-`;
  return all
    .filter((m) => typeof m.date === "string" && (m.date as string).startsWith(prefix))
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

/* ---------- よく使う / 使用履歴（集計） ---------- */
function bucketKey(m: Meal) {
  const t = (m.title || "").trim().toLowerCase();
  const b = (m.brand || "").trim().toLowerCase();
  return `${t}||${b}`;
}

export async function listRecentMeals(limit = 12): Promise<Meal[]> {
  const all = await loadAll();
  return all
    .slice()
    .sort((a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0))
    .slice(0, limit);
}

export async function listFrequentMeals(limit = 12): Promise<(Meal & { usedCount?: number })[]> {
  const all = await loadAll();
  const buckets = new Map<string, { count: number; sample: Meal }>();

  for (const m of all) {
    const key = bucketKey(m);
    const hit = buckets.get(key);
    if (hit) {
      hit.count += 1;
      // 情報が豊富な方をサンプルに
      if (!hit.sample.photoUri && m.photoUri) hit.sample = m;
      if ((hit.sample.calories ?? 0) === 0 && (m.calories ?? 0) > 0) hit.sample = m;
      if ((hit.sample.protein ?? 0) === 0 && (m.protein ?? 0) > 0) hit.sample = m;
      // 更新日時が新しい方を優先
      if ((m.updatedAt ?? 0) > (hit.sample.updatedAt ?? 0)) hit.sample = m;
    } else {
      buckets.set(key, { count: 1, sample: m });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (b.sample.updatedAt ?? b.sample.createdAt ?? 0) - (a.sample.updatedAt ?? a.sample.createdAt ?? 0);
    })
    .map((x) => ({ ...x.sample, usedCount: x.count }))
    .slice(0, limit);
}

/* ---------- ワンタップ再記録 ---------- */
export async function reLogMeal(original: Meal, opts?: { date?: string; mealType?: string }) {
  const now = Date.now();
  const copy: Meal = {
    id: genId("meal"),
    date: opts?.date ?? todayYMD(),
    mealType: (opts?.mealType ?? (original as any).mealType ?? "snack") as any,
    title: original.title,
    brand: original.brand,
    photoUri: original.photoUri,
    grams: (original as any).grams,
    calories: original.calories,
    protein: original.protein,
    fat: (original as any).fat,
    carbs: (original as any).carbs,
    createdAt: now,
    updatedAt: now,
  };
  await saveMeal(copy);
  return copy;
}

/* ---------- 共通：Key/Value & JSON ヘルパー ---------- */
export const STORAGE_KEYS = {
  FAVORITES: "favorites_product_codes",
};

export async function getItem(key: string) {
  return AsyncStorage.getItem(key);
}
export async function setItem(key: string, value: string) {
  return AsyncStorage.setItem(key, value);
}

//  追加：JSON汎用ヘルパー（今回のエラー対策）
export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
export async function setJSON(key: string, value: any): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// どちらの import 形でも使えるよう default も用意
export default { getItem, setItem, getJSON, setJSON };
