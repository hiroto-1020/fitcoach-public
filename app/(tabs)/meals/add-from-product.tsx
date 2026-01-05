import React, { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { colors, spacing, radius } from "../../../ui/theme";
import { Card, PrimaryButton, SectionTitle } from "../../../ui/components";
import { fetchNormalized100gByCode } from "../../../lib/openfoodfacts";

type Params = {
  code?: string;
  title?: string;
  brand?: string;
  image?: string;
  kcal100?: string;
  protein100?: string;
  fat100?: string;
  carbs100?: string;
};

function calc(per100: number, grams: number) {
  return Math.round(((per100 * grams) / 100) * 10) / 10;
}

export default function AddFromProductScreen() {
  const params = useLocalSearchParams<Params>();
  const code = (params.code || "").toString();
  const title = (params.title || "").toString();
  const brand = (params.brand || "").toString();
  const image = (params.image || "").toString();

  const [grams, setGrams] = useState(100);

  const [kcal100, setKcal100] = useState<number | undefined>(() => Number(params.kcal100 || 0) || undefined);
  const [p100, setP100]       = useState<number | undefined>(() => Number(params.protein100 || 0) || undefined);
  const [f100, setF100]       = useState<number | undefined>(() => Number(params.fat100 || 0) || undefined);
  const [c100, setC100]       = useState<number | undefined>(() => Number(params.carbs100 || 0) || undefined);

  const [loading, setLoading] = useState(false);
  const [inferred, setInferred] = useState(false);

  useEffect(() => {
    const needs = [kcal100, p100, f100, c100].some((v) => v == null || v === 0);
    if (!needs || !code) return;
    setLoading(true);
    fetchNormalized100gByCode(code)
      .then((n) => {
        if (n.kcal100 != null) setKcal100(n.kcal100);
        if (n.p100 != null) setP100(n.p100);
        if (n.f100 != null) setF100(n.f100);
        if (n.c100 != null) setC100(n.c100);
        setInferred(Boolean(n.inferred));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  const totals = useMemo(() => {
    return {
      kcal: Math.round(calc(kcal100 || 0, grams)),
      p: calc(p100 || 0, grams),
      f: calc(f100 || 0, grams),
      c: calc(c100 || 0, grams),
    };
  }, [grams, kcal100, p100, f100, c100]);

  const prefillParams = useMemo(() => {
    return {
      prefill_title: title,
      prefill_brand: brand,
      prefill_photo: image,
      prefill_grams: String(grams),
      prefill_kcal: String(totals.kcal),
      prefill_p: String(totals.p),
      prefill_f: String(totals.f),
      prefill_c: String(totals.c),
    };
  }, [title, brand, image, grams, totals]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <Card style={{ padding: spacing.md, flexDirection: "row", gap: spacing.md }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: radius.md,
              backgroundColor: "#f1f5f9",
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {image ? (
              <Image source={{ uri: image }} style={{ width: "100%", height: "100%" }} />
            ) : (
              <Text style={{ fontSize: 10, color: colors.subtext }}>No Image</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: "800" }} numberOfLines={2}>
              {title || "（名称不明）"}
            </Text>
            {!!brand && <Text style={{ color: colors.subtext, marginTop: 4 }}>{brand}</Text>}
            <Text style={{ color: colors.subtext, marginTop: 4, fontSize: 12 }}>
              栄養（100gあたり）：
              kcal {kcal100 ?? "-"} ／ P {p100 ?? "-"}g ／ F {f100 ?? "-"}g ／ C {c100 ?? "-"}g
            </Text>
            {loading ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                <ActivityIndicator />
                <Text style={{ color: colors.subtext, fontSize: 12 }}>詳細から補正中…</Text>
              </View>
            ) : inferred ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>≒ 推定値を含みます</Text>
              </View>
            ) : null}
          </View>
        </Card>

        <Card style={{ padding: spacing.md }}>
          <SectionTitle>分量（g）</SectionTitle>
          <Text style={{ color: colors.text, fontWeight: "800", fontSize: 24, marginTop: spacing.sm }}>
            {grams} g
          </Text>

          <View style={{ marginTop: spacing.md }}>
            <Slider minimumValue={10} maximumValue={500} step={5} value={grams} onValueChange={(v: number) => setGrams(Math.round(v))} />
          </View>

          <View style={{ height: spacing.md }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {([50, 100, 150, 200, 300, 400] as number[]).map((g) => (
              <QuickChip key={g} g={g} onPick={() => setGrams(g)} />
            ))}
          </View>
        </Card>

        <Card style={{ padding: spacing.md }}>
          <SectionTitle>この分量での栄養</SectionTitle>
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
            <NutBox label="kcal" value={`${totals.kcal}`} />
            <NutBox label="P" value={`${totals.p} g`} />
            <NutBox label="F" value={`${totals.f} g`} />
            <NutBox label="C" value={`${totals.c} g`} />
          </View>
        </Card>

        <Link asChild href={{ pathname: "/(tabs)/meals/new-from-product", params: prefillParams }}>
          <PrimaryButton title="この内容で食事を作成へ" />
        </Link>
      </View>
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

function QuickChip({ g, onPick }: { g: number; onPick: () => void }) {
  return (
    <View style={styles.chipWrap}>
      <Text onPress={onPick} style={styles.chipText}>{g}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
    borderWidth: 1,
    borderRadius: 999,
  },
  chipText: { color: "#3730a3", fontWeight: "700" },
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
