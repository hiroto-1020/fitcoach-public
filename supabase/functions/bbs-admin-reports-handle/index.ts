//C:\Users\horit\fitcoach\supabase\functions\bbs-admin-reports-handle\index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("method", { status: 405 });
    const adminKeys = (Deno.env.get("BBS_ADMIN_DEVICE_KEYS") ?? "").split(",").map(s=>s.trim()).filter(Boolean);
    const dev = req.headers.get("x-device-key") ?? "";
    if (!adminKeys.includes(dev)) return new Response("forbidden", { status: 403 });

    const { reportId, action } = await req.json(); // 'dismiss' | 'delete_post' | 'archive_thread'
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: rep, error: e1 } = await sb.from("bbs_reports").select("*").eq("id", reportId).single();
    if (e1) throw e1;

    if (action === "delete_post" && rep.target_type === "post") {
      await sb.from("bbs_posts").delete().eq("id", rep.target_id);
    }
    if (action === "archive_thread" && rep.target_type === "thread") {
      await sb.from("bbs_threads").update({ is_archived: true }).eq("id", rep.target_id);
    }

    await sb.from("bbs_reports").update({ handled_at: new Date().toISOString(), action }).eq("id", reportId);

    return Response.json({ ok: true });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500 });
  }
});
