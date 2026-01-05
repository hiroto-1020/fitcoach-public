import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { Stack, Link } from "expo-router";
import { colors } from "../../../ui/theme";

function withAlpha(hex: string, a: number) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((s) => parseInt(s, 16));
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, a))})`;
}

export default function MealsLayout() {
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
          title: "食事",
          headerRight: () => (
            <Link
              href={{ pathname: "/(tabs)/help", params: { section: "meals" } }}
              asChild
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="食事のヘルプを開く"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontWeight: "800" }}>
                  ヘルプ
                </Text>
              </TouchableOpacity>
            </Link>
          ),
        }}
      />

      <Stack.Screen name="new" options={{ title: "食事を記録" }} />
      <Stack.Screen name="new-from-product" options={{ title: "商品から作成" }} />
      <Stack.Screen name="[id]/index" options={{ title: "食事の詳細" }} />
      <Stack.Screen name="[id]/edit" options={{ title: "食事を編集" }} />
      <Stack.Screen name="search" options={{ title: "商品検索" }} />
      <Stack.Screen name="add-from-product" options={{ title: "商品を取り込み" }} />
      <Stack.Screen name="bulk-from-products" options={{ title: "複数商品の合算" }} />
      <Stack.Screen name="favorites" options={{ title: "お気に入り" }} />
    </Stack>
  );
}
