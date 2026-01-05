// lib/recentMeals.ts
import dayjs from "dayjs";
import { listMealsInMonth } from "./storage";
import type { Meal } from "./meals";

/**
 * 直近の食事を新しい順に返す（最大 limit 件）
 * 実装は安全第一：今月〜過去5ヶ月を走査して集約。
 */
export async function listRecentMeals(limit: number = 10): Promise<Meal[]> {
  const now = dayjs();
  const buckets: Meal[][] = [];

  // 今月 + 過去5ヶ月 = 計6ヶ月分を収集
  for (let i = 0; i < 6; i++) {
    const d = now.subtract(i, "month");
    // 0-based month のため d.month() を渡す
    // 既存の listMealsInMonth に合わせる
    // 例: year=2025, month0=9 (10月)
    // 失敗しても他月が返れば良いので try/catch で握りつぶす
    try {
      const arr = await listMealsInMonth(d.year(), d.month());
      buckets.push(arr || []);
    } catch {
      // ignore
    }
  }

  // フラット化   重複除去（id）  日付降順
  const all = buckets.flat();

  const seen = new Set<string>();
  const uniq: Meal[] = [];
  for (const m of all) {
    const id = String(m.id ?? "");
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    uniq.push(m);
  }

  uniq.sort((a, b) => {
    const at = (a.updatedAt ?? a.createdAt ?? 0) as number;
    const bt = (b.updatedAt ?? b.createdAt ?? 0) as number;
    return bt - at; // 新しい順
  });

  return uniq.slice(0, limit);
}
