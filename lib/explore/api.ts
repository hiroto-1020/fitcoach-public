// lib/explore/api.ts
import { supabase } from "../supabase";

export type ExploreCategory = "workout" | "motivation" | "music" | "all";

// DBのビューは thumb_high と thumb_url のどちらか/両方がある想定
export type ExploreItem = {
  yt_id: string;
  title: string;
  channel_title: string | null;
  thumb_high: string | null;
  thumb_url: string | null;
  published_at: string | null;
  category: "workout" | "motivation" | "music";
  rank: number;
};

// 画面側が使う最終形
export type ExploreClientItem = {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
};

export type ExploreMeta = {
  refreshed_at: string;
  cnt_workout: number;
  cnt_motivation: number;
  cnt_music: number;
};

export async function fetchExploreCache(params: {
  category: ExploreCategory;
  search?: string;
  topPerCat?: number;
}): Promise<ExploreClientItem[]> {
  const { category, search = "", topPerCat = 60 } = params;
  const cats =
    category === "all" ? (["workout", "motivation", "music"] as const) : [category];

  let q = supabase
    .from("v_explore_feed")
    // ← thumb_high と thumb_url を両方取得（どちらか無くてもOK）
    .select("yt_id,title,channel_title,thumb_high,thumb_url,published_at,category,rank")
    .in("category", cats as any);

  const k = search.trim();
  if (k) {
    const esc = k.replace(/[%_]/g, "\\$&");
    q = q
      .or(`title.ilike.%${esc}%,channel_title.ilike.%${esc}%`)
      .order("published_at", { ascending: false })
      .limit(120);
  } else {
    q = q
      .lte("rank", topPerCat)
      .order("category", { ascending: true })
      .order("rank", { ascending: true });
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  // サムネは thumb_high → thumb_url → img.youtube.com の順で採用
  const toClient = (x: ExploreItem): ExploreClientItem => ({
    id: x.yt_id,
    title: x.title,
    channelTitle: x.channel_title ?? "",
    thumbnailUrl:
      x.thumb_high ??
      x.thumb_url ??
      (x.yt_id ? `https://img.youtube.com/vi/${x.yt_id}/hqdefault.jpg` : ""),
    publishedAt: x.published_at ?? "",
  });

  return (data ?? []).map(toClient);
}

export async function fetchExploreMeta(): Promise<ExploreMeta | null> {
  const { data, error } = await supabase
    .from("v_explore_meta")
    .select("refreshed_at,cnt_workout,cnt_motivation,cnt_music")
    .order("refreshed_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}

export async function requestExploreRefresh(mode: "full" | "health" = "full") {
  const { data, error } = await supabase.functions.invoke("explore-refresh", {
    body: { mode },
  });
  if (error) throw new Error(error.message);
  return data as { ok: boolean; note?: string };
}
