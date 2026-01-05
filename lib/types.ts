// lib/types.ts
export type Meal = {
  id?: number;
  ts: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  photoUri?: string | null;
};

export type BodyMetric = {
  id?: number;
  ts: number;
  weight: number;
  bodyFat?: number | null;
  muscle?: number | null;
  waist?: number | null;
  notes?: string;
};
