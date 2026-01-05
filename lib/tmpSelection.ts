// lib/tmpSelection.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SelectedProduct = {
  code: string;
  title: string;
  brand?: string;
  image?: string;
  kcal100?: number;
  p100?: number;
  f100?: number;
  c100?: number;
};

const KEY = "BULK_SELECTION_V1";

export async function setBulkSelection(items: SelectedProduct[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function getBulkSelection(): Promise<SelectedProduct[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SelectedProduct[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function clearBulkSelection() {
  await AsyncStorage.removeItem(KEY);
}
