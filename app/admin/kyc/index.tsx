import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";

const KYC_BUCKET = "kyc-uploads";

type ProviderStatus = "approved" | "rejected" | "failed" | "pending" | "processing" | null;

type Row = {
  id: string;
  user_id: string;
  provider_status: ProviderStatus;
  created_at: string;
  // ※ DBに無い環境が多いので列は持たない前提。画像はStorageから推測取得。
  profile_nickname?: string | null;
  _img?: string | null;
};

const STATUS_BADGE: Record<
  "approved" | "rejected" | "failed" | "pending",
  { label: string; color: string }
> = {
  approved: { label: "承認",   color: "#16a34a" },
  rejected: { label: "棄却",   color: "#ef4444" },
  failed:   { label: "失敗",   color: "#111827" },
  pending:  { label: "審査中", color: "#f59e0b" },
};

/** processing -> pending に寄せる */
function normalizeStatus(s: ProviderStatus): "approved" | "rejected" | "failed" | "pending" {
  if (s === "approved" || s === "rejected" || s === "failed") return s;
  return "pending";
}

async function fetchNicknames(userIds: string[]): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  const remainOf = () => userIds.filter((id) => !(id in result));
  const tables = ["profiles", "gotore_profiles", "user_profiles", "profiles_public"];

  // user_id カラム
  for (const t of tables) {
    const remain = remainOf();
    if (!remain.length) break;
    try {
      const { data, error } = await supabase.from(t).select("user_id,nickname").in("user_id", remain);
      if (!error && Array.isArray(data)) {
        for (const r of data as any[]) result[r.user_id] = r.nickname ?? null;
      }
    } catch {}
  }
  // id カラム（万一 user_id で持ってない古テーブル用）
  for (const t of tables) {
    const remain = remainOf();
    if (!remain.length) break;
    try {
      const { data, error } = await supabase.from(t).select("id,nickname").in("id", remain);
      if (!error && Array.isArray(data)) {
        for (const r of data as any[]) result[r.id] = r.nickname ?? null;
      }
    } catch {}
  }
  for (const id of userIds) if (!(id in result)) result[id] = null;
  return result;
}

/** 画像URLを Storage から推測して署名URLを作る（ユーザーフォルダの最新1枚） */
async function resolveImageURL(r: Row): Promise<string | null> {
  try {
    const { data: files, error } = await supabase.storage.from(KYC_BUCKET).list(r.user_id, {
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error || !files?.length) return null;

    const guess = `${r.user_id}/${files[0].name}`;
    // 署名URL（公開バケットでも署名URLを優先）
    const { data: signed } = await supabase.storage.from(KYC_BUCKET).createSignedUrl(guess, 3600);
    if (signed?.signedUrl) return signed.signedUrl;

    // 念のため public URL も試す
    const { data: pub } = supabase.storage.from(KYC_BUCKET).getPublicUrl(guess);
    return pub?.publicUrl ?? null;
  } catch {
    return null;
  }
}

export default function KycAdminList() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // ※ document_path / document_url は選択しない（存在しない環境が多いため）
      const { data, error } = await supabase
        .from("kyc_verifications")
        .select("id,user_id,provider_status,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const base = (data ?? []) as Row[];
      const nickMap = await fetchNicknames(Array.from(new Set(base.map((r) => r.user_id))));
      const imgUrls = await Promise.all(base.map(resolveImageURL));

      const filled = base.map((r, i) => ({
        ...r,
        provider_status: r.provider_status ?? "pending",
        profile_nickname: nickMap[r.user_id] ?? null,
        _img: imgUrls[i] ?? null,
      }));
      setRows(filled);
    } catch (e: any) {
      Alert.alert("読み込みエラー", String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const Item = ({ item }: { item: Row }) => {
    const key = normalizeStatus(item.provider_status);
    const badge = STATUS_BADGE[key];
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => router.push(`/admin/kyc/${item.id}` as any)}
      >
        <View style={styles.thumb}>
          {item._img ? (
            <Image source={{ uri: item._img }} style={{ width: "100%", height: "100%" }} />
          ) : (
            <Text style={{ color: "#94a3b8", fontWeight: "800" }}>noimage</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.main}>
            {item.profile_nickname ? item.profile_nickname : "(ユーザー名なし)"}
          </Text>
          <Text style={styles.sub}>User ID: {item.user_id}</Text>
          <Text style={styles.sub}>KYC ID: {item.id}</Text>

          <View style={[styles.badge, { backgroundColor: badge.color }]}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>{badge.label}</Text>
          </View>

          <Text style={styles.date}>{fmt(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top","bottom"]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <Text style={{ color: "#e5e7eb", fontSize: 20, fontWeight: "900" }}>本人確認一覧</Text>
        <TouchableOpacity onPress={load} style={styles.reload}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>{loading ? "更新中…" : "更新"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        renderItem={Item}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 }}
      />
    </SafeAreaView>
  );
}

function fmt(iso: string) {
  try {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  } catch { return iso; }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
  },
  thumb: {
    width: 64, height: 64, borderRadius: 10, overflow: "hidden",
    backgroundColor: "#0b1020", alignItems: "center", justifyContent: "center",
  },
  main: { color: "#e5e7eb", fontWeight: "900" },
  sub: { color: "#cbd5e1", marginTop: 2, fontWeight: "700" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  date: { color: "#94a3b8", marginTop: 4, fontSize: 12, fontWeight: "700" },
  reload: { position: "absolute", right: 16, top: 8, backgroundColor: "#334155", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
});
