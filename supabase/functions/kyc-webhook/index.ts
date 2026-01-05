
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = {
  provider?: string;
  session_id?: string;
  person_id?: string | null;
  status?: "approved" | "rejected" | "failed" | "pending";
};

const DEBUG_TAG = "kyc-webhook-v1";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization,content-type",
  "access-control-allow-methods": "POST,OPTIONS",
};

const json = (obj: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(obj), {
    ...(init ?? {}),
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-debug": DEBUG_TAG,
      ...cors,
      ...(init?.headers ?? {}),
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, { status: 405 });

  const SUPABASE_URL =
    Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL") ?? "";
  const SERVICE_ROLE =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json(
      { error: "env_missing", detail: "SUPABASE_URL/PROJECT_URL または SERVICE_ROLE_KEY が未設定" },
      { status: 500 }
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return json({ error: "bad_json" }, { status: 400 });
  }

  const provider = body.provider ?? "persona";
  const sid = body.session_id ?? "";
  const personId = body.person_id ?? null;
  const providerStatus = body.status ?? "pending";

  if (!sid) return json({ error: "missing_session_id" }, { status: 400 });

  const { data: rows, error: updErr } = await admin
    .from("kyc_verifications")
    .update({
      provider_status: providerStatus,
      provider_person_id: personId,
      provider,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_session_id", sid)
    .select("user_id")
    .limit(1);

  if (updErr) {
    return json({ error: "update_failed", detail: updErr.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return json(
      {
        error: "pending_not_found",
        detail:
          "No pending row for this session_id. Ensure startKycSession() inserts a pending record before approval.",
      },
      { status: 400 }
    );
  }

  const userId = rows[0].user_id as string;

  const finalStatus = providerStatus === "approved" ? "verified" : providerStatus;
  const { error: profErr } = await admin
    .from("profiles")
    .update({
      verified_provider: provider,
      verified_person_id: personId,
      verified_status: finalStatus,
      verified_at: providerStatus !== "pending" ? new Date().toISOString() : null,
    })
    .eq("user_id", userId);

  if (profErr) {
    return json({ error: "profile_update_failed", detail: profErr.message }, { status: 500 });
  }

  return json({ ok: true, session_id: sid, status: providerStatus, user_id: userId }, { status: 200 });
});
