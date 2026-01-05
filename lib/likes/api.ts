import { supabase } from "../supabase";

const DAILY_FREE_LIMIT = 10;

export function getNextLocalMidnight(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next;
}

export function getLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type LikeStatus = {
  freeRemaining: number;
  paidRemaining: number;
  totalRemaining: number;
  nextResetAt: number;
};

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("ログインが必要です");
  return data.user.id;
}

export async function fetchLikeStatus(): Promise<LikeStatus> {
  const userId = await getCurrentUserId();
  const todayStr = getLocalDateString();

  const { data: counterRow, error: counterErr } = await supabase
    .from("like_counters")
    .select("*")
    .eq("user_id", userId)
    .eq("jst_date", todayStr)
    .maybeSingle();

  let freeUsed = 0;

  if (!counterRow) {
    const { error: insertErr } = await supabase
      .from("like_counters")
      .insert([{ user_id: userId, jst_date: todayStr, free_used: 0 }]);
    if (insertErr) throw insertErr;
  } else if (counterErr) {
    throw counterErr;
  } else {
    freeUsed = counterRow.free_used ?? 0;
  }

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

export async function tryConsumeLike(): Promise<{
  ok: boolean;
  source?: "free" | "paid";
}> {
  const userId = await getCurrentUserId();
  const todayStr = getLocalDateString();

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
