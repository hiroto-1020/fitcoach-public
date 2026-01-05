import React from "react";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function BodyLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      {/* /body */}
      <Stack.Screen
        name="index"
        options={{ title: t("body.title") }}
      />

      {/* /body/new を将来作る場合 */}
      {/* 
      <Stack.Screen
        name="new"
        options={{ title: t("body.title_new") }}
      />
      */}
    </Stack>
  );
}
