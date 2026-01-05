import { Appearance, ColorSchemeName } from "react-native";
import { useSyncExternalStore } from "react";

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

let mode: Mode = "system";

const initialScheme: "light" | "dark" =
  Appearance.getColorScheme() === "dark" ? "dark" : "light";

let scheme: "light" | "dark" = initialScheme;

export const colors: Palette = { ...PALETTES[initialScheme] };

const listeners = new Set<() => void>();

function apply(next: "light" | "dark") {
  scheme = next;
  Object.assign(colors, PALETTES[next]);
  listeners.forEach((l) => l());
}

Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
  if (mode !== "system") return;
  apply(colorScheme === "dark" ? "dark" : "light");
});

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

export function useTheme() {
  const subscribe = (onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    return () => listeners.delete(onStoreChange);
  };
  useSyncExternalStore(subscribe, () => scheme, () => "light");
  return { colors, isDark: scheme === "dark", scheme, mode };
}

export function useThemeColors(pref: Mode = "system"): Palette {
  if (pref === "system") {
    return useTheme().colors;
  }
  return PALETTES[pref === "dark" ? "dark" : "light"];
}

export function getColorScheme() {
  return scheme;
}

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
    elevation: 3,
  },
} as const;

export function alpha(hex: string, a: number) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((s) => parseInt(s, 16));
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
}
