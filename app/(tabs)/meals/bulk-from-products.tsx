// app/(tabs)/meals/bulk-from-products.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { colors, spacing, radius } from "../../../ui/theme";
import { Card, PrimaryButton, SectionTitle } from "../../../ui/components";
import { clearBulkSelection, getBulkSelection, type SelectedProduct } from "../../../lib/tmpSelection";
import { fetchNormalized100gByCode } from "../../../lib/openfoodfacts";
import type { Meal, MealType } from "../../../lib/meals";
import { saveMeal } from "../../../lib/storage";
import { generateId } from "../../../lib/id";
import { recordUsage } from "../../../lib/usage"; // ★追加

type ItemState = SelectedProduct & {
  grams: number;
  loading?: boolean;
  inferred?: boolean;
};

function calc(per100: number | undefined, grams: number) {
  const n = per100 ?? 0;
  return Math.round(((n * grams) / 100) * 10) / 10;
}

export default function BulkFromProductsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ItemState[]>([]);
  const [busy, setBusy] = useState(true);

  // 保存先（合算 個別保存にするため、ここで日付/区分を決める）
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [mealType, setMealType] = useState<MealType>("snack");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setBusy(true);
      const sel = await getBulkSelection();
      const init = sel.map((s) => ({ ...s, grams: 100 }));
      if (mounted) setItems(init);
      setBusy(false);

      // 欠損がある要素は詳細APIで補正
      for (const [idx, it] of init.entries()) {
        const needs = [it.kcal100, it.p100, it.f100, it.c100].some((v) => v == null || v === 0);
        if (needs && it.code) {
          setItems((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], loading: true };
            return next;
          });
          try {
            const n = await fetchNormalized100gByCode(it.code);
            setItems((prev) => {
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                kcal100: n.kcal100 ?? next[idx].kcal100,
                p100: n.p100 ?? next[idx].p100,
                f100: n.f100 ?? next[idx].f100,
                c100: n.c100 ?? next[idx].c100,
                inferred: Boolean(n.inferred),
                loading: false,
              };
              return next;
            });
          } catch {
            setItems((prev) => {
              const next = [...prev];
              next[idx] = { ...next[idx], loading: false };
              return next;
            });
          }
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const totals = useMemo(() => {
    const sum = { kcal: 0, p: 0, f: 0, c: 0 };
    for (const it of items) {
      sum.kcal += Math.round(calc(it.kcal100, it.grams));
      sum.p += calc(it.p100, it.grams);
      sum.f += calc(it.f100, it.grams);
      sum.c += calc(it.c100, it.grams);
    }
    sum.kcal = Math.round(sum.kcal);
    sum.p = Math.round(sum.p * 10) / 10;
    sum.f = Math.round(sum.f * 10) / 10;
    sum.c = Math.round(sum.c * 10) / 10;
    return sum;
  }, [items]);

  const allLoaded = items.every((i) => !i.loading);

  async function saveIndividually() {
    // 各アイテムを独立した Meal として保存
    for (const it of items) {
      const meal: Meal = {
        id: generateId("meal"),
        date,
        mealType,
        title: it.title || "（名称不明）",
        brand: it.brand,
        grams: it.grams,
        calories: Math.round(calc(it.kcal100, it.grams)),
        protein: calc(it.p100, it.grams),
        fat: calc(it.f100, it.grams),
        carbs: calc(it.c100, it.grams),
        photoUri: it.image,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveMeal(meal);

      //  使用履歴に記録（codeあり）
      await recordUsage({
        code: it.code,
        title: meal.title || "（名称不明）",
        brand: meal.brand,
        image: meal.photoUri,
        kcal100: it.kcal100,
        p100: it.p100,
        f100: it.f100,
        c100: it.c100,
      });
    }
    await clearBulkSelection();
    Alert.alert("保存しました", `${items.length}件の記録を保存しました。`, [
      { text: "OK", onPress: () => router.replace("/(tabs)/meals/search") },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {/* 保存先情報 */}
        <Card style={{ padding: spacing.md }}>
          <SectionTitle>記録先</SectionTitle>
          <Text style={{ color: colors.subtext, marginTop: spacing.sm }}>日付（YYYY-MM-DD）</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            style={{
              borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.text,
              borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6,
            }}
          />
          <Text style={{ color: colors.subtext, marginTop: spacing.md }}>区分</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setMealType(t)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
                  borderColor: mealType === t ? colors.text : colors.border,
                  backgroundColor: mealType === t ? colors.text : colors.card,
                }}
              >
                <Text style={{ color: mealType === t ? colors.card : colors.text, fontWeight: "700" }}>
                  {t === "breakfast" ? "朝食" : t === "lunch" ? "昼食" : t === "dinner" ? "夕食" : "間食"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* 合計 */}
        <Card style={{ padding: spacing.md }}>
          <SectionTitle>合計（{items.length}品）</SectionTitle>
          {!allLoaded && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <ActivityIndicator />
              <Text style={{ color: colors.subtext, fontSize: 12 }}>一部の値を詳細から補正中…</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
            <NutBox label="kcal" value={`${totals.kcal}`} />
            <NutBox label="P" value={`${totals.p} g`} />
            <NutBox label="F" value={`${totals.f} g`} />
            <NutBox label="C" value={`${totals.c} g`} />
          </View>
        </Card>

        {/* 各アイテム */}
        {busy ? (
          <Text style={{ color: colors.subtext }}>読み込み中…</Text>
        ) : items.length === 0 ? (
          <Text style={{ color: colors.subtext }}>選択された商品がありません。</Text>
        ) : (
          items.map((it, i) => (
            <Card key={it.code || i} style={{ padding: spacing.md }}>
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View
                  style={{
                    width: 60, height: 60, borderRadius: radius.md, backgroundColor: "#f1f5f9",
                    overflow: "hidden", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {it.image ? (
                    <Image source={{ uri: it.image }} style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <Text style={{ fontSize: 10, color: colors.subtext }}>No Image</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "800" }} numberOfLines={2}>
                    {it.title || "（名称不明）"}
                  </Text>
                  {!!it.brand && <Text style={{ color: colors.subtext, marginTop: 2 }}>{it.brand}</Text>}
                  <Text style={{ color: colors.subtext, marginTop: 2, fontSize: 12 }}>
                    /100g: kcal {it.kcal100 ?? "-"} / P {it.p100 ?? "-"} / F {it.f100 ?? "-"} / C {it.c100 ?? "-"}
                  </Text>
                  {it.loading ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <ActivityIndicator />
                      <Text style={{ color: colors.subtext, fontSize: 12 }}>補正中…</Text>
                    </View>
                  ) : it.inferred ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>≒ 推定値を含む</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* g スライダー */}
              <View style={{ marginTop: spacing.md }}>
                <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>
                  {it.grams} g
                </Text>
                <Slider
                  minimumValue={10}
                  maximumValue={500}
                  step={5}
                  value={it.grams}
                  onValueChange={(v: number) =>
                    setItems((prev) => {
                      const next = [...prev];
                      next[i] = { ...next[i], grams: Math.round(v) };
                      return next;
                    })
                  }
                />
              </View>

              {/* 計算結果 */}
              <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
                <NutSmall label="kcal" value={`${Math.round(calc(it.kcal100, it.grams))}`} />
                <NutSmall label="P" value={`${calc(it.p100, it.grams)} g`} />
                <NutSmall label="F" value={`${calc(it.f100, it.grams)} g`} />
                <NutSmall label="C" value={`${calc(it.c100, it.grams)} g`} />
              </View>
            </Card>
          ))
        )}

        {/* アクション：合算ではなく個別保存 */}
        <PrimaryButton title={`保存（${items.length}件）`} onPress={saveIndividually} />
        <PrimaryButton
          title="選択をクリアして検索に戻る"
          onPress={async () => {
            await clearBulkSelection();
            router.replace("/(tabs)/meals/search");
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function NutBox({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: spacing.md, alignItems: "center" }}>
      <Text style={{ color: colors.subtext }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 18, marginTop: 4 }}>{value}</Text>
    </Card>
  );
}
function NutSmall({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ minWidth: 70 }}>
      <Text style={{ color: colors.subtext, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: "800", marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderWidth: 1,
  },
  badgeText: { color: "#9a3412", fontSize: 11, fontWeight: "700" },
});
