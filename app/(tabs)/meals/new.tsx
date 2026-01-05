
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  Modal,
  Platform,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import dayjs from "dayjs";

import { spacing } from "../../../ui/theme";
import { Card, SectionTitle, PrimaryButton } from "../../../ui/components";

import type { Meal, MealType } from "../../../lib/meals";
import { saveMeal } from "../../../lib/storage";
import { generateId } from "../../../lib/id";
import { analyzeMealPhoto } from "../../../lib/ai";
import { useAppPrefs } from "../../../lib/app-prefs";
import { useTranslation } from "react-i18next";

let SliderComp: any = null;
try {
  SliderComp = require("expo-slider").Slider;
} catch {}
let Calendars: any = null;
try {
  Calendars = require("react-native-calendars");
} catch {}
let DateTimePicker: any = null;
try {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
} catch {}

type PrefillParams = {
  prefill_title?: string;
  prefill_brand?: string;
  prefill_photo?: string;
  prefill_grams?: string;
  prefill_kcal?: string;
  prefill_p?: string;
  prefill_f?: string;
  prefill_c?: string;
  date?: string;
  mealType?: MealType;
};

const cleanDecimal = (s: string): string => {
  if (s == null) return "";
  let t = String(s).replace(/[^0-9.]/g, "");

  const firstDot = t.indexOf(".");
  if (firstDot !== -1) {
    t = t.slice(0, firstDot + 1) + t.slice(firstDot + 1).replace(/\./g, "");
  }
  return t;
};

const toNum = (s: string): number | undefined => {
  const t = cleanDecimal(s).trim();
  if (!t || t === ".") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};

export default function NewMealScreen() {
  const { colors: C, effectiveScheme, haptic } = useAppPrefs();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<PrefillParams>();

  const [date, setDate] = useState<string>(
    () => (params.date || "").toString() || dayjs().format("YYYY-MM-DD")
  );
  const [mealType, setMealType] = useState<MealType>(
    (params.mealType as MealType) || "snack"
  );

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [grams, setGrams] = useState<number | undefined>(undefined);
  const [calories, setCalories] = useState<number | undefined>(undefined);
  const [protein, setProtein] = useState<number | undefined>(undefined);
  const [fat, setFat] = useState<number | undefined>(undefined);
  const [carbs, setCarbs] = useState<number | undefined>(undefined);

  const [caloriesText, setCaloriesText] = useState<string>("");
  const [proteinText, setProteinText] = useState<string>("");
  const [fatText, setFatText] = useState<string>("");
  const [carbsText, setCarbsText] = useState<string>("");

  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

  const [analyzing, setAnalyzing] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const baseRef = useRef<{
    grams?: number;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  } | null>(null);
  const [qty, setQty] = useState(1);

  const [dateModalOpen, setDateModalOpen] = useState(false);

  const handleDecimalInput = (
    raw: string,
    setText: (v: string) => void,
    setNumber: (v: number | undefined) => void
  ) => {
    const cleaned = cleanDecimal(raw);
    setText(cleaned);
    setNumber(toNum(cleaned));
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row" }}>
          <Pressable
            onPress={async () => {
              await haptic("light");
              router.push({
                pathname: "/(tabs)/help",
                params: { topic: "meals" },
              });
            }}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              marginRight: 6,
            }}
          >
            <Text style={{ fontWeight: "900", color: C.text }}>
              {t("help.common.helpButton")}
            </Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, router, C.text, haptic, t]);

  useEffect(() => {
    const tTitle = (params.prefill_title || "").toString();
    const b = (params.prefill_brand || "").toString();
    const ph = (params.prefill_photo || "").toString();
    const g = Number((params.prefill_grams || "").toString());
    const kcal = Number((params.prefill_kcal || "").toString());
    const p = Number((params.prefill_p || "").toString());
    const f = Number((params.prefill_f || "").toString());
    const c = Number((params.prefill_c || "").toString());

    if (tTitle) setTitle(tTitle);
    if (b) setBrand(b);
    if (!Number.isNaN(g) && g > 0) setGrams(g);
    if (!Number.isNaN(kcal) && kcal >= 0) {
      setCalories(kcal);
      setCaloriesText(String(kcal));
    }
    if (!Number.isNaN(p) && p >= 0) {
      setProtein(p);
      setProteinText(String(p));
    }
    if (!Number.isNaN(f) && f >= 0) {
      setFat(f);
      setFatText(String(f));
    }
    if (!Number.isNaN(c) && c >= 0) {
      setCarbs(c);
      setCarbsText(String(c));
    }
    if (ph) setPhotoUri(ph);

    setTimeout(() => snapshotBase("init"), 0);
  }, []);

  const canSave = useMemo(
    () => Boolean(title || calories || protein || fat || carbs),
    [title, calories, protein, fat, carbs]
  );

  function snapshotBase(_reason: string = "manual") {
    baseRef.current = { grams, calories, protein, fat, carbs };
    setQty(1);
  }
  function resetToBase() {
    const b = baseRef.current;
    if (!b) return;
    setGrams(b.grams);
    setCalories(b.calories);
    setProtein(b.protein);
    setFat(b.fat);
    setCarbs(b.carbs);

    setCaloriesText(b.calories != null ? String(b.calories) : "");
    setProteinText(b.protein != null ? String(b.protein) : "");
    setFatText(b.fat != null ? String(b.fat) : "");
    setCarbsText(b.carbs != null ? String(b.carbs) : "");

    setQty(1);
  }

  async function pickImage() {
    await haptic("light");
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("meals.new.photoPermissionTitle"),
          t("meals.new.photoPermissionMessage")
        );
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });
      if (res.canceled) return;
      const asset = res.assets && res.assets[0];
      if (!asset?.uri) return;
      setPhotoUri(asset.uri);
    } catch (e: any) {
      console.warn("pickImage error:", e);
      Alert.alert(t("meals.new.errorTitle"), String(e?.message || e));
    }
  }

  async function onAnalyzeFromPhoto() {
    await haptic("medium");
    try {
      if (!photoUri) {
        await pickImage();
        if (!photoUri) return;
      }
      const uriNow = photoUri;
      if (!uriNow) return;

      setAnalyzing(true);
      const r = await analyzeMealPhoto(uriNow);
      if (r.title && !title) setTitle(r.title);
      if (typeof r.calories === "number") {
        setCalories(r.calories);
        setCaloriesText(String(r.calories));
      }
      if (typeof r.protein === "number") {
        setProtein(r.protein);
        setProteinText(String(r.protein));
      }
      if (typeof r.fat === "number") {
        setFat(r.fat);
        setFatText(String(r.fat));
      }
      if (typeof r.carbs === "number") {
        setCarbs(r.carbs);
        setCarbsText(String(r.carbs));
      }

      snapshotBase("after-analyze");

      if (r.title || r.calories || r.protein || r.fat || r.carbs) {
        Alert.alert(
          t("meals.new.analyzeSuccessTitle"),
          r.reason
            ? t("meals.new.analyzeSuccessReason", {
                reason: r.reason,
              })
            : undefined
        );
      } else {
        Alert.alert(
          t("meals.new.analyzeNotFoundTitle"),
          t("meals.new.analyzeNotFoundMessage")
        );
      }
    } catch (e: any) {
      Alert.alert(
        t("meals.new.analyzeFailedTitle"),
        String(e?.message || e)
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function setQtyScaled(nextQty: number) {
    if (!baseRef.current) snapshotBase("qty-first");
    const base = baseRef.current!;
    setQty(nextQty);
    const scale = (v?: number) =>
      typeof v === "number" ? Math.round(v * nextQty) : undefined;

    const nextCalories = scale(base.calories);
    const nextProtein = scale(base.protein);
    const nextFat = scale(base.fat);
    const nextCarbs = scale(base.carbs);
    const nextGrams =
      typeof base.grams === "number"
        ? Math.round(base.grams * nextQty)
        : undefined;

    setCalories(nextCalories);
    setProtein(nextProtein);
    setFat(nextFat);
    setCarbs(nextCarbs);
    setGrams(nextGrams);

    setCaloriesText(nextCalories != null ? String(nextCalories) : "");
    setProteinText(nextProtein != null ? String(nextProtein) : "");
    setFatText(nextFat != null ? String(nextFat) : "");
    setCarbsText(nextCarbs != null ? String(nextCarbs) : "");
  }
  function incQty(delta: number) {
    const next = Math.max(
      0.25,
      Math.min(3, parseFloat((qty + delta).toFixed(2)))
    );
    setQtyScaled(next);
  }
  function setGramsScaled(nextG: number) {
    if (!baseRef.current) snapshotBase("grams-first");
    const base = baseRef.current!;
    setGrams(nextG);
    if (typeof base.grams === "number" && base.grams > 0) {
      const ratio = nextG / base.grams;
      const scale = (v?: number) =>
        typeof v === "number" ? Math.round(v * ratio) : undefined;

      const nextCalories = scale(base.calories);
      const nextProtein = scale(base.protein);
      const nextFat = scale(base.fat);
      const nextCarbs = scale(base.carbs);

      setCalories(nextCalories);
      setProtein(nextProtein);
      setFat(nextFat);
      setCarbs(nextCarbs);
      setQty(parseFloat(ratio.toFixed(2)));

      setCaloriesText(nextCalories != null ? String(nextCalories) : "");
      setProteinText(nextProtein != null ? String(nextProtein) : "");
      setFatText(nextFat != null ? String(nextFat) : "");
      setCarbsText(nextCarbs != null ? String(nextCarbs) : "");
    }
  }
  function incGrams(delta: number) {
    const g = Math.max(0, Math.min(10000, (grams ?? 0) + delta));
    setGramsScaled(g);
  }

  async function onSave() {
    await haptic("medium");
    const meal: Meal = {
      id: generateId("meal"),
      date,
      mealType,
      title: title?.trim() || undefined,
      brand: brand?.trim() || undefined,
      grams,
      calories,
      protein,
      fat,
      carbs,
      photoUri,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveMeal(meal);
    Alert.alert(
      t("meals.new.saveSuccessTitle"),
      t("meals.new.saveSuccessMessage"),
      [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/meals/search"),
        },
      ]
    );
  }

  const preview = (
    <View
      style={{
        marginTop: 12,
        backgroundColor: C.primary,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "900" }}>
        {t("meals.new.previewLabel", {
          kcal: calories ?? 0,
          protein: protein ?? 0,
          fat: fat ?? 0,
          carbs: carbs ?? 0,
          grams: grams ?? 0,
        })}
      </Text>
    </View>
  );

  const muted = effectiveScheme === "dark" ? "#6b7280" : "#9CA3AF";

  return (
    <>
      <Modal
        visible={helpOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalCard, { backgroundColor: C.card }]}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: C.text,
              }}
            >
              {t("meals.new.sliderHelpTitle")}
            </Text>
            <View style={{ height: 8 }} />
            <Text style={{ color: C.text }}>
              {t("meals.new.sliderHelpBody")}
            </Text>
            <View style={{ height: 16 }} />
            <PrimaryButton
              title="OK"
              onPress={() => setHelpOpen(false)}
            />
          </View>
        </View>
      </Modal>

      <CalendarModal
        open={dateModalOpen}
        value={date}
        onClose={() => setDateModalOpen(false)}
        onChange={(iso) => {
          setDate(iso);
          setDateModalOpen(false);
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Card
          style={{
            padding: spacing.md,
            backgroundColor: C.card,
            borderColor: C.border,
          }}
        >
          <SectionTitle>{t("meals.new.basicSectionTitle")}</SectionTitle>

          <Text
            style={{ color: C.sub, marginTop: spacing.sm }}
          >
            {t("meals.new.titleLabel")}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("meals.new.titlePlaceholder")}
            placeholderTextColor={muted}
            style={ti(C)}
          />

          <Text
            style={{ color: C.sub, marginTop: spacing.md }}
          >
            {t("meals.new.brandLabel")}
          </Text>
          <TextInput
            value={brand}
            onChangeText={setBrand}
            placeholder={t("meals.new.brandPlaceholder")}
            placeholderTextColor={muted}
            style={ti(C)}
          />

          <Text
            style={{ color: C.sub, marginTop: spacing.md }}
          >
            {t("meals.new.photoLabel")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 8,
            }}
          >
            <TouchableOpacity
              onPress={pickImage}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: C.card,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <Text
                style={{ color: C.text, fontWeight: "700" }}
              >
                {t("meals.new.photoPickButton")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onAnalyzeFromPhoto}
              disabled={analyzing}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: analyzing
                  ? effectiveScheme === "dark"
                    ? "#374151"
                    : "#e5e7eb"
                  : effectiveScheme === "dark"
                  ? "#0b1220"
                  : "#dbeafe",
                borderRadius: 8,
                borderWidth: 1,
                borderColor:
                  effectiveScheme === "dark"
                    ? "#1e3a8a66"
                    : "#bfdbfe",
              }}
            >
              {analyzing ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ActivityIndicator />
                  <Text
                    style={{
                      color: C.text,
                      fontWeight: "700",
                    }}
                  >
                    {t("meals.new.analyzingLabel")}
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    color:
                      effectiveScheme === "dark"
                        ? "#93c5fd"
                        : "#1e40af",
                    fontWeight: "700",
                  }}
                >
                  {t("meals.new.autoFromPhotoButton")}
                </Text>
              )}
            </TouchableOpacity>

            {!!photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                }}
              />
            )}
          </View>
          <Text
            style={{ color: C.sub, marginTop: spacing.md }}
          >
            {t("meals.new.autoFromPhotoNote")}
          </Text>

          <View style={{ marginTop: 12 }}>
            <PrimaryButton
              title={t("meals.new.barcodeButton")}
              onPress={async () => {
                await haptic("light");
                router.push("/(tabs)/meals/scan-barcode");
              }}
            />
          </View>
        </Card>

        <Card
          style={{
            padding: spacing.md,
            backgroundColor: C.card,
            borderColor: C.border,
          }}
        >
          <SectionTitle>
            {t("meals.new.nutritionSectionTitle")}
          </SectionTitle>
          <Text
            style={{ color: C.sub, marginTop: spacing.sm }}
          >
            {t("meals.new.nutritionDescription")}
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.sub }}>
                {t("meals.new.kcalLabel")}
              </Text>
              <TextInput
                value={caloriesText}
                onChangeText={(txt) =>
                  handleDecimalInput(
                    txt,
                    setCaloriesText,
                    setCalories
                  )
                }
                placeholder={t("meals.new.zeroPlaceholder")}
                placeholderTextColor={muted}
                style={ti(C)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.sub }}>
                {t("meals.new.pLabel")}
              </Text>
              <TextInput
                value={proteinText}
                onChangeText={(txt) =>
                  handleDecimalInput(
                    txt,
                    setProteinText,
                    setProtein
                  )
                }
                placeholder={t("meals.new.zeroPlaceholder")}
                placeholderTextColor={muted}
                style={ti(C)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.sub }}>
                {t("meals.new.fLabel")}
              </Text>
              <TextInput
                value={fatText}
                onChangeText={(txt) =>
                  handleDecimalInput(txt, setFatText, setFat)
                }
                placeholder={t("meals.new.zeroPlaceholder")}
                placeholderTextColor={muted}
                style={ti(C)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.sub }}>
                {t("meals.new.cLabel")}
              </Text>
              <TextInput
                value={carbsText}
                onChangeText={(txt) =>
                  handleDecimalInput(
                    txt,
                    setCarbsText,
                    setCarbs
                  )
                }
                placeholder={t("meals.new.zeroPlaceholder")}
                placeholderTextColor={muted}
                style={ti(C)}
              />
            </View>
          </View>

          {preview}

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 10,
            }}
          >
            <SmallGhostButton
              title={t("meals.new.baseSaveButton")}
              onPress={() => snapshotBase("manual-edit")}
            />
            <SmallGhostButton
              title={t("meals.new.resetButton")}
              onPress={resetToBase}
            />
          </View>
        </Card>

        <Card
          style={{
            padding: spacing.md,
            backgroundColor: C.card,
            borderColor: C.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <SectionTitle>
              {t("meals.new.quantitySectionTitle")}
            </SectionTitle>
            <Pressable onPress={() => setHelpOpen(true)}>
              <Text
                style={{
                  color: C.primary,
                  fontWeight: "900",
                }}
              >
                {t("meals.new.sliderHelpButton")}
              </Text>
            </Pressable>
          </View>

          <Text
            style={{ color: C.sub, marginTop: spacing.md }}
          >
            {t("meals.new.quantityLabel")}
          </Text>
          <RowStepper
            value={qty}
            onDec={() => incQty(-0.25)}
            onInc={() => incQty(+0.25)}
            rightLabel={`${qty.toFixed(2)}×`}
          >
            {SliderComp ? (
              <SliderComp
                value={qty}
                onValueChange={(v: number) =>
                  setQtyScaled(parseFloat(v.toFixed(2)))
                }
                minimumValue={0.25}
                maximumValue={3}
                step={0.05}
                style={{ flex: 1 }}
              />
            ) : null}
          </RowStepper>

          <Text
            style={{ color: C.sub, marginTop: spacing.md }}
          >
            {t("meals.new.gramsLabel")}
          </Text>
          <RowStepper
            value={grams ?? 0}
            onDec={() => incGrams(-10)}
            onInc={() => incGrams(+10)}
            rightLabel={`${grams ?? 0}g`}
          >
            {SliderComp ? (
              <SliderComp
                value={grams ?? 0}
                onValueChange={(v: number) =>
                  setGramsScaled(Math.round(v))
                }
                minimumValue={0}
                maximumValue={1000}
                step={5}
                style={{ flex: 1 }}
              />
            ) : null}
          </RowStepper>

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 10,
            }}
          >
            <SmallGhostButton
              title={t("meals.new.resetButton")}
              onPress={resetToBase}
            />
            <SmallGhostButton
              title={t("meals.new.baseSaveButton")}
              onPress={() => snapshotBase("manual")}
            />
          </View>
        </Card>

        <Card
          style={{
            padding: spacing.md,
            backgroundColor: C.card,
            borderColor: C.border,
          }}
        >
          <SectionTitle>
            {t("meals.new.targetSectionTitle")}
          </SectionTitle>

          <Text
            style={{ color: C.sub, marginTop: spacing.sm }}
          >
            {t("meals.new.dateLabel")}
          </Text>
          <TouchableOpacity
            onPress={() => setDateModalOpen(true)}
            style={{
              marginTop: 6,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: C.card,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: C.text, fontWeight: "800" }}
            >
              {date}
            </Text>
            <Text style={{ color: C.sub }}>📅</Text>
          </TouchableOpacity>

          <Text
            style={{ color: C.sub, marginTop: spacing.md }}
          >
            {t("meals.new.mealTypeLabel")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 8,
            }}
          >
            {(
              ["breakfast", "lunch", "dinner", "snack"] as MealType[]
            ).map((mt) => {
              const active = mealType === mt;
              return (
                <TouchableOpacity
                  key={mt}
                  onPress={async () => {
                    await haptic("light");
                    setMealType(mt);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? C.text : C.border,
                    backgroundColor: active ? C.text : C.card,
                  }}
                >
                  <Text
                    style={{
                      color: active ? C.card : C.text,
                      fontWeight: "700",
                    }}
                  >
                    {labelOfType(mt, t)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <PrimaryButton
          title={t("meals.new.saveButton")}
          onPress={onSave}
          disabled={!canSave}
        />
      </ScrollView>
    </>
  );
}

function ti(C: ReturnType<typeof useAppPrefs>["colors"]) {
  return {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    color: C.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  } as const;
}

function labelOfType(
  tType: MealType,
  tFn: (key: string) => string
) {
  switch (tType) {
    case "breakfast":
      return tFn("meals.types.breakfast");
    case "lunch":
      return tFn("meals.types.lunch");
    case "dinner":
      return tFn("meals.types.dinner");
    case "snack":
    default:
      return tFn("meals.types.snack");
  }
}

function SmallGhostButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  const { colors: C, haptic } = useAppPrefs();
  return (
    <TouchableOpacity
      onPress={async () => {
        await haptic("light");
        onPress();
      }}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.card,
      }}
    >
      <Text style={{ color: C.text, fontWeight: "800" }}>{title}</Text>
    </TouchableOpacity>
  );
}

function RowStepper({
  value,
  onDec,
  onInc,
  rightLabel,
  children,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  rightLabel: string;
  children?: React.ReactNode;
}) {
  const { colors: C } = useAppPrefs();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 6,
      }}
    >
      <StepBtn label="−" onPress={onDec} />
      <View style={{ flex: 1 }}>{children}</View>
      <StepBtn label="＋" onPress={onInc} />
      <Text
        style={{
          width: 70,
          textAlign: "right",
          fontWeight: "900",
          color: C.text,
        }}
      >
        {rightLabel}
      </Text>
    </View>
  );
}
function StepBtn({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors: C, effectiveScheme, haptic } = useAppPrefs();
  const bg = effectiveScheme === "dark" ? "#111827" : "#f1f5f9";
  const bd = effectiveScheme === "dark" ? "#1f2937" : "#e2e8f0";
  return (
    <TouchableOpacity
      onPress={async () => {
        await haptic("light");
        onPress();
      }}
      style={{
        width: 38,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: bd,
      }}
    >
      <Text
        style={{
          color: C.text,
          fontWeight: "900",
          fontSize: 18,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CalendarModal({
  open,
  value,
  onClose,
  onChange,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onChange: (isoDate: string) => void;
}) {
  const { colors: C, effectiveScheme } = useAppPrefs();
  const { t } = useTranslation();
  const [local, setLocal] = useState<string>(value);
  useEffect(() => setLocal(value), [value]);

  const hasCalendars = !!Calendars?.Calendar;
  const hasNativePicker = !!DateTimePicker;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalCard, { backgroundColor: C.card }]}
        >
          <Text
            style={{
              fontWeight: "900",
              fontSize: 16,
              color: C.text,
              marginBottom: 8,
            }}
          >
            {t("meals.new.calendarTitle")}
          </Text>

          {hasCalendars ? (
            <Calendars.Calendar
              initialDate={local}
              onDayPress={(d: any) => setLocal(d.dateString)}
              markedDates={{ [local]: { selected: true } }}
              theme={{
                calendarBackground: C.card,
                dayTextColor: C.text,
                monthTextColor: C.text,
                textDisabledColor: C.sub,
                todayTextColor: C.primary,
                selectedDayBackgroundColor: C.primary,
                selectedDayTextColor: "#fff",
              }}
              style={{
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 12,
              }}
            />
          ) : hasNativePicker ? (
            <DateTimePicker
              value={new Date(local || new Date())}
              mode="date"
              display={
                Platform.OS === "ios" ? "inline" : "calendar"
              }
              onChange={(_, d?: Date) =>
                d && setLocal(dayjs(d).format("YYYY-MM-DD"))
              }
            />
          ) : (
            <>
              <Text
                style={{
                  color: C.sub,
                  marginBottom: 8,
                }}
              >
                {t("meals.new.calendarFallback")}
              </Text>
              <TextInput
                value={local}
                onChangeText={setLocal}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={
                  effectiveScheme === "dark"
                    ? "#6b7280"
                    : "#9CA3AF"
                }
                style={{
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.card,
                  color: C.text,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              />
            </>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 12,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{ color: C.sub, fontWeight: "800" }}
              >
                {t("meals.new.calendarCancel")}
              </Text>
            </TouchableOpacity>
            <PrimaryButton
              title={t("meals.new.calendarDecide")}
              onPress={() => onChange(local)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: { borderRadius: 16, padding: 16 },
});
