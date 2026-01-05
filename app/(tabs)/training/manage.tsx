// app/(tabs)/training/manage.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  initTrainingDb,
  listBodyParts,
  insertBodyPart,
  deleteBodyPart,
  listExercisesForPart,
  insertExercise,
  deleteExercise,
} from "../../../lib/training/db";
import { useTranslation } from "react-i18next";

// ===== パレット（ui/theme のフックがあれば最優先 / なければ OS に追従） =====
type Pal = {
  bg: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
  primaryText: string;
};
let themeMod: any = null;
try {
  themeMod = require("../../../ui/theme");
} catch {}
function usePalette(): Pal {
  if (themeMod?.useThemeColors) return themeMod.useThemeColors();
  if (themeMod?.useColors) return themeMod.useColors();
  const scheme = useColorScheme();
  const light: Pal = {
    bg: "#f8fafc",
    card: "#ffffff",
    text: "#0f172a",
    subtext: "#6b7280",
    border: "#e5e7eb",
    primary: "#2563EB",
    primaryText: "#ffffff",
  };
  const dark: Pal = {
    bg: "#0b1220",
    card: "#0f172a",
    text: "#e5e7eb",
    subtext: "#94a3b8",
    border: "#1f2937",
    primary: "#60a5fa",
    primaryText: "#0b1220",
  };
  return scheme === "dark" ? dark : light;
}

type BodyPart = { id: number; name: string; sort_order?: number };

export default function Manage() {
  const C = usePalette();
  const { t } = useTranslation();

  const [parts, setParts] = useState<BodyPart[]>([]);
  const [partName, setPartName] = useState("");
  const [exInputs, setExInputs] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    await initTrainingDb();
    const rows = await listBodyParts();
    setParts(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addPart = async () => {
    const name = partName.trim();
    if (!name) return;
    try {
      await insertBodyPart(name);
      setPartName("");
      await reload();
    } catch (e: any) {
      Alert.alert(
        t("trainingManage.error_cannot_add_title"),
        e?.message ?? t("trainingManage.error_part_duplicate")
      );
    }
  };

  const addExercise = async (partId: number) => {
    const name = (exInputs[partId] ?? "").trim();
    if (!name) return;
    try {
      await insertExercise(name, partId);
      setExInputs((s) => ({ ...s, [partId]: "" }));
      await reload();
    } catch (e: any) {
      Alert.alert(
        t("trainingManage.error_cannot_add_title"),
        e?.message ?? t("trainingManage.error_exercise_failed")
      );
    }
  };

  const removePart = async (partId: number, name: string) => {
    Alert.alert(
      t("trainingManage.remove_part_title"),
      t("trainingManage.remove_part_message", { name }),
      [
        { text: t("trainingManage.remove_part_cancel"), style: "cancel" },
        {
          text: t("trainingManage.remove_part_confirm"),
          style: "destructive",
          onPress: async () => {
            await deleteBodyPart(partId);
            await reload();
          },
        },
      ]
    );
  };

  const removeExercise = async (exId: number, exName: string) => {
    const ret = await deleteExercise(exId);
    if ((ret as any).archived) {
      Alert.alert(
        t("trainingManage.archived_title"),
        t("trainingManage.archived_message", { name: exName })
      );
    }
    await reload();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* ヘッダー */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 12,
            color: C.text,
          }}
        >
          {t("trainingManage.title")}
        </Text>

        {/* 部位の追加 */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <TextInput
            value={partName}
            onChangeText={setPartName}
            placeholder={t("trainingManage.add_part_placeholder")}
            placeholderTextColor={C.subtext}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: C.card,
              color: C.text,
            }}
            returnKeyType="done"
            onSubmitEditing={addPart}
          />
          <TouchableOpacity
            onPress={addPart}
            activeOpacity={0.85}
            style={{
              paddingHorizontal: 14,
              justifyContent: "center",
              borderRadius: 10,
              backgroundColor: C.primary,
            }}
          >
            <Text
              style={{ color: C.primaryText, fontWeight: "700" }}
            >
              {t("trainingManage.add_button")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 部位ごとの一覧 */}
        {loading ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ color: C.subtext, marginTop: 6 }}>
              {t("trainingManage.loading")}
            </Text>
          </View>
        ) : parts.length === 0 ? (
          <Text style={{ color: C.subtext }}>
            {t("trainingManage.empty_parts")}
          </Text>
        ) : (
          parts.map((p) => (
            <View
              key={p.id}
              style={{
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 12,
                marginBottom: 14,
                backgroundColor: C.card,
              }}
            >
              {/* 部位ヘッダー */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                }}
              >
                <Text style={{ fontWeight: "700", color: C.text }}>
                  {p.name}
                </Text>
                <TouchableOpacity
                  onPress={() => removePart(p.id, p.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#E11D48"
                  />
                </TouchableOpacity>
              </View>

              {/* 種目リスト */}
              <ExercisesBlock partId={p.id} onDelete={removeExercise} />

              {/* 種目追加 */}
              <View style={{ flexDirection: "row", gap: 8, padding: 12 }}>
                <TextInput
                  value={exInputs[p.id] ?? ""}
                  onChangeText={(t2) =>
                    setExInputs((s) => ({ ...s, [p.id]: t2 }))
                  }
                  placeholder={t("trainingManage.add_ex_placeholder")}
                  placeholderTextColor={C.subtext}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: C.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: C.card,
                    color: C.text,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={() => addExercise(p.id)}
                />
                <TouchableOpacity
                  onPress={() => addExercise(p.id)}
                  activeOpacity={0.85}
                  style={{
                    paddingHorizontal: 14,
                    justifyContent: "center",
                    borderRadius: 10,
                    backgroundColor: "#43A047",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "700" }}
                  >
                    {t("trainingManage.add_ex_button")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ExercisesBlock({
  partId,
  onDelete,
}: {
  partId: number;
  onDelete: (id: number, name: string) => void;
}) {
  const C = usePalette();
  const { t } = useTranslation();
  const [rows, setRows] = useState<
    Array<{ id: number; name: string; is_archived: number }>
  >([]);

  const load = useCallback(async () => {
    const xs = await listExercisesForPart(partId);
    setRows(xs);
  }, [partId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
      {rows.length === 0 ? (
        <Text style={{ color: C.subtext }}>
          {t("trainingManage.ex_block_empty")}
        </Text>
      ) : (
        rows.map((x) => (
          <View
            key={x.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Text
              style={{
                color: x.is_archived ? C.subtext : C.text,
              }}
            >
              {x.name}
              {x.is_archived
                ? t("trainingManage.ex_archived_suffix")
                : ""}
            </Text>
            <TouchableOpacity
              onPress={() => onDelete(x.id, x.name)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="#E11D48"
              />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}
