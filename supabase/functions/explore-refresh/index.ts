// supabase/functions/explore-refresh/index.ts
// Explore feed refresher — 新着優先 + 直近N日で収集 + 日本語優先 + 急上昇(任意)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** ───────────────────────── env helper ───────────────────────── */
const env = (...names: string[]) => {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (typeof v === "string" && v.length) return v;
  }
  return undefined;
};

/** ─────────────────── 必須/任意の設定値 ─────────────────── */
const YT_KEY           = env("YT_KEY", "YOUTUBE_API_KEY");
const SUPABASE_URL     = env("SUPABASE_URL", "PROJECT_URL");
const SERVICE_ROLE_KEY = env("SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SERVICE_KEY", "SERVICE_ROLE");

// 任意（調整可能）
const FEATURE_TRENDING     = (env("FEATURE_TRENDING") ?? "false").toLowerCase() === "true";
const REFRESH_COOLDOWN_MIN = Number(env("REFRESH_COOLDOWN_MIN") ?? "180"); // 3h
const YT_LIMIT             = Number(env("YT_LIMIT") ?? "50");              // 1カテゴリの取得件数（デフォ50）
const YT_DAYS_BACK         = Number(env("YT_DAYS_BACK") ?? "7");           // 直近N日分のみ
const YT_REGION            = env("YT_REGION") ?? "JP";
const YT_LANG              = env("YT_LANG") ?? "ja";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[explore-refresh] Missing Supabase credentials (SUPABASE_URL / SERVICE_ROLE_KEY).");
}
if (!YT_KEY) {
  console.warn("[explore-refresh] YT_KEY is not set. Only `yt_diag` will work.");
}

/** ─────────────────── Supabase (service role) ─────────────────── */
const supa = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

/** ─────────────────────── meta helpers ─────────────────────── */
type MetaRow = { k: string; v: Record<string, unknown> };

async function getLastRefresh(): Promise<Date | null> {
  const { data, error } = await supa
    .from<MetaRow>("explore_meta")
    .select("v")
    .eq("k", "last_refresh")
    .maybeSingle();
  if (error) throw new Error(`meta_read_failed:${error.message}`);
  const ts = (data as any)?.v?.ts as string | undefined;
  return ts ? new Date(ts) : null;
}

async function setLastRefresh(): Promise<void> {
  const payload: MetaRow = { k: "last_refresh", v: { ts: new Date().toISOString() } };
  const { error } = await supa.from<MetaRow>("explore_meta").upsert(payload, { onConflict: "k" });
  if (error) throw new Error(`meta_write_failed:${error.message}`);
}

/** ───────────────────── YouTube helpers ───────────────────── */
async function yt(path: "search" | "videos", params: Record<string, string>) {
  if (!YT_KEY) throw new Error("yt_key_missing");
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", YT_KEY);
  const res = await fetch(url.toString());
  const text = await res.text();
  if (!res.ok) throw new Error(`YouTube ${path} error ${res.status}: ${text}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

type Cat = "workout" | "motivation" | "music";

const SEARCH_QUERY: Record<Cat, string> = {
  workout:
    "筋トレ OR ワークアウト OR トレーニング OR HIIT OR 自重 OR ダンベル OR ベンチプレス OR スクワット OR デッドリフト",
  motivation:
    '(モチベーション OR "モチベ" OR 名言 OR 自己啓発 OR スピーチ OR 講演 OR 受験 OR "勉強 モチベ" OR "仕事 モチベ" OR "ダイエット モチベ") ' +
    "-筋トレ -トレーニング -ワークアウト -ベンチ -スクワット -デッドリフト -HIIT -フォーム -解説 -やり方 -メニュー -胸トレ -背中トレ -肩トレ -脚トレ",
  music:
    "筋トレ BGM OR workout music OR 作業用BGM OR ランニング 音楽 OR HIIT 音楽 OR playlist OR mix",
};

// 並び順に "date" を追加（新着優先）
type Order = "viewCount" | "relevance" | "date";
const CATEGORY_PARAMS: Record<Cat, { order: Order; videoDuration?: "short" | "medium" | "long"; videoCategoryId?: string }> = {
  workout:    { order: "date",      videoDuration: "medium", videoCategoryId: "17" }, // Sports
  motivation: { order: "date",      videoDuration: "medium", videoCategoryId: "27" }, // Education
  music:      { order: "viewCount", videoDuration: "long",   videoCategoryId: "10" }, // Music（安定枠）
};

// クライアント側と同じフィルタ
const F = {
  workout: {
    mustAny: ["筋トレ","ワークアウト","トレーニング","ベンチ","スクワット","デッド","HIIT","自重","ダンベル","腹筋","胸","背中","肩","脚","二の腕","体幹"],
    excludeAny: ["bgm","lofi","playlist","mix","歌ってみた","mv","歌","cover","カラオケ","作業用"],
  },
  motivation: {
    mustAny: ["モチベ","モチベーション","自己啓発","名言","スピーチ","講演","やる気","継続","習慣","メンタル","目標","挫折","続ける","ルーティン"],
    excludeAny: ["筋トレ","トレーニング","ワークアウト","ベンチ","スクワット","デッド","胸トレ","背中トレ","肩トレ","脚トレ","上半身","下半身","二頭","三頭","腹筋","プランク","HIIT","フォーム","解説","やり方","講座","メニュー","種目"],
  },
  music: {
    mustAny: ["bgm","lofi","playlist","mix","remix","instrumental","作業用","workout music","running","edm","hip hop","lo-fi","睡眠用","集中"],
    excludeAny: ["解説","やり方","トレーニング","筋トレ","ベンチ","スクワット","デッド","フォーム","講座"],
  },
} as const;

const normalize = (s: string) => (s || "").toLowerCase();
const containsAny = (text: string, arr: string[]) => arr.some((w) => normalize(text).includes(w.toLowerCase()));
function passesByRule(rule: { mustAny: string[]; excludeAny: string[] }, title: string, channel: string) {
  const t = `${title} ${channel}`;
  return containsAny(t, rule.mustAny) && !containsAny(t, rule.excludeAny);
}
function isJapaneseText(s: string) {
  return /[\u3040-\u30ff\u3400-\u9FFF]/.test(s || "");
}
function prioritizeJapanese<T extends { snippet?: { title?: string; channelTitle?: string } }>(arr: T[]) {
  const jp: T[] = [], non: T[] = [];
  for (const it of arr) {
    const t = it?.snippet?.title || "";
    const c = it?.snippet?.channelTitle || "";
    (isJapaneseText(t) || isJapaneseText(c)) ? jp.push(it) : non.push(it);
  }
  return [...jp, ...non];
}

async function fetchCategory(cat: Cat) {
  const base = SEARCH_QUERY[cat];
  const hint = CATEGORY_PARAMS[cat];
  const since = new Date(Date.now() - YT_DAYS_BACK * 24 * 60 * 60 * 1000).toISOString();

  // 検索（新着優先 + 直近N日）
  const s = await yt("search", {
    part: "snippet",
    type: "video",
    maxResults: String(YT_LIMIT),
    q: base,
    order: hint.order,
    regionCode: YT_REGION,
    relevanceLanguage: YT_LANG,
    videoEmbeddable: "true",
    safeSearch: "strict",
    publishedAfter: since,
    ...(hint.videoCategoryId ? { videoCategoryId: hint.videoCategoryId } : {}),
    ...(hint.videoDuration  ? { videoDuration:  hint.videoDuration  } : {}),
  });
  let items = (s?.items ?? []) as any[];

  // 厳格フィルタ
  items = items.filter((it) => {
    const title = it?.snippet?.title ?? "";
    const ch    = it?.snippet?.channelTitle ?? "";
    return passesByRule((F as any)[cat], title, ch);
  });

  // 急上昇を先頭に（任意）
  if (FEATURE_TRENDING) {
    try {
      const v = await yt("videos", {
        part: "snippet",
        chart: "mostPopular",
        regionCode: YT_REGION,
        maxResults: "8",
        ...(hint.videoCategoryId ? { videoCategoryId: hint.videoCategoryId } : {}),
      });
      const trend = (v?.items ?? []) as any[];
      const merged: any[] = [];
      const seen = new Set<string>();
      for (const it of trend.concat(items)) {
        const id = (it?.id?.videoId ?? it?.id) as string | undefined;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        merged.push(it);
      }
      items = merged;
    } catch (e) {
      console.log("trending skipped:", String(e));
    }
  }

  // 日本語優先
  items = prioritizeJapanese(items);

  // DB 行へ変換（explore_feed のカラムに合わせる）
  return items.map((it: any) => ({
    category: cat,
    video_id: (it?.id?.videoId ?? it?.id) as string,
    title: it?.snippet?.title ?? "",
    channel_title: it?.snippet?.channelTitle ?? "",
    published_at: it?.snippet?.publishedAt ?? null,
    thumb_url:
      it?.snippet?.thumbnails?.high?.url ??
      it?.snippet?.thumbnails?.medium?.url ??
      it?.snippet?.thumbnails?.default?.url ??
      null,
  }));
}

/** ─────────────────────── DB upsert ───────────────────────
 *  前提: explore_feed に UNIQUE(category, video_id)
 *  v_explore_feed 側で video_id yt_id, thumb_url thumb_high に別名を付けている
 */
async function upsertFeed(rows: any[]) {
  if (!rows.length) return;
  const { error } = await supa.from("explore_feed").upsert(rows, { onConflict: "category,video_id" });
  if (error) throw new Error(`upsert_failed:${error.message}`);
}

/** ─────────────────────── small utils ─────────────────────── */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** ─────────────────────────── main ─────────────────────────── */
serve(async (req) => {
  try {
    const { mode = "full" } = await (async () => { try { return await req.json(); } catch { return {}; } })();

    // 診断
    if (mode === "yt_diag") {
      const out: any = { ok: true, key_tail: (YT_KEY ?? "").slice(-6) };
      try {
        const s = await yt("search", {
          part: "snippet", type: "video", maxResults: "1",
          q: "モチベーション", order: "viewCount", regionCode: YT_REGION,
          relevanceLanguage: YT_LANG, videoEmbeddable: "true", safeSearch: "strict"
        });
        out.search_ok = true; out.search_sample = s?.items?.[0]?.id ?? null;
      } catch (e) { out.search_ok = false; out.search_err = String(e); }

      try {
        const v = await yt("videos", { part:"snippet", chart:"mostPopular", regionCode: YT_REGION, maxResults:"1" });
        out.videos_ok = true; out.videos_sample = v?.items?.[0]?.id ?? null;
      } catch (e) { out.videos_ok = false; out.videos_err = String(e); }

      return json(out, 200);
    }

    if (mode === "health") {
      return json({ ok: true, msg: "alive", key_tail: (YT_KEY ?? "").slice(-6) });
    }

    // クールダウン
    const last = await getLastRefresh();
    if (last) {
      const mins = Math.floor((Date.now() - last.getTime()) / 60000);
      if (mins < REFRESH_COOLDOWN_MIN) {
        return json({ ok: true, skipped: true, reason: "cooldown", since_min: mins });
      }
    }

    // 取得
    const cats: Cat[] = ["workout", "motivation", "music"];
    const all: any[] = [];
    for (const c of cats) {
      try {
        const rows = await fetchCategory(c);
        all.push(...rows);
      } catch (e) {
        const msg = String(e);
        if (msg.includes("quotaExceeded")) {
          // クォータ超過   DB変更なしで既存キャッシュを使わせる
          return json({ ok: false, quotaExceeded: true, note: "served-from-cache" }, 200);
        }
        throw e;
      }
    }

    // 保存
    await upsertFeed(all);
    await setLastRefresh();

    return json({ ok: true, upserted: all.length, categories: [...new Set(all.map((r) => r.category))] });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
