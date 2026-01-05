// lib/gotore/kyc.ts
import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";
import { supabase, SUPABASE_URL } from "../supabase";
import { startKycSession } from "./api";

/* --- types --- */
export type KycProvider = "persona" | "sumsub" | "mock";
export type KycStatus = "approved" | "rejected" | "failed" | "pending";
export const KYC_BUCKET = "kyc-uploads";

/** KYCバッジ表記 */
export function toKycBadge(status?: string | null) {
  const s = String(status ?? "unverified");
  if (s === "verified" || s === "approved")
    return { label: "本人確認済み", color: "#16a34a", isVerified: true as const };
  if (s === "pending")
    return { label: "審査中", color: "#f59e0b", isVerified: false as const };
  if (s === "rejected" || s === "failed")
    return { label: "否認/失敗", color: "#ef4444", isVerified: false as const };
  return { label: "未確認", color: "#64748b", isVerified: false as const };
}

/* --- Edge Functions base（モバイル直叩き） --- */
const FUNCTIONS_BASE: string = (() => {
  try {
    const host = new URL(SUPABASE_URL).hostname; // xxxxx.supabase.co
    const ref = host.split(".")[0];
    // Edge Functions の正しいベース: https://<ref>.functions.supabase.co
    return `https://${ref}.functions.supabase.co`;
  } catch {
    return SUPABASE_URL; // フォールバック（invokeで使わない）
  }
})();

/* --- ポーリング設定 --- */
const POLL_MS = 1500;
const POLL_MAX_MS = 120_000;

export async function openKycFlow(
  provider: KycProvider = "persona"
): Promise<{ status: KycStatus; person_id: string | null; session_id: string }> {
  const session_id = genId();
  try {
    // Edge Function 側でセッション作成
    await startKycSession(provider === "mock" ? "persona" : provider, session_id);
  } catch {
    // 無視（後段でブラウザ起動しつつDBポーリング）
  }

  if (provider === "mock") {
    // アプリ内モック（ディープリンク）
    const url = `FitGear://me/kyc?sid=${encodeURIComponent(session_id)}&provider=persona`;
    try {
      await Linking.openURL(url);
    } catch {}
  } else {
    // Edge Functions がホストするKYC開始ページ（例：kyc-mock-html）
    const startUrl = `${FUNCTIONS_BASE}/kyc-mock-html?sid=${encodeURIComponent(
      session_id
    )}&provider=${encodeURIComponent(provider)}`;
    if (!/^https?:\/\//i.test(startUrl)) throw new Error("KYC start URL is invalid");
    try {
      await WebBrowser.openBrowserAsync(startUrl);
    } catch {
      try {
        await Linking.openURL(startUrl);
      } catch {}
    }
  }

  // DBを定期ポーリングして結果を待つ（最大 POLL_MAX_MS）
  let last: KycStatus = "pending";
  let person_id: string | null = null;
  const until = Date.now() + POLL_MAX_MS;

  while (Date.now() < until) {
    const { data, error } = await supabase
      .from("kyc_verifications")
      .select("provider_status, provider_person_id")
      .eq("provider_session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.provider_status) {
      last = (data.provider_status as KycStatus) ?? "pending";
      person_id = (data.provider_person_id as string | null) ?? null;
      if (last !== "pending") break;
    }
    await wait(POLL_MS);
  }
  return { status: last, person_id, session_id };
}

/* --- 手動審査（画像アップロード→pending upsert） --- */
export type KycDocType = "license" | "insurance" | "juminhyo";

export async function submitKycForManualReview(opts: {
  sessionId: string;
  docType: KycDocType;
  localUri: string; // ImagePicker / Camera の uri
  provider?: KycProvider; // 省略時 persona
}) {
  const { sessionId, docType, localUri, provider = "persona" } = opts;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です。");
  const uid = user.id;

  // 画像をバイト化して Storage に put
  const { ext, contentType } = guessExt(localUri);
  const objectKey = `${uid}/${sessionId}.${ext}`;
  const res = await fetch(localUri);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);

  const up = await supabase.storage.from(KYC_BUCKET).upload(objectKey, bytes, {
    contentType,
    upsert: true,
  });
  if (up.error) throw up.error;

  const pub = supabase.storage.from(KYC_BUCKET).getPublicUrl(objectKey);
  const docUrl = pub.data.publicUrl;

  // kyc_verifications に pending で upsert（審査はサーバ側）
  const { error } = await supabase.from("kyc_verifications").upsert(
    {
      user_id: uid,
      provider,
      provider_session_id: sessionId,
      provider_person_id: null,
      provider_status: "pending",
      doc_type: docType,
      doc_url: docUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider_session_id" }
  );
  if (error) throw error;

  return { objectKey, url: docUrl };
}

/* --- utils --- */
function genId(): string {
  try {
    // @ts-ignore
    if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  } catch {}
  return "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function guessExt(uri: string): { ext: string; contentType: string } {
  const noQ = uri.split("?")[0];
  let ext = (noQ.split(".").pop() || "jpg").toLowerCase();
  if (!["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext)) ext = "jpg";
  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
      ? "image/webp"
      : ext === "heic" || ext === "heif"
      ? "image/heic"
      : "image/jpeg";
  return { ext, contentType };
}
