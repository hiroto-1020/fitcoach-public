// lib/gotore/api.ts — 完全版（UPDATE限定・検証カラム不触・性別ロックRPC）

import { Alert } from 'react-native';
import { BuddyMode, Candidate, Gender, Profile, SettingsRow, UserRow } from './types';
import { supabase, SUPABASE_URL } from '../supabase';
import * as FileSystem from 'expo-file-system';

const IMAGE_BUCKET = 'message-images';
const PROFILE_BUCKET = 'profile-photos';

const PROFILE_COLS = `
  user_id,
  nickname,
  home_gym_location,
  preferred_training_tags,
  region, region_code, region_label,
  bio, training_years, goal, training_frequency_per_week, height_cm,
  training_level, pr_lifts, available_days, preferred_times,
  photos, avatar_url,
  gender,
  verified_status,
  verified_person_id,
  updated_at
` as const;

/* ================= 互換判定 ================= */
export function isCompatible(buddyMode: BuddyMode, otherGender: Gender) {
  if (buddyMode === 'any') return true;
  if (buddyMode === 'male_only') return otherGender === 'male';
  if (buddyMode === 'female_only') return otherGender === 'female';
  return false;
}
export function isPairCompatible(
  myMode: BuddyMode, myGender: Gender, otherMode: BuddyMode, otherGender: Gender
) {
  return isCompatible(myMode, otherGender) && isCompatible(otherMode, myGender);
}

/* ================= Auth / 自分情報 ================= */
export async function getMe() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return undefined;
  return data.user;
}

export async function ensureMyUserRow(gender: Gender = 'unknown'): Promise<UserRow> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { data } = await supabase.from('users').select('user_id, gender').eq('user_id', me.id).maybeSingle();
  if (data) return data as UserRow;
  const { data: inserted, error } = await supabase
    .from('users').insert({ user_id: me.id, gender }).select('user_id, gender').single();
  if (error) throw error;
  return inserted as UserRow;
}

export async function ensureMySettingsRow(): Promise<SettingsRow> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { data } = await supabase.from('settings').select('user_id, buddy_gender_mode').eq('user_id', me.id).maybeSingle();
  if (data) return data as SettingsRow;
  const { data: inserted, error } = await supabase
    .from('settings').insert({ user_id: me.id }).select('user_id, buddy_gender_mode').single();
  if (error) throw error;
  return inserted as SettingsRow;
}

export async function getMyUserAndSettings(): Promise<{ user: UserRow; settings: SettingsRow }> {
  const user = await ensureMyUserRow();
  const settings = await ensureMySettingsRow();
  return { user, settings };
}

export async function updateMyBuddyMode(mode: BuddyMode): Promise<SettingsRow> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { data, error } = await supabase
    .from('settings')
    .update({ buddy_gender_mode: mode })
    .eq('user_id', me.id)
    .select('user_id, buddy_gender_mode')
    .single();
  if (error) throw error;
  return data as SettingsRow;
}

export async function setSeekingBuddyOn() {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { error } = await supabase.from('profiles')
    .upsert({ user_id: me.id, seeking_buddy: true }, { onConflict: 'user_id' });
  if (error) throw error;
}

/* ================= オンボーディング要否 ================= */
export async function needsGotoreOnboarding() {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const [{ data: u }, { data: p }] = await Promise.all([
    supabase.from('users').select('user_id, gender').eq('user_id', me.id).single(),
    supabase.from('profiles').select('user_id, nickname, region').eq('user_id', me.id).maybeSingle(),
  ]);
  const gender: Gender = (u as any)?.gender ?? 'unknown';
  const nickname = (p as any)?.nickname ?? null;
  const region = (p as any)?.region ?? null;

  const missing: { key: 'nickname' | 'gender' | 'region'; label: string }[] = [];
  if (!nickname || !String(nickname).trim()) missing.push({ key: 'nickname', label: 'ニックネーム' });
  if (!gender || gender === 'unknown') missing.push({ key: 'gender', label: '性別' });
  if (!region) missing.push({ key: 'region', label: '地域' });

  return { required: missing.length > 0, missing };
}

/* ================= ブロック補助 ================= */
async function getBlockSetsForMe(meId: string) {
  const [{ data: myBlocks }, { data: blocksMe }] = await Promise.all([
    supabase.from('blocks').select('blocked').eq('blocker', meId),
    supabase.from('blocks').select('blocker').eq('blocked', meId),
  ]);
  const iBlock = new Set<string>((myBlocks ?? []).map((r: any) => r.blocked as string));
  const blockMe = new Set<string>((blocksMe ?? []).map((r: any) => r.blocker as string));
  return { iBlock, blockMe };
}
async function getBlockedSet(): Promise<Set<string>> {
  const me = await getMe();
  if (!me) return new Set();
  const [a, b] = await Promise.all([
    supabase.from('blocks').select('blocked').eq('blocker', me.id),
    supabase.from('blocks').select('blocker').eq('blocked', me.id),
  ]);
  const ids = new Set<string>();
  (a.data ?? []).forEach((r: any) => ids.add(r.blocked));
  (b.data ?? []).forEach((r: any) => ids.add(r.blocker));
  return ids;
}

/* ================= フィード（地域 + 各種フィルタ） ================= */
export type FeedFilters = {
  tagsAny?: string[];          // 例: ["ベンチ","減量"]
  gymQuery?: string;           // 例: "博多"（ホームジム部分一致）
  hideLiked?: boolean;         // 自分がいいね済みを除外
  verifiedOnly?: boolean;      // 本人確認済みだけ表示
};

export async function fetchBuddyFeedWithFilters(
  filters: FeedFilters,
  limit = 60
): Promise<Candidate[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return [];

  // 自分の地域
  const { data: me } = await supabase
    .from("profiles")
    .select("region,region_code,region_label")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  // profiles のみ取得（JOIN しない）
  let q = supabase
    .from("profiles")
    .select(PROFILE_COLS, { count: "exact" })
    .neq("user_id", auth.user.id)
    .limit(limit);

  // 地域フィルタ
  if (me?.region) q = q.eq("region", me.region);
  else if (me?.region_label) q = q.eq("region_label", me.region_label);
  else if (me?.region_code) q = q.eq("region_code", me.region_code);

  if (filters.verifiedOnly) q = q.eq("verified_status", "verified");

  if (filters.tagsAny?.length) {
    q = q.overlaps("preferred_training_tags", filters.tagsAny);
  }

  if (filters.gymQuery?.trim()) {
    q = q.ilike("home_gym_location", `%${filters.gymQuery.trim()}%`);
  }

  if (filters.hideLiked) {
    const { data: liked } = await supabase
      .from("likes")
      .select("to_user")
      .eq("from_user", auth.user.id);
    const likedIds: string[] = (liked ?? []).map((r: any) => r.to_user as string);
    if (likedIds.length) {
      const list = `(${likedIds.join(",")})`;
      if (list.length < 6000) {
        q = q.not("user_id", "in", list);
      } else {
        for (const id of likedIds) q = q.neq("user_id", id);
      }
    }
  }

  const { data: profiles, error } = await q;
  if (error) throw error;
  if (!profiles?.length) return [];

  const rank = (s?: string) =>
    s === "verified" ? 0 :
    s === "pending"  ? 1 :
    s === "unverified" || s == null ? 2 : 3;

  const sorted = (profiles as any[]).slice().sort((a, b) => {
    const ra = rank(a.verified_status);
    const rb = rank(b.verified_status);
    if (ra !== rb) return ra - rb;
    const au = a.updated_at ?? "";
    const bu = b.updated_at ?? "";
    return bu > au ? 1 : bu < au ? -1 : 0;
  });

  // users / settings を一括取得
  const ids = sorted.map((p) => p.user_id);
  const [{ data: users }, { data: settings }] = await Promise.all([
    supabase.from("users").select("user_id, gender").in("user_id", ids),
    supabase.from("settings").select("user_id, buddy_gender_mode").in("user_id", ids),
  ]);

  const userMap = new Map<string, { user_id: string; gender: Gender }>();
  (users ?? []).forEach((u: any) =>
    userMap.set(u.user_id, {
      user_id: u.user_id,
      gender: (u.gender as Gender) ?? "unknown",
    })
  );

  const settingsMap = new Map<string, { user_id: string; buddy_gender_mode: BuddyMode }>();
  (settings ?? []).forEach((s: any) =>
    settingsMap.set(s.user_id, {
      user_id: s.user_id,
      buddy_gender_mode: (s.buddy_gender_mode as BuddyMode) ?? "any",
    })
  );

  return sorted.map((row: any) => {
    const toInt = (v: any) => {
      if (v == null) return null;
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string") { const m = v.match(/\d+/); return m ? Number(m[0]) : null; }
      return null;
    };
    const goal = row.goal ?? row.goals ?? null;
    const freq = row.training_frequency_per_week ?? row.training_frequency ?? toInt(row.availability);

    return {
      profile: {
        user_id: row.user_id,
        nickname: row.nickname,
        home_gym_location: row.home_gym_location,
        preferred_training_tags: row.preferred_training_tags,
        region: row.region,
        region_code: row.region_code,
        region_label: row.region_label,
        bio: row.bio,
        training_years: row.training_years,
        goal,
        training_frequency_per_week: freq,
        height_cm: row.height_cm,
        training_level: row.training_level,
        pr_lifts: row.pr_lifts,
        available_days: row.available_days,
        preferred_times: row.preferred_times,
        photos: row.photos,
        avatar_url: row.avatar_url,
        gender: row.gender,
        verified_status: row.verified_status,
        verified_person_id: row.verified_person_id,
        updated_at: row.updated_at,
      },
      user: userMap.get(row.user_id) ?? { user_id: row.user_id, gender: "unknown" },
      settings: settingsMap.get(row.user_id) ?? { user_id: row.user_id, buddy_gender_mode: "any" },
    } as Candidate;
  });
}

export async function getProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      user_id,
      nickname,
      home_gym_location,
      preferred_training_tags,
      region, region_code, region_label,
      bio, training_years, goals, availability, height_cm,
      training_level, training_frequency, pr_lifts, available_days, preferred_times,
      photos, avatar_url,
      gender,
      verified_status,
      verified_person_id,
      updated_at
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as any;
}

/* ================= 旧シンプル版（互換） ================= */
export async function fetchBuddyFeed(limit = 40): Promise<Candidate[]> {
  return fetchBuddyFeedWithFilters({}, limit);
}

/* ================= いいね（前判定 + ブロック判定） ================= */
export async function sendLikeWithPrecheck(toUserId: string) {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');

  const [{ iBlock, blockMe }, { user: myUser, settings: mySettings }] = await Promise.all([
    getBlockSetsForMe(me.id),
    getMyUserAndSettings(),
  ]);
  if (iBlock.has(toUserId) || blockMe.has(toUserId)) {
    Alert.alert('送信できません', 'ブロックしている／されている相手には送れません。');
    return { sent: false };
  }

  const [{ data: u }, { data: s }] = await Promise.all([
    supabase.from('users').select('user_id, gender').eq('user_id', toUserId).single(),
    supabase.from('settings').select('user_id, buddy_gender_mode').eq('user_id', toUserId).single(),
  ]);
  const otherGender: Gender = (u?.gender as Gender) ?? 'unknown';
  const otherMode: BuddyMode = (s?.buddy_gender_mode as BuddyMode) ?? 'any';

  const ok = isPairCompatible(
    mySettings.buddy_gender_mode, myUser.gender, otherMode, otherGender
  );
  if (!ok) {
    Alert.alert('条件が一致しません', '相手の募集条件と一致しないため、いいねできません。');
    return { sent: false };
  }

  const { error } = await supabase.from('likes').insert({
    from_user: me.id,
    to_user: toUserId,
    type: 'normal',
  });
  if (error) throw error;
  return { sent: true };
}

/* ================= マッチ一覧（未読数 + ブロック除外） ================= */
export type MatchListItem = {
  match_id: string;
  other_user_id: string;
  nickname: string | null;
  last_message_at: string | null;
};

export async function fetchMyMatches(): Promise<MatchListItem[]> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');

  const [{ data: matches, error }, blockedSet] = await Promise.all([
    supabase
      .from('matches')
      .select('id, user_a, user_b, last_message_at, created_at, closed_at')
      .or(`user_a.eq.${me.id},user_b.eq.${me.id}`)
      .is('closed_at', null)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    getBlockedSet(),
  ]);
  if (error) throw error;
  if (!matches?.length) return [];

  const visibleMatches = (matches as any[]).filter((m) => {
    const other = m.user_a === me.id ? m.user_b : m.user_a;
    return !blockedSet.has(other);
  });

  const others = visibleMatches.map((m: any) => (m.user_a === me.id ? m.user_b : m.user_a));
  const { data: profs } = await supabase.from('profiles').select('user_id, nickname').in('user_id', others);

  const nickMap = new Map<string, string | null>();
  (profs || []).forEach((p: any) => nickMap.set(p.user_id, p.nickname ?? null));

  return visibleMatches.map((m) => {
    const other = m.user_a === me.id ? m.user_b : m.user_a;
    return {
      match_id: m.id,
      other_user_id: other,
      nickname: nickMap.get(other) ?? '名無し',
      last_message_at: m.last_message_at ?? null,
    } as MatchListItem;
  });
}

/* ====== チャット一覧（未読 + ブロック除外） ====== */
export type MatchRow = {
  id: string;
  other_user_id: string;
  other_nickname: string | null;
  other_gender: Gender;
  last_message_at: string | null;
  unread_count: number;
};
export type ChatInboxItem = MatchRow;

export async function fetchMatchesWithUnread(): Promise<MatchRow[]> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');

  const [{ data: matches, error: mErr }, blockedSet] = await Promise.all([
    supabase
      .from('matches')
      .select('id, user_a, user_b, last_message_at, created_at, closed_at')
      .or(`user_a.eq.${me.id},user_b.eq.${me.id}`)
      .is('closed_at', null)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    getBlockedSet(),
  ]);
  if (mErr) throw mErr;
  if (!matches || matches.length === 0) return [];

  const visibleMatches = (matches as any[]).filter((m) => {
    const other = m.user_a === me.id ? m.user_b : m.user_a;
    return !blockedSet.has(other);
  });

  const matchIds = visibleMatches.map((m: any) => m.id);
  const others = visibleMatches.map((m: any) => (m.user_a === me.id ? m.user_b : m.user_a));

  const [{ data: profs }, { data: users }] = await Promise.all([
    supabase.from('profiles').select('user_id, nickname').in('user_id', others),
    supabase.from('users').select('user_id, gender').in('user_id', others),
  ]);

  const nickMap = new Map<string, string | null>();
  (profs || []).forEach((p: any) => nickMap.set(p.user_id, p.nickname ?? null));
  const genderMap = new Map<string, Gender>();
  (users || []).forEach((u: any) => genderMap.set(u.user_id, (u.gender as Gender) ?? 'unknown'));

  const { data: unreadRows } = await supabase
    .from('messages')
    .select('match_id')
    .is('read_at', null)
    .neq('from_user', me.id)
    .in('match_id', matchIds);

  const countMap = new Map<string, number>();
  (unreadRows || []).forEach((r: any) => {
    countMap.set(r.match_id, (countMap.get(r.match_id) ?? 0) + 1);
  });

  return visibleMatches.map((m) => {
    const other = m.user_a === me.id ? m.user_b : m.user_a;
    return {
      id: m.id,
      other_user_id: other,
      other_nickname: nickMap.get(other) ?? '名無し',
      other_gender: genderMap.get(other) ?? 'unknown',
      last_message_at: m.last_message_at ?? null,
      unread_count: countMap.get(m.id) ?? 0,
    } as MatchRow;
  });
}

export async function fetchChatInbox(): Promise<ChatInboxItem[]> {
  return fetchMatchesWithUnread();
}

export async function getUnreadSetByMatch(): Promise<Set<string>> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { data: matches } = await supabase.from('matches').select('id').or(`user_a.eq.${me.id},user_b.eq.${me.id}`).is('closed_at', null);
  const ids = (matches ?? []).map((m: any) => m.id);
  if (!ids.length) return new Set();
  const { data: msgs } = await supabase
    .from('messages')
    .select('match_id, from_user, read_at')
    .in('match_id', ids).neq('from_user', me.id).is('read_at', null);
  return new Set((msgs ?? []).map((r: any) => r.match_id));
}

export async function getUnreadTotal(): Promise<number> {
  const set = await getUnreadSetByMatch();
  return set.size;
}

export async function markReadAll(matchId: string) {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .neq('from_user', me.id)
    .is('read_at', null)
    .select('id');
  if (error) throw error;
  return { updated: (data ?? []).length };
}

/* ================= プロフィール編集 ================= */

export async function ensureMyProfileRow() {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', me.id)
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    const { error: e2 } = await supabase.from('profiles').insert({
      user_id: me.id,
      nickname: null,
      home_gym_location: null,
      preferred_training_tags: [],
      seeking_buddy: false,
      region: null,
    });
    if (e2) throw e2;
  }
}

export type MyProfileEdit = {
  nickname: string | null;
  home_gym_location: string | null;
  preferred_training_tags: string[];
  region: string | null;
  bio?: string | null;
  training_years?: number | null;
  height_cm?: number | null;
  photos?: string[];

  // 新
  goal?: string | null;
  training_frequency_per_week?: number | null;

  // 旧（受け取りは可・保存は正規化で新に集約）
  goals?: string | null;
  availability?: string | number | null;
};

export async function getMyProfileAndGender() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("auth required");

  const { data: row, error } = await supabase
    .from("profiles")
    .select(`
      user_id,
      nickname,
      home_gym_location,
      preferred_training_tags,
      region, region_code, region_label,
      bio, training_years, goal, training_frequency_per_week, height_cm,
      training_level, pr_lifts, available_days, preferred_times,
      photos, avatar_url,
      gender,
      verified_status,
      verified_person_id,
      updated_at,
      goals,
      availability,
      training_frequency
    `)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) throw error;

  const toInt = (v: any) => {
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const m = v.match(/\d+/);
      return m ? Number(m[0]) : null;
    }
    return null;
  };

  const profile = row ? {
    ...row,
    goal: row.goal ?? row.goals ?? null,
    training_frequency_per_week:
      row.training_frequency_per_week ??
      row.training_frequency ??
      toInt(row.availability),
  } : null;

  // gender フォールバック
  let gender = (profile as any)?.gender ?? "unknown";
  if (!gender || gender === "unknown") {
    const { data: urow } = await supabase
      .from("users")
      .select("gender")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    gender = (urow?.gender as any) ?? "unknown";
  }

  return { profile: profile as any, gender };
}

/** UPDATE専用：検証カラムを送らず、安全に保存 */
export async function saveMyProfile(input: MyProfileEdit) {
  const me = await getMe();
  if (!me) throw new Error("not_authenticated");

  // まずレコードは必ず存在させる（以降は UPDATE のみ）
  await ensureMyProfileRow();

  const toInt = (v: any) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string") {
      const m = v.match(/\d+/);
      return m ? Number(m[0]) : null;
    }
    return null;
  };

  // 送信許可フィールドのみ構築（検証系カラムは一切含めない）
  const allowed: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  const has = (k: string) => Object.prototype.hasOwnProperty.call(input, k);

  if (has("nickname")) allowed.nickname = input.nickname ?? null;
  if (has("home_gym_location")) allowed.home_gym_location = input.home_gym_location ?? null;
  if (has("region")) allowed.region = input.region ?? null;
  if (has("bio")) allowed.bio = input.bio ?? null;

  if (has("preferred_training_tags")) {
    allowed.preferred_training_tags = Array.isArray(input.preferred_training_tags) ? input.preferred_training_tags : [];
  }

  if (has("training_years")) allowed.training_years = toInt(input.training_years);
  if (has("height_cm")) allowed.height_cm = toInt(input.height_cm);

  if (has("photos")) {
    const photos = (input.photos ?? []).filter((u) => typeof u === "string" && u.length > 0).slice(0, 5);
    allowed.photos = photos;
  }

  if (has("goal") || (input as any).goals !== undefined) {
    const raw = has("goal") ? (input as any).goal : (input as any).goals;
    allowed.goal = (typeof raw === "string" ? raw.trim() : raw) || null;
  }

  if (has("training_frequency_per_week") || (input as any).availability !== undefined) {
    const raw = has("training_frequency_per_week")
      ? (input as any).training_frequency_per_week
      : (input as any).availability;
    allowed.training_frequency_per_week = toInt(raw);
  }

  const { error } = await supabase
    .from("profiles")
    .update(allowed)
    .eq("user_id", me.id);

  if (error) throw error;
}

/* ================= 性別：フロントAPI（変更は set_gender_once 経由） ================= */

type GenderOnceErrorCode =
  | 'gender_locked'
  | 'kyc_pending'
  | 'invalid_or_used_token'
  | 'invalid_gender'
  | 'profile_not_found'
  | 'gender_update_not_allowed'
  | 'unknown';

export type GenderOnceResult =
  | { ok: true }
  | { ok: false; code: GenderOnceErrorCode };

/** UIから渡る Gender を RPCの受理に合わせて正規化 */
function normalizeGenderForRpc(g: Gender): 'male'|'female'|'nonbinary' {
  if (g === 'male' || g === 'female') return g;
  return 'nonbinary'; // 'other' / 'unknown' は nonbinary へ
}

/** set_gender_once を叩く唯一の窓口 */
export async function updateMyGender(gender: Gender, token?: string | null): Promise<GenderOnceResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");

  const { error } = await supabase.rpc('set_gender_once', {
    p_token: token ?? null,
    p_gender: normalizeGenderForRpc(gender),
  });

  if (!error) return { ok: true };

  const msg = String(error.message || '').toLowerCase();
  const map = (m: string): GenderOnceErrorCode => {
    if (m.includes('gender_locked')) return 'gender_locked';
    if (m.includes('kyc_pending')) return 'kyc_pending';
    if (m.includes('invalid_or_used_token')) return 'invalid_or_used_token';
    if (m.includes('invalid_gender')) return 'invalid_gender';
    if (m.includes('profile_not_found')) return 'profile_not_found';
    if (m.includes('gender_update_not_allowed')) return 'gender_update_not_allowed';
    return 'unknown';
  };
  return { ok: false, code: map(msg) };
}

/** 互換：古い呼び出し */
export async function saveMyGender(gender: string) {
  const { error } = await supabase.rpc("save_my_gender", { p_gender: gender });
  if (error) throw new Error(error.message);
}

/** 互換API（以前の setMyGender 呼び出しを踏み替え） */
export async function setMyGender(gender: 'male'|'female'|'other'|'unknown', token?: string | null) {
  const res = await updateMyGender(gender as Gender, token);
  if (!res.ok) throw new Error(res.code);
}

/** 画面用：性別・KYCのゲート情報 */
export type GenderGateState = {
  gender: Gender;
  kyc_status: 'not_started'|'pending'|'approved'|'rejected'|null;
  gender_locked: boolean;
  gender_edit_token: string | null;
};

export async function fetchGenderGateState(): Promise<GenderGateState> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");

  const { data } = await supabase
    .from('profiles')
    .select('gender, kyc_status, gender_locked_at, gender_edit_token')
    .eq('user_id', user.id)
    .maybeSingle();

  const g: Gender = (data?.gender as Gender) ?? 'unknown';
  const k: any = data?.kyc_status ?? null;
  const locked = !!data?.gender_locked_at;

  return {
    gender: g,
    kyc_status: k,
    gender_locked: locked,
    gender_edit_token: data?.gender_edit_token ?? null,
  };
}

/* ================= チャット ================= */
export type ChatMessage = {
  id: string;
  match_id: string;
  from_user: string;
  text: string | null;
  attachments: any | null;
  read_at: string | null;
  created_at: string;
};

export async function fetchMessages(matchId: string): Promise<ChatMessage[]> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { data, error } = await supabase
    .from('messages')
    .select('id, match_id, from_user, text, attachments, read_at, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendMessage(matchId: string, text: string) {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const body = (text ?? '').trim();
  if (!body) return;
  const { error } = await supabase.from('messages').insert({
    match_id: matchId, from_user: me.id, text: body,
  });
  if (error) throw error;
}

export function subscribeMessages(
  matchId: string,
  onInsert: (msg: ChatMessage) => void,
  onUpdate?: (msg: ChatMessage) => void
) {
  const channel = supabase
    .channel(`msg-${matchId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
      (payload) => onInsert(payload.new as ChatMessage));
  if (onUpdate) {
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
      (payload) => onUpdate(payload.new as ChatMessage));
  }
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}

function guessMime(ext: string) {
  const e = ext.toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'png') return 'image/png';
  if (e === 'heic') return 'image/heic';
  return 'application/octet-stream';
}
export async function sendImageMessage(matchId: string, localUri: string) {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const ext = (localUri.split('.').pop() || 'jpg').replace('jpeg', 'jpg').toLowerCase();
  const path = `${me.id}/${matchId}/${Date.now()}.${ext}`;

  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error('no_session');

  const baseUrl = SUPABASE_URL;
  const uploadUrl = `${baseUrl}/storage/v1/object/${IMAGE_BUCKET}/${encodeURI(path)}`;

  const form = new FormData();
  form.append('file', { uri: localUri, name: `upload.${ext}`, type: guessMime(ext) } as any);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'x-upsert': 'false' },
    body: form,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`upload_failed: ${res.status} ${txt}`);
  }

  const publicUrl = `${baseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${encodeURI(path)}`;
  const { error } = await supabase.from('messages').insert({
    match_id: matchId, from_user: me.id, text: null, attachments: { images: [{ url: publicUrl }] },
  });
  if (error) throw error;
}

// RN安全版：FormData + 直POST
export async function uploadProfilePhoto(localUri: string): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("not_authenticated");
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("no_session");

  const noQuery = localUri.split("?")[0];
  let ext = (noQuery.split(".").pop() || "jpg").toLowerCase();
  if (!["jpg","jpeg","png","webp","heic","heif"].includes(ext)) ext = "jpg";
  const contentType =
    ext === "png" ? "image/png" :
    ext === "webp" ? "image/webp" :
    (ext === "heic" || ext === "heif") ? "image/heic" :
    "image/jpeg";

  const key = `${auth.user.id}/${Date.now()}.${ext}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${PROFILE_BUCKET}/${encodeURI(key)}`;

  const form = new FormData();
  form.append("file", { uri: localUri, name: `upload.${ext}`, type: contentType } as any);

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "x-upsert": "false" },
    body: form,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`upload_failed: ${res.status} ${txt}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${PROFILE_BUCKET}/${encodeURI(key)}`;
}

/** 並び替え/削除を含む写真配列を保存（UPDATEのみ・最大5枚） */
export async function saveProfilePhotos(urls: string[]) {
  const me = await getMe();
  if (!me) throw new Error("not_authenticated");
  await ensureMyProfileRow();
  const { error } = await supabase
    .from("profiles")
    .update({ photos: urls.slice(0, 5), updated_at: new Date().toISOString() })
    .eq("user_id", me.id);
  if (error) throw error;
}

/* ================= Safety：ブロック／マッチ解除・相手取得 ================= */
export async function getMatchOtherUser(matchId: string): Promise<string> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { data, error } = await supabase
    .from('matches')
    .select('user_a, user_b')
    .eq('id', matchId)
    .single();
  if (error || !data) throw error ?? new Error('match_not_found');
  return data.user_a === me.id ? data.user_b : data.user_a;
}

export type MatchMeta = { match_id: string; other_user_id: string; closed_at: string | null };
export async function getMatchMeta(matchId: string): Promise<MatchMeta> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { data, error } = await supabase
    .from('matches')
    .select('id, user_a, user_b, closed_at')
    .eq('id', matchId)
    .single();
  if (error) throw error;
  const other = (data as any).user_a === me.id ? (data as any).user_b : (data as any).user_a;
  return { match_id: (data as any).id, other_user_id: other, closed_at: (data as any).closed_at ?? null };
}

export async function blockUser(targetUserId: string) {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker: me.id, blocked: targetUserId });
  if (error && String(error.message).includes('duplicate key value')) {
    return { ok: true, already: true };
  }
  if (error) throw error;
  return { ok: true };
}

export async function unblockUser(targetUserId: string) {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker', me.id)
    .eq('blocked', targetUserId);
  if (error) throw error;
  return { ok: true };
}

export async function unmatch(matchId: string) {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');

  const { error: rpcErr } = await supabase.rpc('app_unmatch', {
    p_match_id: matchId,
    p_by: me.id,
  });
  if (!rpcErr) return { ok: true };

  const { error } = await supabase
    .from('matches')
    .update({ closed_at: new Date().toISOString() })
    .eq('id', matchId)
    .or(`user_a.eq.${me.id},user_b.eq.${me.id}`);
  if (error) throw error;
  return { ok: true };
}

/* ================= Safety：通報 & ミュート ================= */
export type ReportCategory = 'spam' | 'harassment' | 'inappropriate' | 'other';

export async function reportUser(params: {
  targetUserId: string;
  matchId?: string | null;
  category: ReportCategory;
  detail?: string;
}) {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');

  const try1 = await supabase.from('reports').insert({
    reporter: me.id,
    target: params.targetUserId,
    match_id: params.matchId ?? null,
    category: params.category,
    detail: (params.detail ?? '').trim() || null,
  });

  if (try1.error) {
    const try2 = await supabase.from('reports').insert({
      reporter: me.id,
      target: params.targetUserId,
      reason: params.category,
      note: (params.detail ?? '').trim() || null,
    });
    if (try2.error) throw try1.error;
  }

  Alert.alert('通報を受け付けました', '運営が内容を確認します。');
  return { ok: true };
}

export async function isMuted(targetUserId: string): Promise<boolean> {
  const me = await getMe(); if (!me) return false;
  const { data, error } = await supabase
    .from('mutes')
    .select('muted')
    .eq('muter', me.id)
    .eq('muted', targetUserId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function muteUser(targetUserId: string) {
  const me = await getMe(); if (!me) throw new Error('not_authenticated');
  const { error } = await supabase
    .from('mutes')
    .upsert({ muter: me.id, muted: targetUserId }, { onConflict: 'muter,muted' });
  if (error) throw error;
  return { ok: true };
}

export async function unmuteUser(targetUserId: string) {
  const me = await getMe(); if (!me) throw new Error('not_authenticated');
  const { error } = await supabase
    .from('mutes')
    .delete()
    .eq('muter', me.id)
    .eq('muted', targetUserId);
  if (error) throw error;
  return { ok: true };
}

/* ================= 受け取ったいいね ================= */
export type ReceivedLike = {
  from_user_id: string;
  nickname: string | null;
  gender: Gender;
  created_at: string;
};

export async function fetchReceivedLikes(): Promise<ReceivedLike[]> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');

  const { data: likes, error } = await supabase
    .from('likes')
    .select('from_user, to_user, created_at')
    .eq('to_user', me.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!likes?.length) return [];

  const latestMap = new Map<string, string>();
  for (const r of likes as any[]) {
    if (!latestMap.has(r.from_user)) latestMap.set(r.from_user, r.created_at);
  }
  const senders = Array.from(latestMap.keys());

  const [{ data: blocks1 }, { data: blocks2 }, { data: openMatches }] = await Promise.all([
    supabase.from('blocks').select('blocked').eq('blocker', me.id).in('blocked', senders),
    supabase.from('blocks').select('blocker').eq('blocked', me.id).in('blocker', senders),
    supabase.from('matches')
      .select('user_a, user_b, closed_at')
      .or(`user_a.eq.${me.id},user_b.eq.${me.id}`)
      .is('closed_at', null),
  ]);
  const blocked = new Set<string>();
  (blocks1 ?? []).forEach((x: any) => blocked.add(x.blocked));
  (blocks2 ?? []).forEach((x: any) => blocked.add(x.blocker));
  const alreadyMatched = new Set<string>(
    (openMatches ?? []).map((m: any) => (m.user_a === me.id ? m.user_b : m.user_a))
  );

  const candidates = senders.filter(id => !blocked.has(id) && !alreadyMatched.has(id));
  if (!candidates.length) return [];

  const [{ data: profs }, { data: users }] = await Promise.all([
    supabase.from('profiles').select('user_id, nickname').in('user_id', candidates),
    supabase.from('users').select('user_id, gender').in('user_id', candidates),
  ]);
  const nick = new Map(candidates.map(id => [id, null as string | null]));
  (profs ?? []).forEach((p: any) => nick.set(p.user_id, p.nickname ?? null));
  const gen = new Map<string, Gender>();
  (users ?? []).forEach((u: any) => gen.set(u.user_id, (u.gender as Gender) ?? 'unknown'));

  return candidates.map(id => ({
    from_user_id: id,
    nickname: nick.get(id) ?? '名無し',
    gender: gen.get(id) ?? 'unknown',
    created_at: latestMap.get(id)!,
  }));
}

export async function subscribeReceivedLikes(onChange: () => void) {
  const me = await getMe();
  if (!me) return () => {};
  const ch = supabase
    .channel(`rx-likes-${me.id}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'likes', filter: `to_user=eq.${me.id}`
    }, () => onChange())
    .subscribe();
  return () => supabase.removeChannel(ch);
}

export async function fetchReceivedLikesCount(): Promise<number> {
  const { data, error } = await supabase.rpc('app_received_likes_count');
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function acceptReceivedLike(otherUserId: string) {
  const { data, error } = await supabase.rpc('app_accept_like_basic', { p_other: otherUserId });
  if (error) throw error;
  const mid = Array.isArray(data) && data.length ? (data[0] as any)?.match_id ?? null : null;
  return { sent: true, match_id: mid };
}

export async function fetchLatestMatchWith(otherUserId: string) {
  const { data, error } = await supabase.rpc('app_latest_match_with', { p_other: otherUserId });
  if (error) throw error;
  return data ? { id: data as string } : null;
}

export async function dismissReceivedLike(fromUserId: string) {
  const { error } = await supabase.rpc('app_dismiss_like', { p_from: fromUserId });
  if (error && !String(error.message).toLowerCase().includes('function')) throw error;
}
export async function skipReceivedLike(fromUserId: string) {
  return dismissReceivedLike(fromUserId);
}

/* =========================================================
   Stage7：距離・タグ一致スコア・ページング（無限スクロール）
   ========================================================= */

export type LatLng = { lat: number; lng: number };

export function haversineKm(a: LatLng, b: LatLng) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function saveMyLocation(pos: LatLng) {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { error } = await supabase.from('profiles').update({
    lat: pos.lat,
    lng: pos.lng,
    location_updated_at: new Date().toISOString(),
  }).eq('user_id', me.id);
  if (error) throw error;
}

export type CandidateScored = Candidate & {
  distanceKm?: number;
  tagMatches: number;
};

function decorateScore(
  items: Candidate[],
  myPos?: LatLng | null,
  myTags: string[] = []
): CandidateScored[] {
  const normTags = (arr?: string[]) => (arr ?? []).map(s => s.trim()).filter(Boolean);
  const myTagSet = new Set(normTags(myTags));

  return items.map(it => {
    const otherTags = normTags(it.profile.preferred_training_tags);
    const tagMatches = otherTags.reduce((acc, t) => acc + (myTagSet.has(t) ? 1 : 0), 0);

    let distanceKm: number | undefined = undefined;
    const lat = (it.profile as any).lat as number | undefined;
    const lng = (it.profile as any).lng as number | undefined;
    if (myPos && typeof lat === 'number' && typeof lng === 'number') {
      distanceKm = haversineKm(myPos, { lat, lng });
    }

    return { ...it, tagMatches, distanceKm };
  });
}

export function compareByDistanceAndTags(a: CandidateScored, b: CandidateScored) {
  const aHas = typeof a.distanceKm === 'number';
  const bHas = typeof b.distanceKm === 'number';
  if (aHas && bHas) {
    if (a.distanceKm! !== b.distanceKm!) return a.distanceKm! - b.distanceKm!;
  } else if (aHas !== bHas) {
    return aHas ? -1 : 1;
  }
  if (a.tagMatches !== b.tagMatches) return b.tagMatches - a.tagMatches;
  const au = (a.profile.updated_at ?? '') as string;
  const bu = (b.profile.updated_at ?? '') as string;
  return (bu > au ? 1 : bu < au ? -1 : 0);
}

export async function fetchBuddyFeedPage(
  filters: FeedFilters = {},
  page: number,
  pageSize: number,
  myPos?: LatLng | null
): Promise<{ items: CandidateScored[]; hasMore: boolean }> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');

  const { user: myUser, settings: mySettings } = await getMyUserAndSettings();
  const { profile: myProfile } = await getMyProfileAndGender();
  if (!myProfile.region) {
    const err: any = new Error('region_required');
    err.code = 'region_required';
    throw err;
  }

  const [{ data: myMatches }, blockSets] = await Promise.all([
    supabase.from('matches')
      .select('id, user_a, user_b, closed_at')
      .or(`user_a.eq.${me.id},user_b.eq.${me.id}`),
    getBlockSetsForMe(me.id),
  ]);
  const matchedSet = new Set<string>(
    (myMatches ?? [])
      .filter((m: any) => !m.closed_at)
      .map((m: any) => (m.user_a === me.id ? m.user_b : m.user_a))
  );

  let q = supabase
    .from('profiles')
    .select('user_id, nickname, home_gym_location, preferred_training_tags, seeking_buddy, updated_at, region, lat, lng')
    .eq('seeking_buddy', true)
    .eq('region', myProfile.region)
    .neq('user_id', me.id)
    .order('updated_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (filters.tagsAny && filters.tagsAny.length) {
    q = q.overlaps('preferred_training_tags', filters.tagsAny.map(s => s.trim()).filter(Boolean));
  }
  if (filters.gymQuery && filters.gymQuery.trim()) {
    q = q.ilike('home_gym_location', `%${filters.gymQuery.trim()}%`);
  }

  const { data: profiles, error: pErr } = await q;
  if (pErr) throw pErr;

  const filtered0 = (profiles ?? []).filter((p) =>
    !matchedSet.has(p.user_id) &&
    !blockSets.iBlock.has(p.user_id) &&
    !blockSets.blockMe.has(p.user_id)
  );

  let filtered = filtered0;
  if (filters.hideLiked) {
    const ids = filtered.map((p) => p.user_id);
    if (ids.length) {
      const { data: likes } = await supabase
        .from('likes')
        .select('to_user')
        .eq('from_user', me.id)
        .in('to_user', ids);
      const likedSet = new Set((likes ?? []).map((r: any) => r.to_user as string));
      filtered = filtered.filter((p) => !likedSet.has(p.user_id));
    }
  }

  if (!filtered.length) return { items: [], hasMore: (profiles ?? []).length === pageSize };

  const ids = filtered.map((p) => p.user_id);
  const [{ data: users }, { data: settings }] = await Promise.all([
    supabase.from('users').select('user_id, gender').in('user_id', ids),
    supabase.from('settings').select('user_id, buddy_gender_mode').in('user_id', ids),
  ]);

  const userMap = new Map<string, UserRow>();
  (users || []).forEach((u) => userMap.set(u.user_id, u as UserRow));
  const settingsMap = new Map<string, SettingsRow>();
  (settings || []).forEach((s) => settingsMap.set(s.user_id, s as SettingsRow));

  const compatible: Candidate[] = [];
  for (const p of filtered as Profile[]) {
    const u = userMap.get(p.user_id);
    const s = settingsMap.get(p.user_id);
    const otherGender: Gender = u?.gender ?? 'unknown';
    const otherMode: BuddyMode = s?.buddy_gender_mode ?? 'any';
    const ok = isPairCompatible(
      mySettings.buddy_gender_mode,
      myUser.gender,
      otherMode,
      otherGender
    );
    if (!ok) continue;
    compatible.push({
      profile: p,
      user: { user_id: p.user_id, gender: otherGender },
      settings: { user_id: p.user_id, buddy_gender_mode: otherMode },
    });
  }

  const myTags = myProfile.preferred_training_tags ?? [];
  const decorated = decorateScore(compatible, myPos ?? undefined, myTags);

  return {
    items: decorated,
    hasMore: (profiles ?? []).length === pageSize,
  };
}

/* ================= Stage9 追加：メッセージ削除＆ページング ================= */

export async function deleteMyMessage(messageId: string) {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('from_user', me.id);
  if (error) throw error;
}

export async function fetchMessagesPage(
  matchId: string,
  beforeIso: string,
  limit = 30
): Promise<ChatMessage[]> {
  const me = await getMe();
  if (!me) throw new Error('not_authenticated');

  const { data, error } = await supabase
    .from('messages')
    .select('id, match_id, from_user, text, attachments, read_at, created_at')
    .eq('match_id', matchId)
    .lt('created_at', beforeIso)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).slice().reverse() as ChatMessage[];
}

/* ================= KYC：開始/結果反映 ================= */

export async function startKycSession(provider: 'persona', sessionId: string) {
  const { error } = await supabase.rpc('start_kyc_session', {
    p_provider: provider,
    p_session_id: sessionId,
  });
  if (error) throw error;
  return { ok: true };
}


export async function applyKycResult(status: 'approved' | 'rejected') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not_authenticated');

  // 検証系カラムの反映は安全関数経由（禁止列は自動で間引く）
  await updateProfilesKycSafeFor(user.id, {
    kyc_status: status,
    verified_status: status === 'approved' ? 'verified' : 'rejected',
    kyc_last_result_at: new Date().toISOString(),
  });
}

/* ================= KYC + 性別（簡易取得API：既存と互換） ================= */
export async function getMyKycAndGender(): Promise<{
  verified_status: 'unverified'|'pending'|'verified'|'rejected'|'failed',
  verified_person_id: string | null,
  gender: string | null,
}> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("not_authenticated");

  const uid = auth.user.id;

  const { data: kv } = await supabase
    .from("kyc_verifications")
    .select("provider_status, provider_person_id")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (kv) {
    const mapped =
      kv.provider_status === "approved" ? "verified" :
      kv.provider_status === "rejected" ? "rejected" :
      kv.provider_status === "failed"   ? "failed"   :
      "pending";
    const { data: prof } = await supabase
      .from("profiles")
      .select("gender")
      .eq("user_id", uid)
      .maybeSingle();
    return {
      verified_status: mapped as any,
      verified_person_id: kv.provider_person_id ?? null,
      gender: (prof?.gender ?? "unknown") as any,
    };
  }

  const { data: prof2, error: err2 } = await supabase
    .from("profiles")
    .select("verified_status, verified_person_id, gender")
    .eq("user_id", uid)
    .maybeSingle();

  if (err2) throw err2;

  return {
    verified_status: (prof2?.verified_status ?? "unverified") as any,
    verified_person_id: prof2?.verified_person_id ?? null,
    gender: (prof2?.gender ?? "unknown") as any,
  };
}

/* ================= 内部ヘルパ：profiles へのKYC安全反映 ================= */
async function updateProfilesKycSafeFor(uid: string, patch: Record<string, any>) {
  const tryUpdate = async (keys: string[]) => {
    const body: Record<string, any> = {};
    keys.forEach((k) => { if (k in patch) body[k] = patch[k]; });
    if (!Object.keys(body).length) return;
    const { error } = await supabase.from('profiles').update(body).eq('user_id', uid);
    if (error) throw error;
  };

  try {
    await tryUpdate(Object.keys(patch));
    return;
  } catch (e: any) {
    const msg = String(e?.message ?? '');
    const keys = Object.keys(patch).slice();
    if (msg.includes('kyc_status')) keys.splice(keys.indexOf('kyc_status'), 1);
    if (msg.includes('verified_status')) keys.splice(keys.indexOf('verified_status'), 1);
    if (msg.includes('kyc_last_started_at')) keys.splice(keys.indexOf('kyc_last_started_at'), 1);
    if (msg.includes('kyc_last_result_at')) keys.splice(keys.indexOf('kyc_last_result_at'), 1);
    if (!keys.length) return;
    await tryUpdate(keys);
  }
}

export async function adminSetKycResult(
  kycId: string,
  status: "approved" | "rejected"
) {
  // ← 関数のパラメータ名と**同じ**名前にする（p_kyc_id / p_status）
  const { error } = await supabase.rpc("admin_set_kyc_result", {
    p_kyc_id: kycId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
}