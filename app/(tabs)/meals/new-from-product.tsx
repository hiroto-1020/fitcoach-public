import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import dayjs from "dayjs";

import { colors, spacing } from "../../../ui/theme";
import { Card, SectionTitle, PrimaryButton } from "../../../ui/components";

import type { Meal, MealType } from "../../../lib/meals";
import { saveMeal } from "../../../lib/storage";
import { generateId } from "../../../lib/id";
import { recordUsage } from "../../../lib/usage";

type PrefillParams = {
  prefill_title?: string;
  prefill_brand?: string;
  prefill_photo?: string;
  prefill_grams?: string;
  prefill_kcal?: string;
  prefill_p?: string;
  prefill_f?: string;
  prefill_c?: string;
  date?: string;
  mealType?: MealType;
};

export default function NewFromProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PrefillParams>();

  const [date, setDate] = useState<string>(() => (params.date || "").toString() || dayjs().format("YYYY-MM-DD"));
  const [mealType, setMealType] = useState<MealType>((params.mealType as MealType) || "snack");

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [grams, setGrams] = useState<number | undefined>(undefined);
  const [calories, setCalories] = useState<number | undefined>(undefined);
  const [protein, setProtein] = useState<number | undefined>(undefined);
  const [fat, setFat] = useState<number | undefined>(undefined);
  const [carbs, setCarbs] = useState<number | undefined>(undefined);
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    const t = (params.prefill_title || "").toString();
    const b = (params.prefill_brand || "").toString();
    const ph = (params.prefill_photo || "").toString();
    const g = Number((params.prefill_grams || "").toString());
    const kcal = Number((params.prefill_kcal || "").toString());
    const p = Number((params.prefill_p || "").toString());
    const f = Number((params.prefill_f || "").toString());
    const c = Number((params.prefill_c || "").toString());

    if (t) setTitle(t);
    if (b) setBrand(b);
    if (!Number.isNaN(g) && g > 0) setGrams(g);
    if (!Number.isNaN(kcal) && kcal > 0) setCalories(kcal);
    if (!Number.isNaN(p) && p >= 0) setProtein(p);
    if (!Number.isNaN(f) && f >= 0) setFat(f);
    if (!Number.isNaN(c) && c >= 0) setCarbs(c);
    if (ph) setPhotoUri(ph);
  }, []);

  const canSave = useMemo(() => Boolean(title || calories || protein || fat || carbs), [title, calories, protein, fat, carbs]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]?.uri) setPhotoUri(res.assets[0].uri);
  }

  async function onSave() {
    const meal: Meal = {
      id: generateId("meal"),
      date,
      mealType,
      title: title?.trim() || undefined,
      brand: brand?.trim() || undefined,
      grams,
      calories,
      protein,
      fat,
      carbs,
      photoUri,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveMeal(meal);

    await recordUsage({
      title: meal.title || "（名称不明）",
      brand: meal.brand,
      image: meal.photoUri,
    });

    Alert.alert("保存しました", "記録を保存しました。", [
      { text: "OK", onPress: () => router.replace("/(tabs)/meals/search") },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <Card style={{ padding: spacing.md }}>
        <SectionTitle>基本情報</SectionTitle>
        <Text style={{ color: colors.subtext, marginTop: spacing.sm }}>タイトル</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="例：サラダチキン（ローソン）" placeholderTextColor={colors.muted} style={ti()} />
        <Text style={{ color: colors.subtext, marginTop: spacing.md }}>ブランド（任意）</Text>
        <TextInput value={brand} onChangeText={setBrand} placeholder="ローソン / 明治 など" placeholderTextColor={colors.muted} style={ti()} />
        <Text style={{ color: colors.subtext, marginTop: spacing.md }}>写真（任意）</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
          <TouchableOpacity
            onPress={pickImage}
            style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ color: colors.text, fontWeight: "700" }}>写真を選ぶ</Text>
          </TouchableOpacity>
          {!!photoUri && <Image source={{ uri: photoUri }} style={{ width: 64, height: 64, borderRadius: 8 }} />}
        </View>
      </Card>

      <Card style={{ padding: spacing.md }}>
        <SectionTitle>分量・栄養</SectionTitle>
        <Text style={{ color: colors.subtext, marginTop: spacing.sm }}>分量（g）</Text>
        <TextInput
          value={grams != null ? String(grams) : ""}
          onChangeText={(t) => setGrams(Number(t) || undefined)}
          keyboardType="numeric"
          placeholder="例：150"
          placeholderTextColor={colors.muted}
          style={ti()}
        />
        <View style={{ height: spacing.md }} />
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.subtext }}>kcal</Text>
            <TextInput
              value={calories != null ? String(calories) : ""}
              onChangeText={(t) => setCalories(Number(t) || undefined)}
              keyboardType="numeric"
              placeholder="例：220"
              placeholderTextColor={colors.muted}
              style={ti()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.subtext }}>P（g）</Text>
            <TextInput
              value={protein != null ? String(protein) : ""}
              onChangeText={(t) => setProtein(Number(t) || undefined)}
              keyboardType="numeric"
              placeholder="例：20"
              placeholderTextColor={colors.muted}
              style={ti()}
            />
          </View>
        </View>
        <View style={{ height: spacing.md }} />
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.subtext }}>F（g）</Text>
            <TextInput
              value={fat != null ? String(fat) : ""}
              onChangeText={(t) => setFat(Number(t) || undefined)}
              keyboardType="numeric"
              placeholder="例：7"
              placeholderTextColor={colors.muted}
              style={ti()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.subtext }}>C（g）</Text>
            <TextInput
              value={carbs != null ? String(carbs) : ""}
              onChangeText={(t) => setCarbs(Number(t) || undefined)}
              keyboardType="numeric"
              placeholder="例：15"
              placeholderTextColor={colors.muted}
              style={ti()}
            />
          </View>
        </View>
      </Card>

      <Card style={{ padding: spacing.md }}>
        <SectionTitle>記録先</SectionTitle>
        <Text style={{ color: colors.subtext, marginTop: spacing.sm }}>日付（YYYY-MM-DD）</Text>
        <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} style={ti()} />
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

      <PrimaryButton title="保存する" onPress={onSave} disabled={!canSave} />
    </ScrollView>
  );
}

function ti() {
  return {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  } as const;
}
