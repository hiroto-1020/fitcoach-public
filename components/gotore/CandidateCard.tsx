import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import type { Candidate } from "../../lib/gotore/types";
import { getFirstProfilePhotoUrl, labelGender } from "../../../lib/gotore/profile-media";

type Props = {
  candidate: Candidate & {
    // height や自己紹介など、無い環境でもビルドが通るように全部オプショナル
    height_cm?: number | null;
    bio?: string | null;
    goal?: string | null;
  };
};

export default function CandidateCard({ candidate }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const url = await getFirstProfilePhotoUrl(c.profile.user_id);
      if (alive) setPhotoUrl(url ?? null);
    })();
    return () => { alive = false; };
  }, [c.profile.user_id]);

  const name = candidate.profile.nickname ?? "名前未設定";
  const region = candidate.profile.region_label ?? "未設定";
  const gym = candidate.profile.home_gym_location ?? "未設定";
  const genderLabel = labelGender(candidate.user.gender);
  const height = typeof candidate.height_cm === "number" ? candidate.height_cm : null;

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>

      <Text style={styles.meta}>地域：{region} ／ ホームジム：{gym}</Text>
      <Text style={styles.meta}>性別：{genderLabel}</Text>

      {height !== null && (
        <View style={styles.heightChip}>
          <Text style={styles.heightChipText}>{height}cm</Text>
        </View>
      )}

      {/*    身長の“直下”に 1 枚目のプロフィール写真 */}
      <View style={{ marginTop: 12 }}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.placeholderText}>写真なし</Text>
          </View>
        )}
      </View>

      {/* 既存に合わせて、あれば目標/自己紹介を表示（未定義なら何も出さない） */}
      {candidate.goal ? (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionLabel}>目標</Text>
          <Text style={styles.sectionBody}>{candidate.goal}</Text>
        </View>
      ) : null}

      {candidate.bio ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionLabel}>自己紹介</Text>
          <Text style={styles.sectionBody}>{candidate.bio}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#0F172A", // 深めのダーク
  },
  name: { fontSize: 28, fontWeight: "800", color: "white", marginBottom: 4 },
  meta: { color: "#CBD5E1", marginTop: 2, fontSize: 14 },

  heightChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#1E293B",
    marginTop: 10,
  },
  heightChipText: { color: "white", fontWeight: "700" },

  photo: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    backgroundColor: "#0B1020",
  },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: { color: "#64748B" },

  sectionLabel: { color: "#94A3B8", fontWeight: "700", fontSize: 12 },
  sectionBody: { color: "white", marginTop: 2, lineHeight: 20 },
});
