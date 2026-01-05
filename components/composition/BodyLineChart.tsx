// components/composition/BodyLineChart.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Dimensions, Text, ScrollView } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { G, Rect } from "react-native-svg";
import { radius, shadow, spacing } from "../../ui/theme.body";
import { useAppPrefs } from "../../lib/app-prefs";

type Props = {
  labels: string[];
  weightSeries: (number | null)[];
  bodyFatSeries: (number | null)[];
  rollingAvgSeries?: (number | null)[];
  goalLineSeries?: (number | null)[];
  showWeight: boolean;
  showBodyFat: boolean;
  pointMinWidth?: number;
  height?: number;
  todayIndex?: number | null;
  notesSeries?: (string | null)[];
};

const FALLBACK_COLORS = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  subtext: "#6B7280",
  primary: "#2563EB",
  accent: "#2563EB",
};

export function BodyLineChart({
  labels,
  weightSeries,
  bodyFatSeries,
  rollingAvgSeries,
  goalLineSeries,
  showWeight,
  showBodyFat,
  pointMinWidth = 52,
  height = 260,
  todayIndex = null,
  notesSeries,
}: Props) {
  const { colors: CFromPrefs } = useAppPrefs();
  const colors = CFromPrefs ?? FALLBACK_COLORS;

  const screenW = Dimensions.get("window").width;
  const contentWidth = Math.max(
    screenW - spacing.m * 2,
    Math.max(labels.length * pointMinWidth, 320)
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const fallbackIndex = labels.length > 0 ? labels.length - 1 : null;
  const currentIndex = activeIndex ?? fallbackIndex ?? 0;

  const xsRef = useRef<number[]>([]);
  const stepRef = useRef<number | null>(null);

  const [rev, setRev] = useState(0);
  useEffect(() => {
    xsRef.current = [];
    stepRef.current = null;
    const id = requestAnimationFrame(() => setRev((r) => r + 1));
    return () => cancelAnimationFrame(id);
  }, [labels, contentWidth]);

  const datasets: any[] = useMemo(() => {
    const out: any[] = [];
    const push = (
      arr: (number | null)[],
      strokeWidth: number,
      color: (o?: number) => string
    ) => out.push({ data: arr.map((v) => (v == null ? NaN : v)), strokeWidth, color });

    if (showWeight) push(weightSeries, 2, (o = 1) => `rgba(109,40,217,${o})`); // violet-700
    if (showBodyFat) push(bodyFatSeries, 2, (o = 1) => `rgba(245,158,11,${o})`); // amber-500
    if (rollingAvgSeries) push(rollingAvgSeries, 2, (o = 1) => `rgba(59,130,246,${o})`); // blue-500
    if (goalLineSeries) push(goalLineSeries, 1, (o = 1) => `rgba(148,163,184,${o})`); // slate-400
    if (out.length === 0) push(labels.map(() => null), 0, () => "rgba(0,0,0,0)");
    return out;
  }, [rev, labels, showWeight, showBodyFat, weightSeries, bodyFatSeries, rollingAvgSeries, goalLineSeries]);

  const vW = weightSeries[currentIndex] ?? null;
  const vF = bodyFatSeries[currentIndex] ?? null;
  const vG = goalLineSeries?.[currentIndex] ?? null;
  const noteNow = (notesSeries?.[currentIndex] ?? "").trim();
  const hasNote = !!noteNow;
  const labelNow = labels[currentIndex] ?? "-";

  const handlePointClick = (e: any) => {
    if (typeof e?.index === "number") setActiveIndex(e.index);
  };

  const renderDotContent = ({ x, index }: any) => {
    xsRef.current[index] = x;
    if (index > 0) {
      const d = x - xsRef.current[index - 1];
      stepRef.current = stepRef.current == null ? d : stepRef.current * 0.7 + d * 0.3;
    }
    return null;
  };

  const computePad = () => {
    const fallbackStep = contentWidth / Math.max(1, labels.length);
    const step = stepRef.current ?? fallbackStep;
    const firstX = xsRef.current[0];
    const lastX = xsRef.current[labels.length - 1];
    if (firstX == null || lastX == null) {
      return { left: 0, right: 0, step: fallbackStep, ready: false };
    }
    const left = Math.max(0, firstX - step / 2);
    const right = Math.max(0, contentWidth - (lastX + step / 2));
    return { left, right, step, ready: true };
  };

  const decorator = () => {
    if (!labels.length) return null;
    const pad = computePad();
    if (!pad.ready) return null;
    const xLeft = pad.left + currentIndex * pad.step;
    return (
      <G key="decor">
        <Rect x={xLeft} y={0} width={pad.step} height={height} rx={8} fill="rgba(37,99,235,0.10)" />
      </G>
    );
  };

  const LabelsRow = () => {
    if (labels.length === 0) return null;
    const pad = computePad();
    return (
      <View
        style={{
          width: contentWidth,
          flexDirection: "row",
          marginTop: 4,
          paddingLeft: pad.left,
          paddingRight: pad.right,
        }}
      >
        {labels.map((lab, i) => {
          const isToday = todayIndex != null && i === todayIndex;
          const isActive = i === currentIndex;
          const color = isToday ? colors.accent : isActive ? colors.primary : colors.subtext;
          const weight: "700" | "400" = isToday || isActive ? "700" : "400";
          return (
            <View key={`lbl-${i}`} style={{ width: pad.step, alignItems: "center" }}>
              <Text style={{ fontSize: 10, color, fontWeight: weight }}>{lab}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const Dot = ({ c }: { c: string }) => (
    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c, marginRight: 6 }} />
  );

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius.l,
        padding: spacing.m,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadow.card,
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 2 }}>
        <View>
          <LineChart
            data={{ labels, datasets }}
            width={contentWidth}
            height={height}
            withDots
            withInnerLines
            withOuterLines
            withShadow={false}
            bezier={false}
            fromZero={false}
            verticalLabelRotation={0}
            yAxisSuffix=""
            onDataPointClick={handlePointClick}
            renderDotContent={renderDotContent}
            decorator={decorator}
            withHorizontalLabels={false}
            withVerticalLabels={false}
            chartConfig={{
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 1,
              color: (o = 1) => `rgba(15,23,42,${o})`,
              labelColor: (o = 1) => `rgba(100,116,139,${o})`,
              propsForBackgroundLines: { stroke: colors.border },
              propsForLabels: { fontSize: 10 },
              propsForDots: { r: "2", strokeWidth: "0" },
            }}
            segments={4}
            style={{ borderRadius: radius.m }}
          />
          <LabelsRow />
        </View>
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 16, marginTop: spacing.s, alignItems: "center" }}>
        {showWeight && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Dot c={"#6D28D9"} />
            <Text style={{ color: colors.subtext }}>体重</Text>
          </View>
        )}
        {showBodyFat && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Dot c={"#F59E0B"} />
            <Text style={{ color: colors.subtext }}>体脂肪</Text>
          </View>
        )}
        {rollingAvgSeries && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Dot c={"#3B82F6"} />
            <Text style={{ color: colors.subtext }}>7日移動平均</Text>
          </View>
        )}
        {goalLineSeries && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Dot c={"#94A3B8"} />
            <Text style={{ color: colors.subtext }}>目標</Text>
          </View>
        )}
      </View>

      {labels.length > 0 && (
        <View
          style={{
            marginTop: spacing.m,
            padding: spacing.m,
            borderRadius: radius.m,
            backgroundColor: "#F8FAFC",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.subtext, marginBottom: 6 }}>{labelNow} のデータ</Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.subtext, fontSize: 12 }}>体重</Text>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                {vW != null ? `${Number(vW).toFixed(1)} kg` : "—"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.subtext, fontSize: 12 }}>体脂肪</Text>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                {vF != null ? `${Number(vF).toFixed(1)} %` : "—"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.subtext, fontSize: 12 }}>目標</Text>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                {vG != null ? `${Number(vG).toFixed(1)} kg` : "—"}
              </Text>
            </View>
          </View>

          {hasNote && (
            <View
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 8,
                backgroundColor: "#FFF",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.subtext, fontSize: 12, marginBottom: 4 }}>メモ</Text>
              <Text style={{ color: colors.text }}>{noteNow}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
