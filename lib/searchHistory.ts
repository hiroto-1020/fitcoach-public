import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "SEARCH_HISTORY_V1";

export type SearchRecord = { query: string; time: number };

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
  }
}

export async function listHistory(limit = 10): Promise<SearchRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr: SearchRecord[] = raw ? JSON.parse(raw) : [];
    return arr.slice(0, Math.max(1, Math.min(10, limit)));
  } catch {
    return [];
  }
}

export async function deleteHistory(query: string) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr: SearchRecord[] = raw ? JSON.parse(raw) : [];
    const next = arr.filter((r) => r.query !== query).slice(0, 10);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
  }
}

export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
  }
}
