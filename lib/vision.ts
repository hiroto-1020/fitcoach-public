// lib/vision.ts
// 今はモック（ダミー）です。あとで本物の推論APIに差し替え予定。
export type NutritionGuess = {
  title: string;
  calories: number;
  protein: number; // g
  fat: number;     // g
  carbs: number;   // g
};

export async function analyzeFoodFromImage(_uri: string): Promise<NutritionGuess> {
  // ここでは簡易推論（固定パターン）。実運用では画像 カロリー/PFCの推定APIに差し替え。
  // 例: 料理っぽい平均値（だいたい1食ぶん）
  return {
    title: '鶏むねサラダ（推定）',
    calories: 420,
    protein: 35,
    fat: 12,
    carbs: 45,
  };
}
