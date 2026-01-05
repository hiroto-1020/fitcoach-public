import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { adminSetKycResult } from "../../../lib/gotore/api";

const KYC_BUCKET = "kyc-uploads";

type Row = {
  id: string;
  user_id: string;
  provider_status: "approved" | "rejected" | "failed" | "pending" | null;
  created_at: string;
  document_path: string | null;
  document_url: string | null;
  profile_nickname?: string | null;
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  approved: { label: "承認", color: "#16a34a" },
  rejected: { label: "棄却", color: "#ef4444" },
  failed:   { label: "失敗", color: "#111827" },
  pending:  { label: "審査中", color: "#f59e0b" },
};

async function getNickname(userId: string): Promise<string | null> {
  const tables = ["profiles", "gotore_profiles", "user_profiles", "profiles_public"];
  for (const t of tables) {
    try {
      const { data } = await supabase.from(t).select("user_id,nickname").eq("user_id", userId).maybeSingle();
      if (data?.nickname != null) return data.nickname as string;
    } catch {}
  }
  for (const t of tables) {
    try {
      const { data } = await supabase.from(t).select("id,nickname").eq("id", userId).maybeSingle();
      if (data?.nickname != null) return data.nickname as string;
    } catch {}
  }
  return null;
}

function urlToPath(url?: string | null): string | null {
  if (!url) return null;
  const m =
    url.match(/\/object\/public\/kyc-uploads\/(.+?)(?:\?|$)/) ||
    url.match(/\/object\/sign\/kyc-uploads\/(.+?)(?:\?|$)/) ||
    url.match(/\/storage\/v1\/object\/public\/kyc-uploads\/(.+?)(?:\?|$)/);
  return m ? m[1] : null;
}

async function resolveImageURL(r: Row): Promise<string | null> {
  // そのまま外部URLならそれを採用
  if (r.document_url && /^https?:\/\//i.test(r.document_url) && !/\/object\/public\//.test(r.document_url)) {
    return r.document_url;
  }
  let path = r.document_path || urlToPath(r.document_url);
  if (path) {
    try {
      const { data } = await supabase.storage.from(KYC_BUCKET).createSignedUrl(path, 3600);
      if (data?.signedUrl) return data.signedUrl;
    } catch {}
    try {
      return supabase.storage.from(KYC_BUCKET).getPublicUrl(path).data.publicUrl;
    } catch { return null; }
  }
  // パスが無ければ user_id フォルダの最新を推測
  try {
    const { data: files } = await supabase.storage.from(KYC_BUCKET).list(r.user_id, { sortBy: { column: "created_at", order: "desc" } });
    if (files && files.length) {
      const guess = `${r.user_id}/${files[0].name}`;
      const { data } = await supabase.storage.from(KYC_BUCKET).createSignedUrl(guess, 3600);
      return data?.signedUrl ?? supabase.storage.from(KYC_BUCKET).getPublicUrl(guess).data.publicUrl;
    }
  } catch {}
  return null;
}

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  } catch { return iso; }
}

export default function KycAdminDetail() {
  // id は string | string[] の可能性があるので安全に取り出す
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const kycId = Array.isArray(params.id) ? params.id?.[0] : params.id || "";

  const [row, setRow] = useState<Row | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!kycId) {
      Alert.alert("エラー", "KYC ID が不明です。");
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("kyc_verifications")
        .select("id,user_id,provider_status,created_at,document_path,document_url")
        .eq("id", kycId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        Alert.alert("エラー", "レコードが見つかりません");
        setRow(null);
        return;
      }
      const r = data as Row;
      r.profile_nickname = await getNickname(r.user_id);
      setRow(r);
      setImgUrl(await resolveImageURL(r));
    } catch (e: any) {
      Alert.alert("読み込みエラー", String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [kycId]);

  useEffect(() => { load(); }, [load]);

  //  承認/棄却は管理用RPCのみを叩く（テーブルを直接 update しない）
  // 先頭付近に supabase の import がある前提
// import { supabase } from "../../../lib/supabase";

// onSet 内だけ入れ替え（他は今のままでOK）
const onSet = useCallback(
  async (status: "approved" | "rejected") => {
    if (!row) return;
    setBusy(true);
    try {
      await adminSetKycResult(row.id, status);  // ← これだけ
      await load();                              // ← 再取得してUI反映
      Alert.alert(status === "approved" ? "承認しました" : "棄却しました");
    } catch (e: any) {
      Alert.alert("更新エラー", String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  },
  [row, load]
);



  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top","bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!row) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top","bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: "#e5e7eb", fontWeight: "800" }}>データが見つかりません</Text>
          <TouchableOpacity
            onPress={load}
            style={{ marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#334155", borderRadius: 10 }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>再読み込み</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badge = STATUS_BADGE[(row.provider_status ?? "pending") as keyof typeof STATUS_BADGE];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top","bottom"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 16, paddingBottom: 56 }}>
        <View style={styles.card}>
          <Text style={styles.h1}>本人確認 詳細</Text>

          <Text style={styles.label}>KYC ID</Text>
          <Text style={styles.val}>{row.id}</Text>

          <Text style={styles.label}>ユーザー名 / ユーザーID</Text>
          <Text style={styles.val}>
            {row.profile_nickname ? `${row.profile_nickname}  /  ` : ""}
            {row.user_id}
          </Text>

          <Text style={styles.label}>現在のステータス</Text>
          <View style={[styles.badge, { backgroundColor: badge.color }]}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>{badge.label}</Text>
          </View>

          <Text style={styles.label}>提出画像</Text>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.img} resizeMode="contain" />
          ) : (
            <Text style={[styles.val, { color: "#94a3b8" }]}>（画像なし）</Text>
          )}

          <Text style={styles.meta}>作成日時: {fmtTime(row.created_at)}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => onSet("rejected")}
            disabled={busy}
            style={[styles.btn, { backgroundColor: "#ef4444" }, busy && { opacity: 0.6 }]}
          >
            <Text style={styles.btnText}>棄却</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSet("approved")}
            disabled={busy}
            style={[styles.btn, { backgroundColor: "#16a34a" }, busy && { opacity: 0.6 }]}
          >
            <Text style={styles.btnText}>承認</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            onPress={load}
            disabled={busy}
            style={[styles.btn, { backgroundColor: "#334155" }, busy && { opacity: 0.6 }]}
          >
            <Text style={styles.btnText}>再読み込み</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  h1: { color: "#e5e7eb", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  label: { color: "#94a3b8", marginTop: 12, fontWeight: "800" },
  val: { color: "#e5e7eb", marginTop: 4, fontWeight: "800" },
  img: { width: "100%", height: 320, borderRadius: 10, marginTop: 10, backgroundColor: "#0b1020" },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "900" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  meta: { color: "#94a3b8", marginTop: 12, fontSize: 12, fontWeight: "700" },
});
