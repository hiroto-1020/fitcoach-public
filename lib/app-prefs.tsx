// lib/app-prefs.ts — v2: 既定は「light」。旧v1キーがあっても初回移行で「light」に揃える
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import { DarkTheme as NavDark, DefaultTheme as NavLight } from "@react-navigation/native";

let AsyncStorage: any = null;
try { AsyncStorage = require("@react-native-async-storage/async-storage").default; } catch {}
let Haptics: any = null;
try { Haptics = require("expo-haptics"); } catch {}

export type ThemeMode = "auto" | "light" | "dark";
type Scheme = "light" | "dark";
export type Colors = { bg: string; card: string; text: string; sub: string; border: string; primary: string };

// ★ 新キー（v2）
const APP_KEY_V2 = "me.appPrefs.v2";
// 旧キー（存在すれば移行元として参照）
const APP_KEY_V1 = "me.appPrefs";

type StoreShape = { theme: ThemeMode; haptics: boolean; __schema?: "v2" };

type Ctx = {
  ready: boolean;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => Promise<void> | void;
  effectiveScheme: Scheme;
  navTheme: any;
  colors: Colors;
  hapticsEnabled: boolean;
  setHapticsEnabled: (v: boolean) => Promise<void> | void;
  haptic: (style?: "light" | "medium" | "heavy") => Promise<void>;
};

const C = createContext<Ctx | null>(null);

/** パレット */
function palette(s: Scheme): Colors {
  return s === "dark"
    ? { bg: "#0B0F14", card: "#121922", text: "#E5E7EB", sub: "#9CA3AF", border: "#1F2937", primary: "#2563EB" }
    : { bg: "#F7F8FA", card: "#FFFFFF", text: "#1C1C1E", sub: "#6B7280", border: "#E6E8EE", primary: "#2563EB" };
}

export function AppPrefsProvider({ children }: { children: React.ReactNode }) {
  // ★ 初期は「light」固定（描画直後からライトに見える）
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [hapticsEnabled, setHapticsState] = useState<boolean>(true);
  const [ready, setReady] = useState(false);

  const [system, setSystem] = useState<Scheme>(Appearance?.getColorScheme?.() === "dark" ? "dark" : "light");

  // 初期ロード＆移行
  useEffect(() => {
    (async () => {
      let loaded: StoreShape | null = null;

      if (AsyncStorage) {
        try {
          // v2 があればそれを使う
          const rawV2 = await AsyncStorage.getItem(APP_KEY_V2);
          if (rawV2) {
            loaded = { ...(JSON.parse(rawV2) as StoreShape) };
          } else {
            // v2 が無い → v1 を見て移行（テーマは必ず light に統一、haptics は引き継ぎ）
            const rawV1 = await AsyncStorage.getItem(APP_KEY_V1);
            if (rawV1) {
              const v1 = JSON.parse(rawV1) as Partial<StoreShape> | null;
              loaded = {
                theme: "light", // ★ここで旧設定が何であっても一旦ライトに揃える
                haptics: typeof v1?.haptics === "boolean" ? v1!.haptics : true,
                __schema: "v2",
              };
              await AsyncStorage.setItem(APP_KEY_V2, JSON.stringify(loaded));
            } else {
              // どちらも無い → 新規としてライト/触覚ONを書き込む
              loaded = { theme: "light", haptics: true, __schema: "v2" };
              await AsyncStorage.setItem(APP_KEY_V2, JSON.stringify(loaded));
            }
          }
        } catch {
          // 失敗したら既定値のまま
        }
      }

      if (loaded) {
        setThemeModeState(loaded.theme);
        setHapticsState(loaded.haptics);
      }

      setReady(true);
    })();
  }, []);

  // 端末テーマの変化（auto時のみ反映）
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystem(colorScheme === "dark" ? "dark" : "light");
    });
    return () => sub?.remove?.();
  }, []);

  const effectiveScheme: Scheme = themeMode === "auto" ? system : themeMode;
  const navTheme = effectiveScheme === "dark" ? NavDark : NavLight;
  const colors = useMemo(() => palette(effectiveScheme), [effectiveScheme]);

  // 永続化
  const persist = useCallback(
    async (next: Partial<StoreShape>) => {
      if (!AsyncStorage) return;
      const cur: StoreShape = { theme: themeMode, haptics: hapticsEnabled, __schema: "v2" };
      const merged: StoreShape = { ...cur, ...next, __schema: "v2" };
      try { await AsyncStorage.setItem(APP_KEY_V2, JSON.stringify(merged)); } catch {}
    },
    [themeMode, hapticsEnabled]
  );

  const setThemeMode = useCallback(async (m: ThemeMode) => {
    setThemeModeState(m);
    await persist({ theme: m });
  }, [persist]);

  const setHapticsEnabled = useCallback(async (v: boolean) => {
    setHapticsState(v);
    await persist({ haptics: v });
  }, [persist]);

  const haptic = useCallback(async (style: "light" | "medium" | "heavy" = "light") => {
    if (!Haptics || !hapticsEnabled) return;
    try {
      const map = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      await Haptics.impactAsync(map[style]);
    } catch {}
  }, [hapticsEnabled]);

  const value = useMemo<Ctx>(() => ({
    ready,
    themeMode,
    setThemeMode,
    effectiveScheme,
    navTheme,
    colors,
    hapticsEnabled,
    setHapticsEnabled,
    haptic,
  }), [ready, themeMode, setThemeMode, effectiveScheme, navTheme, colors, hapticsEnabled, setHapticsEnabled, haptic]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useAppPrefs() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useAppPrefs must be used inside <AppPrefsProvider>");
  return ctx;
}
