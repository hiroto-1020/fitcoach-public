import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppPrefs } from "../../../lib/app-prefs";
import { useTranslation } from "react-i18next";

let Constants: any = null; try { Constants = require("expo-constants").default; } catch {}
let Application: any = null; try { Application = require("expo-application"); } catch {}
let Device: any = null; try { Device = require("expo-device"); } catch {}
let Updates: any = null; try { Updates = require("expo-updates"); } catch {}

export default function AboutScreen() {
  const { colors: C, haptic } = useAppPrefs();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const appVersion: string =
    (Constants?.expoConfig?.version as string | undefined) ??
    (Application?.nativeApplicationVersion as string | undefined) ??
    "1.0.0";

  const androidVersionCode = Constants?.expoConfig?.android?.versionCode;
  const buildNumber: string =
    (Application?.nativeBuildVersion as string | undefined) ??
    (Constants?.expoConfig?.ios?.buildNumber as string | undefined) ??
    (androidVersionCode != null ? String(androidVersionCode) : undefined) ??
    "unknown";

  const identifier: string =
    (Application?.applicationId as string | undefined) ??
    (Constants?.expoConfig?.ios?.bundleIdentifier as string | undefined) ??
    (Constants?.expoConfig?.android?.package as string | undefined) ??
    "com.example.app";

  const updateInfo = useMemo(() => {
    const ch =
      (Updates as any)?.channel ??
      (Updates as any)?.manifest?.releaseChannel ??
      "n/a";
    const uid =
      (Updates as any)?.updateId ??
      (Updates as any)?.manifest?.id ??
      "n/a";
    const rt = (Updates as any)?.runtimeVersion ?? "n/a";
    return { channel: ch, updateId: uid, runtimeVersion: rt };
  }, []);

  async function onCheckNow() {
    await haptic("light");
    if (!Updates?.checkForUpdateAsync) {
      Alert.alert(
        t("about.updateCheck.unsupportedTitle"),
        t("about.updateCheck.unsupportedMessage")
      );
      return;
    }
    try {
      setBusy(true);
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          t("about.updateCheck.applyingTitle"),
          t("about.updateCheck.applyingMessage"),
          [
            {
              text: t("about.updateCheck.applyingOk"),
              onPress: () => Updates.reloadAsync?.(),
            },
            {
              text: t("about.updateCheck.applyingCancel"),
              style: "cancel",
            },
          ]
        );
      } else {
        Alert.alert(
          t("about.updateCheck.latestTitle"),
          t("about.updateCheck.latestMessage")
        );
      }
    } catch (e: any) {
      Alert.alert(
        t("about.updateCheck.failedTitle"),
        String(e?.message ?? t("about.updateCheck.failedMessageFallback"))
      );
    } finally {
      setBusy(false);
    }
  }

  function openStore() {
    if (Platform.OS === "ios") {
      Linking.openURL("https://apps.apple.com/").catch(() => {});
    } else {
      Linking.openURL(
        `https://play.google.com/store/apps/details?id=${encodeURIComponent(identifier)}`
      ).catch(() => {});
    }
  }

  const rows: Array<[string, string]> = [
    [t("about.rows.appName"), String(Constants?.expoConfig?.name ?? "FitGear")],
    [t("about.rows.version"), appVersion],
    [t("about.rows.buildNumber"), buildNumber],
    [t("about.rows.appId"), identifier],
    [
      t("about.rows.device"),
      `${Device?.manufacturer ?? "?"} ${Device?.modelName ?? ""}`.trim(),
    ],
    [t("about.rows.os"), `${Platform.OS} ${Device?.osVersion ?? ""}`.trim()],
    [t("about.rows.updatesChannel"), updateInfo.channel],
    [t("about.rows.updatesUpdateId"), updateInfo.updateId],
    [t("about.rows.updatesRuntimeVersion"), updateInfo.runtimeVersion],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={[
            styles.card,
            { backgroundColor: C.card, borderColor: C.border },
          ]}
        >
          {rows.map(([k, v], i) => (
            <View key={k}>
              {i !== 0 && (
                <View style={{ height: 1, backgroundColor: C.border }} />
              )}
              <View style={styles.row}>
                <Text style={[styles.key, { color: C.sub }]}>{k}</Text>
                <Text
                  style={[styles.val, { color: C.text }]}
                  numberOfLines={2}
                >
                  {v || t("about.rows.empty")}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 12 }} />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={onCheckNow}
            disabled={busy}
            style={[styles.btn, { backgroundColor: C.primary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>
              {busy
                ? t("about.updateCheck.buttonChecking")
                : t("about.updateCheck.buttonCheckNow")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openStore}
            style={[
              styles.btn,
              { borderWidth: 1, borderColor: C.border },
            ]}
          >
            <Text style={{ color: C.text, fontWeight: "800" }}>
              {t("about.store.buttonOpenStore")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  key: { width: 140, fontWeight: "700" },
  val: { flex: 1, fontWeight: "600" },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
