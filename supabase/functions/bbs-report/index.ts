// /supabase/functions/bbs-report/index.ts
import { cors, createAdminClient, resolveDeviceHash, validateBody } from "../_shared/bbs.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors(req);

  try {
    const supabase = createAdminClient();
    const { hash: deviceHash } = await resolveDeviceHash(req);
    const { targetType, targetId, reason } = await req.json();

    if (!["thread", "post"].includes(targetType)) return cors(req, { error: "targetType は 'thread' か 'post'" }, 400);
    if (!targetId) return cors(req, { error: "targetId が必要です" }, 400);

    // 簡易バリデーション（reportは短文でOK）
    const r = (reason ?? "").toString().slice(0, 300);
    const err = validateBody(r, { maxLen: 300, maxLines: 10 });
    if (err) return cors(req, { error: err }, 400);

    const ins = await supabase.from("bbs_reports").insert({
      target_type: targetType,
      target_id: targetId,
      reason: r,
      reporter_device_hash: deviceHash,
    }).select("id, created_at").single();

    if (ins.error) return cors(req, { error: ins.error.message }, 500);
    return cors(req, { ok: true, reportId: ins.data.id }, 201);
  } catch (e) {
    return cors(req, { error: String(e?.message ?? e) }, 500);
  }
});
