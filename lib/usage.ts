import AsyncStorage from "@react-native-async-storage/async-storage";

export type UsageItem = {
  id: string;
  code?: string;
  title?: string;
  brand?: string;
  photoUri?: string;
  calories?: number;
  protein?: number;
  createdAt: number;
};

const KEY = "meal_usage_v1";

export async function addUsage(item: UsageItem) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr: UsageItem[] = raw ? JSON.parse(raw) : [];
    arr.unshift(item);
    const trimmed = arr.slice(0, 200);
    await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {}
}

export async function listUsage(limit = 50): Promise<UsageItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const arr: UsageItem[] = raw ? JSON.parse(raw) : [];
    return arr.slice(0, limit);
  } catch {
    return [];
  }
}
