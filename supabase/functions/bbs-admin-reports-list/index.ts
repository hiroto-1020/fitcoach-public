
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

serve(async (req) => {
  try {
    const adminKeys = (Deno.env.get("BBS_ADMIN_DEVICE_KEYS") ?? "").split(",").map(s=>s.trim()).filter(Boolean);
    const dev = req.headers.get("x-device-key") ?? "";
    if (!adminKeys.includes(dev)) return new Response("forbidden", { status: 403 });

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await sb.from("bbs_reports").select("*").is("handled_at", null).order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ items: data });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500 });
  }
});
