// app/(tabs)/meals/index.tsx
// 食事タブファースト画面（ヘッダーにヘルプ導線／カレンダーで「今日」を強調）

import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import dayjs from "dayjs";

import { listMealsInMonth } from "../../../lib/storage";
import type { Meal, MealType } from "../../../lib/meals";

import { Card, SectionTitle, PrimaryButton } from "../../../ui/components";
// ★ テーマを徹底適用（色は C 経由に統一）
import { colors as C, spacing, radius } from "../../../ui/theme";
import { loadAdviceMemo } from "../../../lib/advice";
import { useTranslation } from "react-i18next";

/* optional: react-native-svg（未導入でも壊れない） */
let RNSVG: any = null;
try {
  RNSVG = require("react-native-svg");
} catch {}

/** hex にアルファを足す (#RRGGBB だけ対応) */
function withAlpha(hex: string, a: number) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((s) => parseInt(s, 16));
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, a))})`;
}

type DayCell = { date: dayjs.Dayjs; inMonth: boolean };

export default function MealsCalendar() {
  const router = useRouter();
  const { t } = useTranslation();
  const today = dayjs();
  const [year, setYear] = useState(today.year());
  const [month0, setMonth0] = useState(today.month()); // 0-based
  const [selected, setSelected] = useState(today.format("YYYY-MM-DD"));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  // AIメモ
  const [adviceMemo, setAdviceMemo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMealsInMonth(year, month0);
      setMeals(data);

      // 月が切り替わった場合、選択日の整合性を取る
      const monthAnchor = dayjs(new Date(year, month0, 1));
      const fallback = monthAnchor.format("YYYY-MM-DD");
      if (!dayjs(selected).isSame(monthAnchor, "month")) {
        setSelected(fallback);
      }
    } finally {
      setLoading(false);
    }
  }, [year, month0, selected]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // 選択日が変わったらAIメモを読み込み
  useEffect(() => {
    let on = true;
    (async () => {
      const memo = await loadAdviceMemo(selected);
      if (!on) return;
      setAdviceMemo(memo || "");
    })();
    return () => {
      on = false;
    };
  }, [selected]);

  const monthMatrix: DayCell[] = useMemo(
    () => buildMonthMatrix(year, month0),
    [year, month0]
  );

  const mealsByDate = useMemo(() => {
    const map: Record<string, Meal[]> = {};
    for (const m of meals) (map[m.date] ??= []).push(m);
    return map;
  }, [meals]);

  const selectedMeals = mealsByDate[selected] ?? [];
  const daySummary = summarize(selectedMeals);

  // ■ 月グラフ用データ（当月の合計kcal/日）
  const monthISO = dayjs(new Date(year, month0, 1)).format("YYYY-MM");
  const monthData = useMemo(() => {
    const dayCount = dayjs(monthISO + "-01").daysInMonth();
    const totals = Array.from({ length: dayCount }, (_, i) => ({
      day: i + 1,
      kcal: 0,
    }));
    for (const m of meals) {
      const d = m.date || "";
      if (!d?.startsWith(monthISO)) continue;
      const dd = Number(d.slice(8, 10));
      if (!Number.isFinite(dd)) continue;
      totals[dd - 1].kcal += Number(m.calories || 0);
    }
    return totals;
  }, [meals, monthISO]);

  function prevMonth() {
    const d = dayjs(new Date(year, month0, 1)).subtract(1, "month");
    setYear(d.year());
    setMonth0(d.month());
  }
  function nextMonth() {
    const d = dayjs(new Date(year, month0, 1)).add(1, "month");
    setYear(d.year());
    setMonth0(d.month());
  }

  if (loading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center" }}
      >
        <Text style={{ padding: spacing.xl, color: C.subtext }}>
          {t("meals.loading")}
        </Text>
      </View>
    );
  }

  const goHelpMeals = () => {
    router.push({ pathname: "/(tabs)/help", params: { section: "meals" } });
  };

  const monthDate = dayjs(new Date(year, month0, 1));
  const monthLabel = t("meals.monthHeader", {
    year: monthDate.year(),
    month: monthDate.month() + 1,
  });

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      data={[{ key: "calendar" }]}
      keyExtractor={(i) => i.key}
      renderItem={() => (
        <View style={{ gap: spacing.lg }}>
          {/* ヘッダー（ヘルプ導線） */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View />
            <TouchableOpacity
              onPress={goHelpMeals}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{ color: C.text, fontWeight: "700", fontSize: 13 }}
              >
                {t("help.common.helpButton")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 月切り替え */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
              <Text style={{ fontSize: 18, color: C.subtext }}>{"‹"}</Text>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: C.text,
              }}
            >
              {monthLabel}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
              <Text style={{ fontSize: 18, color: C.subtext }}>{"›"}</Text>
            </TouchableOpacity>
          </View>

          {/* 商品検索への導線 */}
          <Card style={{ padding: spacing.md }}>
            <SectionTitle>{t("meals.productSection.title")}</SectionTitle>
            <View style={{ height: spacing.sm }} />
            <Link asChild href="/(tabs)/meals/search">
              <PrimaryButton title={t("meals.productSection.button")} />
            </Link>
            <Text
              style={{
                color: C.subtext,
                marginTop: 8,
                fontSize: 12,
              }}
            >
              {t("meals.productSection.caption")}
            </Text>
          </Card>

          {/* 曜日ヘッダー */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 4,
            }}
          >
            {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((k) => (
              <Text
                key={k}
                style={{
                  width: `${100 / 7}%`,
                  textAlign: "center",
                  color: C.subtext,
                }}
              >
                {t(`meals.weekday.${k}`)}
              </Text>
            ))}
          </View>

          {/* 月グリッド（6週 × 7列） */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              rowGap: 8,
            }}
          >
            {monthMatrix.map((cell, idx) => {
              const d = cell.date;
              const dateStr = d.isValid() ? d.format("YYYY-MM-DD") : "";
              const isSelected = dateStr === selected;
              const inMonth = cell.inMonth;
              const isToday = d.isSame(today, "day");
              const dayMeals = mealsByDate[dateStr] ?? [];
              const kcal = dayMeals.reduce(
                (s, m) => s + (m.calories ?? 0),
                0
              );

              return (
                <TouchableOpacity
                  key={
                    d.isValid()
                      ? String(d.valueOf())
                      : `invalid-${year}-${month0}-${idx}`
                  }
                  onPress={() => dateStr && setSelected(dateStr)}
                  style={{ width: `${100 / 6}%`, padding: 2 }}
                  activeOpacity={0.7}
                >
                  <Card
                    style={{
                      padding: 8,
                      borderRadius: radius.md,
                      backgroundColor: isSelected
                        ? withAlpha(C.primary, 0.12)
                        : isToday
                        ? withAlpha(C.primary, 0.08)
                        : C.card,
                      borderWidth: 1,
                      borderColor: isSelected
                        ? C.primary
                        : isToday
                        ? withAlpha(C.primary, 0.6)
                        : C.border,
                      opacity: inMonth ? 1 : 0.5,
                    }}
                  >
                    <View
                      style={[
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        },
                        isToday && {
                          backgroundColor: withAlpha(C.primary, 0.18),
                          borderWidth: 1,
                          borderColor: withAlpha(C.primary, 0.45),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          {
                            fontSize: 10,
                            fontWeight: "700",
                            color: C.text,
                          },
                          isToday && {
                            color: C.primary,
                            fontWeight: "900",
                          },
                        ]}
                      >
                        {d.isValid() ? d.date() : ""}
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 11,
                        color: C.subtext,
                        marginTop: 4,
                      }}
                      numberOfLines={1}
                    >
                      {kcal > 0
                        ? t("meals.kcalWithUnit", { value: kcal })
                        : "—"}
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ▼ カレンダー直下：月のカロリー推移グラフ */}
          <CaloriesTrend monthISO={monthISO} data={monthData} goalKcal={0} />

          {/* 選択日のサマリー */}
          <Card>
            <SectionTitle
            >
              {t("meals.summaryTitle", {
                date: dayjs(selected).format("M/D"),
              })}
            </SectionTitle>

            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <SummaryBox
                label={t("meals.summary.totalKcal")}
                value={
                  daySummary.totalKcal
                    ? t("meals.kcalWithUnit", {
                        value: daySummary.totalKcal,
                      })
                    : "—"
                }
              />
              <SummaryBox label="P" value={fmtGram(daySummary.p)} />
              <SummaryBox label="F" value={fmtGram(daySummary.f)} />
              <SummaryBox label="C" value={fmtGram(daySummary.c)} />
            </View>

            {/* 区分別 */}
            <View style={{ height: spacing.md }} />
            {(
              ["breakfast", "lunch", "dinner", "snack"] as MealType[]
            ).map((mt) => {
              const s = daySummary.byType[mt];
              return (
                <View
                  key={mt}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: C.text, fontWeight: "600" }}>
                    {labelOfType(mt, t)}
                  </Text>
                  <Text style={{ color: C.subtext }}>
                    {s.totalKcal
                      ? t("meals.kcalWithUnit", {
                          value: s.totalKcal,
                        })
                      : "—"}{" "}
                    ／ P{fmtGram(s.p)} F{fmtGram(s.f)} C{fmtGram(s.c)}
                  </Text>
                </View>
              );
            })}

            {/* クイック追加 */}
            <View style={{ height: spacing.lg }} />
            <View style={{ flexDirection: "row", gap: 0 }}>
              {(
                ["breakfast", "lunch", "dinner", "snack"] as MealType[]
              ).map((mt) => (
                <View key={mt} style={{ flex: 1, marginHorizontal: 4 }}>
                  <Link
                    asChild
                    href={{
                      pathname: "/(tabs)/meals/new",
                      params: { date: selected, mealType: mt },
                    }}
                  >
                    <PrimaryButton title={labelOfType(mt, t)} />
                  </Link>
                </View>
              ))}
            </View>
          </Card>

          {/* AIからの本日のアドバイス */}
          <Card>
            <SectionTitle>
              {t("meals.aiAdvice.title")}
            </SectionTitle>
            <View
              style={{
                marginTop: spacing.sm,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: C.card,
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: adviceMemo ? C.text : C.subtext,
                  lineHeight: 20,
                }}
              >
                {adviceMemo || t("meals.aiAdvice.empty")}
              </Text>
            </View>
          </Card>

          {/* 選択日の一覧 */}
          <Card>
            <SectionTitle>
              {t("meals.recordsTitle", {
                date: dayjs(selected).format("M/D"),
              })}
            </SectionTitle>

            {selectedMeals.length === 0 ? (
              <Text
                style={{
                  color: C.subtext,
                  marginTop: spacing.sm,
                }}
              >
                {t("meals.records.empty")}
              </Text>
            ) : (
              <View style={{ marginTop: spacing.sm }}>
                {selectedMeals.map((m) => (
                  <Link
                    key={m.id}
                    href={`/(tabs)/meals/${m.id}`}
                    asChild
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: C.border,
                        gap: spacing.md,
                      }}
                    >
                      {/* サムネ（任意） */}
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          backgroundColor: C.card,
                          borderWidth: 1,
                          borderColor: C.border,
                          overflow: "hidden",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {m.photoUri ? (
                          <Image
                            source={{ uri: m.photoUri }}
                            style={{
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        ) : (
                          <Text
                            style={{
                              fontSize: 10,
                              color: C.subtext,
                            }}
                          >
                            {t("meals.noPhoto")}
                          </Text>
                        )}
                      </View>

                      {/* 主要情報 */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: C.text,
                            fontWeight: "700",
                          }}
                        >
                          {(m.title || t("meals.untitled")) +
                            `（${labelOfType(
                              (m.mealType || "snack") as MealType,
                              t
                            )}）`}
                        </Text>
                        <Text
                          style={{
                            color: C.subtext,
                            marginTop: 2,
                          }}
                        >
                          {m.calories
                            ? t("meals.kcalWithUnit", {
                                value: m.calories,
                              })
                            : t("meals.kcalWithUnit", {
                                value: 0,
                              })}
                          {[
                            m.protein
                              ? `・P${m.protein}g`
                              : null,
                            m.fat ? `F${m.fat}g` : null,
                            m.carbs
                              ? `C${m.carbs}g`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            )}
          </Card>
        </View>
      )}
    />
  );
}

/* ===== 折れ線グラフ（タップで日フォーカス移動） ===== */
function CaloriesTrend({
  monthISO,
  data,
  goalKcal,
}: {
  monthISO: string; // "YYYY-MM"
  data: { day: number; kcal: number }[];
  goalKcal: number;
}) {
  const { t } = useTranslation();
  const { width: screenW } = Dimensions.get("window");
  const dayCount = dayjs(monthISO + "-01").daysInMonth();

  const PAD_L = 16,
    PAD_R = 24,
    PAD_T = 20,
    PAD_B = 28;
  const H = 200;
  const STEP = 28; // 1日あたりの横幅
  const W = Math.max(screenW, STEP * dayCount + PAD_L + PAD_R);

  // SVG & ScrollView 参照
  const scRef =
    useRef<import("react-native").ScrollView | null>(null);
  const didInitScroll = useRef(false);

  // 今日
  const todayISO = dayjs().format("YYYY-MM-DD");
  const isThisMonth = todayISO.startsWith(monthISO);
  const todayDay = isThisMonth ? Number(todayISO.slice(8, 10)) : null;

  // フォーカス
  const [focusedDay, setFocusedDay] = useState<number | null>(
    todayDay
  );

  // 座標スケール
  const xScale = (day: number) => PAD_L + (day - 1) * STEP;

  // 初期：今日を中央へ
  useEffect(() => {
    if (!isThisMonth || !todayDay || didInitScroll.current) return;
    const tId = setTimeout(() => {
      const target = Math.max(
        0,
        xScale(todayDay) - screenW / 2
      );
      scRef.current?.scrollTo({
        x: target,
        y: 0,
        animated: false,
      });
      didInitScroll.current = true;
    }, 0);
    return () => clearTimeout(tId);
  }, [isThisMonth, todayDay, screenW]);

  // フォーカス変更時：中央へ
  useEffect(() => {
    if (!focusedDay) return;
    const target = Math.max(
      0,
      xScale(focusedDay) - screenW / 2
    );
    scRef.current?.scrollTo({
      x: target,
      y: 0,
      animated: true,
    });
  }, [focusedDay, screenW]);

  if (!RNSVG) {
    return (
      <Card style={{ padding: spacing.md }}>
        <SectionTitle>{t("meals.trend.title")}</SectionTitle>
        <Text style={{ color: C.subtext, marginTop: 8 }}>
          {t("meals.trend.needSvg", {
            libName: "react-native-svg",
          })}
        </Text>
      </Card>
    );
  }

  const { Svg, Path, Line, Circle, Text: SvgText, Rect, G } = RNSVG;

  const allZero = !data.some((d) => (d.kcal || 0) > 0);
  const maxVal = Math.max(
    600,
    goalKcal || 0,
    ...data.map((d) => d.kcal || 0)
  );
  const yScale = (v: number) => {
    const innerH = H - PAD_T - PAD_B;
    const ratio = Math.min(1, v / (maxVal || 1));
    return H - PAD_B - ratio * innerH;
  };

  const path = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(d.day)} ${yScale(d.kcal)}`
    )
    .join(" ");
  const monthNum = Number(monthISO.slice(5, 7));

  const showTick = (day: number) =>
    day % 3 === 0 ||
    day === 1 ||
    day === dayCount ||
    focusedDay === day ||
    todayDay === day;

  const monthDate = dayjs(monthISO + "-01");
  const y = monthDate.year();
  const m = monthDate.month() + 1;

  return (
    <Card style={{ paddingVertical: spacing.sm }}>
      <SectionTitle>{t("meals.trend.title")}</SectionTitle>
      <ScrollView
        ref={scRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        <Svg width={W} height={H}>
          {/* 背景（テーマ追従） */}
          <Rect x={0} y={0} width={W} height={H} fill={C.card} />

          {/* フォーカス日の縦帯 */}
          {focusedDay && (
            <Rect
              x={xScale(focusedDay) - STEP / 2}
              y={0}
              width={STEP}
              height={H}
              fill={withAlpha(C.primary, 0.13)}
            />
          )}

          {/* 目標ライン */}
          {goalKcal > 0 && (
            <>
              <Line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={yScale(goalKcal)}
                y2={yScale(goalKcal)}
                stroke="#f59e0b"
                strokeDasharray={[6, 6]}
                strokeWidth={2}
              />
              <SvgText
                x={W - PAD_R}
                y={yScale(goalKcal) - 6}
                fontSize="10"
                fill="#b45309"
                textAnchor="end"
              >
                {t("meals.trend.goalLabel", { kcal: goalKcal })}
              </SvgText>
            </>
          )}

          {/* ガイド横線 */}
          {[0.25, 0.5, 0.75].map((p, i) => {
            const yVal = yScale(maxVal * p);
            return (
              <Line
                key={i}
                x1={PAD_L}
                x2={W - PAD_R}
                y1={yVal}
                y2={yVal}
                stroke={C.border}
                strokeWidth={1}
              />
            );
          })}

          {/* 折れ線 */}
          {!allZero && (
            <Path
              d={path}
              stroke={C.primary}
              strokeWidth={3}
              fill="none"
            />
          )}

          {/* ドット + kcalラベル（今日の点は赤） */}
          {data.map((d, i) => {
            const isToday = todayDay === d.day;
            const isFocused = focusedDay === d.day;
            const cx = xScale(d.day);
            const cy = yScale(d.kcal);
            return (
              <G key={i}>
                {isFocused && (
                  <SvgText
                    x={cx}
                    y={cy - 8}
                    fontSize="10"
                    fill={isToday ? "#dc2626" : C.text}
                    textAnchor="middle"
                    fontWeight={
                      isToday ? ("700" as any) : ("600" as any)
                    }
                  >
                    {t("meals.kcalWithUnit", {
                      value: Math.round(d.kcal),
                    })}
                  </SvgText>
                )}
                <Circle
                  cx={cx}
                  cy={cy}
                  r={isToday ? 4.5 : 3.5}
                  fill={isToday ? "#dc2626" : C.primary}
                />
              </G>
            );
          })}

          {/* X軸（M/D 表記） */}
          {Array.from({ length: dayCount }, (_, i) => i + 1).map(
            (day) => {
              if (!showTick(day)) return null;
              const x = xScale(day);
              const label = `${monthNum}/${day}`;
              const isToday = todayDay === day;
              const isFocused = focusedDay === day;
              return (
                <SvgText
                  key={day}
                  x={x}
                  y={H - 6}
                  fontSize="10"
                  fill={
                    isFocused
                      ? C.text
                      : isToday
                      ? C.primary
                      : C.subtext
                  }
                  fontWeight={
                    isFocused || isToday
                      ? ("700" as any)
                      : ("400" as any)
                  }
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              );
            }
          )}

          {/* 透明タップ領域 */}
          {Array.from({ length: dayCount }, (_, i) => i + 1).map(
            (day) => (
              <Rect
                key={`hit-${day}`}
                x={xScale(day) - STEP / 2}
                y={0}
                width={STEP}
                height={H}
                fill="transparent"
                onPress={() => setFocusedDay(day)}
              />
            )
          )}
        </Svg>
      </ScrollView>
      <Text
        style={{
          color: C.subtext,
          marginTop: 6,
          paddingHorizontal: spacing.md,
        }}
      >
        {t("meals.trend.caption", { year: y, month: m })}
      </Text>
    </Card>
  );
}

/* ---------- Helpers ---------- */
function buildMonthMatrix(year: number, month0: number): DayCell[] {
  const first = dayjs(new Date(year, month0, 1)).startOf("day");
  const firstWeekday = first.day(); // 0=日, 6=土
  const gridStart = first.subtract(firstWeekday, "day");

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = gridStart.add(i, "day");
    cells.push({ date: d, inMonth: d.month() === month0 });
  }
  return cells;
}

function summarize(meals: Meal[]) {
  const sum = { totalKcal: 0, p: 0, f: 0, c: 0 };
  const byType: Record<MealType, typeof sum> = {
    breakfast: { ...sum },
    lunch: { ...sum },
    dinner: { ...sum },
    snack: { ...sum },
  };
  for (const m of meals) {
    const kcal = m.calories ?? 0,
      p = m.protein ?? 0,
      f = m.fat ?? 0,
      c = m.carbs ?? 0;
    sum.totalKcal += kcal;
    sum.p += p;
    sum.f += f;
    sum.c += c;
    const t = (m.mealType ?? "snack") as MealType;
    byType[t].totalKcal += kcal;
    byType[t].p += p;
    byType[t].f += f;
    byType[t].c += c;
  }
  const round1 = (n: number) => Math.round(n * 10) / 10;
  sum.totalKcal = Math.round(sum.totalKcal);
  sum.p = round1(sum.p);
  sum.f = round1(sum.f);
  sum.c = round1(sum.c);
  (Object.keys(byType) as MealType[]).forEach((k) => {
    byType[k].totalKcal = Math.round(byType[k].totalKcal);
    byType[k].p = round1(byType[k].p);
    byType[k].f = round1(byType[k].f);
    byType[k].c = round1(byType[k].c);
  });
  return { ...sum, byType };
}
function fmtGram(n: number) {
  return n ? `${n}g` : "—";
}

/** 食事区分ラベル（多言語） */
function labelOfType(mealType: MealType, tFn: (key: string) => string) {
  switch (mealType) {
    case "breakfast":
      return tFn("meals.types.breakfast");
    case "lunch":
      return tFn("meals.types.lunch");
    case "dinner":
      return tFn("meals.types.dinner");
    case "snack":
    default:
      return tFn("meals.types.snack");
  }
}

/* ✅ SummaryBox */
function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card style={{ padding: spacing.md, width: "100%" }}>
      <Text style={{ fontSize: 12, color: C.subtext }}>{label}</Text>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "800",
          color: C.text,
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </Card>
  );
}
