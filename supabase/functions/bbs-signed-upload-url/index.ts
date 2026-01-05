import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

function cors(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "authorization, content-type, x-device-key",
      "cache-control": "no-store",
    },
  });
}

function uuid() {
  try { return crypto.randomUUID(); } catch { /* deno old */ }
  const s = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c=>{
    const r = (Math.random()*16)|0, v = c==="x"? r : (r&0x3)|0x8; return v.toString(16);
  });
  return s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return cors({}, 200);
  if (req.method !== "POST")   return cors({ error: "method_not_allowed" }, 405);

  try {
    const { ext = "jpg", boardSlug = "general" } = await req.json();
    const device = req.headers.get("x-device-key") ?? "unknown";

    const url = Deno.env.get("SUPABASE_URL");
    const srv = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !srv) {
      console.error("MISSING ENV: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return cors({ error: "missing_env" }, 500);
    }

    const sb = createClient(url, srv, {
      global: { headers: { Authorization: `Bearer ${srv}` } },
    });

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth()+1).padStart(2,"0");
    const d = String(now.getDate()).padStart(2,"0");
    const path = `boards/${boardSlug}/${y}${m}/${d}/${device}_${uuid()}.${ext}`;

    const { data, error } = await sb.storage.from("bbs").createSignedUploadUrl(path);
    if (error) {
      console.error("createSignedUploadUrl error:", error);
      return cors({ error: String(error?.message ?? error) }, 500);
    }

    return cors({ path, url: data.signedUrl }, 200);
  } catch (e) {
    console.error("handler error:", e);
    return cors({ error: String(e?.message ?? e) }, 500);
  }
});
