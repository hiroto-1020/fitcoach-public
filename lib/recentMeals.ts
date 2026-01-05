import dayjs from "dayjs";
import { listMealsInMonth } from "./storage";
import type { Meal } from "./meals";

export async function listRecentMeals(limit: number = 10): Promise<Meal[]> {
  const now = dayjs();
  const buckets: Meal[][] = [];

  for (let i = 0; i < 6; i++) {
    const d = now.subtract(i, "month");
    try {
      const arr = await listMealsInMonth(d.year(), d.month());
      buckets.push(arr || []);
    } catch {
    }
  }

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
    return bt - at;
  });

  return uniq.slice(0, limit);
}
