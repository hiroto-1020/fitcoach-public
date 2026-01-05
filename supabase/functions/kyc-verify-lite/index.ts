import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DocType = "driver_license" | "insurance_card" | "residence_certificate";
type ReqBody = {
  session_id: string;
  doc_type: DocType;
  object_keys: string[];
  full_name: string;
  dob: string;
  id_number?: string | null;
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

  const { data: kycRow, error: kycErr } = await admin
    .from("kyc_verifications")
    .select("id,user_id,provider_status")
    .eq("provider_session_id", session_id)
    .maybeSingle();
  if (kycErr || !kycRow) return new Response("pending_not_found", { status: 400 });

  const need = doc_type === "residence_certificate" ? 1 : 2;
  if (object_keys.length < need) return new Response("insufficient_images", { status: 400 });

  const age = calcAge(dob);
  let status: "approved" | "pending" | "rejected" = "pending";
  let reason = "";

  if (age < 0) { status = "rejected"; reason = "dob_invalid"; }
  else if (age < 18) { status = "rejected"; reason = "under_18"; }
  else {
    status = "pending";
  }

  const evidenceUrls = object_keys.map((k) => `kyc-uploads:${k}`);

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

  await admin
    .from("profiles")
    .update({
      verified_status: status,
      verified_provider: "manual-lite",
      verified_person_id: null,
      verified_at: null,
    })
    .eq("user_id", kycRow.user_id);

  return new Response(JSON.stringify({ ok: true, status, reason, age }), {
    headers: { "content-type": "application/json" },
  });
});
