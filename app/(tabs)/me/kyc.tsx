// app/(tabs)/me/kyc.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, Alert, StyleSheet,
  Image, ScrollView, ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase, SUPABASE_URL } from "../../../lib/supabase";

// ===== 動的 import（Expo Go でも落ちないように） =====
let ImagePicker: any = null; try { ImagePicker = require("expo-image-picker"); } catch {}
let FileSystem: any = null; try { FileSystem = require("expo-file-system/legacy"); } catch {}
let atobPolyfill: any = null; try { atobPolyfill = require("base-64").decode; } catch {}

const KYC_BUCKET = "kyc-uploads";

const functionsOrigin = (() => {
  const host = new URL(SUPABASE_URL).hostname.split(".")[0];
  return `https://${host}.functions.supabase.co`;
})();

type DocType = "license" | "insurance" | "juminhyo";

// Base64   Uint8Array（RNでatobが無い環境に配慮）
function b64ToBytes(base64: string) {
  const atob = (globalThis as any).atob || atobPolyfill;
  if (!atob) throw new Error("atob polyfill missing (base-64)");
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export default function KycCaptureScreen() {
  const { sid, provider = "persona" } = useLocalSearchParams<{ sid?: string; provider?: string }>();
  const session_id = useMemo(() => String(sid ?? ""), [sid]);
  const router = useRouter();

  const [docType, setDocType] = useState<DocType>("license");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickFromLibrary = useCallback(async () => {
    if (!ImagePicker) return Alert.alert("未導入", "expo-image-picker を導入してください。");
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
      if (perm && perm.status !== "granted") return;

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
        copyToCacheDirectory: true,
      });
      if (res?.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (uri) setImageUri(uri);
    } catch (e: any) {
      Alert.alert("読み込み失敗", String(e?.message ?? e));
    }
  }, []);

  const takePhoto = useCallback(async () => {
    if (!ImagePicker) return Alert.alert("未導入", "expo-image-picker を導入してください。");
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync?.();
      if (perm && perm.status !== "granted") return;

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });
      if (res?.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (uri) setImageUri(uri);
    } catch (e: any) {
      Alert.alert("撮影失敗", String(e?.message ?? e));
    }
  }, []);

  const onSubmit = useCallback(async () => {
    if (!session_id) return Alert.alert("エラー", "session_id がありません。アカウント画面からやり直してください。");
    if (!imageUri) return Alert.alert("画像なし", "「書類を撮影」または「ライブラリから選択」で画像を選んでください。");
    if (!FileSystem) return Alert.alert("未導入", "expo-file-system を導入してください。");

    setBusy(true);
    try {
      // a) 画像   Base64   Uint8Array（RN/Expo Go対応）
      const base64: string = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
      const bytes = b64ToBytes(base64);

      // b) ユーザーIDと保存パス
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) throw new Error("not authenticated");
      const objectPath = `${uid}/${session_id}.jpg`;

      // c) Storageへアップ（RLS: 事前に storage ポリシーが必要）
      const { error: upErr } = await supabase
        .storage
        .from(KYC_BUCKET)
        .upload(objectPath, bytes, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;

      // d) 公開URL（保険としてURLも保存。ただし基本は document_path を参照）
      const { data: pub } = supabase.storage.from(KYC_BUCKET).getPublicUrl(objectPath);
      const publicUrl = pub?.publicUrl ?? null;

      // e) kyc_verifications を UPDATE（自分の行のみ / RLS対策で user_id も条件に入れる）
      const updatePayload: Record<string, any> = { document_path: objectPath };
      if (publicUrl) updatePayload.document_url = publicUrl;
      // 列があれば種別も保存（無ければ無視）
      // updatePayload.document_type = docType;

      const { error: rowErr } = await supabase
        .from("kyc_verifications")
        .update(updatePayload)
        .eq("provider_session_id", session_id)
        .eq("user_id", uid); // ★ RLS: 申請者のみ更新可
      if (rowErr) throw rowErr;

      // f) Webhookへ pending 通知（失敗しても致命的ではない）
      try {
        await fetch(`${functionsOrigin}/kyc-webhook`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            provider,
            session_id,
            person_id: "p_demo_" + session_id.slice(-6),
            status: "pending",
          }),
        });
      } catch {}

      Alert.alert("送信しました", "審査に回しました。管理者の確認をお待ちください。");
      router.back();
    } catch (e: any) {
      Alert.alert("送信に失敗しました", String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }, [session_id, imageUri, provider, docType, router]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0b1220" }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={styles.title}>本人確認（撮影）</Text>

      {/* 書類種別 */}
      <View style={styles.card}>
        <Text style={styles.label}>提出書類の選択</Text>
        <View style={styles.row}>
          <Chip active={docType === "license"}   onPress={() => setDocType("license")}   label="運転免許証" />
          <Chip active={docType === "insurance"} onPress={() => setDocType("insurance")} label="健康保険証" />
          <Chip active={docType === "juminhyo"}  onPress={() => setDocType("juminhyo")}  label="住民票" />
        </View>
      </View>

      {/* 撮影／選択 */}
      <View style={styles.card}>
        <Text style={styles.label}>書類を撮影</Text>
        <TouchableOpacity style={styles.shot} onPress={takePhoto} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.shotImg} resizeMode="cover" />
          ) : (
            <Text style={{ color: "#94a3b8", fontWeight: "800" }}>タップして撮影</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <TouchableOpacity onPress={takePhoto} style={[styles.btn, { backgroundColor: "#111827", flex: 1 }]}>
            <Text style={styles.btnText}>カメラで撮る</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFromLibrary} style={[styles.btn, { backgroundColor: "#0ea5e9", flex: 1 }]}>
            <Text style={styles.btnText}>ライブラリから選択</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 送信 */}
      <TouchableOpacity onPress={onSubmit} disabled={busy} style={[styles.primary, busy && { opacity: 0.6 }]}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>審査を送信する</Text>}
      </TouchableOpacity>

      <Text style={styles.session}>セッション: <Text style={{ fontWeight: "800", color: "#e5e7eb" }}>{session_id}</Text> / Provider: {provider}</Text>
    </ScrollView>
  );
}

function Chip({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? "#22c55e" : "rgba(255,255,255,0.16)",
        backgroundColor: active ? "rgba(34,197,94,0.2)" : "transparent",
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: active ? "#86efac" : "#cbd5e1", fontWeight: "800" }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: { color: "#e5e7eb", fontSize: 22, fontWeight: "900", marginBottom: 12 },
  card: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  label: { color: "#cbd5e1", fontWeight: "800", marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap" },
  shot: {
    height: 220,
    borderRadius: 12,
    backgroundColor: "#0b1020",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shotImg: { width: "100%", height: "100%" },
  btn: { borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  btnText: { color: "#fff", fontWeight: "900" },
  primary: { backgroundColor: "#22c55e", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  session: { color: "#94a3b8", marginTop: 8 },
});
