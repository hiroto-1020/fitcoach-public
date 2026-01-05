import {
  cors, createAdminClient, resolveDeviceHash, validateBody,
  nowUtc, lastPostAtByDevice, diffSeconds, makePseudonym
} from "../_shared/bbs.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors(req);
  if (req.method !== "POST")   return cors(req, { error: "method_not_allowed" }, 405);

  try {
    const sb = createAdminClient();
    const { hash: deviceHash } = await resolveDeviceHash(req);

    const { threadId, body, isSage, displayName, image } = await req.json() as {
      threadId: string;
      body?: string;
      isSage?: boolean;
      displayName?: string;
      image?: { path?: string; w?: number; h?: number } | null;
    };

    // 直近投稿クールダウン（5秒）
    const last = await lastPostAtByDevice(sb, deviceHash);
    const now  = nowUtc();
    if (last && diffSeconds(now, last) < 5) {
      const ms = (5 - diffSeconds(now, last)) * 1000;
      return cors(req, { error: "rate_limited", retry_after_ms: ms }, 429);
    }

    // スレ確認
    const th = await sb.from("bbs_threads")
      .select("id,is_archived")
      .eq("id", threadId)
      .maybeSingle();
    if (th.error || !th.data)  return cors(req, { error: "thread_not_found" }, 404);
    if (th.data.is_archived)   return cors(req, { error: "archived_thread" }, 400);

    // 本文 or 画像のどちらか必須
    const hasText  = !!String(body ?? "").trim();
    const hasImage = !!image?.path;
    if (!hasText && !hasImage) {
      return cors(req, { error: "empty_post" }, 400);
    }
    if (hasText) {
      const bErr = validateBody(String(body ?? ""));
      if (bErr) return cors(req, { error: bErr }, 400);
    }

    // 次の連番 no
    const mx = await sb.from("bbs_posts")
      .select("no")
      .eq("thread_id", threadId)
      .order("no", { ascending: false })
      .limit(1);
    const no = ((mx.data?.[0]?.no as number | undefined) ?? 0) + 1;

    // 表示名・擬似ID
    const name = (displayName && String(displayName).trim()) || "名無しの筋トレ民";
    const salt = Deno.env.get("BBS_SALT")!;
    const pseudonym = await makePseudonym(salt, deviceHash, threadId, now);

    // 画像項目
    let image_path: string | null = null;
    let image_url : string | null = null;
    let image_w   : number | null = null;
    let image_h   : number | null = null;

    if (hasImage) {
      image_path = image!.path!;
      const pub = sb.storage.from("bbs").getPublicUrl(image_path);
      image_url = (await pub).data?.publicUrl ?? null;
      image_w = image?.w ?? null;
      image_h = image?.h ?? null;
    }

    // 投稿作成（本文が無ければ空文字で保存）
    const ins = await sb.from("bbs_posts").insert({
      thread_id: threadId,
      no,
      body: hasText ? String(body) : "",
      is_sage: !!isSage,
      display_name_snapshot: name,
      author_pseudonym: pseudonym,
      device_hash: deviceHash,
      image_path, image_url, image_w, image_h,
    })
    .select("id,thread_id,no,body,is_sage,display_name_snapshot,author_pseudonym,image_url,image_w,image_h,created_at")
    .single();

    if (ins.error) return cors(req, { error: ins.error.message }, 500);

    // 返信数 / BUMP 更新
    const cnt = await sb.from("bbs_posts")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", threadId);
    const bump = !isSage ? new Date().toISOString() : undefined;

    await sb.from("bbs_threads")
      .update({ reply_count: cnt.count ?? 0, ...(bump ? { last_bump_at: bump } : {}) })
      .eq("id", threadId);

    return cors(req, { ok: true, no, post: ins.data }, 201);
  } catch (e) {
    return cors(req, { error: String(e?.message ?? e) }, 500);
  }
});
