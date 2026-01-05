// C:\Users\horit\fitcoach\app\(tabs)\me\goals.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColors } from "../../../ui/theme";
import { useTranslation } from "react-i18next";

// ===== Optional deps（無くても落ちない） =====
let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {}

// 保存キー（Settingsのindex.tsxと一致させる）
const GOALS_KEY = "me.goals";

// 型（簡易）
type Goals = {
  weightTarget: number | null; // kg
  bodyFatTarget: number | null; // %
  kcalPerDay: number | null; // kcal
  p: number | null; // g
  f: number | null; // g
  c: number | null; // g
};

const DEFAULT_GOALS: Goals = {
  weightTarget: null,
  bodyFatTarget: null,
  kcalPerDay: null,
  p: null,
  f: null,
  c: null,
};

export default function GoalsScreen() {
  const C = useThemeColors();
  const { t } = useTranslation();

  // 文字列で管理（小数/空/途中入力に対応）
  const [w, setW] = useState(""); // kg
  const [bf, setBf] = useState(""); // %
  const [kcal, setKcal] = useState("");
  const [p, setP] = useState("");
  const [f, setF] = useState("");
  const [c, setC] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storageMissing, setStorageMissing] = useState(false);

  // 画面マウント時に読み込み
  useEffect(() => {
    const load = async () => {
      if (!AsyncStorage) {
        setStorageMissing(true);
        setLoading(false);
        return;
      }
      try {
        const raw = await AsyncStorage.getItem(GOALS_KEY);
        if (raw) {
          const g: Goals = JSON.parse(raw);
          setW(numToStr(g?.weightTarget));
          setBf(numToStr(g?.bodyFatTarget));
          setKcal(numToStr(g?.kcalPerDay));
          setP(numToStr(g?.p));
          setF(numToStr(g?.f));
          setC(numToStr(g?.c));
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  // 数値変換 & バリデーション
  const vals = useMemo(() => {
    const weight = strToNum(w);
    const bodyFat = strToNum(bf);
    const kcalNum = strToNum(kcal);
    const pNum = strToNum(p);
    const fNum = strToNum(f);
    const cNum = strToNum(c);

    const errors: Record<string, string | null> = {
      w:
        weight === null
          ? null
          : weight < 30 || weight > 200
          ? t("goals.error_range", { range: t("goals.range_weight") })
          : null,
      bf:
        bodyFat === null
          ? null
          : bodyFat < 3 || bodyFat > 60
          ? t("goals.error_range", { range: t("goals.range_body_fat") })
          : null,
      kcal:
        kcalNum === null
          ? null
          : kcalNum < 800 || kcalNum > 5000
          ? t("goals.error_range", { range: t("goals.range_kcal") })
          : null,
      p:
        pNum === null
          ? null
          : pNum < 0 || pNum > 300
          ? t("goals.error_range", { range: t("goals.range_p") })
          : null,
      f:
        fNum === null
          ? null
          : fNum < 0 || fNum > 200
          ? t("goals.error_range", { range: t("goals.range_f") })
          : null,
      c:
        cNum === null
          ? null
          : cNum < 0 || cNum > 800
          ? t("goals.error_range", { range: t("goals.range_c") })
          : null,
    };

    const anyError = Object.values(errors).some(Boolean);

    // マクロ→概算kcal
    const macroKcal = (pNum ?? 0) * 4 + (fNum ?? 0) * 9 + (cNum ?? 0) * 4;

    // kcalとのズレ（参考）
    const kcalDiff = kcalNum === null ? null : macroKcal - kcalNum;

    return {
      weight,
      bodyFat,
      kcalNum,
      pNum,
      fNum,
      cNum,
      errors,
      anyError,
      macroKcal,
      kcalDiff,
    };
  }, [w, bf, kcal, p, f, c, t]);

  // 変更有無（保存ボタンのガイドに使用）
  const hasAnyValue = [w, bf, kcal, p, f, c].some((s) => s.trim().length > 0);

  const onSave = useCallback(async () => {
    if (!AsyncStorage) {
      Alert.alert(
        t("goals.alert_no_storage_title"),
        t("goals.alert_no_storage_body")
      );
      return;
    }
    if (vals.anyError) {
      Alert.alert(
        t("goals.alert_input_error_title"),
        t("goals.alert_input_error_body")
      );
      return;
    }
    setSaving(true);
    try {
      const payload: Goals = {
        weightTarget: vals.weight,
        bodyFatTarget: vals.bodyFat,
        kcalPerDay: vals.kcalNum,
        p: vals.pNum,
        f: vals.fNum,
        c: vals.cNum,
      };
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(payload));
      Keyboard.dismiss();
      Alert.alert(
        t("goals.alert_saved_title"),
        t("goals.alert_saved_body")
      );
    } catch (e) {
      Alert.alert(
        t("goals.alert_save_failed_title"),
        t("goals.alert_save_failed_body")
      );
    } finally {
      setSaving(false);
    }
  }, [vals, t]);

  const onClear = useCallback(() => {
    setW("");
    setBf("");
    setKcal("");
    setP("");
    setF("");
    setC("");
  }, []);

  // iOS: キーボード上アクセサリバー用ID
  const accessoryID = useRef("goalsAccessory").current;

  if (loading) {
    return (
      <View
        style={[
          styles.wrap,
          { alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
        ]}
      >
        <Text style={{ color: C.subtext }}>{t("goals.loading")}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        style={[styles.wrap, { backgroundColor: C.bg }]}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.h1, { color: C.text }]}>{t("goals.title")}</Text>
        <Text style={[styles.sub, { color: C.subtext }]}>
          {t("goals.subtitle")}
        </Text>

        {storageMissing && (
          <View style={[styles.warnBox, { borderColor: C.danger }]}>
            <Text style={[styles.warnText, { color: C.danger }]}>
              {t("goals.storage_missing")}
            </Text>
          </View>
        )}

        {/* 目標体重・体脂肪 */}
        <Card title={t("goals.section_body_title")} C={C}>
          <Field
            label={t("goals.field_weight")}
            value={w}
            onChangeText={setW}
            placeholder={t("goals.placeholder_weight")}
            unit={t("goals.unit_kg")}
            error={vals.errors.w}
            inputAccessoryViewID={Platform.OS === "ios" ? accessoryID : undefined}
            C={C}
          />
          <Field
            label={t("goals.field_body_fat")}
            value={bf}
            onChangeText={setBf}
            placeholder={t("goals.placeholder_body_fat")}
            unit={t("goals.unit_percent")}
            error={vals.errors.bf}
            inputAccessoryViewID={Platform.OS === "ios" ? accessoryID : undefined}
            C={C}
          />
        </Card>

        {/* 栄養目標 */}
        <Card title={t("goals.section_nutrition_title")} C={C}>
          <Field
            label={t("goals.field_kcal")}
            value={kcal}
            onChangeText={setKcal}
            placeholder={t("goals.placeholder_kcal")}
            unit={t("goals.unit_kcal")}
            error={vals.errors.kcal}
            inputAccessoryViewID={Platform.OS === "ios" ? accessoryID : undefined}
            C={C}
          />
          <Field
            label={t("goals.field_p")}
            value={p}
            onChangeText={setP}
            placeholder={t("goals.placeholder_p")}
            unit={t("goals.unit_g")}
            error={vals.errors.p}
            inputAccessoryViewID={Platform.OS === "ios" ? accessoryID : undefined}
            C={C}
          />
          <Field
            label={t("goals.field_f")}
            value={f}
            onChangeText={setF}
            placeholder={t("goals.placeholder_f")}
            unit={t("goals.unit_g")}
            error={vals.errors.f}
            inputAccessoryViewID={Platform.OS === "ios" ? accessoryID : undefined}
            C={C}
          />
          <Field
            label={t("goals.field_c")}
            value={c}
            onChangeText={setC}
            placeholder={t("goals.placeholder_c")}
            unit={t("goals.unit_g")}
            error={vals.errors.c}
            inputAccessoryViewID={Platform.OS === "ios" ? accessoryID : undefined}
            C={C}
          />

          {/* 概算カロリー表示 */}
          <View
            style={[
              styles.macroBox,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <Text
              style={[
                styles.macroLine,
                { color: C.text },
              ]}
            >
              {t("goals.macro_line", { kcal: vals.macroKcal })}
            </Text>
            <Text
              style={[
                styles.macroHint,
                {
                  color:
                    vals.kcalDiff === null
                      ? C.subtext
                      : Math.abs(vals.kcalDiff) <= 50
                      ? "#16A34A"
                      : "#CA8A04",
                },
              ]}
            >
              {vals.kcalDiff === null
                ? t("goals.macro_hint_empty")
                : t("goals.macro_diff", {
                    diff:
                      (vals.kcalDiff > 0 ? "+" : "") +
                      String(vals.kcalDiff),
                  })}
            </Text>
          </View>
        </Card>

        {/* 下部アクション（通常ボタン） */}
        <View style={{ marginTop: 8, gap: 8 }}>
          <PrimaryButton
            label={saving ? t("goals.button_saving") : t("goals.button_save")}
            onPress={onSave}
            disabled={saving || !hasAnyValue || storageMissing}
            C={C}
          />
          <SecondaryButton
            label={t("goals.button_clear")}
            onPress={onClear}
            C={C}
          />
        </View>
      </ScrollView>

      {/* iOS: キーボード上の簡易完了バー（保存/閉じる） */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={accessoryID}>
          <View style={[styles.accessoryBar, { borderColor: C.border, backgroundColor: C.card }]}>
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              style={styles.accessoryBtn}
            >
              <Text style={[styles.accessoryBtnText, { color: C.text }]}>
                {t("goals.bar_close")}
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={onSave}
              disabled={saving || !hasAnyValue || storageMissing || vals.anyError}
              style={[
                styles.accessoryPrimary,
                { backgroundColor: C.primary },
                (saving || !hasAnyValue || storageMissing || vals.anyError) && {
                  opacity: 0.5,
                },
              ]}
            >
              <Text style={styles.accessoryPrimaryText}>
                {t("goals.bar_save")}
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      {/* 画面下固定の保存バー（Androidなど用） */}
      <View
        style={[
          styles.fixedBar,
          { backgroundColor: C.card, borderColor: C.border },
        ]}
      >
        <TouchableOpacity
          onPress={onSave}
          disabled={saving || !hasAnyValue || storageMissing || vals.anyError}
          style={[
            styles.fixedPrimary,
            { backgroundColor: C.primary },
            (saving || !hasAnyValue || storageMissing || vals.anyError) && {
              opacity: 0.5,
            },
          ]}
        >
          <Text style={styles.fixedPrimaryText}>
            {saving ? t("goals.button_saving") : t("goals.button_save")}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/** ============== 小物 ============== **/

function Card({
  title,
  children,
  C,
}: {
  title: string;
  children: React.ReactNode;
  C: any;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: C.card, borderColor: C.border },
      ]}
    >
      <Text style={[styles.cardTitle, { color: C.text }]}>{title}</Text>
      <View style={{ marginTop: 8 }}>{children}</View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  error,
  inputAccessoryViewID,
  C,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  unit?: string;
  error?: string | null;
  inputAccessoryViewID?: string;
  C: any;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.fieldRow}>
        <Text style={[styles.fieldLabel, { color: C.text }]}>{label}</Text>
        <View
          style={[
            styles.inputWrap,
            { borderColor: C.border, backgroundColor: C.card },
          ]}
        >
          <TextInput
            style={[styles.input, { color: C.text }]}
            value={value}
            onChangeText={(t) => onChangeText(sanitizeDecimal(t))}
            placeholder={placeholder}
            placeholderTextColor={C.subtext}
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "default"}
            inputMode="decimal"
            returnKeyType="done"
            inputAccessoryViewID={inputAccessoryViewID}
          />
          {!!unit && (
            <Text style={[styles.unit, { color: C.subtext }]}>{unit}</Text>
          )}
        </View>
      </View>
      {!!error && (
        <Text style={[styles.error, { color: C.danger }]}>{error}</Text>
      )}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  C,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  C: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.primaryBtn,
        { backgroundColor: C.primary },
        disabled && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.primaryBtnText, { color: C.primaryText }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({
  label,
  onPress,
  C,
}: {
  label: string;
  onPress: () => void;
  C: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.secondaryBtn,
        { backgroundColor: C.card, borderColor: C.border },
      ]}
    >
      <Text style={[styles.secondaryBtnText, { color: C.primary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** ============== Util ============== **/

function sanitizeDecimal(s: string): string {
  // 数字/小数点のみ許容、先頭のピリオドを "0." に
  let v = s.replace(/[^\d.]/g, "");
  if (v.startsWith(".")) v = "0" + v;
  // 小数点は最初の1つだけ
  const first = v.indexOf(".");
  if (first >= 0) {
    v = v.slice(0, first + 1) + v.slice(first + 1).replace(/\./g, "");
  }
  // 先頭の不要0を抑制（"00"→"0"）
  if (/^0\d/.test(v)) {
    v = v.replace(/^0+/, "0");
  }
  return v;
}

function strToNum(s: string): number | null {
  if (!s || !s.trim()) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function numToStr(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? String(n) : "";
}

/** ============== Styles ============== **/

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  h1: { fontSize: 20, fontWeight: "800" },
  sub: { marginTop: 4, marginBottom: 12 },

  warnBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: StyleSheet.hairlineWidth,
  },
  warnText: {
    fontSize: 12,
    lineHeight: 18,
  },

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

  fieldRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  fieldLabel: { width: 110, fontWeight: "600" },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 10, android: 6 }),
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  unit: { marginLeft: 8 },
  error: { marginTop: 4, marginLeft: 110, fontSize: 12 },

  macroBox: {
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  macroLine: { fontSize: 13, fontWeight: "700" },
  macroHint: { fontSize: 12, marginTop: 2 },

  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { fontWeight: "800", fontSize: 15 },
  secondaryBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtnText: { fontWeight: "800", fontSize: 14 },

  accessoryBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  accessoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  accessoryBtnText: { fontWeight: "700" },
  accessoryPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  accessoryPrimaryText: { color: "#FFFFFF", fontWeight: "800" },

  fixedBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 10,
  },
  fixedPrimary: {
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  fixedPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
