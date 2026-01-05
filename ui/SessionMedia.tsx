// ui/SessionMedia.tsx — 保存先を動的に検出＆フォールバック
import React, { useEffect, useState } from "react";
import { View, Text, Alert, Image, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// optional require（無くても画面は落ちない）
let ImagePicker: any = null;   try { ImagePicker = require("expo-image-picker"); } catch {}
let MediaLibrary: any = null;  try { MediaLibrary = require("expo-media-library"); } catch {}
let FileSystem: any = null;    try { FileSystem = require("expo-file-system/legacy"); } catch {}
let VideoThumbs: any = null;   try { VideoThumbs = require("expo-video-thumbnails"); } catch {}
let AV: any = null;            try { AV = require("expo-av"); } catch {}

import {
  addSessionMedia,
  deleteSessionMedia,
  listSessionMedia,
  SessionMedia as SessionMediaRow,
} from "../lib/training/db";

/* ---------------- 保存先ユーティリティ ---------------- */

async function probeWrite(base: string) {
  const p = base + `.__wtest_${Date.now()}`;
  try {
    await FileSystem.writeAsStringAsync(p, "ok");
    await FileSystem.deleteAsync(p, { idempotent: true });
    return true;
  } catch { return false; }
}

async function getWritableBase(): Promise<string> {
  const candidates = [FileSystem?.documentDirectory, FileSystem?.cacheDirectory].filter(Boolean) as string[];
  for (const base of candidates) { if (await probeWrite(base)) return base; }
  throw new Error("保存ディレクトリが取得できません");
}

/** training_media/ を作れたらそこへ。失敗したら base 直下に保存する */
async function ensureDirOrFallback(): Promise<{ dir: string; base: string }> {
  const base = await getWritableBase();
  const dir = base + "training_media/";
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    return { dir, base };
  } catch {
    // サブフォルダ作成に失敗   ベースに直接保存（書き込み可なのは確認済）
    return { dir: base, base };
  }
}

function guessExt(uri: string, kind: "image" | "video") {
  const q = uri.split("?")[0];
  const dot = q.lastIndexOf(".");
  return dot >= 0 ? q.slice(dot + 1).toLowerCase() : (kind === "video" ? "mp4" : "jpg");
}

/** iOS の ph:// を file:// に解決（可能なら MediaLibrary 経由） */
async function resolveToFileUri(asset: any): Promise<{ uri: string; kind: "image" | "video" }> {
  const kind = (asset?.type === "video" ? "video" : "image") as "image" | "video";
  if (asset?.uri?.startsWith?.("file://")) return { uri: asset.uri, kind };
  if (asset?.assetId && MediaLibrary?.getAssetInfoAsync) {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset.assetId, { shouldDownloadFromNetwork: true });
      if (info?.localUri?.startsWith?.("file://")) return { uri: info.localUri, kind };
    } catch {}
  }
  // 最後の手段：キャッシュへコピー
  if (FileSystem?.cacheDirectory && asset?.uri) {
    const ext = asset.fileExtension || guessExt(asset.uri, kind);
    const tmp = FileSystem.cacheDirectory + `picked-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: asset.uri, to: tmp });
    return { uri: tmp, kind };
  }
  throw new Error("ローカルファイルに変換できませんでした");
}

/* ---------------- 画面本体 ---------------- */

export default function SessionMedia({ sessionId }: { sessionId: number }) {
  const [items, setItems] = useState<SessionMediaRow[]>([]);
  const [viewer, setViewer] = useState<SessionMediaRow | null>(null);

  const refresh = async () => setItems(await listSessionMedia(sessionId));
  useEffect(() => { refresh(); }, [sessionId]);

  const pickAndAdd = async () => {
    try {
      const perm = await ImagePicker?.requestMediaLibraryPermissionsAsync?.();
      if (!perm?.granted) {
        Alert.alert("写真へのアクセスが必要です", "設定アプリから写真のアクセスを許可してください。");
        return;
      }
      try {
        const p = await MediaLibrary?.getPermissionsAsync?.();
        if (p?.granted === false) await MediaLibrary?.requestPermissionsAsync?.();
      } catch {}

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 0.9,
        copyToCacheDirectory: true,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
      });
      if (res.canceled || !res.assets?.length) return;

      const picked = res.assets[0];
      const { uri: fileUri, kind } = await resolveToFileUri(picked);

      const { dir } = await ensureDirOrFallback();
      const ext = guessExt(fileUri, kind);
      const dest = dir + `${sessionId}_${Date.now()}.${ext}`;

      await FileSystem.copyAsync({ from: fileUri, to: dest });

      let thumb: string | null = null;
      if (kind === "video" && VideoThumbs?.getThumbnailAsync) {
        try {
          const t = await VideoThumbs.getThumbnailAsync(dest, { time: 800 });
          const tDest = dir + `${sessionId}_${Date.now()}_thumb.jpg`;
          await FileSystem.copyAsync({ from: t.uri, to: tDest });
          thumb = tDest;
        } catch {}
      }

      await addSessionMedia(sessionId, dest, kind, {
        thumb_uri: thumb,
        width: picked?.width ?? null,
        height: picked?.height ?? null,
        duration_sec: (picked as any)?.duration ?? null,
      });

      refresh();
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("保存ディレクトリ")) {
        Alert.alert("メディアの追加に失敗しました", "保存ディレクトリを作成/取得できませんでした。アプリを再起動して再試行してください。");
      } else if (msg.includes("iCloud") || msg.includes("PHPhotosErrorDomain")) {
        Alert.alert("読み込みに失敗しました", "iCloud上のデータを取得できませんでした。写真アプリで一度ダウンロードしてから再試行してください。");
      } else {
        Alert.alert("メディアの追加に失敗しました", msg);
      }
    }
  };

  const onDelete = (item: SessionMediaRow) => {
    Alert.alert("削除しますか？", "このメディアを削除します。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除", style: "destructive",
        onPress: async () => {
          try {
            await deleteSessionMedia(item.id);
            await FileSystem?.deleteAsync?.(item.uri, { idempotent: true }).catch(() => {});
            if (item.thumb_uri) await FileSystem?.deleteAsync?.(item.thumb_uri, { idempotent: true }).catch(() => {});
          } finally {
            setViewer(null);
            refresh();
          }
        },
      },
    ]);
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>フォーム動画 / 写真</Text>
        <TouchableOpacity onPress={pickAndAdd} style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="add-circle-outline" color="#1976d2" size={20} />
          <Text style={{ color: "#1976d2", marginLeft: 6, fontWeight: "600" }}>追加</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 6 }}>
        <TouchableOpacity
          onPress={pickAndAdd}
          style={{
            width: 86, height: 86, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb",
            alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
          }}>
          <Ionicons name="cloud-upload-outline" size={26} color="#6b7280" />
          <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>追加</Text>
        </TouchableOpacity>

        {items.map((m) => (
          <TouchableOpacity key={m.id} onPress={() => setViewer(m)}
            style={{ width: 86, height: 86, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#000" }}>
            {m.type === "image" ? (
              <Image source={{ uri: m.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <>
                <Image source={{ uri: m.thumb_uri || m.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                <View style={{ position: "absolute", right: 6, bottom: 6, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Ionicons name="play" size={14} color="#fff" />
                </View>
              </>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center" }}>
          <TouchableOpacity style={{ position: "absolute", top: 44, right: 16 }} onPress={() => setViewer(null)}>
            <Ionicons name="close-circle" size={32} color="#fff" />
          </TouchableOpacity>

          {viewer?.type === "image" ? (
            <Image source={{ uri: viewer.uri }} style={{ width: "100%", height: 360 }} resizeMode="contain" />
          ) : viewer ? (
            <AV.Video source={{ uri: viewer.uri }} style={{ width: "100%", height: 360 }}
              resizeMode={AV.ResizeMode.CONTAIN} useNativeControls shouldPlay />
          ) : null}

          {viewer && (
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 14 }}>
              <TouchableOpacity onPress={() => onDelete(viewer)}
                style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#ef4444", borderRadius: 999 }}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>削除</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
