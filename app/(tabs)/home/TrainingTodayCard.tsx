// app/(tabs)/home/TrainingTodayCard.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next"; // ★追加

import {
  initTrainingDb,
  findSessionIdByDate,
  listSetsBySession,
  getMaxWeightRecord,
  getMaxRepsRecord,
} from "../../../lib/training/db";

type TRow = {
  id: number;
  session_id: number;
  exercise_id: number;
  set_index: number;
  weight_kg: number;
  reps: number;
  is_warmup: 0 | 1;
  exercise_name: string;
  unit?: string;
};

export default function TrainingTodayCard() {
  const router = useRouter();
  const today = dayjs().format("YYYY-MM-DD");
  const { t } = useTranslation(); // ★追加

  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [rows, setRows] = useState<TRow[]>([]);
  const [prToday, setPrToday] = useState<boolean>(false);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const load = useCallback(async () => {
    setLoading(true);
    await initTrainingDb();
    const sid = await findSessionIdByDate(today);
    setSessionId(sid);
    if (sid) {
      const r = await listSetsBySession(sid);
      setRows(r as TRow[]);
    } else {
      setRows([]);
    }
    const [mw, mr] = await Promise.all([getMaxWeightRecord(), getMaxRepsRecord()]);
    setPrToday(Boolean((mw && mw.date === today) || (mr && mr.date === today)));
    setLoading(false);
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const work = useMemo(() => rows.filter((r) => !r.is_warmup), [rows]);

  const summary = useMemo(() => {
    const exercises = new Set(work.map((r) => r.exercise_id)).size;
    const sets = work.length;
    const reps = work.reduce((a, b) => a + (b.reps || 0), 0);
    const loadKg = work.reduce((a, b) => a + (b.weight_kg || 0) * (b.reps || 0), 0);
    return { exercises, sets, reps, tonnageT: (loadKg / 1000).toFixed(2) };
  }, [work]);

  const digest = useMemo(() => {
    const map = new Map<
      number,
      { name: string; unit: string; sets: { w: number; r: number }[] }
    >();
    work.forEach((r) => {
      const unit = r.unit ?? "kg";
      if (!map.has(r.exercise_id))
        map.set(r.exercise_id, { name: r.exercise_name, unit, sets: [] });
      map.get(r.exercise_id)!.sets.push({ w: r.weight_kg, r: r.reps });
    });
    return Array.from(map.values()).slice(0, 3);
  }, [work]);

  const fmt = (n: number) =>
    Number.isInteger(n) ? String(n) : String(Number(n.toFixed(1)));

  return (
    <LinearGradient
      colors={["#F8FBFF", "#F4F6FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e6e9f0" }}
    >
      {/* ヘッダー */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="barbell-outline" size={20} color="#1e293b" />
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#1e293b" }}>
            {t("home.training_today.title")}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {prToday ? (
            <Animated.View
              style={{
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1.05],
                    }),
                  },
                ],
              }}
            >
              <View
                style={{
                  backgroundColor: "#f59e0b",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>
                  {t("home.training_today.pr_badge")}
                </Text>
              </View>
            </Animated.View>
          ) : null}
          <View
            style={{
              backgroundColor: sessionId ? "#e0f2f1" : "#fee2e2",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                color: sessionId ? "#00695c" : "#991b1b",
                fontWeight: "700",
                fontSize: 12,
              }}
            >
              {sessionId
                ? t("home.training_today.badge_has_record")
                : t("home.training_today.badge_no_record")}
            </Text>
          </View>
        </View>
      </View>

      {/* 内容 */}
      {loading ? (
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 6, color: "#64748b" }}>
            {t("home.loading")}
          </Text>
        </View>
      ) : (
        <>
          {work.length === 0 ? (
            <Text style={{ color: "#64748b", marginBottom: 8 }}>
              {t("home.training_today.empty_message")}
            </Text>
          ) : (
            <>
              {/* サマリー */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {[
                  {
                    key: "exercises",
                    label: t("home.training_today.summary_exercises"),
                    v: summary.exercises,
                  },
                  {
                    key: "sets",
                    label: t("home.training_today.summary_sets"),
                    v: summary.sets,
                  },
                  {
                    key: "reps",
                    label: t("home.training_today.summary_reps"),
                    v: summary.reps,
                  },
                  {
                    key: "tonnage",
                    label: t("home.training_today.summary_tonnage"),
                    v: `${summary.tonnageT} t`,
                  },
                ].map((p) => (
                  <View
                    key={p.key}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontWeight: "800",
                        color: "#111827",
                      }}
                    >
                      {p.v}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      {p.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* ダイジェスト（最大3種目） */}
              {digest.map((g, i) => (
                <View
                  key={i}
                  style={{
                    paddingVertical: 6,
                    borderBottomWidth: i === digest.length - 1 ? 0 : 1,
                    borderBottomColor: "#eef2f7",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color: "#111827",
                      marginBottom: 2,
                    }}
                  >
                    {g.name}
                  </Text>
                  <Text style={{ color: "#334155" }}>
                    {g.sets
                      .map((s) =>
                        t("home.training_today.set_line", {
                          weight: fmt(s.w),
                          unit: g.unit,
                          reps: fmt(s.r),
                        })
                      )
                      .join(" / ")}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* CTA */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => router.push(`/training/${today}`)}
              activeOpacity={0.85}
              style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#1976d2", "#42a5f5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 10, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  {sessionId
                    ? t("home.training_today.cta_continue")
                    : t("home.training_today.cta_start_today")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/training")}
              activeOpacity={0.85}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#fff",
              }}
            >
              <Text style={{ fontWeight: "700", color: "#111827" }}>
                {t("home.training_today.cta_calendar")}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </LinearGradient>
  );
}
