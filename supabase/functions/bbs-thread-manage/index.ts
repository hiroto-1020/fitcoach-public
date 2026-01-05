import { cors, createAdminClient, resolveDeviceHash, resolveAuthUser } from "../_shared/bbs.ts";

const ADMIN_EMAIL = "horita102011@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors(req);
  if (req.method !== "POST")   return cors(req, { error: "method_not_allowed" }, 405);

  try {
    const sb = createAdminClient();
    const { hash: deviceHash } = await resolveDeviceHash(req);
    const user = await resolveAuthUser(req);
    const isAdmin = !!user && user.email === ADMIN_EMAIL;

    const { threadId, action } = await req.json() as { threadId: string; action: "close"|"delete"|"reopen" };

    const th = await sb.from("bbs_threads")
      .select("id, creator_device_hash, is_archived")
      .eq("id", threadId).maybeSingle();

    if (th.error || !th.data) return cors(req, { error: "thread_not_found" }, 404);

    const isOwner = th.data.creator_device_hash && th.data.creator_device_hash === deviceHash;
    if (!isOwner && !isAdmin) return cors(req, { error: "forbidden" }, 403);

    if (action === "close") {
      const { error } = await sb.from("bbs_threads").update({ is_archived: true }).eq("id", threadId);
      if (error) throw error;
      return cors(req, { ok: true, state: "archived" }, 200);
    }
    if (action === "reopen") {
      if (!isAdmin) return cors(req, { error: "admin_only" }, 403);
      const { error } = await sb.from("bbs_threads").update({ is_archived: false }).eq("id", threadId);
      if (error) throw error;
      return cors(req, { ok: true, state: "open" }, 200);
    }
    if (action === "delete") {
      await sb.from("bbs_posts").delete().eq("thread_id", threadId);
      const { error } = await sb.from("bbs_threads").delete().eq("id", threadId);
      if (error) throw error;
      return cors(req, { ok: true, state: "deleted" }, 200);
    }

    return cors(req, { error: "bad_action" }, 400);
  } catch (e:any) {
    return cors(req, { error: String(e?.message ?? e) }, 500);
  }
});
