import React from "react";
import { View, Text, StyleSheet } from "react-native";

function formatTime(ms: number) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
}

type Props = {
  free: number;
  paid: number;
  total: number;
  timeLeftMs: number;
};

export const LikeStatusBar: React.FC<Props> = ({
  free,
  paid,
  total,
  timeLeftMs,
}) => {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        残りいいね：{total}（無料{free} / 購入{paid}）
      </Text>
      <Text style={styles.sub}>回復まで {formatTime(timeLeftMs)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0f172a",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  text: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  sub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 4,
  },
});
