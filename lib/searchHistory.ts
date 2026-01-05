// lib/searchHistory.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "SEARCH_HISTORY_V1";

export type SearchRecord = { query: string; time: number };

/** 検索キーワードを履歴に記録（先頭に追加／重複は先頭へ移動／最大10件） */
export async function recordSearch(query: string) {
  const trimmed = (query || "").trim();
  if (!trimmed) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr: SearchRecord[] = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((r) => r.query !== trimmed);
    const next = [{ query: trimmed, time: Date.now() }, ...filtered].slice(0, 10);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

/** 履歴を最新順で取得（最大10件） */
export async function listHistory(limit = 10): Promise<SearchRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr: SearchRecord[] = raw ? JSON.parse(raw) : [];
    return arr.slice(0, Math.max(1, Math.min(10, limit)));
  } catch {
    return [];
  }
}

/** 指定クエリの履歴を削除 */
export async function deleteHistory(query: string) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr: SearchRecord[] = raw ? JSON.parse(raw) : [];
    const next = arr.filter((r) => r.query !== query).slice(0, 10);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

/** 全消去（必要ならUIから呼ぶ） */
export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
