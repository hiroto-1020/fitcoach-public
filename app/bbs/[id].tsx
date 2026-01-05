import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, FlatList,
  TextInput, Alert, KeyboardAvoidingView, Platform, Switch, Modal, Image
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { closeThread, deleteThread, deletePost } from "../../lib/bbs/api";

let theme: any = null; try { theme = require("../../ui/theme"); } catch {}
const C = theme?.colors ?? { bg:"#0a0d0f", card:"#12161a", text:"#e6e8eb", sub:"#9aa4b2", primary:"#6ee7b7", border:"#1f242a" };

import {
  fetchThread, fetchPosts, fetchPostsLatest50, createPost, getLocalDisplayName,
  addFavorite, removeFavorite, isThreadFavorited, reportContent, getSignedUploadUrl, uploadToSignedUrl
} from "../../lib/bbs/api";
import { supabase } from "../../lib/supabase";

// 任意依存（未導入なら null のまま）
let ImagePicker: any = null; try { ImagePicker = require("expo-image-picker"); } catch {}
let FileSystem: any = null;
try { FileSystem = require("expo-file-system/legacy"); } catch {
  try { FileSystem = require("expo-file-system"); } catch {}
}

// RN用 Base64 Uint8Array
function base64ToBytes(b64: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let bufferLength = b64.length * 0.75, len = b64.length, i = 0, p = 0;
  if (b64.endsWith("==")) bufferLength -= 2;
  else if (b64.endsWith("=")) bufferLength -= 1;
  const bytes = new Uint8Array(bufferLength);
  for (; i < len; i += 4) {
    const e1 = chars.indexOf(b64[i]);
    const e2 = chars.indexOf(b64[i + 1]);
    const e3 = chars.indexOf(b64[i + 2]);
    const e4 = chars.indexOf(b64[i + 3]);
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (e3 !== 64 && e3 !== -1) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (e4 !== 64 && e4 !== -1) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

type Post = {
  id: string; thread_id: string; no: number; body: string; is_sage: boolean;
  display_name_snapshot: string; author_pseudonym: string; created_at: string;
  image_url?: string | null; image_w?: number | null; image_h?: number | null;
  is_deleted?: boolean | null;
  author_user_id?: string | null;
};

export default function BbsThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [thread, setThread] = useState<any | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [isSage, setIsSage] = useState(false);
  const [nextFromNo, setNextFromNo] = useState<number | null>(null);
  const [fav, setFav] = useState<boolean>(false);
  const ADMIN_EMAIL = "horita102011@gmail.com";
  const [myId, setMyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const canManageThread = useMemo(
    () => isAdmin || (!!myId && !!thread?.creator_user_id && thread.creator_user_id === myId),
    [isAdmin, myId, thread?.creator_user_id]
  );

  // 画像添付
  const [picked, setPicked] = useState<{ uri: string; w: number; h: number; mime: "image/jpeg"|"image/png" } | null>(null);

  // 429 クールダウン
  const [cooldownMs, setCooldownMs] = useState<number>(0);
  const cdRef = useRef<NodeJS.Timeout | null>(null);

  // 通報モーダル
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type:"thread"|"post"; id:string }|null>(null);
  const [reportReason, setReportReason] = useState("");

  const listRef = useRef<FlatList>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const th = await fetchThread(id);
      if (!th) throw new Error("スレッドが見つかりません");
      setThread(th);

      // 自分のユーザー情報
      const { data: ures } = await supabase.auth.getUser();
      const u = ures?.user;
      setMyId(u?.id ?? null);
      setIsAdmin((u?.email ?? "") === ADMIN_EMAIL);

      setFav(await isThreadFavorited(id).catch(() => false));

      const { items } = await fetchPostsLatest50(id);
      setPosts(items as any);
      setNextFromNo(null);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 0);
    } catch (e:any) {
      Alert.alert("読み込みエラー", e?.message ?? String(e));
    } finally { setLoading(false); }
  }, [id]);


  useEffect(() => { loadInitial(); }, [loadInitial]);

  const loadAllFromStart = useCallback(async () => {
    setLoading(true);
    try {
      const { items, nextFromNo } = await fetchPosts(id, { fromNo: 1, limit: 100 });
      setPosts(items as any);
      setNextFromNo(nextFromNo);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 0);
    } finally { setLoading(false); }
  }, [id]);

  const loadMore = useCallback(async () => {
    if (!nextFromNo || loading) return;
    try {
      const { items, nextFromNo: nf } = await fetchPosts(id, { fromNo: nextFromNo, limit: 100 });
      setPosts(prev => [...prev, ...(items as any)]);
      setNextFromNo(nf);
    } catch {}
  }, [id, nextFromNo, loading]);

  useEffect(() => {
    const ch = supabase
      .channel(`posts:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bbs_posts", filter: `thread_id=eq.${id}` },
        (payload: any) => {
          const p = payload.new as Post;
          setPosts(prev => {
            const idx = prev.findIndex(x => x.no === p.no);
            if (idx >= 0) { const cp = [...prev]; cp[idx] = p; return cp; }
            return [...prev, p];
          });
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        }
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    if (cooldownMs <= 0) {
      if (cdRef.current) { clearInterval(cdRef.current as any); cdRef.current = null; }
      return;
    }
    if (!cdRef.current) {
      cdRef.current = setInterval(() => {
        setCooldownMs(ms => {
          const n = Math.max(0, ms - 1000);
          if (n === 0 && cdRef.current) { clearInterval(cdRef.current); cdRef.current = null; }
          return n;
        });
      }, 1000) as any;
    }
  }, [cooldownMs]);

  async function onPickImage() {
    if (!ImagePicker) return Alert.alert("画像", "画像選択には expo-image-picker が必要です。");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, quality: 0.85, mediaTypes: ImagePicker.MediaTypeOptions.Images
    });
    if (res.canceled) return;
    const a = res.assets?.[0];
    if (!a) return;
    const mime: "image/jpeg"|"image/png" =
      (a.type === "image" && (a.fileName?.toLowerCase().endsWith(".png") || a.mimeType === "image/png"))
        ? "image/png" : "image/jpeg";
    setPicked({ uri: a.uri, w: a.width ?? 0, h: a.height ?? 0, mime });
  }

  async function uploadPickedToSignedUrl(): Promise<{path:string; w:number; h:number} | null> {
    if (!picked) return null;
    if (!FileSystem) throw new Error("expo-file-system が見つかりません");

    const ext = picked.mime === "image/png" ? "png" : "jpg";
    const { path, url } = await getSignedUploadUrl({ ext, boardSlug: thread?.board?.slug ?? "general" });

    // RNは encoding: "base64"
    const b64 = await FileSystem.readAsStringAsync(picked.uri, { encoding: "base64" });
    const bytes = base64ToBytes(b64);

    await uploadToSignedUrl(url, bytes, picked.mime); // PUT
    return { path, w: picked.w, h: picked.h };
  }

  async function onSend() {
    if (!body.trim() && !picked) return;
    if (thread?.is_archived) return Alert.alert("投稿できません", "このスレッドはクローズされています（1000レス到達）");

    setSending(true);
    try {
      const image = await uploadPickedToSignedUrl(); // 画像ありならアップロード
      const name = await getLocalDisplayName();
      await createPost({ threadId: id, body, isSage, displayName: name, image });

      setBody("");
      setPicked(null);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      const m = msg.match(/retry_after_ms[:=]\s?(\d+)/i);
      const retryMs = m ? Number(m[1]) : 0;
      if (msg.includes("rate_limited") || retryMs > 0) {
        setCooldownMs(retryMs || 5000);
        Alert.alert("投稿制限中", `短時間の連投はできません。${Math.ceil((retryMs || 5000)/1000)}秒お待ちください。`);
      } else {
        Alert.alert("投稿エラー", msg);
      }
    } finally {
      setSending(false);
    }
  }

  const insertQuote = (no: number) => {
    setBody(prev => (prev ? `${prev}\n>>${no}\n` : `>>${no}\n`));
  };

  async function toggleFav() {
    try {
      if (fav) { await removeFavorite(id); setFav(false); }
      else     { await addFavorite(id);   setFav(true); }
    } catch (e:any) { Alert.alert("お気に入り", e?.message ?? String(e)); }
  }

  function openReportThread() {
    setReportTarget({ type:"thread", id });
    setReportReason("");
    setReportOpen(true);
  }
  function openReportPost(postId: string) {
    setReportTarget({ type:"post", id: postId });
    setReportReason("");
    setReportOpen(true);
  }
  async function submitReport() {
    try {
      const reason = reportReason.trim() || "不適切";
      if (!reportTarget) return;
      await reportContent({ targetType: reportTarget.type, targetId: reportTarget.id, reason });
      setReportOpen(false);
      Alert.alert("通報しました", "ご協力ありがとうございます");
    } catch (e:any) {
      Alert.alert("通報エラー", e?.message ?? String(e));
    }
  }

  const renderPost = ({ item }: { item: Post }) => {
    const deleted = !!item.is_deleted;
    const canDeletePost = isAdmin || (!!myId && !!item.author_user_id && item.author_user_id === myId);

    return (
      <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, opacity: deleted ? 0.7 : 1 }}>
        <TouchableOpacity onLongPress={() => insertQuote(item.no)} activeOpacity={0.7} disabled={deleted}>
          {/* 1行目 */}
          <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom: 6 }}>
            <Text style={{ color: C.sub, fontSize: 11 }}>No.{item.no}</Text>
            <View style={{ flexDirection:"row", alignItems:"center", gap: 12 }}>
              <Text style={{ color: C.sub, fontSize: 11 }}>{new Date(item.created_at).toLocaleString()}</Text>
              {!deleted && canDeletePost && (
                <TouchableOpacity onPress={async () => {
                  Alert.alert("確認", "この投稿を削除しますか？", [
                    { text: "キャンセル" },
                    { text: "削除", style: "destructive", onPress: async () => {
                      try {
                        await deletePost(item.id);
                        setPosts(prev => prev.map(p =>
                          p.id === item.id ? { ...p, is_deleted: true, body: "", image_url: null, image_w: null, image_h: null } : p
                        ));
                      } catch (e:any) {
                        const msg = String(e?.message ?? "");
                        if (msg.includes("non-2xx") || msg.includes("forbidden") || msg.includes("401") || msg.includes("403")) {
                          Alert.alert("削除できません", "他の人の投稿は削除できません。");
                        } else {
                          Alert.alert("削除エラー", msg);
                        }
                      }
                    }}]
                  );
                }}>
                  <Text style={{ color: "#f87171", fontSize: 12 }}>削除</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => openReportPost(item.id)}>
                <Text style={{ color: C.sub, fontSize: 12 }}>通報</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2行目：名前/ID/sage */}
          <View style={{ flexDirection:"row", alignItems:"center", gap: 6, marginBottom: 6 }}>
            <Text style={{ color: C.text, fontWeight: "800" }}>{item.display_name_snapshot || "名無しの筋トレ民"}</Text>
            {item.author_pseudonym ? <Text style={{ color: C.sub, fontSize: 12 }}>ID:{item.author_pseudonym}</Text> : null}
            {item.is_sage ? <Text style={{ color: "#fbbf24", fontSize: 11, marginLeft: 6 }}>sage</Text> : null}
          </View>

          {/* 本文 or 削除表示 */}
          {deleted ? (
            <Text style={{ color: C.sub, fontStyle: "italic" }}>※ このコメントの内容は削除されました</Text>
          ) : (
            <>
              {!!item.body && (
                <Text style={{ color: C.text, fontSize: 15, lineHeight: 22, marginBottom: item.image_url ? 8 : 0 }}>{item.body}</Text>
              )}
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{
                    width: "100%",
                    aspectRatio: item.image_w && item.image_h ? item.image_w / item.image_h : 4/3,
                    borderRadius: 8, backgroundColor: "#0f1317"
                  }}
                  resizeMode="cover"
                />
              ) : null}
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };


  if (loading) {
    return <View style={{ flex:1, backgroundColor: C.bg, alignItems:"center", justifyContent:"center" }}><ActivityIndicator /></View>;
  }

  return (
    <SafeAreaView edges={['top','left','right']} style={{ flex:1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderBottomColor: C.border, borderBottomWidth: 1 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "800", marginBottom: 6 }}>{thread?.title || "(無題)"}</Text>
          <View style={{ flexDirection:"row", gap: 12, alignItems:"center" }}>
            <TouchableOpacity onPress={loadInitial} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: C.card, borderColor: C.border, borderWidth:1, borderRadius: 8 }}>
              <Text style={{ color: C.sub, fontSize: 12 }}>最新50</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={loadAllFromStart} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: C.card, borderColor: C.border, borderWidth:1, borderRadius: 8 }}>
              <Text style={{ color: C.sub, fontSize: 12 }}>全件</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace("/bbs")} style={{ paddingVertical: 6, paddingHorizontal: 10 }}>
              <Text style={{ color: C.sub, fontSize: 12 }}>一覧へ</Text>
            </TouchableOpacity>
            <View style={{ marginLeft:"auto", flexDirection:"row", alignItems:"center" }}>
              <TouchableOpacity onPress={toggleFav} style={{ padding: 6 }}>
                <Text style={{ fontSize: 18, color: fav ? "#facc15" : C.sub }}>{fav ? "★" : "☆"}</Text>
              </TouchableOpacity>

              {canManageThread && (
              <>
                {/* スレを閉じる */}
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await closeThread(id);
                      setThread((t:any)=> ({ ...t, is_archived: true }));
                      Alert.alert("スレッドを閉じました", "以後は返信できません。");
                    } catch(e:any) {
                      Alert.alert("エラー", e?.message ?? String(e));
                    }
                  }}
                  style={{ padding: 6, marginLeft: 2 }}
                >
                  <Text style={{ color: C.sub }}>閉じる</Text>
                </TouchableOpacity>

                {/* スレを削除 */}
                <TouchableOpacity
                  onPress={async () => {
                    Alert.alert("確認", "このスレッドを完全に削除します。よろしいですか？", [
                      { text: "キャンセル" },
                      { text: "削除", style: "destructive", onPress: async () => {
                        try {
                          await deleteThread(id);
                          Alert.alert("削除しました");
                          router.replace("/bbs");
                        } catch(e:any) {
                          Alert.alert("削除エラー", e?.message ?? String(e));
                        }
                      }}
                    ]);
                  }}
                  style={{ padding: 6, marginLeft: 2 }}
                >
                  <Text style={{ color: "#f87171" }}>削除</Text>
                </TouchableOpacity>
              </>
              )}
              <TouchableOpacity onPress={openReportThread} style={{ padding: 6, marginLeft: 2 }}>
                <Text style={{ color: "#f87171" }}>通報</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        
        {thread?.is_archived ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#1f2937" }}>
            <Text style={{ color: "#fca5a5", fontWeight: "800" }}>
              このスレッドは終了しました（閲覧のみ）
            </Text>
          </View>
        ) : null}


        <FlatList
          ref={listRef}
          contentContainerStyle={{ padding: 16 }}
          data={posts}
          keyExtractor={(it) => it.id}
          renderItem={renderPost}
          onEndReachedThreshold={0.2}
          onEndReached={loadMore}
          ListFooterComponent={nextFromNo ? <ActivityIndicator style={{ marginVertical: 10 }} /> : <View style={{ height: 6 }} />}
        />

        <View style={{ padding: 12, borderTopColor: C.border, borderTopWidth: 1 }}>
          {picked ? (
            <View style={{ marginBottom: 8, flexDirection:"row", alignItems:"center", gap:10 }}>
              <Image source={{ uri: picked.uri }} style={{ width: 80, height: 80, borderRadius: 8, backgroundColor:"#0f1317" }} />
              <TouchableOpacity onPress={() => setPicked(null)} style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:8, backgroundColor:"#1f2937" }}>
                <Text style={{ color:"#fca5a5", fontWeight:"800" }}>削除</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 10, minHeight: 84, marginBottom: 8 }}>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="本文（長押しで引用 >>No）"
              placeholderTextColor={C.sub}
              style={{ color: C.text, paddingHorizontal: 12, paddingVertical: 10, minHeight: 84, textAlignVertical: "top" }}
              multiline
            />
          </View>
          <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap: 10 }}>
              <TouchableOpacity onPress={onPickImage} style={{ paddingVertical: 8, paddingHorizontal: 10, backgroundColor: C.card, borderWidth:1, borderColor:C.border, borderRadius:8 }}>
                <Text style={{ color: C.text, fontWeight:"800" }}>画像を選ぶ</Text>
              </TouchableOpacity>
              <View style={{ flexDirection:"row", alignItems:"center", gap: 8 }}>
                <Switch value={isSage} onValueChange={setIsSage} />
                <Text style={{ color: C.sub, fontSize: 12 }}>sage（スレを上げない）</Text>
              </View>
            </View>

            <TouchableOpacity
              disabled={sending || (!body.trim() && !picked) || cooldownMs > 0}
              onPress={onSend}
              style={{ backgroundColor: C.primary, opacity: (sending || (!body.trim() && !picked) || cooldownMs>0) ? 0.5 : 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
            >
              <Text style={{ color:"#00140e", fontWeight:"800" }}>
                {cooldownMs > 0 ? `待機 ${Math.ceil(cooldownMs/1000)}s` : (sending ? "送信中…" : "返信する")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
          <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", alignItems:"center", justifyContent:"center", padding:16 }}>
            <View style={{ width:"100%", backgroundColor: C.card, borderColor: C.border, borderWidth:1, borderRadius:12, padding:12 }}>
              <Text style={{ color: C.text, fontWeight:"800", fontSize:16, marginBottom:8 }}>通報理由（300字まで）</Text>
              <View style={{ backgroundColor:"#0f1317", borderRadius:8, borderColor:C.border, borderWidth:1, marginBottom:10 }}>
                <TextInput
                  value={reportReason}
                  onChangeText={setReportReason}
                  placeholder="例：暴言・個人情報・スパム等"
                  placeholderTextColor={C.sub}
                  style={{ color: C.text, paddingHorizontal: 10, paddingVertical: 8, minHeight: 80, textAlignVertical:"top" }}
                  multiline
                  maxLength={300}
                />
              </View>
              <View style={{ flexDirection:"row", justifyContent:"flex-end", gap:12 }}>
                <TouchableOpacity onPress={() => setReportOpen(false)}><Text style={{ color:C.sub }}>キャンセル</Text></TouchableOpacity>
                <TouchableOpacity onPress={submitReport}><Text style={{ color:"#ef4444", fontWeight:"800" }}>送信</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
