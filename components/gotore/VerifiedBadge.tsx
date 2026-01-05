// components/gotore/VerifiedBadge.tsx
import React from "react";
import { View, Text } from "react-native";

type Status = "unverified" | "pending" | "verified" | "rejected" | "failed";
export default function VerifiedBadge({ status, size = "md" }: { status: Status; size?: "sm" | "md" }) {
  const color =
    status === "verified" ? "#16a34a" :
    status === "pending"  ? "#f59e0b" :
    status === "rejected" || status === "failed" ? "#ef4444" : "#64748b";

  const label =
    status === "verified" ? "本人確認済み" :
    status === "pending"  ? "審査中" :
    status === "rejected" || status === "failed" ? "否認" : "未確認";

  const pv = size === "sm" ? 6 : 8;
  const ph = size === "sm" ? 10 : 12;

  return (
    <View style={{
      paddingVertical: pv, paddingHorizontal: ph, borderRadius: 999,
      backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}55`
    }}>
      <Text style={{ color, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}
