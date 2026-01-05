import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppPrefs } from "../../../lib/app-prefs";
import { supabase, SUPABASE_URL } from "../../../lib/supabase";

const functionsOrigin = (() => {
  const host = new URL(SUPABASE_URL).hostname.split(".")[0];
  return `https://${host}.functions.supabase.co`;
})();

export default function KycMockScreen() {
  const { sid, provider = "persona" } = useLocalSearchParams<{ sid?: string; provider?: string }>();
  const session_id = useMemo(() => String(sid ?? ""), [sid]);
  const router = useRouter();
  const { colors: C, haptic } = useAppPrefs();
  const [busy, setBusy] = useState<false | "approved" | "rejected" | "failed" | "pending">(false);

  const send = async (status: "approved" | "rejected" | "failed" | "pending") => {
    if (!session_id) {
      Alert.alert("エラー", "session_id がありません。もう一度お試しください。");
      return;
    }
    setBusy(status);
    try {
      const res = await fetch(`${functionsOrigin}/kyc-webhook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider,
          session_id,
          person_id: "p_demo_" + session_id.slice(-6),
          status,
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      haptic("light");
      Alert.alert("送信しました", `ステータス: ${status}`);
      router.back();
    } catch (e: any) {
      Alert.alert("送信に失敗しました", String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: C.bg }]}>
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={[styles.title, { color: C.text }]}>本人確認（モック）</Text>
        <Text style={{ color: C.sub, marginTop: 6 }}>
          Session: <Text style={{ color: C.text, fontWeight: "800" }}>{session_id || "(なし)"}</Text> / Provider: {provider}
        </Text>
        <Text style={{ color: C.sub, marginTop: 6 }}>
          下のボタンのいずれかを押すと、サーバの Webhook エンドポイントへ結果を送信します。
        </Text>

        <View style={styles.row}>
          <Btn label="承認 (approved)" color="#16a34a" onPress={() => send("approved")} busy={busy === "approved"} />
          <Btn label="否認 (rejected)" color="#ef4444" onPress={() => send("rejected")} busy={busy === "rejected"} />
        </View>
        <View style={styles.row}>
          <Btn label="失敗 (failed)" color="#111827" onPress={() => send("failed")} busy={busy === "failed"} />
          <Btn label="保留 (pending)" color="#f59e0b" onPress={() => send("pending")} busy={busy === "pending"} />
        </View>

        <Text style={{ color: C.sub, marginTop: 10, fontSize: 12 }}>
          送信後は前の画面に戻って、数秒後にステータスが更新されます。
        </Text>
      </View>
    </View>
  );
}

function Btn({
  label,
  color,
  onPress,
  busy,
}: {
  label: string;
  color: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy}
      style={[
        styles.btn,
        { backgroundColor: color, opacity: busy ? 0.6 : 1 },
        Platform.OS === "ios" ? { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } } : {},
      ]}
    >
      <Text style={styles.btnText}>{busy ? "送信中…" : label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, justifyContent: "center" },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 16 },
  title: { fontSize: 18, fontWeight: "800" },
  row: { flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800" },
});
