// C:\Users\horit\fitcoach\app\(tabs)\me\app-settings.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  KeyboardAvoidingView,
  InputAccessoryView,
  Keyboard,
} from "react-native";
import { useAppPrefs, type ThemeMode } from "../../../lib/app-prefs";
import { useTranslation } from "react-i18next";
import i18n from "../../../lib/i18n";

/** 画面 */
export default function AppSettingsScreen() {
  const {
    themeMode,
    setThemeMode,
    effectiveScheme,
    colors: appColors,
    hapticsEnabled,
    setHapticsEnabled,
    haptic,
  } = useAppPrefs();

  const { t } = useTranslation();

  // 画面上は“保存”までローカル編集中にする
  const [theme, setTheme] = useState<ThemeMode>(themeMode);
  const [hapticsLocal, setHapticsLocal] = useState<boolean>(hapticsEnabled);
  const [saving, setSaving] = useState(false);

  // 言語（ローカル）
  const initialLang: "ja" | "en" | "ko" = (() => {
    const lng = i18n.language || "ja";
    if (lng.startsWith("en")) return "en";
    if (lng.startsWith("ko")) return "ko";
    return "ja"; // ja / ja-JP など
  })();
  const [langLocal, setLangLocal] = useState<"ja" | "en" | "ko">(initialLang);

  // iOS キーボード上バー
  const accessoryID = useRef("appSettingsAccessory").current;

  // テーマオプション（ラベルを i18n から取得）
  const themeOptions: { key: ThemeMode; label: string }[] = useMemo(
    () => [
      { key: "auto", label: t("settings.theme_auto") },
      { key: "light", label: t("settings.theme_light") },
      { key: "dark", label: t("settings.theme_dark") },
    ],
    [t]
  );

  // 端末のライト/ダークラベル
  const schemeLabel = effectiveScheme === "dark" ? t("settings.theme_dark") : t("settings.theme_light");

  // プレビュー用の色（ローカル選択に合わせて切替）
  const previewScheme: "light" | "dark" =
    theme === "auto" ? effectiveScheme : (theme as "light" | "dark");
  const ui = useMemo(() => palette(previewScheme), [previewScheme]);

  // 画面初期化：グローバルからローカルへ同期（戻ってきた時など）
  useEffect(() => {
    setTheme(themeMode);
    setHapticsLocal(hapticsEnabled);
  }, [themeMode, hapticsEnabled]);

  // 保存：グローバルへ反映（＝全画面に即反映 & 永続化）
  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      await setThemeMode(theme);
      await setHapticsEnabled(hapticsLocal);
      // 言語を変更（i18next）
      i18n.changeLanguage(langLocal);

      Alert.alert(
        t("settings.alert_saved_title"),
        t("settings.alert_saved_body")
      );
    } catch {
      Alert.alert(
        t("settings.alert_failed_title"),
        t("settings.alert_failed_body")
      );
    } finally {
      setSaving(false);
    }
  }, [theme, hapticsLocal, langLocal, setThemeMode, setHapticsEnabled, t]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: appColors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: appColors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.h1, { color: appColors.text }]}>
          {t("settings.appSettings_title")}
        </Text>
        <Text style={[styles.sub, { color: appColors.sub }]}>
          {t("settings.appSettings_desc")}
        </Text>

        {/* テーマ */}
        <Card title={t("settings.theme_title")} colors={appColors}>
          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: appColors.text }]}>
              {t("settings.theme_mode_label")}
            </Text>
            <View style={styles.segmentRow}>
              {themeOptions.map((opt) => {
                const active = theme === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setTheme(opt.key)}
                    style={[
                      styles.segment,
                      { borderColor: appColors.border, backgroundColor: appColors.card },
                      active && { backgroundColor: appColors.primary, borderColor: appColors.primary },
                    ]}
                    accessibilityLabel={t("settings.theme_accessibility", { label: opt.label })}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? "#fff" : appColors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 簡易プレビュー（ローカル選択を反映） */}
          <View style={[styles.preview, { backgroundColor: ui.card, borderColor: ui.border }]}>
            <Text style={{ color: ui.text, fontWeight: "800", marginBottom: 6 }}>
              {t("settings.theme_preview_title")}
            </Text>
            <Text style={{ color: ui.sub, marginBottom: 8, fontSize: 12 }}>
              {t("settings.theme_current_prefix")}
              {theme === "auto"
                ? t("settings.theme_current_auto", { scheme: schemeLabel })
                : themeOptions.find((o) => o.key === theme)?.label ?? theme.toUpperCase()}
            </Text>

            <View style={[styles.previewCard, { backgroundColor: ui.card, borderColor: ui.border }]}>
              <Text
                style={{
                  color: ui.text,
                  fontWeight: "700",
                  fontSize: 15,
                  marginBottom: 4,
                }}
              >
                {t("settings.theme_preview_cardTitle")}
              </Text>
              <Text style={{ color: ui.sub, fontSize: 12 }}>
                {t("settings.theme_preview_cardBody")}
              </Text>
              <TouchableOpacity
                onPress={() => haptic("light")}
                style={[styles.primaryBtn, { backgroundColor: ui.primary, marginTop: 10 }]}
              >
                <Text style={styles.primaryBtnText}>
                  {t("settings.theme_preview_button")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* 言語切り替え */}
        <Card title={t("settings.language")} colors={appColors}>
          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: appColors.text }]}>
              {t("settings.language")}
            </Text>
            <View style={styles.segmentRow}>
              {([
                { key: "ja", label: t("settings.language_ja") },
                { key: "en", label: t("settings.language_en") },
                { key: "ko", label: t("settings.language_ko") },
              ] as const).map((opt) => {
                const active = langLocal === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setLangLocal(opt.key)}
                    style={[
                      styles.segment,
                      { borderColor: appColors.border, backgroundColor: appColors.card },
                      active && { backgroundColor: appColors.primary, borderColor: appColors.primary },
                    ]}
                    accessibilityLabel={t("settings.language_accessibility", { label: opt.label })}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: active ? "#fff" : appColors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Text style={[styles.hint, { color: appColors.sub }]}>
            {t("settings.language_hint")}
          </Text>
        </Card>

        {/* 触覚 */}
        <Card title={t("settings.haptics_title")} colors={appColors}>
          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: appColors.text }]}>
              {t("settings.haptics_label")}
            </Text>
            <Switch value={hapticsLocal} onValueChange={setHapticsLocal} />
          </View>
          <Text style={[styles.hint, { color: appColors.sub }]}>
            {t("settings.haptics_hint")}
          </Text>

          <TouchableOpacity
            onPress={() => haptic("medium")}
            style={[
              styles.outlineBtn,
              {
                borderColor: appColors.primary,
                backgroundColor: previewScheme === "dark" ? "#0a1630" : "#F0F9FF",
              },
            ]}
          >
            <Text style={[styles.outlineBtnText, { color: appColors.primary }]}>
              {t("settings.haptics_test")}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Tips */}
        <Card title={t("settings.memo_title")} colors={appColors}>
          <Text
            style={{
              color: appColors.sub,
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            {t("settings.memo_body")}
          </Text>
        </Card>
      </ScrollView>

      {/* iOS: キーボード上バー（“保存”ショートカット） */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={accessoryID}>
          <View
            style={[
              styles.accessoryBar,
              { backgroundColor: appColors.card, borderColor: appColors.border },
            ]}
          >
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              style={[
                styles.accessoryBtn,
                {
                  backgroundColor:
                    previewScheme === "dark" ? "#1f2a37" : "#F3F4F6",
                },
              ]}
            >
              <Text
                style={[
                  styles.accessoryBtnText,
                  { color: appColors.text },
                ]}
              >
                {t("settings.accessory_close")}
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={onSave}
              disabled={saving}
              style={[
                styles.accessoryPrimary,
                { backgroundColor: appColors.primary },
                saving && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.accessoryPrimaryText}>
                {saving
                  ? t("settings.accessory_saving")
                  : t("settings.accessory_save")}
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      {/* 下固定バー（Android等） */}
      <View
        style={[
          styles.fixedBar,
          { backgroundColor: appColors.card, borderColor: appColors.border },
        ]}
      >
        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          style={[
            styles.fixedPrimary,
            { backgroundColor: appColors.primary },
            saving && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.fixedPrimaryText}>
            {saving
              ? t("settings.bottom_saving")
              : t("settings.bottom_save")}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/** ========== 小物 ========== */
function Card({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ReturnType<typeof palette>;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      <View style={{ marginTop: 8 }}>{children}</View>
    </View>
  );
}

function palette(s: "light" | "dark") {
  return s === "dark"
    ? {
        bg: "#0B0F14",
        card: "#121922",
        text: "#E5E7EB",
        sub: "#9CA3AF",
        border: "#1F2937",
        primary: "#2563EB",
      }
    : {
        bg: "#F7F8FA",
        card: "#FFFFFF",
        text: "#1C1C1E",
        sub: "#6B7280",
        border: "#E6E8EE",
        primary: "#2563EB",
      };
}

/** ========== Styles ========== */
const styles = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: "800" },
  sub: { marginTop: 4, marginBottom: 12 },

  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.06 : 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: "800" },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: { fontWeight: "700" },
  hint: { fontSize: 12 },

  segmentRow: { flexDirection: "row", gap: 8 },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segmentText: { fontWeight: "800" },

  preview: {
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 10,
  },
  previewCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12 },

  // Buttons (shared)
  primaryBtn: { paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  outlineBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  outlineBtnText: { fontWeight: "800" },

  // Accessory bar
  accessoryBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  accessoryBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  accessoryBtnText: { fontWeight: "700" },
  accessoryPrimary: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  accessoryPrimaryText: { color: "#FFFFFF", fontWeight: "800" },

  // Fixed bottom bar
  fixedBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 10,
  },
  fixedPrimary: { borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  fixedPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
