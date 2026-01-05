// app/(tabs)/meals/add-from-code.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { spacing } from "../../../ui/theme"; // ← colorsは使わない
import { PrimaryButton, SectionTitle } from "../../../ui/components";
import { addUsage } from "../../../lib/usage";
import { useAppPrefs } from "../../../lib/app-prefs";

type OFFResp = { status: number; product?: any };
function getImg(p: any): string | undefined {
  return p?.image_small_url || p?.image_front_url || p?.image_url || undefined;
}
function getStr(v: any) { return typeof v === "string" ? v : ""; }
function num(v: any): number | undefined { const n = Number(v); return Number.isFinite(n) ? n : undefined; }

export default function AddFromCodeScreen() {
  const { colors: C, effectiveScheme, haptic } = useAppPrefs();
  const { code = "" } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json`;
        const res = await fetch(url);
        const json: OFFResp = await res.json();
        if (!alive) return;
        if (json?.status !== 1 || !json.product) {
          Alert.alert("未登録コード", `コード ${code} の商品は見つかりませんでした。`);
          setProduct(null);
        } else {
          setProduct(json.product);
          // 使用履歴に即登録
          const nutr = json.product?.nutriments || {};
          await addUsage({
            id: String(code),
            code: String(code),
            title: getStr(json.product?.product_name) || "（名称不明）",
            brand: getStr(json.product?.brands),
            photoUri: getImg(json.product),
            calories: num(nutr["energy-kcal_100g"]) ?? num(nutr["energy-kcal"]) ?? undefined,
            protein: num(nutr["proteins_100g"]) ?? num(nutr["proteins"]) ?? undefined,
            createdAt: Date.now(),
          });
        }
      } catch (e: any) {
        Alert.alert("取得エラー", String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [code]);

  const img = useMemo(() => getImg(product), [product]);
  const title = useMemo(() => getStr(product?.product_name) || "（名称不明）", [product]);
  const brand = useMemo(() => getStr(product?.brands), [product]);
  const kcal100 = useMemo(() => {
    const n = product?.nutriments || {};
    return num(n["energy-kcal_100g"]) ?? num(n["energy-kcal"]) ?? undefined;
  }, [product]);
  const p100 = useMemo(() => {
    const n = product?.nutriments || {};
    return num(n["proteins_100g"]) ?? num(n["proteins"]) ?? undefined;
  }, [product]);

  const pillBg = effectiveScheme === "dark" ? "#0b1220" : "#eef2ff";
  const pillBorder = effectiveScheme === "dark" ? "#1e3a8a66" : "#e0e7ff";
  const pillText = effectiveScheme === "dark" ? "#93c5fd" : "#3730a3";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: spacing.lg }}>
      <SectionTitle>バーコード検索</SectionTitle>
      <Text style={{ color: C.sub, marginTop: 6 }}>コード: {String(code || "")}</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ color: C.sub, marginTop: 8 }}>読み込み中…</Text>
        </View>
      ) : !product ? (
        <View style={styles.center}>
          <Text style={{ color: C.sub }}>商品が見つかりませんでした。</Text>
        </View>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={styles.thumbWrap}>
              {img ? (
                <Image source={{ uri: img }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPh, { backgroundColor: effectiveScheme === "dark" ? "#0f172a" : "#f4f4f5", borderColor: C.border }]}>
                  <Text style={{ color: C.sub }}>No Image</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text numberOfLines={2} style={[styles.title, { color: C.text }]}>{title}</Text>
              {!!brand && <Text numberOfLines={1} style={[styles.brand, { color: C.sub }]}>{brand}</Text>}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <View style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}><Text style={[styles.pillText, { color: pillText }]}>{kcal100 != null ? `${kcal100} kcal/100g` : "- kcal/100g"}</Text></View>
                {!!(p100 != null) && <View style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}><Text style={[styles.pillText, { color: pillText }]}>P {p100}g/100g</Text></View>}
              </View>
            </View>
          </View>

          <PrimaryButton
            title="この商品で記録する"
            onPress={async () => {
              await haptic("light");
              router.push({
                pathname: "/(tabs)/meals/new",
                params: {
                  prefill_title: title,
                  prefill_brand: brand,
                  prefill_photo: img || "",
                  prefill_kcal: kcal100 != null ? String(kcal100) : "",
                  prefill_p: p100 != null ? String(p100) : "",
                },
              });
            }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  thumbWrap: { width: 80, height: 80, borderRadius: 12, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  thumbPh: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 12 },
  title: { fontWeight: "900", fontSize: 16 },
  brand: { marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  pillText: { fontWeight: "800", fontSize: 12 },
});
