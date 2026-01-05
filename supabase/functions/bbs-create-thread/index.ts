import {
  cors, createAdminClient, resolveDeviceHash,
  validateTitle, validateBody, nowUtc, lastThreadCreatedAtByDevice,
  diffSeconds, makePseudonym
} from "../_shared/bbs.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors(req);
  if (req.method !== "POST")   return cors(req, { error: "method_not_allowed" }, 405);

  try {
    const sb = createAdminClient();
    const { hash: deviceHash } = await resolveDeviceHash(req);

    const payload = await req.json();
    const title: string = (payload?.title ?? "").toString();
    const body: string  = (payload?.body  ?? "").toString();
    const displayName: string | undefined = payload?.displayName;
    // 追加：複数カテゴリ
    const boardSlugsInput: string[] | undefined = Array.isArray(payload?.boardSlugs)
      ? payload.boardSlugs.map((s: any) => String(s)).filter(Boolean)
      : undefined;
    const single = payload?.boardSlug ? String(payload.boardSlug) : undefined;

    // 入力チェック
    const tErr = validateTitle(title); if (tErr) return cors(req, { error: tErr }, 400);
    const bErr = validateBody(body);   if (bErr) return cors(req, { error: bErr }, 400);

    // レート制限（1h）
    const last = await lastThreadCreatedAtByDevice(sb, deviceHash);
    const now  = nowUtc();
    if (last && diffSeconds(now, last) < 3600) {
      const remains = 3600 - diffSeconds(now, last);
      return cors(req, { error: `スレ立ては1時間に1回まで（あと${remains}秒）` }, 429);
    }

    // 有効なカテゴリを確定（未指定は general）
    const wanted = (boardSlugsInput && boardSlugsInput.length > 0)
      ? boardSlugsInput
      : [single ?? "general"];

    // 取得＆整列（指定順を保つ）
    const { data: boards, error: be } = await sb
      .from("bbs_boards")
      .select("id, slug, is_active")
      .in("slug", wanted);
    if (be) return cors(req, { error: be.message }, 500);

    const actives = (boards ?? []).filter(b => b.is_active);
    if (actives.length === 0) return cors(req, { error: "有効なカテゴリがありません" }, 400);

    // 指定順で主カテゴリを選ぶ
    const slugOrder = new Map(wanted.map((s, i) => [s, i]));
    actives.sort((a, b) => (slugOrder.get(a.slug) ?? 999) - (slugOrder.get(b.slug) ?? 999));
    const primary = actives[0];

    // threads 作成
    const thIns = await supabase.from("bbs_threads").insert({
    board_id: boardId,
    title: String(title).trim(),
    creator_device_hash: deviceHash, // ★追加：作成者デバイス
    }).select("id, title, is_archived, last_bump_at, reply_count, created_at").single();
    if (thIns.error) return cors(req, { error: thIns.error.message }, 500);
    const thread = thIns.data;

    // 表示名 & 擬似ID
    const salt = Deno.env.get("BBS_SALT")!;
    const pseudonym = await makePseudonym(salt, deviceHash, thread.id, now);
    const firstName = (displayName && String(displayName).trim()) || "名無しの筋トレ民";

    // 初回投稿
    const poIns = await sb.from("bbs_posts").insert({
      thread_id: thread.id,
      body,
      is_sage: false,
      display_name_snapshot: firstName,
      author_pseudonym: pseudonym,
      device_hash: deviceHash,
    }).select("id, thread_id, no, body, is_sage, display_name_snapshot, author_pseudonym, created_at").single();
    if (poIns.error) return cors(req, { error: poIns.error.message }, 500);

    // タグ付け（重複はupsertで吸収）
    const tagRows = actives.map(b => ({ thread_id: thread.id, board_id: b.id }));
    if (tagRows.length > 0) {
      const tg = await sb.from("bbs_thread_tags").upsert(tagRows, { onConflict: "thread_id,board_id" });
      if (tg.error) return cors(req, { error: tg.error.message }, 500);
    }

    return cors(req, {
      thread,
      post: poIns.data,
      tags: actives.map(b => ({ slug: b.slug, id: b.id }))
    }, 201);
  } catch (e) {
    return cors(req, { error: String(e?.message ?? e) }, 500);
  }
});
