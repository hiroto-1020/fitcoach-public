import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../../../lib/supabase";
import VerifiedBadge from "../../../../components/gotore/VerifiedBadge";

const { width: W } = Dimensions.get("window");
const PROFILE_BUCKET = "profile-photos";

type ProfileRow = {
  user_id: string;
  nickname?: string | null;
  bio?: string | null;
  region?: string | null;
  region_label?: string | null;
  home_gym_location?: string | null;
  preferred_training_tags?: string[] | null;
  verified_status?: "unverified" | "pending" | "verified" | "rejected" | null;
  photos?: string[] | null;
  avatar_url?: string | null;
  height_cm?: number | null;
  goals?: string | null;
  training_years?: number | null;
  availability?: string | null;
  updated_at?: string | null;
};

function DotPager({ total, index }: { total: number; index: number }) {
  if (total <= 1) return null;
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === index ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{children}</Text>
    </View>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{children}</Text>
    </View>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
      <Text style={styles.secTitle}>{title}</Text>
      <View style={styles.secCard}>{children}</View>
    </View>
  );
}

export default function UserDetail() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const router = useRouter();

  if (!userId || userId === "edit") {
    return (
      <View style={styles.center}>
        <Text style={{ fontWeight: "700" }}>不正なユーザーIDです。</Text>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/gotore")}
          style={styles.btnDark}
        >
          <Text style={styles.btnDarkText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const withVersion = (url?: string | null, updatedAt?: string | null) => {
    if (!url) return null;
    if (!updatedAt) return url;
    const v = Date.parse(updatedAt);
    if (!Number.isFinite(v)) return url;
    return url + (url.includes("?") ? "&" : "?") + "v=" + v;
  };

  const fetchStorageFallback = useCallback(async (uid: string) => {
    const { data: files, error } = await supabase
      .storage
      .from(PROFILE_BUCKET)
      .list(uid, { sortBy: { column: "created_at", order: "desc" } });

    if (error || !files || files.length === 0) return [] as string[];
    return files.map((f) => {
      const { data } = supabase
        .storage
        .from(PROFILE_BUCKET)
        .getPublicUrl(`${uid}/${f.name}`);
      return data.publicUrl;
    });
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("profiles")
          .select(
            [
              "user_id",
              "nickname",
              "bio",
              "region",
              "region_label",
              "home_gym_location",
              "preferred_training_tags",
              "verified_status",
              "photos",
              "avatar_url",
              "height_cm",
              "goals",
              "training_years",
              "availability",
              "updated_at",
            ].join(",")
          )
          .eq("user_id", String(userId))
          .maybeSingle();

        if (error) throw error;

        const p = (data as ProfileRow) ?? null;
        if (!alive) return;

        setRow(p);

        // 写真の決定ロジック：photos → Storage フォールバック → avatar_url
        let urls: string[] = Array.isArray(p?.photos)
          ? p!.photos!.filter(Boolean)
          : [];
        if (!urls.length) urls = await fetchStorageFallback(String(userId));
        if (!urls.length && p?.avatar_url) {
          const ver = withVersion(p.avatar_url, p.updated_at);
          urls = ver ? [ver] : [p.avatar_url];
        }

        if (!alive) return;
        setPhotos(urls);
      } catch (e: any) {
        if (alive) Alert.alert("読み込みエラー", String(e?.message ?? e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId, fetchStorageFallback]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems?.length) {
        const idx = viewableItems[0].index ?? 0;
        setPage(idx);
      }
    }
  ).current;
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const nickname = row?.nickname || "名無し";
  const region = row?.region_label || row?.region || "—";
  const gym = row?.home_gym_location || "—";
  const tags = row?.preferred_training_tags || [];
  const bio = row?.bio || "";
  const goals = row?.goals || "";
  const h = row?.height_cm;
  const yrs = row?.training_years;
  const avail = row?.availability || "";
  const verified = row?.verified_status === "verified";

  return (
    <View style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerTintColor: "#fff",
        }}
      />

      <LinearGradient colors={["#0b1220", "#0b1220"]} style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
            <Text style={{ color: "#cbd5e1", marginTop: 8 }}>読み込み中…</Text>
          </View>
        ) : !row ? (
          <View style={styles.center}>
            <Text style={{ color: "#fff", fontWeight: "800" }}>
              プロフィールが見つかりません
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
            {/* 写真カルーセル */}
            <View
              style={{
                marginTop: Platform.select({ ios: 60, android: 16 }),
                alignItems: "center",
              }}
            >
              <View style={styles.cardWrap}>
                {photos.length ? (
                  <>
                    <FlatList
                      ref={listRef}
                      data={photos}
                      keyExtractor={(u, i) => `${u}-${i}`}
                      renderItem={({ item }) => (
                        <Image
                          source={{ uri: item }}
                          style={styles.hero}
                          resizeMode="cover"
                        />
                      )}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onViewableItemsChanged={onViewableItemsChanged}
                      viewabilityConfig={viewConfigRef.current}
                    />
                    <DotPager total={photos.length} index={page} />
                  </>
                ) : (
                  <View style={[styles.hero, styles.heroPlaceholder]}>
                    <Text style={{ color: "#64748B" }}>写真がありません</Text>
                  </View>
                )}
              </View>
            </View>

            {/* タイトル / メタ */}
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.name}>{nickname}</Text>
                <View style={{ marginLeft: 8 }}>
                  <VerifiedBadge visible={verified} />
                </View>
              </View>
              <Text style={styles.meta}>
                地域：{region}　/　ホームジム：{gym}
              </Text>
            </View>

            {/* ハイライト */}
            <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
              <View style={styles.chipsRow}>
                {h ? <Chip>{h}cm</Chip> : null}
                {yrs != null ? <Chip>トレ歴 {yrs}年</Chip> : null}
                {avail ? <Chip>{avail}</Chip> : null}
              </View>
              <View style={styles.chipsRow}>
                {(tags.length ? tags : ["タグ未設定"]).map((t, i) => (
                  <Tag key={`${t}-${i}`}>{t}</Tag>
                ))}
              </View>
            </View>

            {/* 目標 */}
            {goals ? (
              <Section title="目標">
                <Text style={styles.body}>{goals}</Text>
              </Section>
            ) : null}

            {/* 自己紹介 */}
            {bio ? (
              <Section title="自己紹介">
                <Text style={styles.body}>{bio}</Text>
              </Section>
            ) : null}

            {/* アクション：未マッチ時は非表示のため削除 */}
          </ScrollView>
        )}
      </LinearGradient>
    </View>
  );
}

/* ---------- Styles ---------- */
const CARD_RADIUS = 18;
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  btnDark: {
    backgroundColor: "#111",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  btnDarkText: { color: "#fff", fontWeight: "800" },

  cardWrap: {
    width: W * 0.94,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  hero: {
    width: W * 0.94,
    height: W * 0.94 * 1.1,
    backgroundColor: "#0b1020",
  },
  heroPlaceholder: { alignItems: "center", justifyContent: "center" },

  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: "#fff" },
  dotInactive: { backgroundColor: "rgba(255,255,255,0.4)" },

  name: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 0.2 },
  meta: { color: "rgba(255,255,255,0.85)", marginTop: 6, fontWeight: "700" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { color: "#fff", fontWeight: "800" },
  tag: {
    backgroundColor: "rgba(34,197,94,0.16)",
    borderColor: "rgba(34,197,94,0.5)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: { color: "#86efac", fontWeight: "800" },

  secTitle: { color: "#fff", fontWeight: "900", marginBottom: 8, fontSize: 16 },
  secCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
  },
  body: { color: "rgba(255,255,255,0.95)", lineHeight: 20, fontWeight: "600" },
});
