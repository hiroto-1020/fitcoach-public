// app/(tabs)/meals/[id]/edit.tsx
import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getMeal, updateMeal } from "../../../../lib/storage";
import type { Meal } from "../../../../lib/meals";
import { pickImageAndCopy } from "../../../../lib/image";
import { useTranslation } from "react-i18next";

export default function MealEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [title, setTitle] = useState("");
  const [cal, setCal] = useState("");
  const [memo, setMemo] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      if (!id) return;
      const m = await getMeal(id);
      if (!m) return;
      setMeal(m);
      setTitle(m.title ?? "");
      setCal(m.calories ? String(m.calories) : "");
      setMemo(m.memo ?? "");
      setPhotoUri(m.photoUri);
    })();
  }, [id]);

  if (!meal) {
    return (
      <Text style={{ padding: 16 }}>
        {t("meals.edit.loading")}
      </Text>
    );
  }

  async function onPickImage() {
    try {
      const uri = await pickImageAndCopy();
      if (uri) setPhotoUri(uri);
    } catch (e) {
      console.warn(e);
      Alert.alert(
        t("meals.edit.errorTitle"),
        t("meals.edit.errorPhotoMessage")
      );
    }
  }

  async function onSave() {
    await updateMeal(meal.id, {
      title: title.trim() || t("meals.edit.fallbackTitle"),
      calories: cal ? Number(cal) : undefined,
      memo: memo.trim() || undefined,
      photoUri,
    });
    router.replace(`/(tabs)/meals/${meal.id}`);
  }

  function onRemovePhoto() {
    Alert.alert(
      t("meals.edit.confirmRemovePhotoTitle"),
      t("meals.edit.confirmRemovePhotoMessage"),
      [
        { text: t("meals.edit.confirmRemovePhotoCancel"), style: "cancel" },
        {
          text: t("meals.edit.confirmRemovePhotoOk"),
          style: "destructive",
          onPress: () => setPhotoUri(undefined),
        },
      ]
    );
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text>{t("meals.edit.labelTitle")}</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 8,
          padding: 10,
        }}
      />

      <Text>{t("meals.edit.labelCalories")}</Text>
      <TextInput
        value={cal}
        onChangeText={setCal}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 8,
          padding: 10,
        }}
      />

      <Text>{t("meals.edit.labelMemo")}</Text>
      <TextInput
        value={memo}
        onChangeText={setMemo}
        multiline
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 8,
          padding: 10,
          height: 100,
        }}
      />

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={onPickImage}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#2563eb",
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "600" }}>
            {photoUri
              ? t("meals.edit.buttonChangePhoto")
              : t("meals.edit.buttonAddPhoto")}
          </Text>
        </TouchableOpacity>
        {photoUri ? (
          <TouchableOpacity
            onPress={onRemovePhoto}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ef4444",
              padding: 12,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: "600",
                color: "#ef4444",
              }}
            >
              {t("meals.edit.buttonRemovePhoto")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{ width: "100%", height: 200, borderRadius: 8 }}
        />
      ) : null}

      <TouchableOpacity
        onPress={onSave}
        style={{
          backgroundColor: "#2563eb",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          {t("meals.edit.buttonSave")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
