import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { Stack, Link } from "expo-router";
import { colors } from "../../../ui/theme";
import { useTranslation } from "react-i18next";

function withAlpha(hex: string, a: number) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((s) => parseInt(s, 16));
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, a))})`;
}

export default function HomeLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t("home_tab.title"),
          headerRight: () => (
            <Link
              href={{ pathname: "/(tabs)/help", params: { section: "home" } }}
              asChild
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("home_tab.help_accessibility")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontWeight: "800" }}>
                  {t("home_tab.help_label")}
                </Text>
              </TouchableOpacity>
            </Link>
          ),
        }}
      />
    </Stack>
  );
}
