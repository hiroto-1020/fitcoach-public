// lib/favorites.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FavoriteProduct = {
  code: string;              // OFF code（JAN等）
  title: string;             // 表示名
  brand?: string;
  image?: string;
  // 任意メタ（100g栄養のスナップショット）
  kcal100?: number;
  p100?: number;
  f100?: number;
  c100?: number;
  savedAt: number;
};

const KEY = "FAVORITES_V1";

export async function listFavorites(): Promise<FavoriteProduct[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as FavoriteProduct[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function isFavorite(code: string): Promise<boolean> {
  const all = await listFavorites();
  return all.some((f) => f.code === code);
}

export async function toggleFavorite(item: FavoriteProduct): Promise<boolean> {
  const all = await listFavorites();
  const idx = all.findIndex((f) => f.code === item.code);
  if (idx >= 0) {
    all.splice(idx, 1);
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
    return false; // 外れた
  } else {
    all.unshift({ ...item, savedAt: Date.now() });
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
    return true; // 付いた
  }
}
