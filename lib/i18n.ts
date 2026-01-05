import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ja from "../locales/ja/common";
import en from "../locales/en/common";
import ko from "../locales/ko/common";

export const SUPPORTED_LANGS = ["ja", "en", "ko"] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];
export const LANGUAGE_STORAGE_KEY = "fitgear_language_v1";

const resources = {
  ja: { translation: ja },
  en: { translation: en },
  ko: { translation: ko },
};

i18n.use(initReactI18next).init({
  resources,
  compatibilityJSON: "v3",
  lng: "ja",
  fallbackLng: "ja",
  interpolation: { escapeValue: false },
});

async function detectInitialLanguage() {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored as AppLang)) {
      await i18n.changeLanguage(stored);
      return;
    }

    const device = Localization.locale.split("-")[0];
    const initial = SUPPORTED_LANGS.includes(device as AppLang)
      ? (device as AppLang)
      : "ja";

    await i18n.changeLanguage(initial);
  } catch {
  }
}

detectInitialLanguage();

export async function setAppLanguage(lang: AppLang) {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export default i18n;
