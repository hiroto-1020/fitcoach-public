import React from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { View, Text, Pressable } from "react-native";
import HeaderBuyLikes from '../../../ui/components/HeaderBuyLikes';
function TopSwitch() {
  const router = useRouter();
  const path = usePathname();
  const isFeed = path === "/(tabs)/gotore" || path === "/(tabs)/gotore/";
  const isMatches = path.startsWith("/(tabs)/gotore/matches");
  const isChat = path.startsWith("/(tabs)/gotore/chat");

  const Item = ({ label, active, to }: { label: string; active: boolean; to: string }) => (
    <Pressable
      onPress={() => router.replace(to)}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? "#111" : "transparent",
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: active ? "#111" : "#d1d5db",
      }}
    >
      <Text style={{ color: active ? "#fff" : "#111", fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8 }}>
      <Item label="探す" active={isFeed} to="/(tabs)/gotore" />
      <Item label="マッチ" active={isMatches} to="/(tabs)/gotore/matches" />
      <Item label="チャット" active={isChat} to="/(tabs)/gotore/chat" />
    </View>
  );
}

function HeaderPurchaseButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/(tabs)/gotore/purchase")}
      hitSlop={8}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: "#22c55e",
        borderWidth: 0,
      }}
    >
      <Text style={{ color: "#0b1220", fontWeight: "900" }}>＋いいね購入</Text>
    </Pressable>
  );
}

export default function GotoreLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerTitle: () => <TopSwitch />,
        headerBackTitleVisible: false,
        headerRight: () => <HeaderPurchaseButton />,
        headerRightContainerStyle: { paddingRight: 10 },
      }}
    >
      <Stack.Screen
        name="purchase"
        options={{ presentation: "modal", title: "いいねを購入" }}
      />
    </Stack>
  );
}
