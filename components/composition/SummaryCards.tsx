// components/composition/SummaryCards.tsx
import React from "react";
import { View, Text } from "react-native";
import { radius, spacing, shadow } from "../../ui/theme.body";
import { useAppPrefs } from "../../lib/app-prefs";

type Summary = {
  avgW: number | null;
  avgF: number | null;
  minW: number | null;
  maxW: number | null;
  minF: number | null;
  maxF: number | null;
};

export function SummaryCards({ summary }: { summary: Summary }) {
  const { colors: C } = useAppPrefs();

  const Cell = ({ title, value }: { title: string; value: string }) => (
    <View
      style={{
        flex: 1,
        backgroundColor: C.card,
        borderRadius: radius.l,
        padding: spacing.m,
        borderWidth: 1,
        borderColor: C.border,
        ...shadow.card,
      }}
    >
      <Text style={{ color: C.sub, marginBottom: 4 }}>{title}</Text>
      <Text style={{ color: C.text, fontSize: 20, fontWeight: "800" }}>{value}</Text>
    </View>
  );

  const f = (n: number | null, unit = "") => (n == null ? "—" : `${n.toFixed(1)}${unit}`);

  return (
    <View style={{ marginTop: spacing.s, gap: spacing.s }}>
      <View style={{ flexDirection: "row", gap: spacing.s }}>
        <Cell title="平均体重" value={f(summary.avgW, " kg")} />
        <Cell title="平均体脂肪" value={f(summary.avgF, " %")} />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.s }}>
        <Cell title="最小体重" value={f(summary.minW, " kg")} />
        <Cell title="最大体重" value={f(summary.maxW, " kg")} />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.s }}>
        <Cell title="最小体脂肪" value={f(summary.minF, " %")} />
        <Cell title="最大体脂肪" value={f(summary.maxF, " %")} />
      </View>
    </View>
  );
}
