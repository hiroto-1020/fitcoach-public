// ui/theme.ts
import { Appearance, ColorSchemeName } from "react-native";
import { useSyncExternalStore } from "react";

// ====== 型 ======
export type Palette = {
  bg: string;
  card: string;
  border: string;
  text: string;
  subtext: string;
  primary: string;
  primaryText: string;
  accent: string;
  weight: string;
  bodyFat: string;
  avg: string;
  danger: string;
};

export type Mode = "system" | "light" | "dark";

// ====== パレット定義 ======
const PALETTES: Record<"light" | "dark", Palette> = {
  light: {
    bg: "#F7F8FA",
    card: "#FFFFFF",
    border: "#E5E7EB",
    text: "#0F172A",
    subtext: "#64748B",
    primary: "#2563EB",
    primaryText: "#FFFFFF",
    accent: "#10B981",
    weight: "#6D28D9",
    bodyFat: "#F59E0B",
    avg: "#3B82F6",
    danger: "#EF4444",
  },
  dark: {
    bg: "#0B1220",
    card: "#0F172A",
    border: "#334155",
    text: "#E5E7EB",
    subtext: "#94A3B8",
    primary: "#3B82F6",
    primaryText: "#FFFFFF",
    accent: "#34D399",
    weight: "#A78BFA",
    bodyFat: "#FBBF24",
    avg: "#60A5FA",
    danger: "#F87171",
  },
} as const;

// ====== ランタイムのテーマ管理 ======
let mode: Mode = "system"; // 現在のユーザー指定（system|light|dark）

const initialScheme: "light" | "dark" =
  Appearance.getColorScheme() === "dark" ? "dark" : "light";

let scheme: "light" | "dark" = initialScheme; // 実際に適用中のスキーム

// 参照を固定したまま中身だけ差し替える “生きている” colors
export const colors: Palette = { ...PALETTES[initialScheme] };

// 外部購読（useTheme / useThemeColors が購読）
const listeners = new Set<() => void>();

function apply(next: "light" | "dark") {
  scheme = next;
  Object.assign(colors, PALETTES[next]); // 参照は維持 / 中身のみ更新
  listeners.forEach((l) => l());
}

// システムの外観変更を購読（mode=system の時のみ反映）
Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
  if (mode !== "system") return;
  apply(colorScheme === "dark" ? "dark" : "light");
});

// ====== パブリックAPI ======
/** テーマを固定（light/dark）またはシステム追従（system）に設定 */
export function setTheme(next: Mode) {
  mode = next;
  const s =
    next === "system"
      ? Appearance.getColorScheme() === "dark"
        ? "dark"
        : "light"
      : next;
  apply(s);
}

/** 現在のテーマ状態を React で購読（色は `colors` を直接使える） */
export function useTheme() {
  const subscribe = (onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    return () => listeners.delete(onStoreChange);
  };
  // 現状の scheme を外部ストアとして購読（SSR の fallback は light）
  useSyncExternalStore(subscribe, () => scheme, () => "light");
  return { colors, isDark: scheme === "dark", scheme, mode };
}

/** 互換フック：画面側で `const C = useThemeColors()` として使える */
export function useThemeColors(pref: Mode = "system"): Palette {
  // system 指定はグローバル状態を購読（再レンダリングも効く）
  if (pref === "system") {
    // 購読を効かせるために useTheme() を呼ぶ
    // （戻り値の colors は“生きている”参照なので直接返してOK）
    return useTheme().colors;
  }
  // 画面単位で強制したい場合は固定パレットを返却（購読は不要）
  return PALETTES[pref === "dark" ? "dark" : "light"];
}

/** 現在のスキームだけ知りたい時用（購読不要のユーティリティ） */
export function getColorScheme() {
  return scheme;
}

// ====== スペーシング/角丸/影（テーマ非依存）======
export const radius = { s: 8, m: 12, l: 16, xl: 20 } as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
} as const;

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3, // Android
  },
} as const;

// ====== ユーティリティ ======
/** #RRGGBB にアルファを付与（例: alpha(colors.primary, 0.12)） */
export function alpha(hex: string, a: number) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((s) => parseInt(s, 16));
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
}
