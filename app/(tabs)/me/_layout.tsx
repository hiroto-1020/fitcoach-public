// app/(tabs)/me/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { useThemeColors } from "../../../ui/theme";
import { useTranslation } from "react-i18next";

export default function MeLayout() {
  const C = useThemeColors();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerBackTitle: t("me.back"),
        // ▼ テーマ連動
        headerStyle: { backgroundColor: C.card },
        headerTintColor: C.text,
        headerTitleStyle: { color: C.text },
        headerShadowVisible: true,
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t("me.settings") }}
      />
      <Stack.Screen
        name="account"
        options={{ title: t("me.account") }}
      />
      <Stack.Screen
        name="goals"
        options={{ title: t("me.goals") }}
      />
      <Stack.Screen
        name="notifications"
        options={{ title: t("me.notifications") }}
      />
      {/* “アプリ設定”は名称が紛らわしいのでファイル名は app-settings にしています */}
      <Stack.Screen
        name="app-settings"
        options={{ title: t("me.appSettings") }}
      />
      <Stack.Screen
        name="data-privacy"
        options={{ title: t("me.dataPrivacy") }}
      />
      <Stack.Screen
        name="support"
        options={{ title: t("me.support") }}
      />
      <Stack.Screen
        name="about"
        options={{ title: t("me.about") }}
      />
    </Stack>
  );
}
