// components/SearchFilters.tsx
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
} from "react-native";
import type { ClientFilter, ServerFilter } from "../lib/openfoodfacts";

type Props = {
  visible: boolean;
  onClose: () => void;
  serverFilter: ServerFilter;
  clientFilter: ClientFilter;
  onApply: (next: { server: ServerFilter; client: ClientFilter }) => void;
};

export const SearchFilters: React.FC<Props> = ({
  visible,
  onClose,
  serverFilter,
  clientFilter,
  onApply,
}) => {
  const [localServer, setLocalServer] = useState<ServerFilter>(serverFilter);
  const [localClient, setLocalClient] = useState<ClientFilter>(clientFilter);

  useEffect(() => {
    if (visible) {
      setLocalServer(serverFilter);
      setLocalClient(clientFilter);
    }
  }, [visible, serverFilter, clientFilter]);

  const numOrUndefined = (v: string) =>
    v.trim() === "" ? undefined : Number(v);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <View style={styles.header}>
          <Text style={styles.title}>フィルタ</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.link}>閉じる</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>サーバー側（検索クエリに付与）</Text>
            <View style={styles.row}>
              <Text style={styles.label}>国：日本のみ</Text>
              <Switch
                value={localServer.countryJP}
                onValueChange={(v) =>
                  setLocalServer((s) => ({ ...s, countryJP: v }))
                }
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>言語：日本語優先</Text>
              <Switch
                value={localServer.langJA}
                onValueChange={(v) =>
                  setLocalServer((s) => ({ ...s, langJA: v }))
                }
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>クライアント側（結果を絞る）</Text>

            <View style={styles.row}>
              <Text style={styles.label}>画像ありのみ</Text>
              <Switch
                value={localClient.imageOnly}
                onValueChange={(v) =>
                  setLocalClient((c) => ({ ...c, imageOnly: v }))
                }
              />
            </View>

            <Text style={styles.label}>ブランド（含まれる）</Text>
            <TextInput
              placeholder="例：セブン, 明治 など"
              value={localClient.brand || ""}
              onChangeText={(t) =>
                setLocalClient((c) => ({ ...c, brand: t || undefined }))
              }
              style={styles.input}
            />

            <Text style={styles.label}>カテゴリ（含まれる）</Text>
            <TextInput
              placeholder="例：ヨーグルト, パン 等"
              value={localClient.category || ""}
              onChangeText={(t) =>
                setLocalClient((c) => ({ ...c, category: t || undefined }))
              }
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>
              kcal / 100g 範囲
            </Text>
            <View style={[styles.row, { gap: 8 }]}>
              <TextInput
                keyboardType="numeric"
                placeholder="最小"
                style={[styles.input, { flex: 1 }]}
                defaultValue={
                  typeof localClient.kcalMin === "number"
                    ? String(localClient.kcalMin)
                    : ""
                }
                onChangeText={(t) =>
                  setLocalClient((c) => ({
                    ...c,
                    kcalMin: numOrUndefined(t),
                  }))
                }
              />
              <Text style={{ opacity: 0.6 }}>〜</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="最大"
                style={[styles.input, { flex: 1 }]}
                defaultValue={
                  typeof localClient.kcalMax === "number"
                    ? String(localClient.kcalMax)
                    : ""
                }
                onChangeText={(t) =>
                  setLocalClient((c) => ({
                    ...c,
                    kcalMax: numOrUndefined(t),
                  }))
                }
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>
              たんぱく質 / 100g 範囲（g）
            </Text>
            <View style={[styles.row, { gap: 8 }]}>
              <TextInput
                keyboardType="numeric"
                placeholder="最小"
                style={[styles.input, { flex: 1 }]}
                defaultValue={
                  typeof localClient.proteinMin === "number"
                    ? String(localClient.proteinMin)
                    : ""
                }
                onChangeText={(t) =>
                  setLocalClient((c) => ({
                    ...c,
                    proteinMin: numOrUndefined(t),
                  }))
                }
              />
              <Text style={{ opacity: 0.6 }}>〜</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="最大"
                style={[styles.input, { flex: 1 }]}
                defaultValue={
                  typeof localClient.proteinMax === "number"
                    ? String(localClient.proteinMax)
                    : ""
                }
                onChangeText={(t) =>
                  setLocalClient((c) => ({
                    ...c,
                    proteinMax: numOrUndefined(t),
                  }))
                }
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              setLocalServer({ countryJP: true, langJA: true });
              setLocalClient({
                imageOnly: true,
                brand: undefined,
                category: undefined,
                kcalMin: undefined,
                kcalMax: undefined,
                proteinMin: undefined,
                proteinMax: undefined,
              });
            }}
          >
            <Text style={styles.link}>デフォルトに戻す</Text>
          </Pressable>

          <Pressable
            style={styles.applyBtn}
            onPress={() => {
              onApply({ server: localServer, client: localClient });
              onClose();
            }}
          >
            <Text style={styles.applyText}>この条件で適用</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  title: { fontSize: 18, fontWeight: "700" },
  link: { color: "#2563eb", fontWeight: "600" },
  content: { padding: 16, gap: 20 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowOpacity: 0.05,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { fontSize: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  applyBtn: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  applyText: { color: "#fff", fontWeight: "700" },
});
