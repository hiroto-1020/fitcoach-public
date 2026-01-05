// lib/openfoodfacts.ts
// Open Food Facts API ユーティリティ（検索・栄養100g換算・ソート等）
import "react-native-url-polyfill/auto";
import type { OFFProduct, OFFSearchResponse } from "../types/off";

const OFF_BASE = "https://world.openfoodfacts.org";
const USER_AGENT = "FitGear/1.0 (Expo RN) contact: horita.training1020@gmail.com";

// タイムアウト（ミリ秒）
const OFF_TIMEOUT_MS = 12000;

export type ServerFilter = { countryJP: boolean; langJA: boolean };
export type ClientFilter = {
  imageOnly: boolean;
  brand?: string;
  category?: string;
  kcalMin?: number;
  kcalMax?: number;
  proteinMin?: number;
  proteinMax?: number;
};
export type SortKey =
  | "relevance"
  | "kcal_asc"
  | "kcal_desc"
  | "protein_desc"
  | "updated_desc";

/* ============== 小ユーティリティ ============== */
const round1 = (n: number) => Math.round(n * 10) / 10;
function num(v: any): number | undefined {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && !Number.isNaN(n) ? n : undefined;
}
function clamp0_100(x?: number | null): number | undefined {
  if (x == null || Number.isNaN(x)) return undefined;
  return Math.max(0, Math.min(100, round1(x)));
}
function stripLangPrefix(s?: string | null): string {
  if (!s) return "";
  const t = String(s).trim();
  const m = t.match(/^[a-z]{2,3}:(.*)$/i);
  return m ? m[1].trim() : t;
}

export function getImageUrl(p: OFFProduct): string | undefined {
  return (
    (p as any).image_front_small_url ||
    (p as any).image_small_url ||
    (p as any).image_front_url ||
    (p as any).image_url ||
    undefined
  );
}

function parseServingSizeG(raw?: string | null): number | undefined {
  if (!raw) return undefined;
  const s = String(raw).toLowerCase();
  const mg = s.match(/(\d+(?:\.\d+)?)\s*g/);
  if (mg) return Number(mg[1]);
  const ml = s.match(/(\d+(?:\.\d+)?)\s*m[lL]/);
  if (ml) return Number(ml[1]); // 飲料はmlをg相当として扱う（比重1前提）
  return undefined;
}
function per100FromServing(
  valServing?: number,
  servingG?: number
): number | undefined {
  if (valServing == null || !servingG || servingG <= 0) return undefined;
  return round1((100 * valServing) / servingG);
}

/* ============== 栄養（100g換算） ============== */
export function getKcal100g(p: OFFProduct): number | undefined {
  const n = (p as any).nutriments || {};
  const kcal100 = num(n["energy-kcal_100g"]) ?? num(n.energy_kcal_100g);
  if (kcal100 != null) return Math.round(kcal100);
  const kj100 = num(n.energy_100g);
  if (kj100 != null) return Math.round(kj100 / 4.184);
  const svG = parseServingSizeG((p as any).serving_size);
  const kcalSv =
    num(n["energy-kcal_serving"]) ??
    num(n.energy_kcal_serving) ??
    (num(n.energy_serving) != null
      ? num(n.energy_serving)! / 4.184
      : undefined);
  const est = per100FromServing(kcalSv, svG);
  return est != null ? Math.round(est) : undefined;
}
export function getProtein100g(p: OFFProduct): number | undefined {
  const n = (p as any).nutriments || {};
  const by100 = num(n.proteins_100g) ?? num(n.protein_100g);
  if (by100 != null) return clamp0_100(by100);
  const est = per100FromServing(
    num(n.proteins_serving) ?? num(n.protein_serving),
    parseServingSizeG((p as any).serving_size)
  );
  return clamp0_100(est);
}
export function getFat100g(p: OFFProduct): number | undefined {
  const n = (p as any).nutriments || {};
  const by100 = num(n.fat_100g);
  if (by100 != null) return clamp0_100(by100);
  const est = per100FromServing(
    num(n.fat_serving),
    parseServingSizeG((p as any).serving_size)
  );
  return clamp0_100(est);
}
export function getCarbs100g(p: OFFProduct): number | undefined {
  const n = (p as any).nutriments || {};
  const by100 = num(n.carbohydrates_100g) ?? num(n.carbs_100g);
  if (by100 != null) return clamp0_100(by100);
  const est = per100FromServing(
    num(n.carbohydrates_serving) ?? num(n.carbs_serving),
    parseServingSizeG((p as any).serving_size)
  );
  return clamp0_100(est);
}

/** kcalと他2つが分かれば、残り1つを推定して補完（100g） */
export function completeMacros100g(p: OFFProduct): {
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
} {
  const kcal = getKcal100g(p);
  let P = getProtein100g(p);
  let F = getFat100g(p);
  let C = getCarbs100g(p);

  if (kcal != null) {
    if (P != null && F != null && (C == null || C < 0)) {
      C = clamp0_100((kcal - (P * 4 + F * 9)) / 4);
    } else if (P != null && C != null && (F == null || F < 0)) {
      F = clamp0_100((kcal - (P * 4 + C * 4)) / 9);
    } else if (F != null && C != null && (P == null || P < 0)) {
      P = clamp0_100((kcal - (F * 9 + C * 4)) / 4);
    }
  }
  return {
    kcal: kcal ?? undefined,
    protein: P ?? undefined,
    fat: F ?? undefined,
    carbs: C ?? undefined,
  };
}

/* ============== タイトル/ブランド（日本語優先） ============== */
export function getPreferredTitle(p: OFFProduct): string {
  const cands = [
    (p as any).product_name_ja,
    (p as any).product_name_ja_alt,
    (p as any).generic_name_ja,
    (p as any).product_name,
    (p as any).generic_name,
  ];
  for (const c of cands) {
    const v = stripLangPrefix(c);
    if (v) return v;
  }
  return "";
}
export function getPreferredBrand(p: OFFProduct): string {
  const b = (p as any).brands || "";
  return b.split(",")[0]?.trim() || "";
}

/* ============== 検索URL構築（RNでも動作：URLはpolyfill済） ============== */
function buildSearchURL(params: {
  q: string;
  page: number;
  pageSize: number;
  jpOnly: boolean;
  jaLang: boolean;
  tagFilter?: {
    type: "categories" | "ingredients";
    contains: "contains" | "not_contains";
    value: string;
  };
}) {
  const { q, page, pageSize, jpOnly, jaLang, tagFilter } = params;
  const url = new URL(`${OFF_BASE}/cgi/search.pl`);
  url.searchParams.set("json", "1");
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(pageSize));
  url.searchParams.set("search_terms", q);
  url.searchParams.set(
    "fields",
    [
      "code",
      "product_name",
      "product_name_ja",
      "generic_name",
      "generic_name_ja",
      "brands",
      "categories",
      "image_small_url",
      "image_front_small_url",
      "image_url",
      "image_front_url",
      "languages_codes",
      "countries_tags",
      "nutriments",
      "last_modified_t",
      "serving_size",
    ].join(",")
  );
  let nextIndex = 0;
  if (jpOnly) {
    url.searchParams.set(`tagtype_${nextIndex}`, "countries");
    url.searchParams.set(`tag_contains_${nextIndex}`, "contains");
    url.searchParams.set(`tag_${nextIndex}`, "japan");
    nextIndex++;
  }
  if (jaLang) url.searchParams.set("lc", "ja");

  if (tagFilter) {
    url.searchParams.set(`tagtype_${nextIndex}`, tagFilter.type);
    url.searchParams.set(`tag_contains_${nextIndex}`, tagFilter.contains);
    url.searchParams.set(`tag_${nextIndex}`, tagFilter.value);
  }

  return url.toString();
}

/* ============== 共通フェッチ（タイムアウト＆きれいなエラー文言） ============== */

async function fetchOFFJson(
  url: string,
  kind: "search" | "product" = "search"
): Promise<any> {
  const controller =
    typeof AbortController !== "undefined"
      ? new AbortController()
      : undefined;
  const timer =
    controller != null
      ? setTimeout(() => controller.abort(), OFF_TIMEOUT_MS)
      : undefined;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      } as any,
      ...(controller ? { signal: controller.signal } : {}),
    });

    if (!res.ok) {
      // HTML 本文はユーザーに見せない（ログだけにする）
      const status = res.status;

      if (status === 504) {
        throw new Error(
          "Open Food Facts 側のサーバーがタイムアウトしました。\n時間をおいて再度お試しください。"
        );
      }
      if (status >= 500) {
        throw new Error(
          `Open Food Facts のサーバーでエラーが発生しました（HTTP ${status}）。\nしばらく時間をおいて再度お試しください。`
        );
      }
      throw new Error(
        `Open Food Facts へのリクエストに失敗しました（HTTP ${status}）。`
      );
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("OFF JSON parse error", e, text.slice(0, 200));
      throw new Error(
        "Open Food Facts からの応答の解析に失敗しました。\n時間をおいて再度お試しください。"
      );
    }
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(
        "Open Food Facts への接続がタイムアウトしました。\n通信環境を確認してから再度お試しください。"
      );
    }
    console.warn("OFF fetch error", e);
    if (e instanceof Error && e.message.includes("Open Food Facts")) {
      // すでに整形済みの文言ならそのまま
      throw e;
    }
    throw new Error(
      "Open Food Facts への接続に失敗しました。\n通信環境を確認してから再度お試しください。"
    );
  } finally {
    if (timer != null) clearTimeout(timer);
  }
}

// 既存との互換用ラッパ
async function fetchJSON(url: string) {
  return fetchOFFJson(url, "search");
}

/**
 * 検索戦略（JP/JA優先 → カテゴリ contains → 原材料 contains → JAのみグローバル）
 */
export async function searchProducts(params: {
  query: string;
  page?: number;
  pageSize?: number;
  serverFilter: ServerFilter;
}): Promise<OFFSearchResponse> {
  const { query, page = 1, pageSize = 24, serverFilter } = params;
  const q = query.trim();
  if (!q)
    return { count: 0, page: 1, page_size: pageSize, skip: 0, products: [] };

  // pass1: JP+JA
  const u1 = buildSearchURL({
    q,
    page,
    pageSize,
    jpOnly: !!serverFilter.countryJP,
    jaLang: !!serverFilter.langJA,
  });
  const j1 = (await fetchJSON(u1)) as OFFSearchResponse;

  let merged: OFFProduct[] = j1.products || [];
  let count = j1.count || merged.length;

  // pass2: categories contains query（JP+JA）
  const need2 = merged.length < Math.min(12, pageSize);
  if (need2) {
    const u2 = buildSearchURL({
      q,
      page,
      pageSize,
      jpOnly: !!serverFilter.countryJP,
      jaLang: !!serverFilter.langJA,
      tagFilter: { type: "categories", contains: "contains", value: q },
    });
    const j2 = (await fetchJSON(u2)) as OFFSearchResponse;
    const map = new Map<string, OFFProduct>();
    for (const p of merged) map.set(String((p as any).code || ""), p);
    for (const p of j2.products || []) {
      const key = String((p as any).code || "");
      if (!map.has(key)) map.set(key, p);
    }
    merged = Array.from(map.values());
    count = Math.max(count, j2.count || merged.length);
  }

  // pass3: ingredients contains query（JP+JA）
  const need3 = merged.length < Math.min(12, pageSize);
  if (need3) {
    const u3 = buildSearchURL({
      q,
      page,
      pageSize,
      jpOnly: !!serverFilter.countryJP,
      jaLang: !!serverFilter.langJA,
      tagFilter: { type: "ingredients", contains: "contains", value: q },
    });
    const j3 = (await fetchJSON(u3)) as OFFSearchResponse;
    const map = new Map<string, OFFProduct>();
    for (const p of merged) map.set(String((p as any).code || ""), p);
    for (const p of j3.products || []) {
      const key = String((p as any).code || "");
      if (!map.has(key)) map.set(key, p);
    }
    merged = Array.from(map.values());
    count = Math.max(count, j3.count || merged.length);
  }

  // pass4: グローバル（JAのみ）
  const need4 = merged.length < Math.min(12, pageSize);
  if (need4) {
    const u4 = buildSearchURL({
      q,
      page,
      pageSize,
      jpOnly: false,
      jaLang: true,
    });
    const j4 = (await fetchJSON(u4)) as OFFSearchResponse;
    const map = new Map<string, OFFProduct>();
    for (const p of merged) map.set(String((p as any).code || ""), p);
    for (const p of j4.products || []) {
      const key = String((p as any).code || "");
      if (!map.has(key)) map.set(key, p);
    }
    merged = Array.from(map.values());
    count = Math.max(count, j4.count || merged.length);
  }

  // 表示用に product_name / brands を日本語優先に正規化
  const normalized = merged.map((p) => {
    const name = getPreferredTitle(p);
    const brand = getPreferredBrand(p);
    return {
      ...p,
      product_name: name || (p as any).product_name,
      brands: brand || (p as any).brands,
    };
  });

  return {
    count,
    page,
    page_size: pageSize,
    skip: (page - 1) * pageSize,
    products: normalized,
  };
}

/* ============== クライアント側フィルタ/ソート ============== */
export function applyClientFilter(
  products: OFFProduct[],
  filter: ClientFilter
): OFFProduct[] {
  return products.filter((p) => {
    if (filter.imageOnly && !getImageUrl(p)) return false;
    if (filter.brand) {
      const b = ((p as any).brands || "").toLowerCase();
      if (!b.includes(filter.brand.toLowerCase())) return false;
    }
    if (filter.category) {
      const c = ((p as any).categories || "").toLowerCase();
      if (!c.includes(filter.category.toLowerCase())) return false;
    }
    const mac = completeMacros100g(p);
    if (
      typeof filter.kcalMin === "number" &&
      (mac.kcal ?? -Infinity) < filter.kcalMin
    )
      return false;
    if (
      typeof filter.kcalMax === "number" &&
      (mac.kcal ?? Infinity) > filter.kcalMax
    )
      return false;
    if (
      typeof filter.proteinMin === "number" &&
      (mac.protein ?? -Infinity) < filter.proteinMin
    )
      return false;
    if (
      typeof filter.proteinMax === "number" &&
      (mac.protein ?? Infinity) > filter.proteinMax
    )
      return false;
    return true;
  });
}

export function sortProducts(
  products: OFFProduct[],
  sort: SortKey
): OFFProduct[] {
  if (sort === "relevance") return products;
  const sorted = [...products];
  sorted.sort((a, b) => {
    const ka = completeMacros100g(a).kcal ?? undefined;
    const kb = completeMacros100g(b).kcal ?? undefined;
    const pa = completeMacros100g(a).protein ?? undefined;
    const pb = completeMacros100g(b).protein ?? undefined;
    const am = (a as any).last_modified_t || 0;
    const bm = (b as any).last_modified_t || 0;
    switch (sort) {
      case "kcal_asc":
        return (ka ?? Infinity) - (kb ?? Infinity);
      case "kcal_desc":
        return (kb ?? -Infinity) - (ka ?? -Infinity);
      case "protein_desc":
        return (pb ?? -Infinity) - (pa ?? -Infinity);
      case "updated_desc":
        return (bm ?? 0) - (am ?? 0);
      default:
        return 0;
    }
  });
  return sorted;
}

/* ============== 単品取得（100g正規化） ============== */
export type Normalized100g = {
  kcal100?: number;
  p100?: number;
  f100?: number;
  c100?: number;
  servingG?: number;
  inferred?: boolean;
  title?: string;
  brand?: string;
  image?: string;
};

export async function fetchNormalized100gByCode(
  code?: string
): Promise<Normalized100g> {
  if (!code) return {};
  const url = `${OFF_BASE}/api/v0/product/${encodeURIComponent(
    code
  )}.json?lc=ja`;

  const json = (await fetchOFFJson(url, "product")) as {
    product?: OFFProduct;
    status?: number;
  };

  const p = json.product;
  if (!p) return {};

  const title = getPreferredTitle(p);
  const brand = getPreferredBrand(p);
  const image = getImageUrl(p);

  const servingG = parseServingSizeG((p as any).serving_size);
  const mac = completeMacros100g(p);

  const inferred =
    (getProtein100g(p) == null ||
      getFat100g(p) == null ||
      getCarbs100g(p) == null ||
      getKcal100g(p) == null) &&
    servingG != null;

  return {
    title,
    brand,
    image,
    kcal100: mac.kcal,
    p100: mac.protein,
    f100: mac.fat,
    c100: mac.carbs,
    servingG,
    inferred,
  };
}
