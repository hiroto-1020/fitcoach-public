// lib/likes/api.ts
import { supabase } from "../supabase";

const DAILY_FREE_LIMIT = 10;

/** 端末のローカル時間を使って「次の深夜0:00（日本時間）」を計算 */
export function getNextLocalMidnight(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0); // 端末ローカルの翌日0:00
  return next;
}

/** 端末のローカル時間ベースで YYYY-MM-DD を返す（日本在住前提の簡易版） */
export function getLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type LikeStatus = {
  freeRemaining: number;
  paidRemaining: number;   // 今日は常に0の想定（後で課金で増える）
  totalRemaining: number;
  nextResetAt: number;     // ms
};

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("ログインが必要です");
  return data.user.id;
}

/** 今日の行がなければ作る   現在の残数を返す */
export async function fetchLikeStatus(): Promise<LikeStatus> {
  const userId = await getCurrentUserId();
  const todayStr = getLocalDateString();

  // like_counters：本日分を取得
  const { data: counterRow, error: counterErr } = await supabase
    .from("like_counters")
    .select("*")
    .eq("user_id", userId)
    .eq("jst_date", todayStr)
    .maybeSingle();

  let freeUsed = 0;

  if (!counterRow) {
    // なければ作成（free_used=0）
    const { error: insertErr } = await supabase
      .from("like_counters")
      .insert([{ user_id: userId, jst_date: todayStr, free_used: 0 }]);
    if (insertErr) throw insertErr;
  } else if (counterErr) {
    throw counterErr;
  } else {
    freeUsed = counterRow.free_used ?? 0;
  }

  // like_wallets：購入残（今は0想定／将来の拡張用）
  const { data: wallet } = await supabase
    .from("like_wallets")
    .select("paid_remaining")
    .eq("user_id", userId)
    .maybeSingle();

  const paidRemaining = wallet?.paid_remaining ?? 0;
  const freeRemaining = Math.max(DAILY_FREE_LIMIT - freeUsed, 0);
  const totalRemaining = freeRemaining + paidRemaining;

  return {
    freeRemaining,
    paidRemaining,
    totalRemaining,
    nextResetAt: getNextLocalMidnight().getTime(),
  };
}

/** いいねを1つ消費できるなら消費して true、無理なら false */
export async function tryConsumeLike(): Promise<{
  ok: boolean;
  source?: "free" | "paid";
}> {
  const userId = await getCurrentUserId();
  const todayStr = getLocalDateString();

  // 最新の free_used / paid_remaining を取得
  const [{ data: counter }, { data: wallet }] = await Promise.all([
    supabase
      .from("like_counters")
      .select("*")
      .eq("user_id", userId)
      .eq("jst_date", todayStr)
      .maybeSingle(),
    supabase
      .from("like_wallets")
      .select("paid_remaining")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  let freeUsed = counter?.free_used ?? 0;
  const paidRemaining = wallet?.paid_remaining ?? 0;

  // 優先：無料   次に購入
  if (freeUsed < DAILY_FREE_LIMIT) {
    const { error } = await supabase
      .from("like_counters")
      .update({ free_used: freeUsed + 1 })
      .eq("user_id", userId)
      .eq("jst_date", todayStr);
    if (error) return { ok: false };
    return { ok: true, source: "free" };
  }

  if (paidRemaining > 0) {
    const { error } = await supabase
      .from("like_wallets")
      .update({ paid_remaining: paidRemaining - 1 })
      .eq("user_id", userId);
    if (error) return { ok: false };
    return { ok: true, source: "paid" };
  }

  return { ok: false };
}
