import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppPrefs } from "../../lib/app-prefs";
import { ensureNotificationSetup } from "../../lib/notify";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const router = useRouter();
  const { colors } = useAppPrefs();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    ensureNotificationSetup();
  }, []);

  const tabBarStyle = {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    height: 60,
  } as const;

  const icon =
    (name: keyof typeof Ionicons.glyphMap) =>
    ({ color, size }: { color: string; size: number }) =>
      <Ionicons name={name} size={size} color={color} />;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.sub,
          tabBarStyle,
          tabBarItemStyle: { paddingTop: 2, paddingBottom: 2 },
          tabBarLabelStyle: { fontWeight: "600", fontSize: 11, lineHeight: 13 },
        }}
      >

        <Tabs.Screen
          name="home"
          options={{
            title: t("tabs.home"),
            tabBarIcon: icon("home-outline"),
          }}
        />

        <Tabs.Screen
          name="record/index"
          options={{
            title: t("tabs.record"),
            tabBarIcon: icon("clipboard-outline"),
          }}
        />

        <Tabs.Screen
          name="explore/index"
          options={{
            title: t("tabs.explore"),
            tabBarIcon: icon("compass-outline"),
          }}
        />

        <Tabs.Screen
          name="gotore"
          options={{
            title: t("tabs.gotore"),
            tabBarIcon: icon("people-outline"),
          }}
        />

        <Tabs.Screen
          name="me"
          options={{
            title: t("tabs.me"),
            tabBarIcon: icon("person-circle-outline"),
          }}
        />


        <Tabs.Screen
          name="training"
          options={{ href: null}}
        />
        <Tabs.Screen
          name="meals"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="body"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="more"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="videos"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="help/index"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="settings"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="settings/language"
          options={{ href: null }}
        />
      </Tabs>

      <Modal
        visible={moreOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setMoreOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setMoreOpen(false)} />
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingBottom: 16 + (Platform.OS === "ios" ? 8 : 0),
              paddingTop: 10,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            <SheetHandle />
            <SheetItem
              icon="settings-outline"
              label="設定"
              onPress={() => {
                setMoreOpen(false);
                router.push("/(tabs)/me");
              }}
              colors={colors}
            />
            <SheetItem
              icon="help-circle-outline"
              label="ヘルプ"
              onPress={() => {
                setMoreOpen(false);
                router.push("/(tabs)/help");
              }}
              colors={colors}
            />
            <View style={{ height: 10 }} />
            <TouchableOpacity
              onPress={() => setMoreOpen(false)}
              style={{
                alignSelf: "center",
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 12,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>閉じる</Text>
            </TouchableOpacity>
            <View style={{ height: 10 }} />
          </View>
        </View>
      </Modal>
    </>
  );
}

function SheetHandle() {
  return (
    <View style={{ alignItems: "center", marginBottom: 6 }}>
      <View
        style={{
          width: 40,
          height: 4,
          borderRadius: 999,
          backgroundColor: "rgba(150,150,150,0.3)",
        }}
      />
    </View>
  );
}

function SheetItem({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: {
    bg: string;
    card: string;
    text: string;
    sub: string;
    border: string;
    primary: string;
  };
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderColor: colors.border,
      }}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={{ marginLeft: 12, color: colors.text, fontWeight: "700" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
