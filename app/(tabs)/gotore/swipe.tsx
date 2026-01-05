import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, ScrollView,
} from "react-native";
import { LikeStatusBar } from "../../../ui/components/LikeStatusBar";
import { OutOfLikesModal } from "../../../ui/components/OutOfLikesModal";
import { useLikeStatus } from "../../../hooks/useLikeStatus";

function CardShell({ children, height }: { children: React.ReactNode; height: number }) {
  return (
    <View style={[styles.cardShell, { height }]}>
      <View style={styles.cardInner}>{children}</View>
      <View pointerEvents="none" style={styles.cardRing} />
    </View>
  );
}

export default function SwipeScreen() {
  const { status, loading, timeLeft, outOfLikes, setOutOfLikes, consumeOne, reload } = useLikeStatus();

  const [isConsuming, setIsConsuming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const free  = status?.freeRemaining  ?? 0;
  const paid  = status?.paidRemaining  ?? 0;
  const total = status?.totalRemaining ?? 0;
  const tl    = timeLeft ?? 0;

  useEffect(() => {
    if (tl <= 1000) {
      const t = setTimeout(() => reload().catch(() => {}), 1200);
      return () => clearTimeout(t);
    }
  }, [tl, reload]);

  const onSwipeRight = useCallback(async () => {
    if (isConsuming) return;
    setIsConsuming(true);
    try { await consumeOne(); } finally { setIsConsuming(false); }
  }, [consumeOne, isConsuming]);

  const onSwipeLeft = useCallback(() => {}, []);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await reload(); } finally { setRefreshing(false); }
  }, [reload]);

  const disableRight = useMemo(() => total <= 0 || isConsuming, [total, isConsuming]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <LikeStatusBar free={free} paid={paid} total={total} timeLeftMs={tl} />

        <Text style={styles.title}>SwipeScreen（合トレスワイプ）</Text>

        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <CardShell height={380}>
            <View style={styles.cardContentCenter}>
              <Text style={styles.cardText}>ここにプロフィールカード（ダミー）</Text>
            </View>
          </CardShell>
        </View>

        {loading && (
          <View style={styles.center}><ActivityIndicator color="#fff" /></View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnSkip]} onPress={onSwipeLeft}>
            <Text style={styles.btnTextSkip}>×</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnLike, disableRight && styles.btnLikeDisabled]}
            onPress={onSwipeRight}
            disabled={disableRight}
          >
            <Text style={styles.btnTextLike}>♡</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <OutOfLikesModal
        visible={outOfLikes}
        onClose={() => setOutOfLikes(false)}
        onPurchased={async () => { await reload(); setOutOfLikes(false); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1120" },
  scrollContent: { paddingBottom: 24 },
  title: {
    color: "#fff", fontSize: 16, fontWeight: "700",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  center: { alignItems: "center", justifyContent: "center", marginTop: 12 },

  cardShell: {
    borderRadius: 20,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  cardInner: {
    flex: 1,
    backgroundColor: "#111827",
  },
  cardRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardContentCenter: {
    flex: 1, alignItems: "center", justifyContent: "center",
  },
  cardText: { color: "#fff" },

  actions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 18,
  },
  btn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
  },
  btnSkip: { backgroundColor: "#fff" },
  btnLike: { backgroundColor: "#22c55e" },
  btnLikeDisabled: { backgroundColor: "rgba(34,197,94,0.5)" },
  btnTextSkip: { color: "#0b0f1a", fontSize: 28, fontWeight: "800" },
  btnTextLike: { color: "#0b0f1a", fontSize: 24, fontWeight: "800" },
});
