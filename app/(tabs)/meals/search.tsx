
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { colors, spacing } from "../../../ui/theme";
import { PrimaryButton, SectionTitle } from "../../../ui/components";
import type { OFFProduct } from "../../../types/off";
import {
  searchProducts,
  applyClientFilter,
  sortProducts,
  getImageUrl,
  getKcal100g,
  getProtein100g,
  getFat100g,
  getCarbs100g,
  completeMacros100g,
  type SortKey,
} from "../../../lib/openfoodfacts";
import { listUsage } from "../../../lib/usage";
import { useTranslation } from "react-i18next";

type MealLite = {
  id: string;
  title?: string;
  brand?: string;
  photoUri?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  grams?: number;
  mealType?: string;
  createdAt?: number;
  updatedAt?: number;
  usedCount?: number;
};

type ServerFilter = { countryJP: boolean; langJA: boolean };
type ClientFilter = { imageOnly: boolean; kcalMin?: number; kcalMax?: number; proteinMin?: number };
const defaultServerFilter: ServerFilter = { countryJP: true, langJA: true };
const defaultClientFilter: ClientFilter = { imageOnly: true };

let storageMod: any = null;
try {
  storageMod = require("../../../lib/storage");
} catch {}
async function listRecentMeals(limit = 64): Promise<MealLite[]> {
  try {
    if (storageMod?.listRecentMeals) return await storageMod.listRecentMeals(limit);
  } catch {}
  return [];
}
async function listFrequentMeals(limit = 64): Promise<MealLite[]> {
  try {
    if (storageMod?.listFrequentMeals) return await storageMod.listFrequentMeals(limit);
  } catch {}
  return [];
}

let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {}

const KS = {
  FAVORITE_CODES: "favorites_product_codes",
  FAVORITE_MEAL_KEYS: "favorites_meal_keys_v2",
} as const;

async function getItem(key: string) {
  try {
    if (!AsyncStorage?.getItem) return null;
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}
async function setItem(key: string, val: string) {
  try {
    if (!AsyncStorage?.setItem) return;
    await AsyncStorage.setItem(key, val);
  } catch {}
}

function normalize(s?: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}
function mealKeyFromTitleBrand(t?: string, b?: string) {
  return `${normalize(t)}||${normalize(b)}`;
}
function mealKeyFromProduct(p: OFFProduct) {
  return mealKeyFromTitleBrand(p.product_name, p.brands);
}
function mealKeyFromMeal(m: Partial<MealLite>) {
  return mealKeyFromTitleBrand(m.title, m.brand);
}

async function getFavoriteCodes(): Promise<string[]> {
  try {
    const raw = await getItem(KS.FAVORITE_CODES);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
async function getFavoriteMealKeys(): Promise<string[]> {
  try {
    const raw = await getItem(KS.FAVORITE_MEAL_KEYS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
async function setFavoriteCodes(arr: string[]) {
  await setItem(KS.FAVORITE_CODES, JSON.stringify(arr));
}
async function setFavoriteMealKeys(arr: string[]) {
  await setItem(KS.FAVORITE_MEAL_KEYS, JSON.stringify(arr));
}

async function toggleFavoriteForProduct(p: OFFProduct) {
  const code = String(p.code || "");
  const mKey = mealKeyFromProduct(p);

  const [codes, keys] = await Promise.all([getFavoriteCodes(), getFavoriteMealKeys()]);
  const hasCode = codes.includes(code);
  const hasKey = keys.includes(mKey);

  let nextCodes = codes.slice();
  let nextKeys = keys.slice();

  if (hasCode || hasKey) {
    nextCodes = nextCodes.filter((c) => c !== code);
    nextKeys = nextKeys.filter((k) => k !== mKey);
  } else {
    nextCodes = [code, ...nextCodes];
    nextKeys = [mKey, ...nextKeys];
  }
  await Promise.all([setFavoriteCodes(nextCodes), setFavoriteMealKeys(nextKeys)]);
  return { codes: nextCodes, mealKeys: nextKeys };
}

async function toggleFavoriteForMealKey(mKey: string) {
  const keys = await getFavoriteMealKeys();
  const has = keys.includes(mKey);
  const next = has ? keys.filter((k) => k !== mKey) : [mKey, ...keys];
  await setFavoriteMealKeys(next);
  return next;
}

async function reLogMealSafe(meal: MealLite) {
  try {
    if (storageMod?.reLogMeal) return await storageMod.reLogMeal(meal);
    throw new Error("reLogMeal not available");
  } catch {
    throw new Error("reLogMeal not available");
  }
}

export default function MealsSearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverFilter] = useState<ServerFilter>(defaultServerFilter);
  const [clientFilter] = useState<ClientFilter>(defaultClientFilter);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [page, setPage] = useState(1);
  const [productsRaw, setProductsRaw] = useState<OFFProduct[]>([]);
  const [count, setCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const [favoriteCodes, setFavoriteCodesState] = useState<string[]>([]);
  const [favoriteMealKeys, setFavoriteMealKeysState] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [recentMealsRaw, setRecentMealsRaw] = useState<MealLite[]>([]);
  const [frequentMealsRaw, setFrequentMealsRaw] = useState<MealLite[]>([]);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      const [recMeals, freqMeals] = await Promise.all([listRecentMeals(64), listFrequentMeals(64)]);
      const usage = await listUsage(128);

      const toKey = (m: Partial<MealLite>) => mealKeyFromMeal(m);
      const merge = (base: MealLite[], extra: any[]): MealLite[] => {
        const map = new Map<string, MealLite>();
        for (const m of base) {
          const k = toKey(m);
          map.set(k, { ...m, usedCount: m.usedCount ?? 1 });
        }
        for (const u of extra) {
          const k = mealKeyFromTitleBrand(u.title, u.brand);
          const hit = map.get(k);
          if (hit) {
            hit.usedCount = (hit.usedCount ?? 1) + 1;
            if (!hit.photoUri && u.photoUri) hit.photoUri = u.photoUri;
            if ((hit.calories ?? 0) === 0 && (u.calories ?? 0) > 0) hit.calories = u.calories;
            if ((hit.protein ?? 0) === 0 && (u.protein ?? 0) > 0) hit.protein = u.protein;
          } else {
            map.set(k, {
              id: u.id || k,
              title: u.title,
              brand: u.brand,
              photoUri: u.photoUri,
              calories: u.calories,
              protein: u.protein,
              usedCount: 1,
              updatedAt: u.createdAt,
            });
          }
        }
        return [...map.values()];
      };

      const recMerged = merge(recMeals, usage)
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
        .slice(0, 24);

      const freqMerged = merge(freqMeals, usage)
        .sort((a, b) => (b.usedCount ?? 0) - (a.usedCount ?? 0))
        .slice(0, 24);

      const [codes, mealFavs] = await Promise.all([getFavoriteCodes(), getFavoriteMealKeys()]);

      if (!mountedRef.current) return;
      setRecentMealsRaw(recMerged);
      setFrequentMealsRaw(freqMerged);
      setFavoriteCodesState(codes);
      setFavoriteMealKeysState(mealFavs);
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (query.trim().length === 0) {
      setHasSearched(false);
      setProductsRaw([]);
      setCount(0);
      setPage(1);
    }
  }, [query]);

  const favMealSet = useMemo(() => new Set(favoriteMealKeys), [favoriteMealKeys]);
  const frequentMeals = useMemo(
    () => (favoritesOnly ? frequentMealsRaw.filter((m) => favMealSet.has(mealKeyFromMeal(m))) : frequentMealsRaw),
    [favoritesOnly, frequentMealsRaw, favMealSet]
  );
  const recentMeals = useMemo(
    () => (favoritesOnly ? recentMealsRaw.filter((m) => favMealSet.has(mealKeyFromMeal(m))) : recentMealsRaw),
    [favoritesOnly, recentMealsRaw, favMealSet]
  );

  const favCodeSet = useMemo(() => new Set(favoriteCodes.map(String)), [favoriteCodes]);
  const products = useMemo(() => {
    if (!favoritesOnly) return productsRaw;
    return productsRaw.filter((p) => {
      const codeOk = favCodeSet.has(String(p.code || ""));
      const keyOk = favMealSet.has(mealKeyFromProduct(p));
      return codeOk || keyOk;
    });
  }, [productsRaw, favoritesOnly, favCodeSet, favMealSet]);

  const showHeaderBlocks = !hasSearched;

  const sortLabel = (k: SortKey) => {
    switch (k) {
      case "relevance":
        return t("meals.search.sort.relevance");
      case "kcal_asc":
        return t("meals.search.sort.kcalAsc");
      case "kcal_desc":
        return t("meals.search.sort.kcalDesc");
      case "protein_desc":
        return t("meals.search.sort.proteinDesc");
      case "updated_desc":
        return t("meals.search.sort.updatedDesc");
      default:
        return String(k);
    }
  };

  async function performSearch(reset = true) {
    const q = query.trim();
    if (!q) {
      setHasSearched(false);
      setProductsRaw([]);
      setCount(0);
      return;
    }
    Keyboard.dismiss();
    setHasSearched(true);
    setLoading(true);
    try {
      const nextPage = reset ? 1 : page + 1;
      const res = await searchProducts({ query: q, page: nextPage, pageSize: 24, serverFilter });
      const filtered = applyClientFilter(res.products || [], clientFilter);
      const sorted = sortProducts(filtered, sort);
      setCount(res.count || 0);
      setPage(nextPage);
      setProductsRaw((cur) => (reset ? sorted : [...cur, ...sorted]));
    } catch (e: any) {
      Alert.alert(t("meals.search.searchErrorTitle"), String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }
  const onSubmitSearch = () => performSearch(true);

  async function toggleMealFav(meal: MealLite) {
    const mKey = mealKeyFromMeal(meal);
    const nextKeys = await toggleFavoriteForMealKey(mKey);
    setFavoriteMealKeysState(nextKeys);
  }

  async function toggleProductFav(p: OFFProduct) {
    const next = await toggleFavoriteForProduct(p);
    setFavoriteCodesState(next.codes);
    setFavoriteMealKeysState(next.mealKeys);
  }

  async function handleReLog(meal: MealLite) {
    try {
      await reLogMealSafe(meal);
      const name = meal.title || t("meals.search.defaultMealTitle");
      Alert.alert(
        t("meals.search.relogSuccessTitle"),
        t("meals.search.relogSuccessMessage", { title: name })
      );
    } catch {
      router.push({
        pathname: "/(tabs)/meals/new",
        params: {
          prefill_title: meal.title || "",
          prefill_brand: meal.brand || "",
          prefill_photo: meal.photoUri || "",
          prefill_kcal: meal.calories != null ? String(meal.calories) : "",
          prefill_p: meal.protein != null ? String(meal.protein) : "",
          prefill_f: meal.fat != null ? String(meal.fat) : "",
          prefill_c: meal.carbs != null ? String(meal.carbs) : "",
        },
      });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.hero}>
        <View style={styles.searchWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("meals.search.queryPlaceholder")}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={onSubmitSearch}
          />
          <PrimaryButton
            title={t("meals.search.searchButton")}
            onPress={() => performSearch(true)}
            style={styles.searchBtn}
          />
        </View>

        <View style={styles.quickRow}>
          <View style={styles.quickCol}>
            <PrimaryButton
              title={t("meals.search.scanBarcodeButton")}
              onPress={() => router.push("/(tabs)/meals/scan-barcode")}
              style={styles.actionBtn}
              accessibilityLabel={t("meals.search.scanBarcodeButton")}
            />
          </View>
          <View style={styles.quickCol}>
            <PrimaryButton
              title={t("meals.search.recordMealButton")}
              onPress={() => router.push("/(tabs)/meals/new")}
              variant="secondary"
              style={styles.actionBtn}
              accessibilityLabel={t("meals.search.recordMealButton")}
            />
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setFavoritesOnly((v) => !v)}
            style={[
              styles.toggleChip,
              favoritesOnly ? styles.toggleChipOn : styles.toggleChipOff,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.toggleChipText,
                favoritesOnly ? styles.toggleChipTextOn : null,
              ]}
            >
              {t("meals.search.favoritesOnlyChip")}
            </Text>
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(["relevance", "kcal_asc", "kcal_desc", "protein_desc", "updated_desc"] as SortKey[]).map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => {
                  setSort(k);
                  setProductsRaw((cur) => sortProducts(cur, k));
                }}
                style={[styles.sortChip, sort === k ? styles.sortChipOn : null]}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    sort === k ? styles.sortChipTextOn : null,
                  ]}
                >
                  {sortLabel(k)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {(recentMealsRaw.length > 0 || frequentMealsRaw.length > 0) && showHeaderBlocks && (
        <View
          style={{
            paddingHorizontal: spacing.lg,
            gap: spacing.lg,
            paddingBottom: spacing.md,
          }}
        >
          {!!frequentMeals.length && (
            <View>
              <SectionTitle>{t("meals.search.headerFrequent")}</SectionTitle>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
                contentContainerStyle={{ paddingRight: spacing.lg }}
              >
                {frequentMeals.map((m, idx) => {
                  const isFav = favoriteMealKeys.includes(mealKeyFromMeal(m));
                  return (
                    <MealMiniCard
                      key={`freq:${m.id ?? idx}`}
                      meal={m}
                      isFav={isFav}
                      onToggleFav={() => toggleMealFav(m)}
                      onReLog={() => handleReLog(m)}
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}
          {!!recentMeals.length && (
            <View>
              <SectionTitle>{t("meals.search.headerRecent")}</SectionTitle>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
                contentContainerStyle={{ paddingRight: spacing.lg }}
              >
                {recentMeals.map((m, idx) => {
                  const isFav = favoriteMealKeys.includes(mealKeyFromMeal(m));
                  return (
                    <MealMiniCard
                      key={`recent:${m.id ?? idx}`}
                      meal={m}
                      isFav={isFav}
                      onToggleFav={() => toggleMealFav(m)}
                      onReLog={() => handleReLog(m)}
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <View style={{ flex: 1 }}>
        {loading && hasSearched && page === 1 ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={{ color: colors.subtext, marginTop: 8 }}>
              {t("meals.search.searchingLabel")}
            </Text>
          </View>
        ) : hasSearched && products.length === 0 ? (
          <View style={[styles.center, { paddingHorizontal: spacing.lg }]}>
            <Text
              style={{
                color: colors.subtext,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {t("meals.search.noResultMessage")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item, i) => `${item.code || "code"}:${i}`}
            contentContainerStyle={{
              padding: spacing.lg,
              gap: spacing.md,
            }}
            renderItem={({ item }) => {
              const codeFav = favoriteCodes.includes(String(item.code || ""));
              const keyFav = favoriteMealKeys.includes(mealKeyFromProduct(item));
              const isFav = codeFav || keyFav;
              return (
                <ProductRow
                  item={item}
                  isFav={isFav}
                  onToggleFav={() => toggleProductFav(item)}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/meals/add-from-code",
                      params: { code: String(item.code || "") },
                    })
                  }
                />
              );
            }}
            ListFooterComponent={
              count > productsRaw.length ? (
                <View style={{ paddingVertical: 12 }}>
                  {loading ? (
                    <ActivityIndicator />
                  ) : (
                    <PrimaryButton
                      title={t("meals.search.loadMoreButton")}
                      onPress={() => performSearch(false)}
                    />
                  )}
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}


function MealMiniCard({
  meal,
  isFav,
  onToggleFav,
  onReLog,
}: {
  meal: MealLite;
  isFav: boolean;
  onToggleFav: () => void | Promise<void>;
  onReLog: () => void | Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.miniCard}>
      <TouchableOpacity
        onPress={onToggleFav}
        style={styles.miniFavBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "900",
            color: isFav ? "#f59e0b" : "#d1d5db",
          }}
        >
          {isFav ? "★" : "☆"}
        </Text>
      </TouchableOpacity>

      <Link
        href={{
          pathname: "/(tabs)/meals/new",
          params: {
            prefill_title: meal.title || "",
            prefill_brand: meal.brand || "",
            prefill_photo: meal.photoUri || "",
            prefill_kcal:
              meal.calories != null ? String(meal.calories) : "",
            prefill_p:
              meal.protein != null ? String(meal.protein) : "",
            prefill_f: meal.fat != null ? String(meal.fat) : "",
            prefill_c: meal.carbs != null ? String(meal.carbs) : "",
          },
        }}
        asChild
      >
        <TouchableOpacity activeOpacity={0.9}>
          <View style={styles.miniImageWrap}>
            {meal.photoUri ? (
              <Image
                source={{ uri: meal.photoUri }}
                style={styles.miniImage}
              />
            ) : (
              <View
                style={[styles.miniImage, styles.miniImagePlaceholder]}
              >
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                  }}
                >
                  {t("meals.search.noImageLabel")}
                </Text>
              </View>
            )}
            {!!meal.calories && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {meal.calories} kcal
                </Text>
              </View>
            )}
          </View>
          <Text numberOfLines={2} style={styles.miniTitle}>
            {meal.title || t("meals.search.untitled")}
          </Text>
          {!!meal.brand && (
            <Text numberOfLines={1} style={styles.miniBrand}>
              {meal.brand}
            </Text>
          )}
        </TouchableOpacity>
      </Link>

      <TouchableOpacity
        onPress={onReLog}
        activeOpacity={0.9}
        style={styles.relogBtn}
      >
        <Text style={styles.relogBtnText}>
          {t("meals.search.relogButton")}
        </Text>
      </TouchableOpacity>

      {!!meal.usedCount && (
        <View style={styles.usedPill}>
          <Text style={styles.usedPillText}>
            {t("meals.search.usedCount", { count: meal.usedCount })}
          </Text>
        </View>
      )}
    </View>
  );
}

function ProductRow({
  item,
  isFav,
  onToggleFav,
  onPress,
}: {
  item: OFFProduct;
  isFav: boolean;
  onToggleFav: () => void | Promise<void>;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const img = getImageUrl(item);
  const kcal = getKcal100g(item);
  const p = getProtein100g(item);
  const f = getFat100g(item);
  const c = getCarbs100g(item);
  const est = completeMacros100g(item);

  const kcalVal = kcal ?? est.kcal;
  const pVal = p ?? est.protein;
  const fVal = f ?? est.fat;
  const cVal = c ?? est.carbs;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.row}
    >
      <View style={styles.thumbWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text
              style={{ color: colors.muted, fontSize: 12 }}
            >
              {t("meals.search.noImageLabel")}
            </Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text numberOfLines={2} style={styles.rowTitle}>
          {item.product_name || t("meals.search.unknownName")}
        </Text>
        {!!item.brands && (
          <Text numberOfLines={1} style={styles.rowBrand}>
            {item.brands}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>
              {kcalVal != null
                ? t("meals.search.kcalPer100g", { value: kcalVal })
                : t("meals.search.kcalPer100gUnknown")}
            </Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>
              {pVal != null
                ? t("meals.search.proteinPer100g", { value: pVal })
                : t("meals.search.proteinPer100gUnknown")}
            </Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>
              {fVal != null
                ? t("meals.search.fatPer100g", { value: fVal })
                : t("meals.search.fatPer100gUnknown")}
            </Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>
              {cVal != null
                ? t("meals.search.carbsPer100g", { value: cVal })
                : t("meals.search.carbsPer100gUnknown")}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={onToggleFav}
        style={styles.favBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: isFav ? "#f59e0b" : "#9ca3af",
          }}
        >
          {isFav ? "★" : "☆"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};

const ACTION_H = 48;

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: {
    flex: 1,
    height: ACTION_H,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    color: colors.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    ...SHADOW,
  },
  searchBtn: {
    height: ACTION_H,
    borderRadius: 14,
    minWidth: 96,
    alignSelf: "stretch",
  },

  quickRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  quickCol: { flex: 1 },
  actionBtn: { height: ACTION_H, borderRadius: 14, width: "100%" },

  toggleRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  toggleChipOff: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  toggleChipOn: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffec99",
  },
  toggleChipText: { fontWeight: "800", color: colors.text },
  toggleChipTextOn: { color: "#8a6d3b" },

  center: {
    paddingTop: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    ...SHADOW,
  },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTitle: { color: colors.text, fontWeight: "900", fontSize: 15 },
  rowBrand: { color: colors.subtext, marginTop: 2 },

  infoPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  infoPillText: {
    color: "#3730a3",
    fontWeight: "800",
    fontSize: 12,
  },

  favBtn: { paddingHorizontal: 8, paddingVertical: 6 },

  miniCard: {
    width: 160,
    height: 200,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    ...SHADOW,
  },
  miniFavBtn: {
    position: "absolute",
    right: 8,
    top: 8,
    zIndex: 2,
    backgroundColor: "#ffffffcc",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  miniImageWrap: {
    width: "100%",
    height: 96,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniImage: { width: "100%", height: "100%" },
  miniImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  miniTitle: {
    color: colors.text,
    fontWeight: "900",
    marginTop: 8,
    fontSize: 13.5,
  },
  miniBrand: {
    color: colors.subtext,
    marginTop: 2,
    fontSize: 12,
  },

  relogBtn: {
    position: "absolute",
    right: 8,
    bottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#10b981",
  },
  relogBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },

  usedPill: {
    position: "absolute",
    left: 8,
    top: 8,
    backgroundColor: "#111827",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  usedPillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginLeft: 8,
  },
  sortChipOn: { backgroundColor: "#e6fffb", borderColor: "#b2f5ea" },
  sortChipText: { color: colors.text, fontWeight: "700" },
  sortChipTextOn: { color: "#0b7285" },
});
