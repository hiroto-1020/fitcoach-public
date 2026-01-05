
export type Per100 = { kcal?: number; p?: number; f?: number; c?: number };
export type FoodItem = {
  id: string;
  name: string;
  nameJa?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  per100?: Per100;
  grams?: number;
};

const OFF_WORLD = 'https://world.openfoodfacts.org';
const SEARCH_URL = `${OFF_WORLD}/cgi/search.pl`;
const PRODUCT_URL = `${OFF_WORLD}/api/v2/product`;

function toNumber(x: any): number | undefined {
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function kjToKcal(kj?: number): number | undefined {
  if (!Number.isFinite(kj as number)) return undefined;
  return Math.round(((kj as number) / 4.184) * 10) / 10;
}

function parsePer100(nutriments: any | undefined): Per100 | undefined {
  if (!nutriments) return undefined;
  const kcal =
    toNumber(nutriments['energy-kcal_100g']) ??
    toNumber(nutriments['energy-kcal_value']) ??
    kjToKcal(toNumber(nutriments['energy_100g']));
  const p = toNumber(nutriments['proteins_100g']);
  const f = toNumber(nutriments['fat_100g']);
  const c = toNumber(nutriments['carbohydrates_100g']);
  if ([kcal, p, f, c].some((v) => v != null)) return { kcal, p, f, c };
  return undefined;
}

function parseServingGrams(prod: any): number {
  const q = toNumber(prod?.serving_quantity);
  const unit = String(prod?.serving_quantity_unit ?? '').toLowerCase();
  if (q && (unit.includes('g') || unit.includes('ml'))) return Math.round(q);
  const qty = String(prod?.quantity ?? '');
  const m = qty.match(/([\d.]+)\s*(g|ml|l)/i);
  if (m) {
    const n = Number(m[1]);
    const u = m[2].toLowerCase();
    if (u === 'g' || u === 'ml') return Math.round(n);
    if (u === 'l') return Math.round(n * 1000);
  }
  return 100;
}

function pickNameJa(prod: any): string | undefined {
  return (
    prod?.product_name_ja ||
    prod?.product_name_jp ||
    prod?.product_name_ja_kanji ||
    undefined
  );
}

function buildItemFromProduct(prod: any): FoodItem {
  const per100 = parsePer100(prod?.nutriments);
  return {
    id: String(prod?.code ?? prod?._id ?? Math.random().toString(36).slice(2)),
    name: prod?.product_name || prod?.generic_name || '食品',
    nameJa: pickNameJa(prod) ?? null,
    brand: prod?.brands || prod?.brand_owner || null,
    imageUrl: prod?.image_small_url || prod?.image_front_small_url || null,
    per100,
    grams: parseServingGrams(prod),
  };
}

export async function searchFoods(query: string, limit = 30): Promise<FoodItem[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    json: '1',
    page_size: String(limit),
    fields: [
      'code',
      'product_name',
      'product_name_ja',
      'brands',
      'nutriments',
      'image_small_url',
      'serving_quantity',
      'serving_quantity_unit',
      'quantity',
      'languages_tags',
      'countries_tags',
    ].join(','),
    lc: 'ja',
  });

  const url = `${SEARCH_URL}?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`OFF search failed: ${resp.status}`);
  const json: any = await resp.json();
  const products: any[] = Array.isArray(json?.products) ? json.products : [];

  const scored = products.map((p) => {
    const ja =
      /ja/i.test(p?.lang) ||
      (Array.isArray(p?.languages_tags) && p.languages_tags.some((l: string) => /ja/i.test(l)));
    const per = parsePer100(p?.nutriments);
    return { score: (ja ? 2 : 0) + (per ? 1 : 0), p };
  });

  const sorted = scored.sort((a, b) => b.score - a.score).map((x) => buildItemFromProduct(x.p));
  return sorted;
}

export async function getFoodByBarcode(code: string): Promise<FoodItem | null> {
  if (!/^\d{8,14}$/.test(code)) return null;
  const params = new URLSearchParams({
    fields: [
      'code',
      'product_name',
      'product_name_ja',
      'brands',
      'nutriments',
      'image_small_url',
      'serving_quantity',
      'serving_quantity_unit',
      'quantity',
      'languages_tags',
      'countries_tags',
    ].join(','),
    lc: 'ja',
  });
  const url = `${PRODUCT_URL}/${code}.json?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const json: any = await resp.json();
  const prod = json?.product;
  if (!prod) return null;
  return buildItemFromProduct(prod);
}

export function scaleByGrams(item: FoodItem, grams: number) {
  const per = item.per100 ?? {};
  const ratio = Math.max(0, grams) / 100;
  const r1 = (x?: number) => (x == null ? undefined : Math.round(x * ratio * 10) / 10);
  const r0 = (x?: number) => (x == null ? undefined : Math.round(x * ratio));
  return {
    calories: r0(per.kcal),
    protein: r1(per.p),
    fat: r1(per.f),
    carbs: r1(per.c),
  };
}
