export type NutritionGuess = {
  title: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export async function analyzeFoodFromImage(_uri: string): Promise<NutritionGuess> {
  return {
    title: '鶏むねサラダ（推定）',
    calories: 420,
    protein: 35,
    fat: 12,
    carbs: 45,
  };
}
