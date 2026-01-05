import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from "react-native";

type Props = {
  photos: string[];
  max?: number;
  onChange: (next: string[]) => void;
  onPick?: () => void;
};

const MAX_DEFAULT = 5;

function move<T>(arr: T[], from: number, to: number) {
  const a = arr.slice();
  const item = a.splice(from, 1)[0];
  a.splice(to, 0, item);
  return a;
}

export default function ReorderablePhotos({ photos, max = MAX_DEFAULT, onChange, onPick }: Props) {
  const setPrimary = (idx: number) => {
    if (idx <= 0) return;
    onChange([photos[idx], ...photos.filter((_, i) => i !== idx)]);
  };
  const removeAt = (idx: number) => onChange(photos.filter((_, i) => i !== idx));
  const left = (idx: number) => idx > 0 && onChange(move(photos, idx, idx - 1));
  const right = (idx: number) => idx < photos.length - 1 && onChange(move(photos, idx, idx + 1));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {photos.map((u, idx) => (
          <View key={`${u}-${idx}`} style={{ width: 92 }}>
            <Image source={{ uri: u }} style={styles.thumb(idx === 0)} />

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => left(idx)} disabled={idx === 0} style={styles.btn}>
                <Text style={styles.btnText}>{idx === 0 ? " " : "←"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => right(idx)} disabled={idx === photos.length - 1} style={styles.btn}>
                <Text style={styles.btnText}>{idx === photos.length - 1 ? " " : "→"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity onPress={() => setPrimary(idx)} disabled={idx === 0} style={styles.btnWide}>
                <Text style={[styles.btnText, { fontWeight: "800" }]}>{idx === 0 ? "メイン" : "先頭へ"}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeAt(idx)} style={[styles.btnWide, { backgroundColor: "#fee2e2", borderColor: "#fecaca" }]}>
              <Text style={[styles.btnText, { color: "#b91c1c" }]}>削除</Text>
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < max && (
          <TouchableOpacity onPress={onPick} style={styles.addBox}>
            <Text style={{ fontSize: 22 }}>＋</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = {
  thumb: (isPrimary: boolean) => ({
    width: 92, height: 92, borderRadius: 12, backgroundColor: "#eee",
    borderWidth: isPrimary ? 2 : StyleSheet.hairlineWidth,
    borderColor: isPrimary ? "#111" : "#ddd",
  }),
  btnRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  btn: {
    flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: "#ddd",
    paddingVertical: 6, borderRadius: 8, alignItems: "center", backgroundColor: "#fff",
  },
  btnWide: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#ddd",
    paddingVertical: 6, borderRadius: 8, alignItems: "center", backgroundColor: "#fff", marginTop: 6,
  },
  btnText: { color: "#111" },
  addBox: {
    width: 92, height: 92, borderRadius: 12, borderWidth: 1, borderColor: "#ddd",
    alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
  },
} as const;
