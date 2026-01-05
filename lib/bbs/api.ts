// lib/bbs/api.ts
import { supabase } from "../supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 任意依存
let ExpoCrypto: any = null; try { ExpoCrypto = require("expo-crypto"); } catch {}

function uuidv4() {
  // @ts-ignore
  if (typeof global?.crypto?.randomUUID === "function") return global.crypto.randomUUID();
  if (ExpoCrypto?.randomUUID) return ExpoCrypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getLocalDisplayName() {
  const v = await AsyncStorage.getItem("local_display_name");
  return (v && v.trim()) || "名無しの筋トレ民";
}

async function getDeviceKey() {
  const k = await AsyncStorage.getItem("bbs_device_key");
  if (k) return k;
  const v = uuidv4();
  await AsyncStorage.setItem("bbs_device_key", v);
  return v;
}

// ===== 作成 =====
export async function createThread(params: {
    title: string; body: string; boardSlugs?: string[]; displayName?: string;
  }) {
    const xdk = await getDeviceKey();
    const { data, error } = await supabase.functions.invoke("bbs-create-thread", {
      body: params,
      headers: { "x-device-key": xdk },
    });
    if (error) throw new Error(error.message);
    return data as { thread: any; post: any; tags?: Array<{slug:string;id:string}> };
  }

export async function createPost(params: {
  threadId: string;
  body: string;
  isSage?: boolean;
  displayName?: string;
  image?: { path: string; w: number; h: number } | null;
}) {
  const xdk = await getDeviceKey();
  const res = await supabase.functions.invoke("bbs-create-post", {
    body: params,
    headers: { "x-device-key": xdk },
  });
  if (res.error) {
    // ← ここで JSON 本文の error を優先的に表示
    const msg = (res.data as any)?.error || res.error.message;
    throw new Error(msg);
  }
  return res.data as { ok: true; no: number };
}

// ===== 読み取り =====
export async function fetchThreads(opts?: { limit?: number; cursor?: string | null }) {
  const limit = opts?.limit ?? 20;
  let q = supabase.from("bbs_threads_list")
    .select("id,title,reply_count,is_archived,last_bump_at,created_at,primary_slug,primary_name,tag_slugs,tag_names")
    .order("is_archived", { ascending: true })
    .order("last_bump_at", { ascending: false })
    .limit(limit);

  if (opts?.cursor) q = q.lt("last_bump_at", opts.cursor);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const nextCursor = (data?.length ?? 0) === limit ? data[data.length - 1].last_bump_at : null;
  return { items: data ?? [], nextCursor };
}

export async function fetchThread(threadId: string) {
  const { data, error } = await supabase
    .from("bbs_threads_list")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchPosts(threadId: string, opts?: { fromNo?: number; limit?: number }) {
  const limit = opts?.limit ?? 50;
  const from = (opts?.fromNo ?? 1);
  const to = from + limit - 1;
  const { data, error, count } = await supabase
    .from("bbs_posts")
    .select(
      "id,thread_id,no,body,is_sage,display_name_snapshot,author_pseudonym,created_at,image_url,image_w,image_h,is_deleted",
      { count: "exact" }
    )
    .eq("thread_id", threadId)
    .order("no", { ascending: true })
    .range(from - 1, to - 1);
  if (error) throw new Error(error.message);
  return { items: data ?? [], total: count ?? undefined, nextFromNo: (data?.length ?? 0) === limit ? to + 1 : null };
}


export async function closeThread(threadId: string) {
  const { data, error } = await supabase.functions.invoke("bbs-thread-manage", {
    body: { threadId, action: "close" }
  });
  if (error) throw new Error(error.message);
  return data as { ok: true; state: "archived" };
}
export async function deleteThread(threadId: string) {
  const { data, error } = await supabase.functions.invoke("bbs-thread-manage", {
    body: { threadId, action: "delete" }
  });
  if (error) throw new Error(error.message);
  return data as { ok: true; state: "deleted" };
}

// 投稿削除
export async function deletePost(postId: string) {
  const { error } = await supabase.functions.invoke("bbs-post-delete", { body: { postId } });
  if (error) throw new Error(error.message || "edge_failed");
}


export async function fetchPostsLatest50(threadId: string) {
  const { count } = await supabase
    .from("bbs_posts")
    .select("id,is_deleted", { count: "exact", head: true })
    .eq("thread_id", threadId);
  const total = count ?? 0;
  const fromNo = Math.max(1, total - 50 + 1);
  return fetchPosts(threadId, { fromNo, limit: 50 });
}

// ===== 通報 =====
export async function reportContent(params: { targetType: "thread" | "post"; targetId: string; reason: string; }) {
  const xdk = await getDeviceKey();
  const { data, error } = await supabase.functions.invoke("bbs-report", {
    body: params,
    headers: { "x-device-key": xdk },
  });
  if (error) throw new Error(error.message);
  return data as { ok: true; reportId: string };
}

// ===== お気に入り =====
async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
export async function listFavoriteThreadIds(): Promise<Set<string>> {
  const uid = await getUserId(); if (!uid) return new Set();
  const { data, error } = await supabase.from("bbs_favorites").select("thread_id").eq("user_id", uid);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((x: any) => x.thread_id as string));
}
export async function isThreadFavorited(threadId: string) {
  const uid = await getUserId(); if (!uid) return false;
  const { data, error } = await supabase.from("bbs_favorites").select("id").eq("user_id", uid).eq("thread_id", threadId).maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}
export async function addFavorite(threadId: string) {
  const uid = await getUserId(); if (!uid) throw new Error("ログインが必要です");
  const { error } = await supabase.from("bbs_favorites").insert({ user_id: uid, thread_id: threadId });
  if (error && !String(error.message).includes("duplicate")) throw new Error(error.message);
  return true;
}
export async function removeFavorite(threadId: string) {
  const uid = await getUserId(); if (!uid) throw new Error("ログインが必要です");
  const { error } = await supabase.from("bbs_favorites").delete().eq("user_id", uid).eq("thread_id", threadId);
  if (error) throw new Error(error.message);
  return true;
}


export async function getSignedUploadUrl(params: { ext: "jpg" | "png"; boardSlug?: string | null; }) {
  const { data, error } = await supabase.functions.invoke("bbs-signed-upload-url", { body: params });
  if (error) throw new Error(error.message);
  return data as { path: string; url: string };
}

/** 署名付きURLへPUTアップロード */
export async function uploadToSignedUrl(
  url: string,
  bytes: Uint8Array,
  mime: "image/jpeg" | "image/png"
) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "content-type": mime },
    body: bytes,
  });
  if (!res.ok) throw new Error(`upload_failed:${res.status}`);
  return true;
}
