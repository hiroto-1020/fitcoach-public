import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Alert,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  listBodyParts,
  listExercisesByBodyPart,
  getOrCreateSession,
  copyLastSetsToSession,
  addSet,
} from "../../../lib/training/db";
import { useTranslation } from "react-i18next";

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

type Section = {
  title: string;
  data: { id: number; name: string }[];
  body_part_id: number;
};

export default function Picker() {
  const C = usePalette();
  const { t } = useTranslation();
  const { sessionId, date } =
    useLocalSearchParams<{ sessionId?: string; date?: string }>();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const parts = await listBodyParts();
      const filled: Section[] = [];
      for (const p of parts) {
        const exs = await listExercisesByBodyPart(p.id);
        if (exs.length) {
          filled.push({
            title: p.name,
            data: exs,
            body_part_id: p.id,
          });
        }
      }
      setSections(filled);
      setLoading(false);
    })();
  }, []);

  const ensureSessionId = async (): Promise<{ sid: number; d: string }> => {
    const d = String(date ?? "");
    if (sessionId && !isNaN(Number(sessionId))) {
      return { sid: Number(sessionId), d };
    }
    if (d) {
      return { sid: await getOrCreateSession(d), d };
    }
    throw new Error("sessionId and date are missing");
  };

  const choose = async (exerciseId: number) => {
    const { sid, d } = await ensureSessionId();
    Alert.alert(
      t("trainingPicker.alert_title"),
      t("trainingPicker.alert_message"),
      [
        {
          text: t("trainingPicker.alert_copy_last"),
          onPress: async () => {
            await copyLastSetsToSession(exerciseId, sid, d);
            router.replace({
              pathname: "/training/[date]",
              params: { date: d },
            });
          },
        },
        {
          text: t("trainingPicker.alert_empty_set"),
          onPress: async () => {
            await addSet(sid, exerciseId, 0, 0);
            router.replace({
              pathname: "/training/[date]",
              params: { date: d },
            });
          },
        },
        {
          text: t("trainingPicker.alert_cancel"),
          style: "cancel",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.bg,
        }}
      >
        <ActivityIndicator />
        <Text
          style={{
            marginTop: 8,
            color: C.subtext,
          }}
        >
          {t("trainingPicker.loading")}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 12, alignItems: "flex-end" }}>
        <Pressable onPress={() => router.push("/training/manage")}>
          <Text
            style={{
              color: C.primary,
              fontWeight: "700",
            }}
          >
            {t("trainingPicker.manage_button")}
          </Text>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section }) => (
          <Text
            style={{
              padding: 12,
              fontWeight: "bold",
              backgroundColor: C.card,
              color: C.text,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: C.border,
            }}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => choose(item.id)}
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
              backgroundColor: C.card,
            }}
          >
            <Text style={{ color: C.text }}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text
            style={{
              padding: 16,
              color: C.subtext,
            }}
          >
            {t("trainingPicker.empty")}
          </Text>
        }
        stickySectionHeadersEnabled
        style={{ backgroundColor: C.bg }}
      />
    </View>
  );
}
