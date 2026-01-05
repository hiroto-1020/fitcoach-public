// supabase/functions/kyc-verify-lite/index.ts
// 無料版：AIを使わず最低限の検証のみ（18歳未満は棄却）。最終承認は管理者レビューで。
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DocType = "driver_license" | "insurance_card" | "residence_certificate";
type ReqBody = {
  session_id: string;              // 事前に作成する sess_xxx
  doc_type: DocType;
  object_keys: string[];           // 'kyc-uploads' の object key 配列
  full_name: string;
  dob: string;                     // YYYY-MM-DD
  id_number?: string | null;       // 任意（免許番号など）
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function calcAge(yyyy_mm_dd: string): number {
  const d = new Date(yyyy_mm_dd);
  if (Number.isNaN(+d)) return -1;
  const n = new Date();
  let age = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) age--;
  return age;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  let body: ReqBody;
  try { body = await req.json(); } catch { return new Response("bad_json", { status: 400 }); }

  const { session_id, doc_type, object_keys, full_name, dob, id_number } = body;
  if (!session_id || !doc_type || !object_keys?.length || !full_name?.trim() || !dob) {
    return new Response("missing_fields", { status: 400 });
  }

  // pending 行の取得（誰の申請か）
  const { data: kycRow, error: kycErr } = await admin
    .from("kyc_verifications")
    .select("id,user_id,provider_status")
    .eq("provider_session_id", session_id)
    .maybeSingle();
  if (kycErr || !kycRow) return new Response("pending_not_found", { status: 400 });

  // 画像最低限チェック（重複やサイズは本気でやるなら storage API から meta を取る）
  const need = doc_type === "residence_certificate" ? 1 : 2;
  if (object_keys.length < need) return new Response("insufficient_images", { status: 400 });

  // 年齢チェック
  const age = calcAge(dob);
  let status: "approved" | "pending" | "rejected" = "pending";
  let reason = "";

  if (age < 0) { status = "rejected"; reason = "dob_invalid"; }
  else if (age < 18) { status = "rejected"; reason = "under_18"; }
  else {
    // 無料版はここで自動承認せず pending にして管理者審査へ回す
    status = "pending";
  }

  const evidenceUrls = object_keys.map((k) => `kyc-uploads:${k}`);

  // kyc_verifications を更新
  await admin
    .from("kyc_verifications")
    .update({
      provider: "manual-lite",
      provider_status: status,
      doc_type,
      evidence_urls: evidenceUrls,
      full_name,
      dob,
      id_number: id_number ?? null,
      reason,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_session_id", session_id);

  // profiles には pending を反映（承認/拒否は管理画面から更新）
  await admin
    .from("profiles")
    .update({
      verified_status: status,                // pending / rejected / approved(=verified)
      verified_provider: "manual-lite",
      verified_person_id: null,
      verified_at: null,
    })
    .eq("user_id", kycRow.user_id);

  return new Response(JSON.stringify({ ok: true, status, reason, age }), {
    headers: { "content-type": "application/json" },
  });
});
