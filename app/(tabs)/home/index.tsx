import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Modal, Platform, TextInput, StyleSheet, KeyboardAvoidingView,
  TouchableWithoutFeedback, Keyboard, InputAccessoryView, Alert
} from "react-native";
import dayjs from "../../../lib/dayjs";
import { useRouter, useFocusEffect } from "expo-router";
import { spacing } from "../../../ui/theme";
import { Card, SectionTitle, PrimaryButton } from "../../../ui/components";
import { requestAdvice, saveAdviceMemo, loadAdviceMemo, warmupAdvice } from "../../../lib/advice";
import { initDb } from "../../../lib/db";
import { addBodyMetric, getLatestBodyMetric, listBodyMetrics } from "../../../lib/body";
import TrainingTodayCard from "./TrainingTodayCard";
import { useAppPrefs } from "../../../lib/app-prefs";
import { useTranslation } from "react-i18next";

let Calendars: any = null; try { Calendars = require("react-native-calendars"); } catch {}
let DateTimePicker: any = null; try { DateTimePicker = require("@react-native-community/datetimepicker").default; } catch {}
let AsyncStorage: any = null; try { AsyncStorage = require("@react-native-async-storage/async-storage").default; } catch {}

type Meal = {
  id: string;
  date?: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  title?: string;
  brand?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  createdAt?: number;
  updatedAt?: number;
};

type GoalNumbers = { kcal: number; p: number; f: number; c: number };
type GoalDraft   = { kcal: string; p: string; f: string; c: string };

const MEALS_KEYS = ["MEALS_V2", "meals_v2", "meals_v1", "meals"];

const DEFAULT_GOALS: GoalNumbers = { kcal: 2000, p: 120, f: 60, c: 250 };

async function readAllMeals(): Promise<Meal[]> {
  try {
    const mod = require("../../../lib/storage");
    if (typeof mod.getAllMeals === "function") {
      const arr = await mod.getAllMeals(); if (Array.isArray(arr)) return arr;
    }
    if (typeof mod.loadMeals === "function") {
      const arr = await mod.loadMeals(); if (Array.isArray(arr)) return arr;
    }
  } catch {}
  if (!AsyncStorage) return [];
  for (const k of MEALS_KEYS) {
    try {
      const raw = await AsyncStorage.getItem(k);
      if (!raw) continue;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as Meal[];
    } catch {}
  }
  return [];
}

const GOAL_KEYS = { KCAL: "goal_kcal", P: "goal_p", F: "goal_f", C: "goal_c" } as const;
async function loadGoals(): Promise<GoalNumbers> {
  const get = AsyncStorage?.getItem ? AsyncStorage.getItem : async () => null;
  const [k, p, f, c] = await Promise.all([
    get(GOAL_KEYS.KCAL),
    get(GOAL_KEYS.P),
    get(GOAL_KEYS.F),
    get(GOAL_KEYS.C),
  ]);
  const toNum = (v: any) => (v == null ? undefined : Number(v));
  return {
    kcal: toNum(k) ?? DEFAULT_GOALS.kcal,
    p:   toNum(p) ?? DEFAULT_GOALS.p,
    f:   toNum(f) ?? DEFAULT_GOALS.f,
    c:   toNum(c) ?? DEFAULT_GOALS.c,
  };
}
async function saveGoals(next: GoalNumbers) {
  const set = AsyncStorage?.setItem ? AsyncStorage.setItem : async () => {};
  await Promise.all([
    set(GOAL_KEYS.KCAL, String(next.kcal)),
    set(GOAL_KEYS.P, String(next.p)),
    set(GOAL_KEYS.F, String(next.f)),
    set(GOAL_KEYS.C, String(next.c)),
  ]);
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function Progress({ value, target, label }: { value: number; target: number; label: string }) {
  const { colors: C, effectiveScheme } = useAppPrefs();
  const ratio = target > 0 ? clamp01(value / target) : 0;
  const trackBg = effectiveScheme === "dark" ? "#111827" : "#f1f5f9";

  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: C.text, fontWeight: "900" }}>{label}</Text>
        <Text style={{ color: C.sub, fontWeight: "800" }}>
          {Math.round(value)} / {Math.round(target)}
        </Text>
      </View>
      <View
        style={{
          height: 14,
          borderRadius: 999,
          backgroundColor: trackBg,
          borderWidth: 1,
          borderColor: C.border,
          overflow: "hidden",
          marginTop: 6,
        }}
      >
        <View
          style={{
            width: `${ratio * 100}%`,
            height: "100%",
            backgroundColor: ratio < 0.9 ? "#60a5fa" : ratio <= 1.1 ? "#34d399" : "#f59e0b",
          }}
        />
      </View>
    </View>
  );
}

function CalendarModal({
  open, value, onClose, onChange,
}: { open: boolean; value: string; onClose: () => void; onChange: (iso: string) => void }) {
  const { colors: C, effectiveScheme } = useAppPrefs();
  const { t } = useTranslation();
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  const hasCalendars = !!(Calendars as any)?.Calendar;
  const hasNative = !!DateTimePicker;

  const accessoryBg = effectiveScheme === "dark" ? "#1f2937" : "#F2F2F7";

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: C.card }]}>
          <Text style={[styles.modalTitle, { color: C.text }]}>{t("home.calendar_title")}</Text>
          {hasCalendars ? (
            <Calendars.Calendar
              initialDate={local}
              onDayPress={(d: any) => setLocal(d.dateString)}
              markedDates={{ [local]: { selected: true } }}
              theme={{
                calendarBackground: C.card,
                dayTextColor: C.text,
                monthTextColor: C.text,
                textDisabledColor: C.sub,
                todayTextColor: C.primary,
                selectedDayBackgroundColor: C.primary,
                selectedDayTextColor: "#fff",
              }}
              style={{ borderWidth: 1, borderColor: C.border, borderRadius: 12 }}
            />
          ) : hasNative ? (
            <DateTimePicker
              value={new Date(local || new Date())}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "calendar"}
              onChange={(_, d?: Date) => d && setLocal(dayjs(d).format("YYYY-MM-DD"))}
            />
          ) : (
            <>
              <Text style={{ color: C.sub, marginBottom: 8 }}>
                {t("home.calendar_manual_hint")}
              </Text>
              <TextInput
                value={local}
                onChangeText={setLocal}
                placeholder={t("home.calendar_placeholder")}
                placeholderTextColor={C.sub}
                style={[
                  styles.dateInput,
                  { borderColor: C.border, backgroundColor: C.card, color: C.text },
                ]}
              />
            </>
          )}
          <View style={styles.modalBtnRow}>
            <TouchableOpacity onPress={onClose} style={styles.modalGhostBtn}>
              <Text style={{ color: C.sub, fontWeight: "800" }}>{t("ui.cancel")}</Text>
            </TouchableOpacity>
            <PrimaryButton title={t("ui.ok")} onPress={() => onChange(local)} />
          </View>
        </View>
      </View>

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID="numAccessory">
          <View
            style={{
              backgroundColor: accessoryBg,
              borderTopWidth: 1,
              borderColor: C.border,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ color: C.sub }}>{t("ui.input")}</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={Keyboard.dismiss} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: C.primary, fontWeight: "700" }}>{t("ui.done")}</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </Modal>
  );
}

export default function Home() {
  const router = useRouter();
  const { colors: C, effectiveScheme, haptic } = useAppPrefs();
  const { t } = useTranslation();
  const muted = effectiveScheme === "dark" ? "#94a3b8" : "#9CA3AF";

  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [openCal, setOpenCal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);

  const [goals, setGoals] = useState<GoalNumbers>(DEFAULT_GOALS);
  const [openGoal, setOpenGoal] = useState(false);
  const [draftGoal, setDraftGoal] = useState<GoalDraft>({
    kcal: String(DEFAULT_GOALS.kcal),
    p: String(DEFAULT_GOALS.p),
    f: String(DEFAULT_GOALS.f),
    c: String(DEFAULT_GOALS.c),
  });

  const [advice, setAdvice] = useState<string[]>([]);

  const [quickOpen, setQuickOpen] = useState(false);
  const [quickWeight, setQuickWeight] = useState<string>("");
  const [quickBodyFat, setQuickBodyFat] = useState<string>("");
  const accId = Platform.OS === "ios" ? "numAccessory" : undefined;

  const [bodyToday, setBodyToday] = useState<{ weight: number | null; bodyFat: number | null } | null>(null);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    const [all, g] = await Promise.all([readAllMeals(), loadGoals()]);
    setGoals(g);
    setDraftGoal({
      kcal: g.kcal != null ? String(g.kcal) : "",
      p:   g.p   != null ? String(g.p)   : "",
      f:   g.f   != null ? String(g.f)   : "",
      c:   g.c   != null ? String(g.c)   : "",
    });
    setMeals(all.filter((m) => (m.date || "").startsWith(date)));
    setLoading(false);

    const memo = await loadAdviceMemo(date);
    if (memo) setAdvice([memo]);

    const rows = await listBodyMetrics(1000);
    const sameDay = rows
      .filter((r) => dayjs(Number(r.ts)).format("YYYY-MM-DD") === date)
      .sort((a, b) => Number(b.ts) - Number(a.ts));
    setBodyToday(
      sameDay[0]
        ? { weight: sameDay[0].weight ?? null, bodyFat: sameDay[0].bodyFat ?? null }
        : null
    );
  }, [date]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  useFocusEffect(
    useCallback(() => {
      reloadAll();
    }, [reloadAll])
  );

  useEffect(() => {
    initDb().catch(() => {});
  }, []);

  useEffect(() => {
    warmupAdvice();
  }, []);

  const sums = useMemo(() => {
    const total = { kcal: 0, p: 0, f: 0, c: 0 };
    for (const m of meals) {
      total.kcal += Number(m.calories || 0);
      total.p += Number(m.protein || 0);
      total.f += Number(m.fat || 0);
      total.c += Number(m.carbs || 0);
    }
    const round = (x: number) => Math.round(x);
    return { total: { kcal: round(total.kcal), p: round(total.p), f: round(total.f), c: round(total.c) } };
  }, [meals]);

  const latestWeight: number | undefined = bodyToday?.weight ?? undefined;
  const latestBodyFat: number | undefined = bodyToday?.bodyFat ?? undefined;

  const session: any = null;
  const myGender: "male" | "female" | "other" | undefined = undefined;
  const myHeight: number | undefined = undefined;
  const weightGoal: number | undefined = undefined;

  const isTrainingToday: boolean | undefined = undefined;
  const sleepHours7dAvg: number | undefined = undefined;
  const bodyLogStreakDays: number | undefined = undefined;

  async function openAdvice() {
    await haptic("light");
    try {
      setAdvice([t("home.ai_advice_loading") || "AIが分析中です…🤖💭"]);

      const totals = { kcal: sums.total.kcal, p: sums.total.p, f: sums.total.f, c: sums.total.c };
      const goalsObj = { kcalTarget: goals.kcal, proteinTarget: goals.p, fatTarget: goals.f, carbsTarget: goals.c };

      const fiberTotal  = meals.reduce((s, m) => s + Number((m as any).fiber  || 0), 0);
      const sugarTotal  = meals.reduce((s, m) => s + Number((m as any).sugar  || 0), 0);
      const sodiumTotal = meals.reduce((s, m) => s + Number((m as any).sodium || 0), 0);

      const mealsToday = meals.map(m => ({
        title: m.title, calories: m.calories, protein: m.protein, fat: m.fat, carbs: m.carbs,
        ...((m as any).fiber  != null ? { fiber:  (m as any).fiber  } : {}),
        ...((m as any).sugar  != null ? { sugar:  (m as any).sugar  } : {}),
        ...((m as any).sodium != null ? { sodium: (m as any).sodium } : {}),
      }));

      const extraContext: any = {
        nutritionExtras: { fiberTotal, sugarTotal, sodiumTotal },
        ...(typeof latestWeight   !== "undefined" || typeof latestBodyFat !== "undefined"
          ? {
              latestBody: {
                ...(typeof latestWeight  !== "undefined" ? { weight: latestWeight } : {}),
                ...(typeof latestBodyFat !== "undefined" ? { bodyFat: latestBodyFat } : {}),
              },
            }
          : {}),
        ...(typeof session !== "undefined" && session?.user?.id
          ? {
              user: {
                id: session.user.id,
                ...(typeof myGender !== "undefined" ? { sex: myGender } : {}),
                ...(typeof myHeight !== "undefined" ? { height: myHeight } : {}),
              },
            }
          : {}),
        ...(typeof weightGoal !== "undefined" ? { goals: { weightGoal } } : {}),
        context: {
          ...(typeof isTrainingToday  !== "undefined" ? { isTrainingDay: isTrainingToday } : {}),
          ...(typeof sleepHours7dAvg !== "undefined" ? { sleepHoursAvg: sleepHours7dAvg } : {}),
          ...(typeof bodyLogStreakDays !== "undefined" ? { streakDays: bodyLogStreakDays } : {}),
          nonce: Date.now(),
        },
      };

      const pretty = await requestAdvice({
        totals,
        goals: goalsObj,
        meals: mealsToday,
        extraContext,
      });

      setAdvice([pretty]);
      await saveAdviceMemo(date, pretty);
    } catch (e: any) {
      setAdvice([String(e?.message || e)]);
    }
  }

  async function openQuick() {
    await haptic("light");
    try {
      const last = await getLatestBodyMetric();
      setQuickWeight(last?.weight != null ? String(last.weight) : "");
      setQuickBodyFat(last?.bodyFat != null ? String(last.bodyFat) : "");
    } catch {}
    setQuickOpen(true);
  }

  async function saveQuick() {
    await haptic("medium");
    const w = quickWeight ? Number(quickWeight) : null;
    const f = quickBodyFat ? Number(quickBodyFat) : null;

    if (w != null && (isNaN(w) || w < 20 || w > 300)) {
      Alert.alert(t("home.alert_weight_title"), t("home.alert_weight_message"));
      return;
    }
    if (f != null && (isNaN(f) || f < 2 || f > 60)) {
      Alert.alert(t("home.alert_bodyfat_title"), t("home.alert_bodyfat_message"));
      return;
    }

    const ts = dayjs().hour(12).minute(0).second(0).millisecond(0).valueOf();
    await addBodyMetric({
      ts,
      weight: w ?? 0,
      bodyFat: f ?? null,
      muscle: null,
      waist: null,
      notes: null,
    } as any);

    setQuickOpen(false);
    Alert.alert(t("home.alert_saved_title"), t("home.alert_saved_message"));
    const rows = await listBodyMetrics(50);
    const sameDay = rows
      .filter((r) => dayjs(Number(r.ts)).format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD"))
      .sort((a, b) => Number(b.ts) - Number(a.ts));
    setBodyToday(
      sameDay[0]
        ? { weight: sameDay[0].weight ?? null, bodyFat: sameDay[0].bodyFat ?? null }
        : null
    );
  }

  const badgeBorder = effectiveScheme === "dark" ? "#1e40af55" : "#bae6fd";
  const badgeBg = effectiveScheme === "dark" ? "#0b1220" : "#f0f9ff";

  return (
    <>
      <Modal visible={quickOpen} transparent animationType="slide" onRequestClose={() => setQuickOpen(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <View style={[styles.modalCard, { padding: 16, backgroundColor: C.card }]}>
                <Text style={[styles.modalTitle, { color: C.text }]}>{t("home.quick_title")}</Text>

                <Text style={{ color: C.sub, marginBottom: 6 }}>{t("home.quick_weight_label")}</Text>
                <View style={[styles.rowInput, { borderColor: C.border, backgroundColor: C.card }]}>
                  <TextInput
                    value={quickWeight}
                    onChangeText={setQuickWeight}
                    keyboardType="decimal-pad"
                    placeholder={t("home.quick_weight_placeholder")}
                    placeholderTextColor={muted}
                    inputAccessoryViewID={accId}
                    style={[styles.numInput, { color: C.text }]}
                  />
                  <Text style={{ color: C.sub, marginLeft: 8 }}>kg</Text>
                </View>

                <View style={{ height: 10 }} />
                <Text style={{ color: C.sub, marginBottom: 6 }}>{t("home.quick_bodyfat_label")}</Text>
                <View style={[styles.rowInput, { borderColor: C.border, backgroundColor: C.card }]}>
                  <TextInput
                    value={quickBodyFat}
                    onChangeText={setQuickBodyFat}
                    keyboardType="decimal-pad"
                    placeholder={t("home.quick_bodyfat_placeholder")}
                    placeholderTextColor={muted}
                    inputAccessoryViewID={accId}
                    style={[styles.numInput, { color: C.text }]}
                  />
                  <Text style={{ color: C.sub, marginLeft: 8 }}>%</Text>
                </View>

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setQuickOpen(false);
                    }}
                    style={styles.modalGhostBtn}
                  >
                    <Text style={{ color: C.sub, fontWeight: "800" }}>{t("ui.cancel")}</Text>
                  </TouchableOpacity>
                  <PrimaryButton
                    title={t("ui.save")}
                    onPress={saveQuick}
                  />
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>

        {Platform.OS === "ios" && (
          <InputAccessoryView nativeID="numAccessory">
            <View
              style={{
                backgroundColor: effectiveScheme === "dark" ? "#1f2937" : "#F2F2F7",
                borderTopWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ color: C.sub }}>{t("ui.input")}</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={Keyboard.dismiss} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: C.primary, fontWeight: "700" }}>{t("ui.done")}</Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
      </Modal>

      <CalendarModal
        open={openCal}
        value={date}
        onClose={() => setOpenCal(false)}
        onChange={(iso) => {
          setDate(iso);
          setOpenCal(false);
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      >
        <Card style={{ padding: spacing.md, backgroundColor: C.card, borderColor: C.border }}>
          <View>
            <SectionTitle>{t("home.summary_title")}</SectionTitle>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <TouchableOpacity
              onPress={async () => {
                await haptic("light");
                setDraftGoal({
                  kcal: goals.kcal != null ? String(goals.kcal) : "",
                  p:   goals.p   != null ? String(goals.p)   : "",
                  f:   goals.f   != null ? String(goals.f)   : "",
                  c:   goals.c   != null ? String(goals.c)   : "",
                });
                setOpenGoal(true);
              }}
              style={[styles.ghostBtn, { borderColor: C.border, backgroundColor: C.card }]}
            >
              <Text style={[styles.ghostBtnText, { color: C.text }]}>
                {t("home.goal_button")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await haptic("light");
                setOpenCal(true);
              }}
              style={[styles.ghostBtn, { borderColor: C.border, backgroundColor: C.card }]}
            >
              <Text
                style={[styles.ghostBtnText, { color: C.text }]}
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                📅 {date}
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <ActivityIndicator />
              <Text style={{ color: C.sub, marginTop: 8 }}>{t("home.loading")}</Text>
            </View>
          ) : (
            <>
              <View style={{ alignItems: "center", marginTop: 12 }}>
                <View style={[styles.totalBadge, { borderColor: badgeBorder, backgroundColor: badgeBg }]}>
                  <Text style={{ color: C.primary, fontWeight: "900", fontSize: 18 }}>
                    {t("home.total_badge_label")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      marginTop: 4,
                      paddingHorizontal: 6,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      style={{
                        color: C.text,
                        fontWeight: "900",
                        fontSize: 28,
                        textAlign: "center",
                        flexShrink: 1,
                      }}
                    >
                      {sums.total.kcal} / {goals.kcal}
                    </Text>
                    <Text style={{ color: C.text, fontWeight: "900", fontSize: 16, marginLeft: 6 }}>
                      {t("home.label_kcal")}
                    </Text>
                  </View>
                  <Text style={{ color: C.text, fontWeight: "900", marginTop: 6 }}>
                    {t("home.label_p")} {sums.total.p}/{goals.p} ・{" "}
                    {t("home.label_f")} {sums.total.f}/{goals.f} ・{" "}
                    {t("home.label_c")} {sums.total.c}/{goals.c}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: "center", marginTop: 10 }}>
                {bodyToday ? (
                  <Text style={{ color: C.text, fontWeight: "900" }}>
                    {t("home.body_today_label")}
                    {bodyToday.weight != null ? Number(bodyToday.weight).toFixed(1) : "—"} kg /{" "}
                    {bodyToday.bodyFat != null ? Number(bodyToday.bodyFat).toFixed(1) + " %" : "—"}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={openQuick}>
                    <Text style={{ color: C.primary, fontWeight: "800" }}>
                      {t("home.body_record_cta")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ marginTop: 14 }}>
                <Progress value={sums.total.kcal} target={goals.kcal} label={t("home.label_kcal")} />
                <Progress value={sums.total.p} target={goals.p} label={t("home.label_p")} />
                <Progress value={sums.total.f} target={goals.f} label={t("home.label_f")} />
                <Progress value={sums.total.c} target={goals.c} label={t("home.label_c")} />
              </View>
            </>
          )}

          <View style={{ marginTop: 16, gap: 10 }}>
            <PrimaryButton
              title={t("home.button_meal_record")}
              onPress={async () => {
                await haptic("light");
                router.push("/(tabs)/meals/new");
              }}
            />
            <PrimaryButton
              title={t("home.button_product_search")}
              variant="secondary"
              onPress={async () => {
                await haptic("light");
                router.push("/(tabs)/meals/search");
              }}
            />
            <PrimaryButton
              title={t("home.button_quick_body")}
              variant="secondary"
              onPress={openQuick}
            />
          </View>
        </Card>

        <Card style={{ padding: 0, backgroundColor: C.card, borderColor: C.border }}>
          <View style={{ padding: spacing.md }}>
            <TrainingTodayCard />
          </View>
        </Card>

        <Card style={{ padding: spacing.md, backgroundColor: C.card, borderColor: C.border }}>
          <SectionTitle>{t("home.ai_advice_title")}</SectionTitle>
          <View style={{ height: 8 }} />
          <PrimaryButton title={t("home.ai_advice_button")} onPress={openAdvice} />
          <View style={{ height: 10 }} />
          {advice.map((p, i) => (
            <Text key={i} style={{ color: C.text, lineHeight: 20, marginTop: i ? 8 : 0 }}>
              {p}
            </Text>
          ))}
        </Card>
      </ScrollView>

      <Modal visible={openGoal} transparent animationType="fade" onRequestClose={() => setOpenGoal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: C.card }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>{t("home.goal_modal_title")}</Text>

            <GoalRow
              label={t("home.label_kcal")}
              value={draftGoal.kcal}
              onChange={(v) => setDraftGoal({ ...draftGoal, kcal: v })}
            />
            <GoalRow
              label={t("home.label_p")}
              value={draftGoal.p}
              onChange={(v) => setDraftGoal({ ...draftGoal, p: v })}
            />
            <GoalRow
              label={t("home.label_f")}
              value={draftGoal.f}
              onChange={(v) => setDraftGoal({ ...draftGoal, f: v })}
            />
            <GoalRow
              label={t("home.label_c")}
              value={draftGoal.c}
              onChange={(v) => setDraftGoal({ ...draftGoal, c: v })}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => {
                  setDraftGoal({
                    kcal: goals.kcal != null ? String(goals.kcal) : "",
                    p:   goals.p   != null ? String(goals.p)   : "",
                    f:   goals.f   != null ? String(goals.f)   : "",
                    c:   goals.c   != null ? String(goals.c)   : "",
                  });
                  setOpenGoal(false);
                }}
                style={styles.modalGhostBtn}
              >
                <Text style={{ color: C.sub, fontWeight: "800" }}>{t("ui.cancel")}</Text>
              </TouchableOpacity>
              <PrimaryButton
                title={t("ui.save")}
                style={{ alignSelf: "auto", paddingHorizontal: 24 }}
                onPress={async () => {
                  await haptic("light");
                  const safe: GoalNumbers = {
                    kcal: parseGoal(draftGoal.kcal),
                    p:    parseGoal(draftGoal.p),
                    f:    parseGoal(draftGoal.f),
                    c:    parseGoal(draftGoal.c),
                  };
                  await saveGoals(safe);
                  setGoals(safe);
                  setOpenGoal(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

type GoalRowProps = {
  label: string;
  value: string | number | null | undefined;
  onChange: (v: string) => void;
};

function GoalRow({ label, value, onChange }: GoalRowProps) {
  const { colors: C, effectiveScheme } = useAppPrefs();
  const ph = effectiveScheme === "dark" ? "#6b7280" : "#9CA3AF";

  const [text, setText] = useState(
    value === null || typeof value === "undefined" ? "" : String(value)
  );

  useEffect(() => {
    setText(value === null || typeof value === "undefined" ? "" : String(value));
  }, [value]);

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d]/g, "");
    setText(cleaned);
    onChange(cleaned);
  };

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: C.sub, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={handleChange}
        placeholder="0"
        placeholderTextColor={ph}
        style={[styles.goalInput, { borderColor: C.border, backgroundColor: C.card, color: C.text }]}
      />
    </View>
  );
}

function parseGoal(raw: any): number {
  if (raw == null) return 0;
  const s = String(raw).trim();
  if (!s) return 0;
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  modalCard: { borderRadius: 16, padding: 16 },
  modalTitle: { fontWeight: "900", fontSize: 16, marginBottom: 8 },
  dateInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  modalGhostBtn: { paddingHorizontal: 12, paddingVertical: 10 },

  ghostBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  ghostBtnText: { fontWeight: "900" },

  totalBadge: {
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },

  goalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },

  rowInput: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 },
  numInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
});
