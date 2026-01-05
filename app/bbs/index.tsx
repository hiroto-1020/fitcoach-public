import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  FlatList, TextInput, Alert, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

let theme: any = null; try { theme = require("../../ui/theme"); } catch {}
const C = theme?.colors ?? { bg:"#0a0d0f", card:"#12161a", text:"#e6e8eb", sub:"#9aa4b2", primary:"#6ee7b7", border:"#1f242a" };

import { fetchThreads, listFavoriteThreadIds, addFavorite, removeFavorite } from "../../lib/bbs/api";

// boards を取得（存在しなければ固定配列）
const useBoards = () => {
  const [boards, setBoards] = useState<Array<{slug:string; name:string}>>([]);
  useEffect(() => {
    (async () => {
      try {
        const mod = await import("../../lib/bbs/boards"); // 任意：存在すれば使う
        setBoards([{ slug: "", name: "すべて" }, ...mod.default]);
      } catch {
        setBoards([
          { slug: "",         name: "すべて" },
          { slug: "general",  name: "総合" },
          { slug: "training", name: "筋トレ" },
          { slug: "nutrition",name: "栄養" },
          { slug: "chat",     name: "雑談" },
          { slug: "sports",   name: "スポーツ" },  // 追加
          { slug: "health",   name: "健康" },      // 追加
        ]);
      }
    })();
  }, []);
  return boards;
};

export default function BbsListScreen() {
  const router = useRouter();
  const boards = useBoards();

  const [items, setItems] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState("");
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [boardSlug, setBoardSlug] = useState<string>(""); // ""=すべて
  const [sort, setSort] = useState<"new" | "hot">("new");
  const [onlyFav, setOnlyFav] = useState(false);

  // 初回＆カテゴリ切替で取得
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ items, nextCursor }, favs] = await Promise.all([
        // サーバ側の fetchThreads が boardSlug を無視していてもOK（ローカルでも絞るため）
        fetchThreads({ limit: 20, boardSlug: boardSlug || null }),
        listFavoriteThreadIds().catch(() => new Set<string>()),
      ]);
      setItems(items);
      setCursor(nextCursor);
      setFavSet(favs);
    } finally {
      setLoading(false);
    }
  }, [boardSlug]);

  useEffect(() => {
    load();
  }, [load]);

  // ページング
  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items: more, nextCursor } = await fetchThreads({
        limit: 20,
        cursor,
        boardSlug: boardSlug || null,
      });
      setItems((prev) => [...prev, ...more]);
      setCursor(nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, boardSlug]);

  // ローカル絞り込み（タイトル/お気に入り/カテゴリ）
  const filtered = items
    .filter((it) => {
      if (boardSlug) {
        const tagSlugs: string[] = Array.isArray(it.tag_slugs) ? it.tag_slugs : [];
        const hit = it.primary_slug === boardSlug || tagSlugs.includes(boardSlug);
        if (!hit) return false;
      }
      if (onlyFav && !favSet.has(it.id)) return false;
      if (q.trim() && !String(it.title ?? "").toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "hot") {
        // 勢い: 返信数降順 -> 最終更新
        if ((b.reply_count ?? 0) !== (a.reply_count ?? 0)) {
          return (b.reply_count ?? 0) - (a.reply_count ?? 0);
        }
      }
      // new: last_bump_at 新しい順
      const ba = new Date(b.last_bump_at ?? b.created_at ?? 0).getTime();
      const aa = new Date(a.last_bump_at ?? a.created_at ?? 0).getTime();
      return ba - aa;
    });

  async function toggleFav(id: string, v: boolean) {
    try {
      if (v) {
        await addFavorite(id);
        setFavSet((s) => new Set(s).add(id));
      } else {
        await removeFavorite(id);
        setFavSet((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }
    } catch (e: any) {
      Alert.alert("お気に入り", e?.message ?? String(e));
    }
  }

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexBasis: "48%",
        minWidth: 140, // 2列で崩れにくく
        paddingVertical: 12,
        borderRadius: 16,
        paddingHorizontal: 12,
        backgroundColor: active ? "rgba(110,231,183,0.18)" : C.card,
        borderWidth: 1,
        borderColor: active ? C.primary : C.border,
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          color: active ? C.primary : C.text,
          fontWeight: "800",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const Seg = ({ value }: { value: "new" | "hot" }) => (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: C.card,
        borderColor: C.border,
        borderWidth: 1,
        borderRadius: 12,
      }}
    >
      {(["new", "hot"] as const).map((k) => (
        <TouchableOpacity
          key={k}
          onPress={() => setSort(k)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: sort === k ? "rgba(110,231,183,0.16)" : "transparent",
          }}
        >
          <Text style={{ color: sort === k ? C.primary : C.sub, fontWeight: "800" }}>
            {k === "new" ? "新着" : "勢い 🔥"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const FavToggle = () => (
    <TouchableOpacity
      onPress={() => setOnlyFav((v) => !v)}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: onlyFav ? "rgba(250,204,21,0.16)" : C.card,
        borderWidth: 1,
        borderColor: onlyFav ? "#facc15" : C.border,
      }}
    >
      <Text style={{ color: onlyFav ? "#facc15" : C.sub, fontWeight: "800" }}>
        {onlyFav ? "★お気に入りのみ" : "☆すべて"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* ヘッダー */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            {/* 左：タイトル + ホーム */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ color: C.text, fontSize: 22, fontWeight: "900" }}>筋肉掲示板</Text>
                <TouchableOpacity
                onPress={() => router.push("/(tabs)/home")}
                accessibilityLabel="ホームへ戻る"
                style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: C.card,
                    borderWidth: 1,
                    borderColor: C.border,
                }}
                >
                <Text style={{ color: C.sub, fontWeight: "800" }}>ホーム</Text>
                </TouchableOpacity>
            </View>

            {/* 右：新規スレ作成 */}
            <TouchableOpacity
                onPress={() => router.push(`/bbs/new?board=${boardSlug || "general"}`)} // 選択中をプリセット
                style={{ backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}
            >
                <Text style={{ color: "#00140e", fontWeight: "900" }}>新規スレ作成</Text>
            </TouchableOpacity>
            </View>

            {/* フィルタ（2列グリッド & セグメント） */}
            <View style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                {boards.map((b) => (
                <Chip key={b.slug || "all"} label={b.name} active={boardSlug === b.slug} onPress={() => setBoardSlug(b.slug)} />
                ))}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 4 }}>
                <Seg value={sort} />
                <FavToggle />
            </View>
            </View>

            {/* 検索 */}
            <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 10, marginBottom: 10 }}>
            <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="タイトル検索"
                placeholderTextColor={C.sub}
                style={{ color: C.text, paddingHorizontal: 12, paddingVertical: 10 }}
            />
            </View>

            {/* リスト */}
            {loading ? (
            <View style={{ height: 260, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator />
            </View>
            ) : (
            <FlatList
                data={filtered}
                keyExtractor={(it) => String(it.id)}
                renderItem={({ item }) => {
                const isFav = favSet.has(item.id);
                const tagNames: string[] = Array.isArray(item.tag_names) ? item.tag_names : [];
                const tagsToShow = [item.primary_name, ...tagNames.filter((n: string) => n && n !== item.primary_name)];

                return (
                    <View
                    style={{
                        backgroundColor: C.card,
                        borderColor: C.border,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                    }}
                    >
                    <TouchableOpacity onPress={() => router.push(`/bbs/${item.id}`)} activeOpacity={0.85}>
                        <Text numberOfLines={2} style={{ color: C.text, fontSize: 16, fontWeight: "800", marginBottom: 6 }}>
                        {item.title || "(無題)"}
                        </Text>

                        {/* 下段メタ情報 */}
                        <View style={{ flexDirection: "row", gap: 12 }}>
                        <Text style={{ color: C.sub, fontSize: 12 }}>{item.primary_name ?? "筋肉掲示板"}</Text>
                        <Text style={{ color: C.sub, fontSize: 12 }}>返信 {item.reply_count}</Text>
                        <Text style={{ color: item.is_archived ? "#fca5a5" : C.sub, fontSize: 12 }}>
                            {item.is_archived ? "クローズ" : "稼働中"}
                        </Text>
                        </View>

                        {/* タグ（主カテゴリ + 追加タグ） */}
                        {tagsToShow.length > 0 && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                            {tagsToShow.map((nm: string, i: number) => (
                            <View
                                key={`${item.id}-tag-${i}`}
                                style={{
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor: C.card,
                                borderWidth: 1,
                                borderColor: C.border,
                                }}
                            >
                                <Text style={{ color: C.sub, fontSize: 11 }}>{nm}</Text>
                            </View>
                            ))}
                        </View>
                        )}
                    </TouchableOpacity>

                    {/* 右上 お気に入り */}
                    <TouchableOpacity onPress={() => toggleFav(item.id, !isFav)} style={{ position: "absolute", right: 10, top: 10, padding: 6 }}>
                        <Text style={{ fontSize: 18, color: isFav ? "#facc15" : C.sub }}>{isFav ? "★" : "☆"}</Text>
                    </TouchableOpacity>
                    </View>
                );
                }}
                onEndReachedThreshold={0.3}
                onEndReached={loadMore}
                ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} /> : <View style={{ height: 6 }} />}
            />
            )}
        </ScrollView>
    </SafeAreaView>

  );
}

