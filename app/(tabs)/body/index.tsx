// app/(tabs)/body/index.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  InputAccessoryView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "../../../lib/dayjs";
import { spacing, radius, shadow } from "../../../ui/theme.body";
import {
  Period,
  Metric,
  bucketByDay,
  bucketByWeek,
  bucketByMonth,
  rollingAvg,
  calcSummary,
} from "../../../lib/bodyView";
import { BodyLineChart } from "../../../components/composition/BodyLineChart";
import { SummaryCards } from "../../../components/composition/SummaryCards";
import {
  addBodyMetric,
  listBodyMetrics,
  updateBodyMetric,
  deleteBodyMetric,
} from "../../../lib/body";
import { BodyMetric } from "../../../lib/types";
import { initDb } from "../../../lib/db";
import { getJSON, setJSON, STORAGE_KEYS } from "../../../lib/storage";
import { exportBodyCSV } from "../../../utils/exportBody";
import BodyHelpModal from "../../../components/help/BodyHelpModal";
import { useAppPrefs } from "../../../lib/app-prefs";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

const BODY_GOAL_KEY =
  STORAGE_KEYS && (STORAGE_KEYS as any).BODY_GOALS
    ? (STORAGE_KEYS as any).BODY_GOALS
    : "body:goals";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function linearRegression(points: Array<{ x: number; y: number }>) {
  const n = points.length;
  if (n < 2) return { slope: NaN, intercept: NaN };
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: NaN, intercept: NaN };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

const OUTLIER = {
  weight: { min: 20, max: 300, warnDelta: 3 },
  bodyFat: { min: 2, max: 60, warnDelta: 3 },
};

function toNumberSafe(s: string): number | null {
  if (!s?.trim()) return null;
  const tableSrc = "０１２３４５６７８９．，";
  const tableDst = "0123456789.,";
  const z2h = s.replace(/[０-９．，]/g, (ch) => {
    const i = tableSrc.indexOf(ch);
    return i >= 0 ? tableDst[i] : ch;
  });
  const n = Number(z2h.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function confirmAsync(
  title: string,
  message: string,
  cancelLabel: string,
  okLabel: string
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
        { text: okLabel, style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true }
    );
  });
}

type Goals = { weightGoal?: number; bodyFatGoal?: number };

export default function BodyScreen() {
  const { colors: C, effectiveScheme, haptic } = useAppPrefs();
  const { t } = useTranslation();
  const vibrate = async (type: "light" | "medium" = "light") => {
    try {
      await haptic?.(type);
    } catch {}
  };
  const router = useRouter();

  const weightRef = useRef<TextInput>(null);
  const bfRef = useRef<TextInput>(null);
  const accessoryId = Platform.OS === "ios" ? "numericAccessory" : undefined;

  const [period, setPeriod] = useState<Period>("day");
  const [metric, setMetric] = useState<Metric>("both");
  const [showAvg, setShowAvg] = useState(true);
  const [modal, setModal] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [w, setW] = useState("");
  const [bf, setBF] = useState("");
  const [dateText, setDateText] = useState(dayjs().format("YYYY/MM/DD"));
  const [notes, setNotes] = useState("");

  const [editing, setEditing] = useState<{ enabled: boolean; id: number | null }>(
    { enabled: false, id: null }
  );

  const [goals, setGoals] = useState<Goals>({});
  const [goalModal, setGoalModal] = useState(false);
  const [goalWeightText, setGoalWeightText] = useState("");
  const [goalBodyFatText, setGoalBodyFatText] = useState("");

  const [raw, setRaw] = useState<BodyMetric[]>([]);
  async function reload() {
    const rows = await listBodyMetrics(5000);
    setRaw(rows.slice().sort((a, b) => Number(b.ts) - Number(a.ts)));
  }

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        await reload();
        const saved = await getJSON<Goals>(BODY_GOAL_KEY, {});
        setGoals(saved);
        setGoalWeightText(
          saved.weightGoal != null ? String(saved.weightGoal) : ""
        );
        setGoalBodyFatText(
          saved.bodyFatGoal != null ? String(saved.bodyFatGoal) : ""
        );
      } catch (e) {
        console.error("[BodyScreen init] ", e);
        Alert.alert(
          t("body.error_title"),
          t("body.error_load_failed")
        );
      }
    })();
  }, [t]);

  const bucket = useMemo(() => {
    if (period === "day") return bucketByDay(raw);
    if (period === "week") return bucketByWeek(raw);
    return bucketByMonth(raw);
  }, [raw, period]);

  const labels = bucket.map((b) => b.label);
  const seriesW = bucket.map((b) => b.weightAvg);
  const seriesF = bucket.map((b) => b.bodyFatAvg);
  const avgW = showAvg && period === "day" ? rollingAvg(seriesW, 7) : null;
  const summary = useMemo(() => calcSummary(bucket), [bucket]);

  // === グラフを描画しても安全か？（1点でも有効値があればOK）
  const hasChartData = useMemo(
    () =>
      labels.length > 0 &&
      (seriesW.some((v) => v != null) || seriesF.some((v) => v != null)),
    [labels, seriesW, seriesF]
  );

  const dayBucket = useMemo(() => bucketByDay(raw), [raw]);
  const { streakDays, longestStreak, monthCount } = useMemo(() => {
    const daySet = new Set(dayBucket.map((b) => b.dateForSort));
    const today = dayjs().startOf("day");
    let current = 0;
    {
      let c = today.clone();
      while (daySet.has(c.format("YYYY-MM-DD"))) {
        current++;
        c = c.subtract(1, "day");
      }
    }
    const yyyymm = today.format("YYYY-MM");
    const monthCnt = [...daySet].filter((d) => d.startsWith(yyyymm)).length;
    const asc = [...daySet].sort((a, b) => (a < b ? -1 : 1));
    let best = 0,
      run = 0,
      prev: string | null = null;
    for (const d of asc) {
      run =
        prev && dayjs(d).diff(dayjs(prev), "day") === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    }
    return {
      streakDays: current,
      longestStreak: best,
      monthCount: monthCnt,
    };
  }, [dayBucket]);

  const goal = goals.weightGoal ?? null;
  const goalLine = useMemo(
    () => (goal ? labels.map(() => goal) : undefined),
    [labels, goal]
  );

  const eta = useMemo(() => {
    if (goal == null)
      return {
        state: "no-goal" as const,
        main: t("body.eta_no_goal_main"),
        sub: t("body.eta_no_goal_sub"),
      };

    const recentDays = dayBucket
      .slice(-20)
      .filter((b) => b.weightAvg != null)
      .slice(-14);
    if (recentDays.length < 3)
      return {
        state: "insufficient" as const,
        main: t("body.eta_insufficient_main"),
        sub: t("body.eta_insufficient_sub"),
      };

    const pts = recentDays.map((b) => ({
      x:
        dayjs(b.dateForSort).startOf("day").valueOf() /
        MS_PER_DAY,
      y: Number(b.weightAvg),
    }));
    const { slope } = linearRegression(pts);

    const latestWeight =
      (recentDays.length
        ? Number(recentDays[recentDays.length - 1].weightAvg)
        : null) ??
      raw.find((r) => r.weight != null)?.weight ??
      null;
    if (latestWeight == null)
      return {
        state: "insufficient" as const,
        main: t("body.eta_insufficient_main"),
        sub: t("body.eta_insufficient_sub"),
      };

    if (Math.abs(latestWeight - goal) <= 0.2)
      return {
        state: "achieved" as const,
        main: t("body.eta_achieved_main"),
        sub: t("body.eta_achieved_sub", {
          weight: latestWeight.toFixed(1),
        }),
      };

    const EPS = 0.01;
    if (!Number.isFinite(slope) || Math.abs(slope) < EPS)
      return {
        state: "flat" as const,
        main: t("body.eta_flat_main"),
        sub: t("body.eta_flat_sub"),
      };

    const directionOk = (goal - latestWeight) * slope > 0;
    if (!directionOk) {
      const dirText =
        slope > 0
          ? t("body.eta_dir_up")
          : t("body.eta_dir_down");
      return {
        state: "reverse" as const,
        main: t("body.eta_reverse_main", { direction: dirText }),
        sub: t("body.eta_reverse_sub"),
      };
    }

    const daysNeeded = (goal - latestWeight) / slope;
    if (!Number.isFinite(daysNeeded) || daysNeeded < 0)
      return {
        state: "unknown" as const,
        main: t("body.eta_unknown_main"),
        sub: t("body.eta_unknown_sub"),
      };

    const capped = Math.min(daysNeeded, 3650);
    const etaDate = dayjs().add(capped, "day");
    const dateStr = etaDate.format("YYYY/MM/DD");

    return {
      state: "eta" as const,
      main: t("body.eta_eta_main", { date: dateStr }),
      sub: t("body.eta_eta_sub", {
        date: dateStr,
        goal: goal.toFixed(1),
      }),
    };
  }, [goal, dayBucket, raw, t]);

  // ===== 保存 =====
  async function handleSave() {
    await vibrate("medium");
    const weightNum = toNumberSafe(w);
    const bfNum = toNumberSafe(bf);

    // スキーマに合わせて体重は必須（weight REAL NOT NULL）
    if (weightNum == null) {
      Alert.alert(
        t("body.error_weight_required_title"),
        t("body.error_weight_required_message")
      );
      return;
    }

    if (
      weightNum < OUTLIER.weight.min ||
      weightNum > OUTLIER.weight.max
    ) {
      Alert.alert(
        t("body.error_weight_range_title"),
        t("body.error_weight_range_message", {
          min: OUTLIER.weight.min,
          max: OUTLIER.weight.max,
        })
      );
      return;
    }
    if (
      bfNum != null &&
      (bfNum < OUTLIER.bodyFat.min ||
        bfNum > OUTLIER.bodyFat.max)
    ) {
      Alert.alert(
        t("body.error_bodyfat_range_title"),
        t("body.error_bodyfat_range_message", {
          min: OUTLIER.bodyFat.min,
          max: OUTLIER.bodyFat.max,
        })
      );
      return;
    }

    const d = dayjs(
      dateText.replace(/-/g, "/").trim(),
      "YYYY/MM/DD",
      true
    );
    if (!d.isValid()) {
      Alert.alert(
        t("body.error_date_format_title"),
        t("body.error_date_format_message")
      );
      return;
    }
    const newTs = d
      .hour(12)
      .minute(0)
      .second(0)
      .millisecond(0)
      .valueOf();

    const existing = raw
      .filter(
        (r) =>
          !(
            editing.enabled &&
            editing.id != null &&
            Number((r as any).id) === editing.id
          )
      )
      .sort((a, b) => Number(b.ts) - Number(a.ts));
    const prev =
      existing.find(
        (r) => r.weight != null || r.bodyFat != null
      ) ?? null;
    const prevW = prev?.weight ?? null;
    const prevF = prev?.bodyFat ?? null;

    let needsConfirm = false;
    const warns: string[] = [];
    if (prevW != null) {
      const diff = Math.abs(weightNum - prevW);
      if (diff >= OUTLIER.weight.warnDelta) {
        needsConfirm = true;
        warns.push(
          t("body.warn_weight_change", {
            diff: diff.toFixed(1),
            threshold: OUTLIER.weight.warnDelta,
          })
        );
      }
    }
    if (bfNum != null && prevF != null) {
      const diff = Math.abs(bfNum - prevF);
      if (diff >= OUTLIER.bodyFat.warnDelta) {
        needsConfirm = true;
        warns.push(
          t("body.warn_bodyfat_change", {
            diff: diff.toFixed(1),
            threshold: OUTLIER.bodyFat.warnDelta,
          })
        );
      }
    }
    if (needsConfirm) {
      const ok = await confirmAsync(
        t("body.confirm_change_title"),
        warns.join("\n") +
          "\n" +
          t("body.confirm_change_question"),
        t("body.confirm_change_fix"),
        t("body.confirm_change_save")
      );
      if (!ok) return;
    }

    const noteVal = notes.trim() || null;

    try {
      if (editing.enabled && editing.id != null) {
        await updateBodyMetric(editing.id, {
          ts: newTs,
          weight: weightNum,
          bodyFat: bfNum ?? null,
          notes: noteVal,
        } as any);
      } else {
        const rec: BodyMetric = {
          ts: newTs,
          weight: weightNum,
          bodyFat: bfNum ?? null,
          muscle: null,
          waist: null,
          notes: noteVal,
        } as any;
        await addBodyMetric(rec);
      }
      await reload();
      closeModal();
    } catch (e: any) {
      console.error("[BodyScreen save] ", e);
      Alert.alert(
        t("body.error_save_failed_title"),
        t("body.error_save_failed_message")
      );
    }
  }

  function openCreateModal() {
    vibrate("light");
    setEditing({ enabled: false, id: null });
    setDateText(dayjs().format("YYYY/MM/DD"));
    setW("");
    setBF("");
    setNotes("");
    setModal(true);
  }
  function openEditModal(item: BodyMetric) {
    vibrate("light");
    setEditing({ enabled: true, id: Number((item as any).id) });
    setDateText(dayjs(item.ts).format("YYYY/MM/DD"));
    setW(item.weight != null ? String(item.weight) : "");
    setBF(item.bodyFat != null ? String(item.bodyFat) : "");
    setNotes(item.notes ?? "");
    setModal(true);
  }
  function closeModal() {
    setModal(false);
    setEditing({ enabled: false, id: null });
    setW("");
    setBF("");
    setNotes("");
    setDateText(dayjs().format("YYYY/MM/DD"));
  }
  async function confirmDelete(item: BodyMetric) {
    await vibrate("medium");
    const id = Number((item as any).id);
    const dateStr = dayjs(item.ts).format("YYYY/MM/DD");
    Alert.alert(
      t("body.delete_confirm_title"),
      t("body.delete_confirm_message", { date: dateStr }),
      [
        { text: t("body.delete_cancel"), style: "cancel" },
        {
          text: t("body.delete_ok"),
          style: "destructive",
          onPress: async () => {
            await deleteBodyMetric(id);
            await reload();
          },
        },
      ]
    );
  }

  async function handleSaveGoals() {
    await vibrate("medium");
    const weightGoal = toNumberSafe(goalWeightText) ?? undefined;
    const bodyFatGoal = toNumberSafe(goalBodyFatText) ?? undefined;
    if (
      weightGoal != null &&
      (weightGoal < OUTLIER.weight.min ||
        weightGoal > OUTLIER.weight.max)
    ) {
      Alert.alert(
        t("body.error_goal_weight_title"),
        t("body.error_goal_weight_message", {
          min: OUTLIER.weight.min,
          max: OUTLIER.weight.max,
        })
      );
      return;
    }
    if (
      bodyFatGoal != null &&
      (bodyFatGoal < OUTLIER.bodyFat.min ||
        bodyFatGoal > OUTLIER.bodyFat.max)
    ) {
      Alert.alert(
        t("body.error_goal_bodyfat_title"),
        t("body.error_goal_bodyfat_message", {
          min: OUTLIER.bodyFat.min,
          max: OUTLIER.bodyFat.max,
        })
      );
      return;
    }
    const g: Goals = { weightGoal, bodyFatGoal };
    setGoals(g);
    try {
      await setJSON(BODY_GOAL_KEY, g);
      setGoalModal(false);
    } catch (e) {
      console.error("[BodyScreen save goals] ", e);
      Alert.alert(
        t("body.error_goal_save_title"),
        t("body.error_goal_save_message")
      );
    }
  }

  async function handleExport() {
    await vibrate("light");
    try {
      const path = await exportBodyCSV();
      Alert.alert(
        t("body.export_success_title"),
        t("body.export_success_message", { path })
      );
    } catch (e: any) {
      Alert.alert(
        t("body.export_fail_title"),
        t("body.export_fail_message")
      );
    }
  }

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={async () => {
        await vibrate("light");
        onPress();
      }}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? C.primary : C.card,
        borderWidth: 1,
        borderColor: active ? C.primary : C.border,
        ...shadow.card,
      }}
    >
      <Text
        style={{
          color: active ? "#fff" : C.text,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const todayIdx = useMemo(() => {
    if (period !== "day") return null;
    const todayKey = dayjs().format("YYYY-MM-DD");
    return bucket.findIndex((b) => b.dateForSort === todayKey);
  }, [bucket, period]);

  const recent = useMemo(
    () =>
      raw
        .slice()
        .sort((a, b) => Number(b.ts) - Number(a.ts))
        .slice(0, 20),
    [raw]
  );

  const notesSeries = useMemo<(string | null)[] | undefined>(() => {
    if (period !== "day") return undefined;
    const byDayLatestNote = new Map<string, string>();
    const rawDesc = raw
      .slice()
      .sort((a, b) => Number(b.ts) - Number(a.ts));
    for (const r of rawDesc) {
      const key = dayjs(r.ts).format("YYYY-MM-DD");
      if (
        !byDayLatestNote.has(key) &&
        r.notes &&
        r.notes.trim()
      ) {
        byDayLatestNote.set(key, r.notes.trim());
      }
    }
    return bucket.map(
      (b) => byDayLatestNote.get(b.dateForSort) ?? null
    );
  }, [period, bucket, raw]);

  const subtleBg =
    effectiveScheme === "dark" ? "#111827" : "#F8FAFC";

  const headerDate = dayjs().format("YYYY/MM/DD");

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: C.bg }}
      edges={["left", "right"]}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: 0, bottom: 0 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.m,
          paddingTop: spacing.m,
          paddingBottom: 0,
        }}
        keyboardDismissMode="on-drag"
      >
        {/* ヘッダー */}
        <View
          style={{
            marginBottom: spacing.m,
            flexDirection: "row",
            alignItems: "flex-end",
          }}
        >
          <View>
            <Text style={{ color: C.sub, marginTop: 4 }}>
              {t("body.header_asof", { date: headerDate })}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={async () => {
              await vibrate("light");
              router.push("/(tabs)/help?section=bodycomp");
            }}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginRight: 6,
            }}
          >
            <Text
              style={{ color: C.text, fontWeight: "700" }}
            >
              {t("body.header_help")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExport}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginRight: 6,
            }}
          >
            <Text
              style={{ color: C.primary, fontWeight: "700" }}
            >
              {t("body.header_export")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              await vibrate("light");
              setGoalModal(true);
            }}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{ color: C.text, fontWeight: "700" }}
            >
              {t("body.header_goal")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 期間 & 記録ボタン */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: spacing.m,
            gap: spacing.s,
          }}
        >
          <Chip
            label={t("body.period_day")}
            active={period === "day"}
            onPress={() => setPeriod("day")}
          />
          <Chip
            label={t("body.period_week")}
            active={period === "week"}
            onPress={() => setPeriod("week")}
          />
          <Chip
            label={t("body.period_month")}
            active={period === "month"}
            onPress={() => setPeriod("month")}
          />
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={openCreateModal}
            style={{
              backgroundColor: C.primary,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 999,
              ...shadow.card,
            }}
          >
            <Text
              style={{ color: "#fff", fontWeight: "700" }}
            >
              {t("body.btn_add_record")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* メトリック切替 & 7日平均 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.s,
            marginBottom: spacing.s,
          }}
        >
          <Chip
            label={t("body.metric_both")}
            active={metric === "both"}
            onPress={() => setMetric("both")}
          />
          <Chip
            label={t("body.metric_weight")}
            active={metric === "weight"}
            onPress={() => setMetric("weight")}
          />
          <Chip
            label={t("body.metric_bodyfat")}
            active={metric === "bodyFat"}
            onPress={() => setMetric("bodyFat")}
          />
          <View style={{ flex: 1 }} />
          <Chip
            label={
              showAvg && period === "day"
                ? t("body.avg7_on")
                : t("body.avg7_off")
            }
            active={showAvg && period === "day"}
            onPress={() => setShowAvg((s) => !s)}
          />
        </View>

        {/* グラフ（データ0件は描画しない） */}
        {hasChartData ? (
          <BodyLineChart
            labels={labels}
            weightSeries={seriesW}
            bodyFatSeries={seriesF}
            rollingAvgSeries={avgW ?? undefined}
            goalLineSeries={goalLine}
            showWeight={metric === "both" || metric === "weight"}
            showBodyFat={metric === "both" || metric === "bodyFat"}
            todayIndex={todayIdx}
            notesSeries={notesSeries}
          />
        ) : (
          <View
            style={{
              height: 220,
              borderRadius: radius.l,
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: "center",
              justifyContent: "center",
              ...shadow.card,
              marginBottom: spacing.m,
              padding: spacing.m,
            }}
          >
            <Text
              style={{
                color: C.sub,
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              {t("body.chart_empty_title")}
            </Text>
            <Text
              style={{ color: C.sub, marginTop: 6 }}
            >
              {t("body.chart_empty_message")}
            </Text>
          </View>
        )}

        {/* サマリー */}
        <SummaryCards summary={summary} />

        {/* ETA */}
        <ETACard
          eta={eta}
          C={C}
          title={t("body.eta_title")}
        />

        {/* ストリーク */}
        <View style={{ marginTop: spacing.m }}>
          <Text
            style={{
              color: "#78350F",
              fontWeight: "900",
              marginBottom: 6,
              fontSize: 18,
            }}
          >
            {t("body.streak_board_title")}
          </Text>
          <View>
            <View style={{ marginBottom: spacing.s }}>
              <GoldCard
                title={t("body.streak_current_title")}
                value={`${streakDays} 日`}
                subtitle={t("body.streak_current_sub")}
                tint="#F59E0B"
              />
            </View>
            <View style={{ marginBottom: spacing.s }}>
              <GoldCard
                title={t("body.streak_longest_title")}
                value={`${longestStreak} 日`}
                subtitle={t("body.streak_longest_sub")}
                tint="#A78BFA"
              />
            </View>
            <GoldCard
              title={t("body.streak_month_title")}
              value={`${monthCount} 日`}
              subtitle={t("body.streak_month_sub", {
                month: dayjs().format("M"),
              })}
              tint="#34D399"
            />
          </View>
        </View>

        {/* 直近履歴 */}
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: radius.l,
            padding: spacing.m,
            borderWidth: 1,
            borderColor: C.border,
            ...shadow.card,
            marginTop: spacing.m,
          }}
        >
          <Text
            style={{
              color: C.text,
              fontSize: 18,
              fontWeight: "700",
              marginBottom: spacing.s,
            }}
          >
            {t("body.recent_title")}
          </Text>
          {recent.length === 0 && (
            <Text style={{ color: C.sub }}>
              {t("body.recent_empty")}
            </Text>
          )}
          {recent.map((item, idx) => {
            const key = String(
              (item as any).id ?? `${item.ts}-${idx}`
            );
            const note = (item.notes ?? "").trim();
            return (
              <View key={key}>
                {idx !== 0 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: C.border,
                    }}
                  />
                )}
                <View style={{ paddingVertical: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: C.text,
                          fontWeight: "600",
                        }}
                      >
                        {dayjs(item.ts).format("YYYY/MM/DD")}
                      </Text>
                      <Text
                        style={{
                          color: C.sub,
                          marginTop: 2,
                        }}
                      >
                        {item.weight != null
                          ? `${Number(item.weight).toFixed(
                              1
                            )} kg`
                          : "—"}
                        {item.bodyFat != null
                          ? ` / ${Number(
                              item.bodyFat
                            ).toFixed(1)} %`
                          : ""}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: C.border,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: C.text,
                          fontWeight: "600",
                        }}
                      >
                        {t("body.recent_edit")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDelete(item)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                        backgroundColor: "#fee2e2",
                        borderWidth: 1,
                        borderColor: "#fecaca",
                      }}
                    >
                      <Text
                        style={{
                          color: "#b91c1c",
                          fontWeight: "700",
                        }}
                      >
                        {t("body.recent_delete")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {!!note && (
                    <Text
                      numberOfLines={2}
                      style={{
                        color: C.text,
                        marginTop: 6,
                        backgroundColor: subtleBg,
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: C.border,
                      }}
                    >
                      📝 {note}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 入力モーダル */}
      <Modal
        visible={modal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#0006",
              justifyContent: "flex-end",
            }}
          >
            <KeyboardAvoidingView
              behavior={
                Platform.OS === "ios" ? "padding" : "height"
              }
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  backgroundColor: C.card,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  padding: spacing.l,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Text
                  style={{
                    color: C.text,
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: spacing.s,
                  }}
                >
                  {editing.enabled
                    ? t("body.modal_edit_title")
                    : t("body.modal_add_title")}
                </Text>

                {/* 日付 */}
                <View style={{ marginBottom: spacing.m }}>
                  <Text
                    style={{
                      color: C.sub,
                      marginBottom: 6,
                    }}
                  >
                    {t("body.modal_date_label")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: C.border,
                      borderRadius: radius.m,
                      paddingHorizontal: 12,
                    }}
                  >
                    <TextInput
                      placeholder={t(
                        "body.modal_date_placeholder"
                      )}
                      placeholderTextColor={C.sub}
                      value={dateText}
                      onChangeText={setDateText}
                      returnKeyType="next"
                      onSubmitEditing={() =>
                        weightRef.current?.focus()
                      }
                      style={{
                        flex: 1,
                        color: C.text,
                        paddingVertical: 12,
                        fontSize: 16,
                      }}
                    />
                  </View>
                </View>

                {/* 体重 */}
                <View style={{ marginBottom: spacing.m }}>
                  <Text
                    style={{
                      color: C.sub,
                      marginBottom: 6,
                    }}
                  >
                    {t("body.modal_weight_label")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: C.border,
                      borderRadius: radius.m,
                      paddingHorizontal: 12,
                    }}
                  >
                    <TextInput
                      ref={weightRef}
                      placeholder={t(
                        "body.modal_weight_placeholder"
                      )}
                      placeholderTextColor={C.sub}
                      value={w}
                      onChangeText={setW}
                      returnKeyType="next"
                      onSubmitEditing={() =>
                        bfRef.current?.focus()
                      }
                      inputAccessoryViewID={accessoryId}
                      style={{
                        flex: 1,
                        color: C.text,
                        paddingVertical: 12,
                        fontSize: 16,
                      }}
                    />
                    <Text
                      style={{ color: C.sub, marginLeft: 8 }}
                    >
                      kg
                    </Text>
                  </View>
                </View>

                {/* 体脂肪 */}
                <View style={{ marginBottom: spacing.m }}>
                  <Text
                    style={{
                      color: C.sub,
                      marginBottom: 6,
                    }}
                  >
                    {t("body.modal_bodyfat_label")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: C.border,
                      borderRadius: radius.m,
                      paddingHorizontal: 12,
                    }}
                  >
                    <TextInput
                      ref={bfRef}
                      placeholder={t(
                        "body.modal_bodyfat_placeholder"
                      )}
                      placeholderTextColor={C.sub}
                      value={bf}
                      onChangeText={setBF}
                      returnKeyType="next"
                      inputAccessoryViewID={accessoryId}
                      style={{
                        flex: 1,
                        color: C.text,
                        paddingVertical: 12,
                        fontSize: 16,
                      }}
                    />
                    <Text
                      style={{ color: C.sub, marginLeft: 8 }}
                    >
                      %
                    </Text>
                  </View>
                </View>

                {/* ノート */}
                <View style={{ marginBottom: spacing.l }}>
                  <Text
                    style={{
                      color: C.sub,
                      marginBottom: 6,
                    }}
                  >
                    {t("body.modal_note_label")}
                  </Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: C.border,
                      borderRadius: radius.m,
                      paddingHorizontal: 12,
                    }}
                  >
                    <TextInput
                      placeholder={t(
                        "body.modal_note_placeholder"
                      )}
                      placeholderTextColor={C.sub}
                      value={notes}
                      onChangeText={setNotes}
                      style={{
                        color: C.text,
                        paddingVertical: 12,
                        fontSize: 16,
                        minHeight: 80,
                      }}
                      multiline
                      textAlignVertical="top"
                      maxLength={300}
                    />
                  </View>
                  <Text
                    style={{
                      color: C.sub,
                      marginTop: 4,
                      textAlign: "right",
                    }}
                  >
                    {notes.length}/300
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: spacing.s,
                  }}
                >
                  <TouchableOpacity
                    onPress={closeModal}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: radius.m,
                      backgroundColor: C.card,
                      borderWidth: 1,
                      borderColor: C.border,
                    }}
                  >
                    <Text
                      style={{
                        color: C.text,
                        fontWeight: "600",
                      }}
                    >
                      {t("body.modal_cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: radius.m,
                      backgroundColor: C.primary,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                      }}
                    >
                      {editing.enabled
                        ? t("body.modal_update")
                        : t("body.modal_save")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>

        {Platform.OS === "ios" && (
          <InputAccessoryView nativeID="numericAccessory">
            <View
              style={{
                backgroundColor:
                  effectiveScheme === "dark"
                    ? "#1f2937"
                    : "#F2F2F7",
                borderTopWidth: 1,
                borderColor:
                  effectiveScheme === "dark"
                    ? "#374151"
                    : "#D1D5DB",
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ color: C.sub }}>
                {t("body.input_bar_label")}
              </Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={Keyboard.dismiss}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: C.primary,
                    fontWeight: "700",
                  }}
                >
                  {t("body.input_bar_done")}
                </Text>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
      </Modal>

      {/* 目標設定モーダル */}
      <Modal
        visible={goalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalModal(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setGoalModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#0006",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  width: "90%",
                  backgroundColor: C.card,
                  borderRadius: radius.l,
                  padding: spacing.l,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Text
                  style={{
                    color: C.text,
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: spacing.m,
                  }}
                >
                  {t("body.goal_modal_title")}
                </Text>

                <Text
                  style={{
                    color: C.sub,
                    marginBottom: 6,
                  }}
                >
                  {t("body.goal_weight_label")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.border,
                    borderRadius: radius.m,
                    paddingHorizontal: 12,
                    marginBottom: spacing.m,
                  }}
                >
                  <TextInput
                    placeholder={t(
                      "body.goal_weight_placeholder"
                    )}
                    placeholderTextColor={C.sub}
                    value={goalWeightText}
                    onChangeText={setGoalWeightText}
                    style={{
                      flex: 1,
                      color: C.text,
                      paddingVertical: 12,
                      fontSize: 16,
                    }}
                  />
                  <Text
                    style={{ color: C.sub, marginLeft: 8 }}
                  >
                    kg
                  </Text>
                </View>

                <Text
                  style={{
                    color: C.sub,
                    marginBottom: 6,
                  }}
                >
                  {t("body.goal_bodyfat_label")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: C.border,
                    borderRadius: radius.m,
                    paddingHorizontal: 12,
                    marginBottom: spacing.l,
                  }}
                >
                  <TextInput
                    placeholder={t(
                      "body.goal_bodyfat_placeholder"
                    )}
                    placeholderTextColor={C.sub}
                    value={goalBodyFatText}
                    onChangeText={setGoalBodyFatText}
                    style={{
                      flex: 1,
                      color: C.text,
                      paddingVertical: 12,
                      fontSize: 16,
                    }}
                  />
                  <Text
                    style={{ color: C.sub, marginLeft: 8 }}
                  >
                    %
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: spacing.s,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setGoalModal(false)}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: radius.m,
                      backgroundColor: C.card,
                      borderWidth: 1,
                      borderColor: C.border,
                    }}
                  >
                    <Text
                      style={{
                        color: C.text,
                        fontWeight: "600",
                      }}
                    >
                      {t("body.modal_cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveGoals}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: radius.m,
                      backgroundColor: C.primary,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                      }}
                    >
                      {t("body.modal_save")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <BodyHelpModal
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </SafeAreaView>
  );
}

const GoldCard = ({
  title,
  value,
  subtitle,
  tint = "#F59E0B",
}: {
  title: string;
  value: string;
  subtitle: string;
  tint?: string;
}) => (
  <View
    style={{
      marginTop: spacing.s,
      borderRadius: radius.xl,
      padding: spacing.m,
      backgroundColor: "#FFF7E6",
      borderWidth: 2,
      borderColor: "#FBBF24",
      shadowColor: "#F59E0B",
      shadowOpacity: 0.45,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 10 },
      overflow: "hidden",
    }}
  >
    <View
      pointerEvents="none"
      style={{ position: "absolute", inset: 0 }}
    >
      <View
        style={{
          position: "absolute",
          top: -70,
          left: -40,
          width: 260,
          height: 260,
          backgroundColor: "#f8f2d9ff",
          opacity: 0.9,
          borderRadius: 9999,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -80,
          right: -30,
          width: 240,
          height: 240,
          backgroundColor: "#FFE08A",
          opacity: 0.7,
          borderRadius: 9999,
        }}
      />
    </View>
    <Text
      style={{
        color: "#78350F",
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 0.5,
      }}
    >
      🏆 {title}
    </Text>
    <Text
      style={{
        color: "#713F12",
        fontSize: 40,
        fontWeight: "900",
        marginTop: 4,
      }}
    >
      {value}
    </Text>
    <Text
      style={{ color: "#92400E", fontSize: 14, marginTop: 2 }}
    >
      {subtitle}
    </Text>
    <View
      style={{
        marginTop: spacing.s,
        height: 14,
        borderRadius: 999,
        backgroundColor: tint + "33",
      }}
    />
  </View>
);

const ETACard = ({
  eta,
  C,
  title,
}: {
  eta: any;
  C: any;
  title: string;
}) => {
  let bg = "#ECFDF5",
    border = "#A7F3D0",
    accent = "#059669";
  switch (eta.state) {
    case "no-goal":
      bg = "#FEF3C7";
      border = "#FDE68A";
      accent = "#92400E";
      break;
    case "insufficient":
      bg = "#F3F4F6";
      border = "#E5E7EB";
      accent = "#374151";
      break;
    case "achieved":
      bg = "#EEF2FF";
      border = "#C7D2FE";
      accent = "#3730A3";
      break;
    case "flat":
      bg = "#FFF7ED";
      border = "#FED7AA";
      accent = "#9A3412";
      break;
    case "reverse":
      bg = "#FEF2F2";
      border = "#FECACA";
      accent = "#991B1B";
      break;
    case "unknown":
      bg = "#F3F4F6";
      border = "#E5E7EB";
      accent = "#374151";
      break;
    case "eta":
    default:
      bg = "#ECFDF5";
      border = "#A7F3D0";
      accent = "#059669";
      break;
  }
  return (
    <View
      style={{
        marginTop: spacing.m,
        borderRadius: radius.l,
        padding: spacing.m,
        backgroundColor: bg,
        borderWidth: 1.5,
        borderColor: border,
        ...shadow.card,
      }}
    >
      <Text
        style={{
          color: accent,
          fontWeight: "900",
          fontSize: 14,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: C.text,
          fontWeight: "900",
          fontSize: 28,
          marginTop: 4,
        }}
      >
        {eta.main}
      </Text>
      {!!eta.sub && (
        <Text style={{ color: C.sub, marginTop: 6 }}>
          {eta.sub}
        </Text>
      )}
    </View>
  );
};
