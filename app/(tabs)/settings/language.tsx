import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useAppPrefs } from "../../../lib/app-prefs";
import { AppLang, SUPPORTED_LANGS, setAppLanguage } from "../../../lib/i18n";

const LANG_ITEMS: { code: AppLang; labelKey: string; flag: string }[] = [
  { code: "ja", labelKey: "settings.language_ja", flag: "🇯🇵" },
  { code: "en", labelKey: "settings.language_en", flag: "🇺🇸" },
  { code: "ko", labelKey: "settings.language_ko", flag: "🇰🇷" },
];

export default function LanguageSettingsScreen() {
  const { colors: C } = useAppPrefs();
  const { t, i18n } = useTranslation();
  const [current, setCurrent] = useState<AppLang>("ja");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const code = (i18n.language || "ja").split("-")[0] as AppLang;
    setCurrent(SUPPORTED_LANGS.includes(code) ? code : "ja");
  }, [i18n.language]);

  const handleSelect = async (code: AppLang) => {
    if (saving || code === current) return;
    setSaving(true);
    try {
      await setAppLanguage(code);
      setCurrent(code);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t("settings.language") }} />

      <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: C.text }]}>
            {t("settings.language")}
          </Text>
          <Text style={[styles.subtitle, { color: C.sub }]}>
            {t("settings.language_hint")}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: C.card,
                borderColor: C.border,
                shadowColor: C.elevatedShadow ?? "#000",
              },
            ]}
          >
            {LANG_ITEMS.map((item, index) => {
              const selected = current === item.code;
              const isLast = index === LANG_ITEMS.length - 1;

              return (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => handleSelect(item.code)}
                  disabled={saving}
                  activeOpacity={0.7}
                  style={[
                    styles.row,
                    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
                    selected && { backgroundColor: `${C.primary}11` },
                  ]}
                >
                  <Text style={[styles.flag, { opacity: selected ? 1 : 0.8 }]}>
                    {item.flag}
                  </Text>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.label,
                        { color: C.text, fontWeight: selected ? "800" : "600" },
                      ]}
                    >
                      {t(item.labelKey)}
                    </Text>
                    {selected && (
                      <Text style={[styles.chip, { color: C.primary }]}>
                        ● {t("ui.done")}
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: selected ? C.primary : C.sub },
                    ]}
                  >
                    {selected && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: C.primary },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {saving && (
            <Text
              style={{
                marginTop: 10,
                fontSize: 12,
                color: C.sub,
              }}
            >
              …保存中です
            </Text>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
  },
  card: {
    marginTop: 20,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  flag: {
    fontSize: 22,
    marginRight: 12,
  },
  label: {
    fontSize: 15,
  },
  chip: {
    fontSize: 11,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
});
