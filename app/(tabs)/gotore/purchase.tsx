import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { LikeStatusBar } from "../../../ui/components/LikeStatusBar";
import { useLikeStatus } from "../../../hooks/useLikeStatus";
import { canUsePurchases, initRevenueCat, purchaseLikesPack } from "../../../lib/revenuecat";

//   フラグ（lib/featureFlags.ts に定義済み想定）
import { GOTORE_PURCHASE_ENABLED } from "../../../lib/featureFlags";

export default function PurchaseLikesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, timeLeft, reload } = useLikeStatus();

  const [busy, setBusy] = useState<10 | 30 | 50 | 100 | null>(null);
  const enabled = GOTORE_PURCHASE_ENABLED;

  // RevenueCat 初期化は有効時のみ
  useEffect(() => {
    if (enabled) initRevenueCat();
  }, [enabled]);

  const buy = useCallback(
    async (pack: 10 | 30 | 50 | 100) => {
      if (!enabled) {
        // 念のためガード（将来の誤タップ対策）
        Alert.alert("準備中", "いいね購入は現在準備中です。");
        return;
      }
      if (!canUsePurchases()) {
        Alert.alert("対応外", "購入はモバイル端末（Test Store か実機ビルド）で行ってください。");
        return;
      }
      try {
        setBusy(pack);
        await purchaseLikesPack({ pack });
        await reload();
        Alert.alert("購入完了", `＋${pack}いいねを付与しました。`);
        router.back();
      } catch (e: any) {
        Alert.alert("購入エラー", String(e?.message ?? e));
      } finally {
        setBusy(null);
      }
    },
    [enabled, reload, router]
  );

  const free = status?.freeRemaining ?? 0;
  const paid = status?.paidRemaining ?? 0;
  const total = status?.totalRemaining ?? 0;

  // ========== 準備中ビュー ==========
  if (!enabled) {
    return (
      <LinearGradient colors={["#0b1220", "#111827"]} style={{ flex: 1, paddingBottom: insets.bottom + 12 }}>
        <View style={{ paddingTop: insets.top }}>
          {/* 現状の残数バーはそのまま見せてOK（ユーザーの状況把握用） */}
          <LikeStatusBar free={free} paid={paid} total={total} timeLeftMs={timeLeft ?? 0} />
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", textAlign: "center" }}>
            🛒 いいね購入は{"\n"}現在準備中です
          </Text>
          <Text style={{ color: "#cbd5e1", marginTop: 10, textAlign: "center", lineHeight: 20 }}>
            初期リリースでは無料枠のみご利用いただけます。{"\n"}
            利用者が増え次第、購入機能を解放予定です。
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 16,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: "#fff",
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#111", fontWeight: "800" }}>OK</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // ========== 本来の購入UI（既存実装そのまま） ==========
  return (
    <View style={{ flex: 1, backgroundColor: "#0b1220", paddingBottom: insets.bottom + 12 }}>
      <View style={{ paddingTop: insets.top }}>
        <LikeStatusBar free={free} paid={paid} total={total} timeLeftMs={timeLeft ?? 0} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.h1}>いいねを追加購入</Text>

        <View style={styles.row}>
          <PackCard label="+10" sub="ライト" onPress={() => buy(10)} loading={busy === 10} />
          <PackCard label="+30" sub="おすすめ" onPress={() => buy(30)} loading={busy === 30} highlight />
        </View>
        <View style={styles.row}>
          <PackCard label="+50" sub="ヘビー" onPress={() => buy(50)} loading={busy === 50} />
          <PackCard label="+100" sub="まとめ買い" onPress={() => buy(100)} loading={busy === 100} />
        </View>

        <Text style={styles.note}>
          ※ 価格と商品IDは RevenueCat の Offering / Packages に合わせて設定済みであることが前提です。
        </Text>
      </ScrollView>
    </View>
  );
}

function PackCard({
  label, sub, onPress, loading, highlight,
}: {
  label: string;
  sub?: string;
  onPress: () => void;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[
        styles.card,
        highlight && { borderColor: "#22c55e" },
        loading && { opacity: 0.6 },
      ]}
    >
      <Text style={styles.cardLabel}>{label}</Text>
      {!!sub && <Text style={styles.cardSub}>{sub}</Text>}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 8 }} />
      ) : (
        <Text style={styles.cardCta}>購入</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  h1: { color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 12 },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  cardLabel: { color: "#fff", fontSize: 28, fontWeight: "900" },
  cardSub: { color: "rgba(255,255,255,0.7)", marginTop: 2, fontWeight: "700" },
  cardCta: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    color: "#0b0f1a",
    fontWeight: "900",
  },
  note: { color: "#94a3b8", marginTop: 6, fontSize: 12 },
});
