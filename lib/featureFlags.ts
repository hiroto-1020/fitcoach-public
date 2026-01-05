import Constants from "expo-constants";

function readBool(v: any, fallback = false) {
  if (v == null) return fallback;
  const s = String(v).toLowerCase();
  return s === "true" || s === "1";
}

export const GOTORE_ENABLED: boolean = (() => {
  const extra: any =
    (Constants as any)?.expoConfig?.extra ??
    (Constants as any)?.manifest?.extra ?? {};
  const raw = extra.GOTORE_ENABLED ?? process.env.EXPO_PUBLIC_GOTORE_ENABLED;
  return readBool(raw, false);
})();

export const GOTORE_PURCHASE_ENABLED: boolean = (() => {
  const extra: any =
    (Constants as any)?.expoConfig?.extra ??
    (Constants as any)?.manifest?.extra ?? {};
  const raw = extra.GOTORE_PURCHASE_ENABLED ?? process.env.EXPO_PUBLIC_GOTORE_PURCHASE_ENABLED;
  return readBool(raw, false);
})();