import AsyncStorage from '@react-native-async-storage/async-storage';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Meal = {
  id: string;
  date: string;
  title: string;
  calories?: number;
  memo?: string;
  photoUri?: string;
  createdAt?: number;     
  updatedAt?: number;
  mealType?: MealType;
  protein?: number;
  fat?: number;
  carbs?: number;
  grams?: number;
};

const MEALS_KEY = 'meals/v1';

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export async function getMeals(): Promise<Record<string, Meal>> {
  const raw = await AsyncStorage.getItem(MEALS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveMeal(meal: Meal) {
  const all = await getMeals();
  all[meal.id] = meal;
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(all));
}
