import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";
import { supabase, SUPABASE_URL } from "../supabase";
import { startKycSession } from "./api";

export type KycProvider = "persona" | "sumsub" | "mock";
export type KycStatus = "approved" | "rejected" | "failed" | "pending";
export const KYC_BUCKET = "kyc-uploads";

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

const FUNCTIONS_BASE: string = (() => {
  try {
    const host = new URL(SUPABASE_URL).hostname;
    const ref = host.split(".")[0];
    return `https://${ref}.functions.supabase.co`;
  } catch {
    return SUPABASE_URL;
  }
})();

const POLL_MS = 1500;
const POLL_MAX_MS = 120_000;

export async function openKycFlow(
  provider: KycProvider = "persona"
): Promise<{ status: KycStatus; person_id: string | null; session_id: string }> {
  const session_id = genId();
  try {
    await startKycSession(provider === "mock" ? "persona" : provider, session_id);
  } catch {
  }

  if (provider === "mock") {
    const url = `FitGear://me/kyc?sid=${encodeURIComponent(session_id)}&provider=persona`;
    try {
      await Linking.openURL(url);
    } catch {}
  } else {
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

export type KycDocType = "license" | "insurance" | "juminhyo";

export async function submitKycForManualReview(opts: {
  sessionId: string;
  docType: KycDocType;
  localUri: string;
  provider?: KycProvider;
}) {
  const { sessionId, docType, localUri, provider = "persona" } = opts;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です。");
  const uid = user.id;

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

function genId(): string {
  try {
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
