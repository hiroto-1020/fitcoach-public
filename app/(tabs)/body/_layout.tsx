import React from "react";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function BodyLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen
        name="index"
        options={{ title: t("body.title") }}
      />

    </Stack>
  );
}
