// Explore：カテゴリ（筋トレ/モチベ/音楽/ニュース/お気に入り/ALL）＋検索（キャッシュ内）＋YouTube再生＋ニュースRSS＋お気に入り連続再生
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet,
  Image, Modal, Platform, RefreshControl, TextInput, useWindowDimensions, ScrollView
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import YoutubePlayer from "react-native-youtube-iframe";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import NetInfo from "@react-native-community/netinfo";
import dayjs from "dayjs";
import { XMLParser } from "fast-xml-parser";
import { useTranslation } from "react-i18next";
import { fetchExploreCache, fetchExploreMeta, type ExploreClientItem } from "../../../lib/explore/api";

// Supabase（クライアント）
import { supabase } from "../../../lib/supabase";

// AsyncStorage（無ければメモリfallback）
let AsyncStorage: any = null; try { AsyncStorage = require("@react-native-async-storage/async-storage").default; } catch {}
const FAV_KEY = "fitcoach.video.favs.v1";
let memoryFavs: any[] = [];

// Theme
let theme: any = null; try { theme = require("../../../ui/theme"); } catch {}
const colors = theme?.colors ?? { bg:"#0b0e11", card:"#11151a", text:"#e6ebf0", sub:"#9aa5b1", primary:"#5ac8fa", border:"#1f2630" };
const spacing = theme?.spacing ?? { xs:6, sm:10, md:14, lg:18, xl:24 };

// 型
type Category = "workout" | "motivation" | "music" | "news" | "fav" | "all";
type CacheItem = ExploreClientItem;
type NewsItem = { title: string; link: string };

// カテゴリラベル用キー
const CATEGORY_LABEL_KEY: Record<Category, string> = {
  workout: "explore.categories.workout",
  motivation: "explore.categories.motivation",
  music: "explore.categories.music",
  news: "explore.categories.news",
  fav: "explore.categories.fav",
  all: "explore.categories.all",
};

// GoogleニュースRSS
function buildNewsUrl(q: string) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("hl","ja"); url.searchParams.set("gl","JP"); url.searchParams.set("ceid","JP:ja");
  url.searchParams.set("q", `${q} when:7d`);
  return url.toString();
}
function extractDirectUrl(link: string) { try { const u = new URL(link); const t = u.searchParams.get("url"); return t ? decodeURIComponent(t) : link; } catch { return link; } }
async function fetchGoogleNews(q: string): Promise<NewsItem[]> {
  const res = await fetch(buildNewsUrl(q));
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:"@_" });
  const data = parser.parse(xml);
  const items = data?.rss?.channel?.item ?? [];
  const arr = (Array.isArray(items) ? items : [items]).map((it:any)=>({ title: it?.title ?? "", link: extractDirectUrl(it?.link ?? "") }));
  return arr;
}

// Utils
function withAlpha(hex: string, a: number) {
  let h = hex.replace(/^#/, ""); if (h.length===3) h = h.split("").map(c=>c+c).join("");
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}
async function loadFavs(): Promise<CacheItem[]> { try { if (AsyncStorage) { const raw = await AsyncStorage.getItem(FAV_KEY); return raw ? JSON.parse(raw) : []; } } catch {} return memoryFavs; }
async function saveFavs(list: CacheItem[]) { try { if (AsyncStorage) await AsyncStorage.setItem(FAV_KEY, JSON.stringify(list)); else memoryFavs = list; } catch {} }

const normalize = (s:string) => (s || "").toLowerCase();
const includesQ = (t:string, q:string) => normalize(t).includes(normalize(q));

// Component
export default function ExploreTab() {
  const { t } = useTranslation();

  const [category, setCategory] = useState<Category>("all");
  const [items, setItems] = useState<CacheItem[]|NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [online, setOnline] = useState(true);

  const [favs, setFavs] = useState<CacheItem[]>([]);
  const isFav = useCallback((vid:string)=>favs.some(f=>f.id===vid),[favs]);
  const toggleFav = useCallback(async (item:any)=>{
    const vid = item?.id;
    const simple: CacheItem = {
      id: vid,
      title: item?.title || item?.snippet?.title || "",
      channelTitle: item?.channelTitle || item?.snippet?.channelTitle || "",
      publishedAt: item?.publishedAt || item?.snippet?.publishedAt || "",
      thumbnailUrl: item?.thumbnailUrl || item?.snippet?.thumbnails?.high?.url || ""
    };
    const next = isFav(vid) ? favs.filter(f=>f.id!==vid) : [simple, ...favs];
    setFavs(next); await saveFavs(next);
    if (category==="fav") setItems(next);
  },[favs,isFav,category]);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(()=>{ const tId=setTimeout(()=>setDebounced(search.trim()),400); return ()=>clearTimeout(tId); },[search]);

  const [playingId, setPlayingId] = useState<string|null>(null);
  const [playingItem, setPlayingItem] = useState<CacheItem|null>(null);
  const [autoNext, setAutoNext] = useState(true);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const playerW = Math.min(width - spacing.lg * 2, 720);
  const playerH = Math.round((playerW*9)/16);

  useEffect(()=>{ const unsub = NetInfo.addEventListener(s=>setOnline(!!s.isConnected)); return ()=>unsub(); },[]);
  useEffect(()=>{ (async()=>setFavs(await loadFavs()))(); },[]);

  const onSelectCategory = useCallback(async(c:Category)=>{ await Haptics.selectionAsync(); setCategory(prev=>prev===c?"all":c); },[]);

  const TOP_PER_CAT = 60; // カテゴリごとの上限

  const readCache = useCallback(async (c: Exclude<Category,"news"|"fav">) => {
    return await fetchExploreCache({
      category: c === "all" ? "all" : c,
      search,
      topPerCat: TOP_PER_CAT,
    });
  }, [search]);

  // 最終更新/件数の読み込み（ヘッダ表示用など） ※meta/state は元の実装に合わせて利用
  const loadMeta = useCallback(async () => {
    const meta = await fetchExploreMeta();
    setMeta(meta);               // ここは元ファイルの meta ステートに合わせてください
  }, []);

  const fetchFirst = useCallback(async()=>{
    setLoading(true); setError(null);
    try {
      if (category==="news") {
        const arr = await fetchGoogleNews("健康 OR 筋トレ OR フィットネス OR ダイエット OR サプリメント");
        setItems(arr);
      } else if (category==="fav") {
        const arr = await loadFavs(); setFavs(arr); setItems(arr);
      } else if (category==="all") {
        // 3カテゴリを結合（キャッシュのみ）
        const [w,m,mu] = await Promise.all([readCache("workout"), readCache("motivation"), readCache("music")]);
        let arr = [...w, ...m, ...mu];
        if (debounced) {
          const q = debounced;
          arr = arr.filter(it => includesQ(it.title, q) || includesQ(it.channelTitle, q));
        }
        setItems(arr);
      } else {
        // 単一カテゴリ
        let arr = await readCache(category);
        if (debounced) {
          const q = debounced;
          arr = arr.filter(it => includesQ(it.title, q) || includesQ(it.channelTitle, q));
        }
        setItems(arr);
      }
    } catch(e:any) {
      setError(e?.message ?? t("explore.error_generic")); setItems([]);
    } finally { setLoading(false); setRefreshing(false); }
  },[category,debounced,readCache,t]);

  useEffect(()=>{ fetchFirst(); },[category,debounced,fetchFirst]);
  const onRefresh = useCallback(()=>{ setRefreshing(true); fetchFirst(); },[fetchFirst]);

  const handleStateChange = useCallback((state:string)=>{
    if (state==="ended" && autoNext && playingId) {
      const idx = favs.findIndex(f=>f.id===playingId);
      if (idx>=0 && idx<favs.length-1) {
        const nxt = favs[idx+1];
        setPlayingItem(nxt as any); setPlayingId(nxt.id);
      }
    }
  },[autoNext,playingId,favs]);

  const renderItem = useCallback(({ item }:{item:any })=>{
    if (category === "news") {
      return (
        <TouchableOpacity
          style={styles.newsRow}
          activeOpacity={0.85}
          onPress={()=>WebBrowser.openBrowserAsync(item.link)}
        >
          <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.newsLink} numberOfLines={1}>{item.link}</Text>
        </TouchableOpacity>
      );
    }
    const vid = item?.id;
    const thumb =
      item?.thumbnailUrl ||
      (item?.id ? `https://img.youtube.com/vi/${item.id}/hqdefault.jpg` : null);
    const title = item?.title ?? "";
    const ch = item?.channelTitle ?? "";
    const pub = item?.publishedAt ? dayjs(item.publishedAt).format("YYYY/MM/DD") : "";
    const fav = isFav(vid);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={()=>{ setPlayingId(vid); setPlayingItem(item); }}
      >
        {thumb ? <Image source={{ uri: thumb }} style={styles.thumb}/> : <View style={[styles.thumb,{ backgroundColor: colors.border }]}/>}
        <TouchableOpacity
          onPress={()=>toggleFav(item)}
          style={styles.favBtn}
          hitSlop={{ top:10,bottom:10,left:10,right:10 }}
        >
          <Ionicons name={fav ? "heart" : "heart-outline"} size={20} color={fav ? "#ff5577" : "#fff"} />
        </TouchableOpacity>
        <View style={styles.metaWrap}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <Text style={styles.channel} numberOfLines={1}>{ch}</Text>
          <Text style={styles.published} numberOfLines={1}>{pub}</Text>
        </View>
      </TouchableOpacity>
    );
  },[category,isFav,toggleFav]);

  const keyExtractor = useCallback(
    (item:any,idx:number)=>
      category==="news" ? (item.link ?? `${idx}`) : (item?.id ?? `${idx}`),
    [category]
  );

  return (
    <SafeAreaView style={[styles.container,{ backgroundColor: colors.bg }]}>
      {/* カテゴリ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.header}
      >
        {(["workout","motivation","music","news","fav"] as Category[]).map((c)=>{
          const active = category===c;
          return (
            <TouchableOpacity
              key={c}
              style={[
                styles.catBtn,
                active && {
                  backgroundColor: withAlpha(colors.primary,0.15),
                  borderColor: withAlpha(colors.primary,0.6),
                },
              ]}
              onPress={()=>onSelectCategory(c)}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.catTxt,
                  active && { color: colors.primary, fontWeight: "800" },
                ]}
              >
                {t(CATEGORY_LABEL_KEY[c])}
              </Text>
            </TouchableOpacity>
          );
        })}
        {category==="all" && (
          <View style={styles.allBadge}>
            <Text style={styles.allBadgeTxt}>{t(CATEGORY_LABEL_KEY.all)}</Text>
          </View>
        )}
      </ScrollView>

      {/* 検索（キャッシュ内） */}
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={
            category==="news"
              ? t("explore.search_placeholder_news")
              : category==="fav"
              ? t("explore.search_placeholder_fav")
              : t("explore.search_placeholder_default")
          }
          placeholderTextColor={colors.sub}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* エンプティ＆エラー */}
      {!online && (
        <EmptyState
          title={t("explore.offline_title")}
          body={t("explore.offline_body")}
          actionText={t("explore.retry")}
          onPress={fetchFirst}
        />
      )}
      {online && error && (
        <EmptyState
          title={t("explore.error_title")}
          body={error}
          actionText={t("explore.retry")}
          onPress={fetchFirst}
        />
      )}

      {/* リスト */}
      {online && (
        <FlatList
          data={
            category==="fav" && debounced
              ? favs.filter(f=>(f.title ?? "").includes(debounced))
              : (items as any[])
          }
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              tintColor={colors.sub}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListFooterComponent={
            loading ? (
              <View style={{ paddingVertical: spacing.lg }}>
                <ActivityIndicator color={colors.primary}/>
              </View>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={{ paddingVertical: spacing.lg }}>
                <ActivityIndicator color={colors.primary}/>
              </View>
            ) : category==="fav" ? (
              <EmptyState
                title={t("explore.fav_empty_title")}
                body={t("explore.fav_empty_body")}
              />
            ) : null
          }
        />
      )}

      {/* 再生モーダル */}
      <Modal
        visible={!!playingId}
        animationType="slide"
        onRequestClose={()=>{ setPlayingId(null); setPlayingItem(null); }}
      >
        <View style={[styles.container,{ backgroundColor:"#000" }]}>
          <TouchableOpacity
            onPress={()=>{ setPlayingId(null); setPlayingItem(null); }}
            style={[styles.closeFab,{ top: insets.top + 8 }]}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.playerSheet}>
            <View style={[styles.playerCard,{ width: playerW }]}>
              {!!playingId && (
                <YoutubePlayer
                  height={playerH}
                  width={playerW}
                  play
                  videoId={playingId}
                  onChangeState={handleStateChange}
                  webViewProps={{
                    allowsInlineMediaPlayback:true,
                    mediaPlaybackRequiresUserAction:false,
                    androidLayerType:"hardware",
                  }}
                  initialPlayerParams={{
                    modestbranding:true,
                    rel:false,
                    controls:true,
                  }}
                />
              )}
            </View>

            <View style={{ width: playerW, marginTop: spacing.md }}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {playingItem?.title ?? ""}
              </Text>
              <Text style={styles.modalChannel} numberOfLines={1}>
                {playingItem?.channelTitle ?? ""}
              </Text>
              <View style={[styles.modalActions,{ justifyContent:"space-between" }]}>
                <TouchableOpacity
                  onPress={()=>Linking.openURL(`https://www.youtube.com/watch?v=${playingId}`)}
                  style={styles.modalBtn}
                >
                  <Text style={styles.modalBtnTxt}>
                    {t("explore.open_in_youtube")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={()=>playingItem && toggleFav(playingItem)}
                  style={styles.modalBtn}
                >
                  <Text style={styles.modalBtnTxt}>
                    {playingId && isFav(playingId)
                      ? t("explore.fav_remove_label")
                      : t("explore.fav_add_label")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EmptyState({
  title,
  body,
  actionText,
  onPress,
}:{
  title:string;
  body?:string;
  actionText?:string;
  onPress?:()=>void;
}) {
  return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:24 }}>
      <Text style={{ color: colors.text, fontSize:18, fontWeight:"800", marginBottom:8 }}>
        {title}
      </Text>
      {!!body && (
        <Text
          style={{ color: colors.sub, fontSize:14, textAlign:"center", lineHeight:20 }}
        >
          {body}
        </Text>
      )}
      {!!actionText && (
        <TouchableOpacity
          onPress={onPress}
          style={{
            marginTop:14,
            paddingHorizontal:16,
            paddingVertical:10,
            backgroundColor: withAlpha(colors.primary,0.15),
            borderColor: withAlpha(colors.primary,0.6),
            borderWidth:1,
            borderRadius:999,
          }}
        >
          <Text style={{ color: colors.primary, fontWeight:"800" }}>
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal:12,
    paddingVertical:12,
    gap:8,
    flexDirection:"row",
    alignItems:"center",
  },
  catBtn: {
    paddingHorizontal: 14,
    minHeight: 36,
    paddingVertical: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  catTxt: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    ...(Platform.OS === "android"
      ? { includeFontPadding: false, textAlignVertical: "center" as any }
      : {}),
  },
  allBadge: {
    marginLeft:6,
    paddingHorizontal:10,
    paddingVertical:6,
    borderRadius:999,
    backgroundColor: colors.card,
    borderWidth:1,
    borderColor: colors.border,
  },
  allBadgeTxt: { color: colors.sub, fontSize:12, fontWeight:"700" },

  searchWrap: {
    paddingHorizontal:12,
    paddingTop:6,
    paddingBottom:2,
    backgroundColor: colors.bg,
  },
  searchInput: {
    height:38,
    borderRadius:10,
    paddingHorizontal:12,
    backgroundColor: colors.card,
    borderWidth:1,
    borderColor: colors.border,
    color: colors.text,
    fontSize:14,
  },

  card: {
    backgroundColor: colors.card,
    borderWidth:1,
    borderColor: colors.border,
    borderRadius:16,
    overflow:"hidden",
    marginBottom:14,
    ...Platform.select({
      ios:{ shadowColor:"#000", shadowOpacity:0.15, shadowRadius:12, shadowOffset:{ width:0, height:6 } },
      android:{ elevation:3 },
      default:{},
    }),
  },
  thumb: { width:"100%", aspectRatio:16/9, backgroundColor:"#222" },
  favBtn: {
    position:"absolute",
    right:10,
    top:10,
    width:30,
    height:30,
    borderRadius:15,
    backgroundColor:"rgba(0,0,0,0.35)",
    alignItems:"center",
    justifyContent:"center",
  },
  metaWrap: { padding:12, gap:6 },
  title: { color: colors.text, fontSize:15, fontWeight:"800" },
  channel: { color: colors.sub, fontSize:13 },
  published: { color: colors.sub, fontSize:12 },

  playerSheet: { flex:1, alignItems:"center", justifyContent:"center", padding: spacing.lg },
  playerCard: {
    borderRadius:16,
    overflow:"hidden",
    backgroundColor:"#000",
    borderWidth:1,
    borderColor:"#222",
  },
  modalTitle: { color:"#fff", fontSize:16, fontWeight:"800", marginBottom:6 },
  modalChannel: { color:"#ccc", fontSize:13 },
  modalActions: { flexDirection:"row", gap:10, marginTop:12 },
  modalBtn: {
    paddingHorizontal:12,
    paddingVertical:8,
    borderRadius:999,
    borderWidth:1,
    borderColor:"#3a3a3a",
  },
  modalBtnTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 17,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },

  closeFab: {
    position:"absolute",
    right:12,
    zIndex:10,
    width:36,
    height:36,
    borderRadius:18,
    backgroundColor:"rgba(0,0,0,0.6)",
    alignItems:"center",
    justifyContent:"center",
  },

  newsRow: {
    backgroundColor: colors.card,
    borderWidth:1,
    borderColor: colors.border,
    borderRadius:12,
    padding:12,
    marginBottom:10,
  },
  newsTitle: { color: colors.text, fontSize:15, fontWeight:"800", marginBottom:6 },
  newsLink: { color: colors.sub, fontSize:12 },

  headerBtnTxt: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
});
