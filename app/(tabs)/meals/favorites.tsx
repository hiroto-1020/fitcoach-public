import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../../ui/theme";
import { listFavorites, toggleFavorite, type FavoriteProduct } from "../../../lib/favorites";
import { setBulkSelection, type SelectedProduct } from "../../../lib/tmpSelection";

export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<FavoriteProduct[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, SelectedProduct>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setLoading(true);
    const favs = await listFavorites();
    setItems(favs);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it =>
      (it.title || "").toLowerCase().includes(q) ||
      (it.brand || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  function toggleSelect(it: FavoriteProduct) {
    setSelected(prev => {
      const next = { ...prev };
      if (next[it.code]) delete next[it.code];
      else {
        next[it.code] = {
          code: it.code,
          title: it.title,
          brand: it.brand,
          image: it.image,
          kcal100: it.kcal100,
          p100: it.p100,
          f100: it.f100,
          c100: it.c100,
        };
      }
      return next;
    });
  }

  async function proceedBulk() {
    const arr = Object.values(selected);
    if (arr.length === 0) return;
    await setBulkSelection(arr);
    router.push("/(tabs)/meals/bulk-from-products");
  }

  const selectedCount = Object.keys(selected).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="お気に入り内を検索（商品名・ブランド）"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          style={[
            styles.searchInput,
            { borderColor: colors.border, backgroundColor: colors.card, color: colors.text },
          ]}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: colors.subtext }}>お気に入りがありません。</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.code}
          renderItem={({ item }) => {
            const active = !!selected[item.code];
            return (
              <View style={[styles.card, active && { backgroundColor: "#f8fafc" }]}>
                <Pressable onPress={() => toggleSelect(item)} style={[styles.checkBox, active && styles.checkBoxOn]} />
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Text style={{ color: "#666" }}>No Image</Text>
                  </View>
                )}
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/meals/add-from-product",
                      params: {
                        code: item.code,
                        title: item.title,
                        brand: item.brand || "",
                        image: item.image || "",
                        kcal100: item.kcal100 != null ? String(item.kcal100) : "",
                        protein100: item.p100 != null ? String(item.p100) : "",
                        fat100: item.f100 != null ? String(item.f100) : "",
                        carbs100: item.c100 != null ? String(item.c100) : "",
                      },
                    })
                  }
                >
                  <Text numberOfLines={2} style={styles.nameText}>
                    {item.title}{item.brand ? ` / ${item.brand}` : ""}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                    <Text style={styles.badge}>kcal/100g: {item.kcal100 ?? "-"}</Text>
                    <Text style={styles.badge}>P/100g: {item.p100 ?? "-"}</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    await toggleFavorite(item);
                    setItems(prev => prev.filter(p => p.code !== item.code));
                    setSelected(prev => {
                      const next = { ...prev }; delete next[item.code]; return next;
                    });
                  }}
                  style={styles.starBtn}
                >
                  <Text style={{ fontSize: 18 }}>★</Text>
                </Pressable>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: selectedCount > 0 ? 100 : 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }} />
          }
        />
      )}

      {selectedCount > 0 && (
        <View style={styles.bulkBar}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>選択：{selectedCount}件</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => setSelected({})} style={[styles.bulkBtn, { backgroundColor: "#e5e7eb" }]}>
              <Text style={{ fontWeight: "700" }}>クリア</Text>
            </Pressable>
            <Pressable onPress={proceedBulk} style={[styles.bulkBtn, { backgroundColor: "#22c55e" }]}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>まとめて取り込み</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
    alignItems: "center",
  },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#94a3b8", marginRight: 8,
  },
  checkBoxOn: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  thumbPlaceholder: {
    width: 56, height: 56, borderRadius: 8, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center",
  },
  nameText: { fontSize: 15, fontWeight: "700", color: colors.text },
  badge: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#f3f4f6", borderRadius: 6 },
  starBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  bulkBar: {
    position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#e5e7eb", padding: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  bulkBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
});
