import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";

const ADMIN_EMAIL = "horita102011@gmail.com";

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ログインユーザー
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: ures, error: uerr } = await userClient.auth.getUser();
    if (uerr || !ures.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    const me = ures.user;

    const { postId } = await req.json();
    if (!postId) return new Response(JSON.stringify({ error: "postId required" }), { status: 400 });

    // 対象投稿
    const { data: post, error: perr } = await userClient
      .from("bbs_posts").select("id, author_user_id").eq("id", postId).single();
    if (perr || !post) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });

    const isAdmin = (me.email ?? "") === ADMIN_EMAIL;
    const isAuthor = post.author_user_id && post.author_user_id === me.id;
    if (!isAdmin && !isAuthor) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });

    // 論理削除（service role で RLS 無視）
    const svc = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error: uperr } = await svc.from("bbs_posts").update({
      is_deleted: true, body: "", image_url: null, image_w: null, image_h: null, updated_at: new Date().toISOString(),
    }).eq("id", postId);

    if (uperr) return new Response(JSON.stringify({ error: "update_failed", detail: uperr.message }), { status: 500 });
    return new Response(null, { status: 204 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "unexpected", detail: String(e) }), { status: 500 });
  }
});
