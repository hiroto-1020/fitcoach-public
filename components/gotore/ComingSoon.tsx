
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ImageSourcePropType,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

type Props = {
  background?: ImageSourcePropType;
  backgroundUrl?: string;
  bgBlur?: number;
  dim?: number;
};

const DEFAULT_BG = require("../../image/Image_fx (82) (1).jpg");

export default function ComingSoon({
  background,
  backgroundUrl,
  bgBlur = 6,
  dim = 0.35,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const bgSource: ImageSourcePropType | undefined =
    backgroundUrl ? { uri: backgroundUrl } : background ?? DEFAULT_BG;

  return (
    <View style={{ flex: 1 }}>
      {bgSource ? (
        <ImageBackground
          source={bgSource}
          resizeMode="cover"
          blurRadius={bgBlur}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={["#0b1220", "#111827"]}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: `rgba(0,0,0,${dim})` },
        ]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "transparent",
          "rgba(11,18,32,0.25)",
          "rgba(11,18,32,0.45)",
        ]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {t("gotore.coming_soon.title")}
          </Text>

          <Text style={styles.desc}>
            {t("gotore.coming_soon.description_1")}
          </Text>

          <View style={styles.list}>
            <Text style={styles.listHead}>
              {t("gotore.coming_soon.planned_title")}
            </Text>
            <Text style={styles.listItem}>
              {t("gotore.coming_soon.planned_1")}
            </Text>
            <Text style={styles.listItem}>
              {t("gotore.coming_soon.planned_2")}
            </Text>
            <Text style={styles.listItem}>
              {t("gotore.coming_soon.planned_3")}
            </Text>
            <Text style={styles.listItem}>
              {t("gotore.coming_soon.planned_4")}
            </Text>
          </View>

          <Text style={styles.desc}>
            {t("gotore.coming_soon.description_2")}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
              marginTop: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/home")}
              style={styles.btnWhite}
            >
              <Text style={{ color: "#111", fontWeight: "800" }}>
                {t("gotore.coming_soon.btn_back_home")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/me")}
              style={styles.btnBlue}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {t("gotore.coming_soon.btn_open_notifications")}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            {Platform.OS === "ios"
              ? t("gotore.coming_soon.note_ios")
              : t("gotore.coming_soon.note_android")}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "92%",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  desc: {
    color: "#cbd5e1",
    marginTop: 12,
    lineHeight: 22,
    textAlign: "center",
    fontWeight: "600",
  },
  list: {
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  listHead: {
    color: "#93c5fd",
    fontWeight: "800",
    marginBottom: 6,
  },
  listItem: {
    color: "#e5e7eb",
  },
  btnWhite: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  btnBlue: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#3B82F6",
    borderRadius: 10,
  },
  note: {
    color: "#94a3b8",
    marginTop: 10,
    fontSize: 12,
    textAlign: "center",
  },
});
