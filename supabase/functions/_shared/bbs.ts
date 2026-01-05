// /supabase/functions/_shared/bbs.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

const te = new TextEncoder();

/** CORS ヘルパ */
export function cors(req: Request, resBody: any = null, status = 200) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map(s => s.trim());
  const allow = allowed.length === 0 || allowed.includes(origin);

  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allow ? origin : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-device-key",
    "Vary": "Origin",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  return new Response(resBody ? JSON.stringify(resBody) : null, { status, headers });
}

/** Adminクライアント（RLSバイパス） */
export function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** HMAC-SHA256 (hex) */
export async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", te.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, te.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/** hex   Base32（Crockford系） */
export function hexToBase32(hex: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (let i = 0; i < hex.length; i += 2) {
    bits += parseInt(hex.slice(i, i + 2), 16).toString(2).padStart(8, "0");
  }
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += alphabet[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

/** 擬似ID（スレ内・当日固定） */
export async function makePseudonym(salt: string, deviceHash: string, threadId: string, now = new Date()) {
  const ymd = `${now.getUTCFullYear()}${String(now.getUTCMonth()+1).padStart(2,"0")}${String(now.getUTCDate()).padStart(2,"0")}`;
  const hex = await hmacHex(salt, `${deviceHash}:${threadId}:${ymd}`);
  return hexToBase32(hex).slice(0, 8); // 先頭8文字
}

/** デバイス識別（必須）。x-device-key or IP */
export async function resolveDeviceHash(req: Request): Promise<{ rawKey: string, hash: string }> {
  const salt = Deno.env.get("BBS_SALT")!;
  const hdrKey = (req.headers.get("x-device-key") ?? "").trim();
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
  const raw = hdrKey || ip || crypto.randomUUID();
  const hash = await hmacHex(salt, raw);
  return { rawKey: raw, hash };
}

/** NGワード簡易判定 */
export function hasNg(text: string): string[] {
  const list = (Deno.env.get("BBS_NG_WORDS") ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const hit: string[] = [];
  const lower = text.toLowerCase();
  for (const w of list) {
    if (!w) continue;
    if (lower.includes(w.toLowerCase())) hit.push(w);
  }
  return hit;
}

/** 文字数・改行数の簡易バリデーション */
export function validateBody(body: string, { maxLen = 2000, maxLines = 60 } = {}) {
  if (!body || !body.trim()) return "本文が空です";
  if (body.length > maxLen) return `本文が長すぎます（最大${maxLen}文字）`;
  if (body.split("\n").length > maxLines) return `改行が多すぎます（最大${maxLines}行）`;
  const ng = hasNg(body);
  if (ng.length) return `NGワードが含まれています: ${ng.join(", ")}`;
  return null;
}

/** タイトルのバリデーション */
export function validateTitle(title: string) {
  if (!title || !title.trim()) return "タイトルが空です";
  if (title.length > 60) return "タイトルは60文字以内にしてください";
  const ng = hasNg(title);
  if (ng.length) return `NGワードが含まれています: ${ng.join(", ")}`;
  return null;
}

/** UTC now（DBと合わせるため） */
export function nowUtc() {
  return new Date(new Date().toISOString());
}

/** 直近投稿（レート制限用） */
export async function lastPostAtByDevice(supabase: ReturnType<typeof createAdminClient>, deviceHash: string) {
  const { data, error } = await supabase
    .from("bbs_posts")
    .select("created_at")
    .eq("device_hash", deviceHash)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data?.created_at ? new Date(data.created_at) : null;
}

/** 直近スレ立て（レート制限用：初回レスno=1を検索） */
export async function lastThreadCreatedAtByDevice(supabase: ReturnType<typeof createAdminClient>, deviceHash: string) {
  const { data, error } = await supabase
    .from("bbs_posts")
    .select("created_at, no")
    .eq("device_hash", deviceHash)
    .eq("no", 1)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data?.created_at ? new Date(data.created_at) : null;
}

/** 秒差 */
export function diffSeconds(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 1000);
}

export async function resolveAuthUser(req: Request) {
  const url  = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const client = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await client.auth.getUser();
  return user; // { email, id, ... } | null
}