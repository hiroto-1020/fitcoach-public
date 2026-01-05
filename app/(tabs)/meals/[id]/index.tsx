// app/(tabs)/meals/[id]/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, Alert, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, Link, useRouter } from "expo-router";
import dayjs from "dayjs";

import { colors, spacing } from "../../../../ui/theme";
import { Card, SectionTitle, PrimaryButton } from "../../../../ui/components";

import type { Meal } from "../../../../lib/meals";
import { getMeal, deleteMeal } from "../../../../lib/storage";
import { useTranslation } from "react-i18next";

export default function MealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const m = id ? await getMeal(String(id)) : undefined;
        if (mounted) setMeal(m ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Text style={{ padding: spacing.lg, color: colors.subtext }}>
        {t("meals.detail.loading")}
      </Text>
    );
  }

  if (!meal) {
    return (
      <Text style={{ padding: spacing.lg, color: colors.subtext }}>
        {t("meals.detail.notFound")}
      </Text>
    );
  }

  function onDelete() {
    Alert.alert(
      t("meals.detail.deleteConfirmTitle"),
      t("meals.detail.deleteConfirmMessage"),
      [
        { text: t("meals.detail.deleteCancel"), style: "cancel" },
        {
          text: t("meals.detail.deleteConfirm"),
          style: "destructive",
          onPress: async () => {
            await deleteMeal(meal.id);
            Alert.alert(t("meals.detail.deletedTitle"), undefined, [
              {
                text: "OK", // OK は共通表記としてそのまま使用
                onPress: () => router.replace("/(tabs)/meals"),
              },
            ]);
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
    >
      <Card style={{ padding: spacing.md }}>
        <SectionTitle>{t("meals.detail.recordSectionTitle")}</SectionTitle>
        <Text style={{ color: colors.subtext, marginTop: spacing.sm }}>
          {dayjs(meal.date).format("YYYY/MM/DD")}（
          {t(mealTypeKey(meal.mealType))}
          ）
        </Text>

        <Text
          style={{
            color: colors.text,
            fontWeight: "800",
            marginTop: spacing.sm,
          }}
        >
          {meal.title || t("meals.detail.untitled")}
        </Text>
        {!!meal.brand && (
          <Text style={{ color: colors.subtext, marginTop: 4 }}>
            {meal.brand}
          </Text>
        )}

        {!!meal.photoUri && (
          <Image
            source={{ uri: meal.photoUri }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 8,
              marginTop: spacing.md,
            }}
          />
        )}
      </Card>

      <Card style={{ padding: spacing.md }}>
        <SectionTitle>{t("meals.detail.nutritionSectionTitle")}</SectionTitle>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            columnGap: 16,
            rowGap: 8,
            marginTop: spacing.sm,
          }}
        >
          <Fact
            label={t("meals.detail.amountLabel")}
            value={meal.grams != null ? `${meal.grams} g` : "—"}
          />
          <Fact
            label="kcal"
            value={meal.calories != null ? String(meal.calories) : "—"}
          />
          <Fact
            label="P"
            value={meal.protein != null ? `${meal.protein} g` : "—"}
          />
          <Fact
            label="F"
            value={meal.fat != null ? `${meal.fat} g` : "—"}
          />
          <Fact
            label="C"
            value={meal.carbs != null ? `${meal.carbs} g` : "—"}
          />
        </View>
      </Card>

      <View style={{ flexDirection: "row", gap: 12 }}>
        {/* 編集へ */}
        <Link asChild href={`/(tabs)/meals/${meal.id}/edit`}>
          <PrimaryButton title={t("meals.detail.editButton")} />
        </Link>

        {/* 削除 */}
        <TouchableOpacity
          onPress={onDelete}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#ef4444",
            backgroundColor: "#fee2e2",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#b91c1c", fontWeight: "800" }}>
            {t("meals.detail.deleteConfirm")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ minWidth: 80 }}>
      <Text style={{ color: colors.subtext, fontSize: 12 }}>{label}</Text>
      <Text
        style={{
          color: colors.text,
          fontWeight: "800",
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// mealType   i18n キー
function mealTypeKey(t?: string) {
  return t === "breakfast"
    ? "meals.detail.mealTypeBreakfast"
    : t === "lunch"
    ? "meals.detail.mealTypeLunch"
    : t === "dinner"
    ? "meals.detail.mealTypeDinner"
    : "meals.detail.mealTypeSnack";
}
