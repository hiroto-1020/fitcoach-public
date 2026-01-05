import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("NG", { status: 405 });
  const { URL, SERVICE_ROLE } = Deno.env.toObject();
  const admin = createClient(URL, SERVICE_ROLE);

  const { match_id, body } = await req.json();
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace("Bearer ", "");
  const { data: user } = await admin.auth.getUser(jwt);
  if (!user?.user) return new Response("unauthorized", { status: 401 });
  const uid = user.user.id;


  const { data: prof } = await admin.from("profiles").select("verified_status").eq("user_id", uid).maybeSingle();
  const verified = prof?.verified_status === "verified";

  const { count } = await admin.from("messages").select("*", { count: "exact", head: true }).eq("match_id", match_id).eq("sender_id", uid);

  if (!verified && (count ?? 0) >= 1) {
    return new Response(JSON.stringify({ error: "kyc_required_after_first" }), { status: 403, headers: { "content-type": "application/json" } });
  }

  const { error } = await admin.from("messages").insert({ match_id, sender_id: uid, body });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "content-type": "application/json" } });

  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
});
