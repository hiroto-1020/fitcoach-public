// lib/gotore/profile-media.ts
import { supabase } from "../supabase";
import type { Gender } from "./types";

export const PROFILE_BUCKET = "profile-photos";

// ---- Gender helpers ----
export function labelGender(g?: Gender | string | null): string {
  switch (normalizeGender(g)) {
    case "male": return "男性";
    case "female": return "女性";
    case "other": return "その他";
    case "unknown":
    default: return "未設定";
  }
}

export function normalizeGender(g?: any): Gender {
  if (g == null) return "unknown";
  const s = String(g).trim().toLowerCase();
  if (["male","m","man","1","男","男性"].includes(s)) return "male";
  if (["female","f","woman","2","女","女性"].includes(s)) return "female";
  if (["other","x","nonbinary","nb","3","その他"].includes(s)) return "other";
  return ["male","female","other","unknown"].includes(s as any) ? s : "unknown";
}

/** 任意の userId の性別を、よくあるテーブル/カラムを横断して補完取得 */
export async function fetchGenderForUser(userId: string): Promise<Gender> {
  if (!userId) return "unknown";
  // よくある候補（環境に合わせて増減可）
  const candidates = [
    { table: "profiles", idCols: ["user_id","id"] },
    { table: "users",    idCols: ["user_id","id"] },
    { table: "app_users", idCols: ["user_id","id"] },
    { table: "user_profiles", idCols: ["user_id","id"] },
  ] as const;

  for (const t of candidates) {
    for (const idCol of t.idCols) {
      const { data, error } = await supabase
        .from(t.table as any)
        .select("*")
        .eq(idCol as any, userId)
        .limit(1);

      const row = (data as any)?.[0];
      if (!error && row) {
        const raw = row.gender ?? row.sex ?? row.gender_code;
        const n = normalizeGender(raw);
        if (n !== "unknown") return n;
      }
    }
  }
  return "unknown";
}

// ---- Photo helpers ----
async function toUrl(path: string): Promise<string | null> {
  const pub = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path)?.data?.publicUrl;
  if (pub) return pub;
  const signed = await supabase.storage.from(PROFILE_BUCKET).createSignedUrl(path, 3600);
  return signed.data?.signedUrl ?? null;
}

/**
 * 1枚目として表示する写真URLを返す。
 * 優先度: profiles.photos[0] → profile_photos(order_index/created_at) → Storage最新更新
 * 返却時に `?v=timestamp` を付与してキャッシュを回避。
 */
export async function getFirstProfilePhotoUrl(userId: string): Promise<string | null> {
  if (!userId) return null;

  // 0) profiles.photos（URL配列）を最優先
  const { data: prof } = await supabase
    .from("profiles")
    .select("photos, updated_at")
    .eq("user_id", userId)
    .limit(1);
  const p0 = prof?.[0];
  const photos = (p0?.photos ?? []) as string[];
  const ver = p0?.updated_at ? new Date(p0.updated_at).getTime() : undefined;
  if (Array.isArray(photos) && photos.length) {
    const u = photos[0];
    return ver ? `${u}${u.includes("?") ? "&" : "?"}v=${ver}` : u;
  }

  // 1) 中間テーブルがある場合
  const { data: rows } = await supabase
    .from("profile_photos")
    .select("storage_path, path, order_index, created_at")
    .eq("user_id", userId)
    .order("order_index", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .limit(1);

  const keyFromRow = rows?.[0] && ((rows[0] as any).storage_path ?? (rows[0] as any).path);
  if (keyFromRow) {
    const u = await toUrl(keyFromRow);
    const withV = ver && u ? `${u}${u.includes("?") ? "&" : "?"}v=${ver}` : u;
    if (withV) return withV;
  }

  // 2) Storage を最新更新順で拾う（ascではなく更新降順）
  const { data: list } = await supabase.storage.from(PROFILE_BUCKET).list(userId, {
    limit: 100, offset: 0, sortBy: { column: "updated_at", order: "desc" as any },
  });
  const newest = (list ?? []).sort((a: any, b: any) => {
    const ta = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
    const tb = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
    return tb - ta;
  })[0];

  if (newest) {
    const u = await toUrl(`${userId}/${newest.name}`);
    const withV = ver && u ? `${u}${u.includes("?") ? "&" : "?"}v=${ver}` : u;
    if (withV) return withV;
  }

  return null;
}
