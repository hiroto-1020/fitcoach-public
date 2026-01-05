// C:\Users\horit\fitcoach\app\(tabs)\me\notifications.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColors } from "../../../ui/theme";
import { useTranslation } from "react-i18next";

// ===== Optional deps（無くても動作） =====
let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {}

let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch {}

let DateTimePicker: any = null;
try {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
} catch {}

// 保存キー（設定トップの読込と一致）
const NOTI_KEY = "me.notifications";
const NOTI_IDS_KEY = "me.noti.scheduledIds"; // 端末登録したIDの控え（自分の分だけキャンセルするため）
const CHANNEL_ID = "reminders"; // ← 高重要度チャネルを明示

/** ===== 型 ===== */
type TrainingSlot = { days: number[]; time: string }; // time="HH:mm", days: 0=Sun..6=Sat
type NotiPrefs = {
  training: { enabled: boolean; times: TrainingSlot[] };
  meals: { enabled: boolean; times: string[] }; // "HH:mm"
  weeklyReview: { enabled: boolean; dow: number; time: string };
};

const DEFAULT_PREFS: NotiPrefs = {
  training: { enabled: false, times: [] },
  meals: { enabled: false, times: [] },
  weeklyReview: { enabled: false, dow: 0, time: "20:00" }, // Sun 20:00
};

/** ===== メイン ===== */
export default function NotificationsScreen() {
  const C = useThemeColors();
  const { t } = useTranslation();

  const [prefs, setPrefs] = useState<NotiPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 権限
  const [perm, setPerm] = useState<"unknown" | "granted" | "denied">("unknown");
  const [hasNotiModule, setHasNotiModule] = useState<boolean>(!!Notifications);

  // iOSキーボード上バー
  const accessoryID = useRef("notiAccessory").current;

  // 曜日ラベル（言語別）
  const DOW_LABEL = useMemo(
    () => [
      t("notifications.dow_sun"),
      t("notifications.dow_mon"),
      t("notifications.dow_tue"),
      t("notifications.dow_wed"),
      t("notifications.dow_thu"),
      t("notifications.dow_fri"),
      t("notifications.dow_sat"),
    ],
    [t]
  );

  // 初回読込
  useEffect(() => {
    (async () => {
      if (AsyncStorage) {
        try {
          const raw = await AsyncStorage.getItem(NOTI_KEY);
          if (raw) {
            const v: NotiPrefs = JSON.parse(raw);
            setPrefs({
              training: v?.training ?? DEFAULT_PREFS.training,
              meals: v?.meals ?? DEFAULT_PREFS.meals,
              weeklyReview: v?.weeklyReview ?? DEFAULT_PREFS.weeklyReview,
            });
          }
        } catch {}
      }
      // 権限チェック & Androidチャネル（HIGH）作成
      if (Notifications) {
        try {
          const st = await Notifications.getPermissionsAsync();
          setPerm(
            st?.granted ? "granted" : st?.status === "denied" ? "denied" : "unknown"
          );

          if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync?.(CHANNEL_ID, {
              name: "Reminders",
              importance:
                Notifications.AndroidImportance?.HIGH ??
                4 /* HIGH */,
              vibrationPattern: [0, 250, 250, 250],
              sound: "default" as any,
              lockscreenVisibility:
                Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1,
            });
          }
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  const requestPerm = useCallback(async () => {
    if (!Notifications) return;
    try {
      const st = await Notifications.requestPermissionsAsync();
      setPerm(
        st?.granted ? "granted" : st?.status === "denied" ? "denied" : "unknown"
      );
      if (!st?.granted) {
        Alert.alert(
          t("notifications.alert_perm_needed_title"),
          t("notifications.alert_perm_needed_body")
        );
      }
    } catch {
      Alert.alert(
        t("notifications.alert_perm_error_title"),
        t("notifications.alert_perm_error_body")
      );
    }
  }, [t]);

  /** ===== 保存（必要ならOSへスケジュール登録） ===== */
  const onSave = useCallback(async () => {
    if (!AsyncStorage) {
      Alert.alert(
        t("notifications.alert_no_storage_title"),
        t("notifications.alert_no_storage_body")
      );
      return;
    }
    setSaving(true);
    try {
      // 1) 設定を保存
      await AsyncStorage.setItem(NOTI_KEY, JSON.stringify(prefs));

      // 2) モジュールがあれば端末へ再スケジュール
      let newIds: string[] = [];
      if (Notifications) {
        // 2-1) 以前の自分のスケジュールをキャンセル
        try {
          const rawIds = await AsyncStorage.getItem(NOTI_IDS_KEY);
          const ids: string[] = rawIds ? JSON.parse(rawIds) : [];
          await Promise.all(
            ids.map((id) =>
              Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
            )
          );
        } catch {}
        // 2-2) 必要なものを登録
        if (prefs.training.enabled) {
          for (const slot of prefs.training.times) {
            const { time, days } = slot;
            const { hour, minute } = parseHHmm(time) ?? { hour: 9, minute: 0 };
            if (Array.isArray(days) && days.length) {
              for (const d of days) {
                const id = await safeSchedule({
                  title: t("notifications.training_noti_title"),
                  body: t("notifications.training_noti_body"),
                  hour,
                  minute,
                  weekday: d,
                });
                if (id) newIds.push(id);
              }
            } else {
              const id = await safeSchedule({
                title: t("notifications.training_noti_title"),
                body: t("notifications.training_noti_body"),
                hour,
                minute,
              });
              if (id) newIds.push(id);
            }
          }
        }
        if (prefs.meals.enabled) {
          for (const tTime of prefs.meals.times) {
            const { hour, minute } =
              parseHHmm(tTime) ?? { hour: 7, minute: 30 };
            const id = await safeSchedule({
              title: t("notifications.meals_noti_title"),
              body: t("notifications.meals_noti_body"),
              hour,
              minute,
            });
            if (id) newIds.push(id);
          }
        }
        if (prefs.weeklyReview.enabled) {
          const { hour, minute } =
            parseHHmm(prefs.weeklyReview.time) ?? { hour: 20, minute: 0 };
          const id = await safeSchedule({
            title: t("notifications.weekly_noti_title"),
            body: t("notifications.weekly_noti_body"),
            hour,
            minute,
            weekday: prefs.weeklyReview.dow,
          });
          if (id) newIds.push(id);
        }
        // 2-3) 自分の登録IDを控える
        await AsyncStorage.setItem(NOTI_IDS_KEY, JSON.stringify(newIds));
      }

      Keyboard.dismiss();
      Alert.alert(
        t("notifications.alert_saved_title"),
        hasNotiModule
          ? t("notifications.alert_saved_with_schedule")
          : t("notifications.alert_saved_without_module")
      );
    } catch (e) {
      Alert.alert(
        t("notifications.alert_save_error_title"),
        t("notifications.alert_save_error_body")
      );
    } finally {
      setSaving(false);
    }
  }, [prefs, hasNotiModule, t]);

  // ===== UI操作ヘルパ =====
  const toggleTraining = (v: boolean) =>
    setPrefs((p) => ({ ...p, training: { ...p.training, enabled: v } }));
  const addTrainingSlot = () =>
    setPrefs((p) => ({
      ...p,
      training: {
        ...p.training,
        times: [...p.training.times, { days: [1, 3, 5], time: "19:00" }],
      },
    }));
  const removeTrainingSlot = (idx: number) =>
    setPrefs((p) => ({
      ...p,
      training: {
        ...p.training,
        times: p.training.times.filter((_, i) => i !== idx),
      },
    }));
  const updateTrainingTime = (idx: number, time: string) =>
    setPrefs((p) => {
      const arr = [...p.training.times];
      arr[idx] = { ...arr[idx], time };
      return { ...p, training: { ...p.training, times: arr } };
    });
  const toggleTrainingDay = (idx: number, dow: number) =>
    setPrefs((p) => {
      const arr = [...p.training.times];
      const set = new Set(arr[idx].days);
      set.has(dow) ? set.delete(dow) : set.add(dow);
      arr[idx] = { ...arr[idx], days: Array.from(set).sort() };
      return { ...p, training: { ...p.training, times: arr } };
    });

  const toggleMeals = (v: boolean) =>
    setPrefs((p) => ({ ...p, meals: { ...p.meals, enabled: v } }));
  const addMealTime = () =>
    setPrefs((p) => ({
      ...p,
      meals: { ...p.meals, times: [...p.meals.times, "07:30"] },
    }));
  const updateMealTime = (i: number, time: string) =>
    setPrefs((p) => {
      const arr = [...p.meals.times];
      arr[i] = time;
      return { ...p, meals: { ...p.meals, times: arr } };
    });
  const removeMealTime = (i: number) =>
    setPrefs((p) => ({
      ...p,
      meals: {
        ...p.meals,
        times: p.meals.times.filter((_, idx) => idx !== i),
      },
    }));

  const toggleWeekly = (v: boolean) =>
    setPrefs((p) => ({
      ...p,
      weeklyReview: { ...p.weeklyReview, enabled: v },
    }));
  const setWeeklyDow = (d: number) =>
    setPrefs((p) => ({
      ...p,
      weeklyReview: { ...p.weeklyReview, dow: d },
    }));
  const setWeeklyTime = (tStr: string) =>
    setPrefs((p) => ({
      ...p,
      weeklyReview: { ...p.weeklyReview, time: tStr },
    }));

  // 権限と状態のサマリ
  const permText = useMemo(() => {
    if (!hasNotiModule) return t("notifications.perm_module_missing");
    if (perm === "granted") return t("notifications.perm_granted");
    if (perm === "denied") return t("notifications.perm_denied");
    return t("notifications.perm_unknown");
  }, [perm, hasNotiModule, t]);

  if (loading) {
    return (
      <View
        style={[
          styles.wrap,
          {
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: C.bg,
          },
        ]}
      >
        <Text style={{ color: C.subtext }}>{t("notifications.loading")}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.wrap, { backgroundColor: C.bg }]}
        contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.h1, { color: C.text }]}>
          {t("notifications.title")}
        </Text>
        <Text style={[styles.sub, { color: C.subtext }]}>
          {t("notifications.subtitle")}
        </Text>

        {/* 権限/状態 */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: C.card, borderColor: C.border },
          ]}
        >
          <Text style={[styles.infoText, { color: C.primary }]}>
            📣 {permText}
          </Text>
          {hasNotiModule && perm !== "granted" && (
            <TouchableOpacity
              onPress={requestPerm}
              style={[styles.smallBtn, { backgroundColor: C.primary }]}
            >
              <Text
                style={[
                  styles.smallBtnText,
                  { color: C.primaryText },
                ]}
              >
                {t("notifications.button_request_perm")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* トレーニング */}
        <Card title={t("notifications.section_training_title")} C={C}>
          <RowSwitch
            label={t("notifications.switch_enabled")}
            value={prefs.training.enabled}
            onValueChange={toggleTraining}
            C={C}
          />
          {prefs.training.enabled && (
            <View style={{ marginTop: 8 }}>
              {prefs.training.times.map((slot, idx) => (
                <View key={idx} style={styles.slotCard}>
                  <View style={styles.slotHeader}>
                    <Text style={[styles.slotTitle, { color: C.text }]}>
                      {t("notifications.training_slot_label", {
                        index: idx + 1,
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeTrainingSlot(idx)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeBtnText}>
                        {t("notifications.button_delete")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 曜日チップ */}
                  <View style={styles.dowRow}>
                    {DOW_LABEL.map((lab, d) => {
                      const active = slot.days.includes(d);
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => toggleTrainingDay(idx, d)}
                          style={[
                            styles.chip,
                            active && styles.chipActive,
                          ]}
                          accessibilityLabel={`${lab}${active
                            ? t("notifications.accessibility_remove_suffix")
                            : t("notifications.accessibility_add_suffix")
                          }`}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              active && styles.chipTextActive,
                            ]}
                          >
                            {lab}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TimeField
                    label={t("notifications.time_label")}
                    value={slot.time}
                    onChange={(tStr) => updateTrainingTime(idx, tStr)}
                    inputAccessoryViewID={
                      Platform.OS === "ios" ? accessoryID : undefined
                    }
                    C={C}
                  />
                </View>
              ))}
              <SecondaryButton
                label={t("notifications.button_add_slot")}
                onPress={addTrainingSlot}
                C={C}
              />
            </View>
          )}
        </Card>

        {/* 食事 */}
        <Card title={t("notifications.section_meals_title")} C={C}>
          <RowSwitch
            label={t("notifications.switch_enabled")}
            value={prefs.meals.enabled}
            onValueChange={toggleMeals}
            C={C}
          />
          {prefs.meals.enabled && (
            <View style={{ marginTop: 8 }}>
              {prefs.meals.times.map((tTime, i) => (
                <View key={i} style={styles.slotRow}>
                  <TimeField
                    label={t("notifications.time_label_with_index", {
                      index: i + 1,
                    })}
                    value={tTime}
                    onChange={(v) => updateMealTime(i, v)}
                    style={{ flex: 1 }}
                    inputAccessoryViewID={
                      Platform.OS === "ios" ? accessoryID : undefined
                    }
                    C={C}
                  />
                  <TouchableOpacity
                    onPress={() => removeMealTime(i)}
                    style={[styles.removeBtn, { marginLeft: 8 }]}
                  >
                    <Text style={styles.removeBtnText}>
                      {t("notifications.button_delete")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              <SecondaryButton
                label={t("notifications.button_add_time")}
                onPress={addMealTime}
                C={C}
              />
              {/* 推奨プリセット（ラベルなしチップ） */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {["07:30", "12:00", "19:00", "21:30"].map((tt) => (
                  <TouchableOpacity
                    key={tt}
                    onPress={() =>
                      setPrefs((p) => ({
                        ...p,
                        meals: {
                          ...p.meals,
                          times: [...p.meals.times, tt],
                        },
                      }))
                    }
                    style={styles.preset}
                  >
                    <Text style={styles.presetText}>{tt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* 週間レビュー */}
        <Card title={t("notifications.section_weekly_title")} C={C}>
          <RowSwitch
            label={t("notifications.switch_enabled")}
            value={prefs.weeklyReview.enabled}
            onValueChange={toggleWeekly}
            C={C}
          />
          {prefs.weeklyReview.enabled && (
            <View style={{ marginTop: 8 }}>
              {/* 曜日選択（単一） */}
              <View style={styles.dowRow}>
                {DOW_LABEL.map((lab, d) => {
                  const active = prefs.weeklyReview.dow === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setWeeklyDow(d)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {lab}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TimeField
                label={t("notifications.time_label")}
                value={prefs.weeklyReview.time}
                onChange={setWeeklyTime}
                inputAccessoryViewID={
                  Platform.OS === "ios" ? accessoryID : undefined
                }
                C={C}
              />
            </View>
          )}
        </Card>

        {/* アクション */}
        <Text
          style={[styles.actionsLabel, { color: C.subtext }]}
        >
          {t("notifications.actions_title")}
        </Text>
        <View style={{ marginTop: 8, gap: 8 }}>
          <PrimaryButton
            label={
              saving
                ? t("notifications.button_saving")
                : t("notifications.button_save")
            }
            onPress={onSave}
            disabled={saving}
            C={C}
          />
          {/* テスト通知系はコメントのまま（必要なら後でi18n対応して再度有効化）
          {hasNotiModule && (
            <View style={{ gap: 8 }}>
              ...
            </View>
          )} */}
        </View>

        {(!hasNotiModule || perm !== "granted") && (
          <View
            style={[
              styles.warnBox,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <Text
              style={[styles.warnText, { color: C.danger }]}
            >
              {t("notifications.warn_requires_module")}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* iOS アクセサリバー */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={accessoryID}>
          <View
            style={[
              styles.accessoryBar,
              { borderColor: C.border, backgroundColor: C.card },
            ]}
          >
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              style={styles.accessoryBtn}
            >
              <Text
                style={[
                  styles.accessoryBtnText,
                  { color: C.text },
                ]}
              >
                {t("notifications.bar_close")}
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={onSave}
              style={[
                styles.accessoryPrimary,
                { backgroundColor: C.primary },
              ]}
            >
              <Text style={styles.accessoryPrimaryText}>
                {t("notifications.bar_save")}
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </KeyboardAvoidingView>
  );
}

/** ====== 小物 ====== */
function Card({
  title,
  children,
  C,
}: {
  title: string;
  children: React.ReactNode;
  C: any;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: C.card, borderColor: C.border },
      ]}
    >
      <Text style={[styles.cardTitle, { color: C.text }]}>{title}</Text>
      <View style={{ marginTop: 8 }}>{children}</View>
    </View>
  );
}

function RowSwitch({
  label,
  value,
  onValueChange,
  C,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  C: any;
}) {
  return (
    <View style={styles.rowSwitch}>
      <Text style={[styles.rowSwitchLabel, { color: C.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  C,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  C: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!!disabled}
      style={[
        styles.primaryBtn,
        { backgroundColor: C.primary },
        disabled && { opacity: 0.6 },
      ]}
    >
      <Text
        style={[
          styles.primaryBtnText,
          { color: C.primaryText },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({
  label,
  onPress,
  C,
}: {
  label: string;
  onPress: () => void;
  C: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.secondaryBtn,
        { backgroundColor: C.card, borderColor: C.border },
      ]}
    >
      <Text
        style={[
          styles.secondaryBtnText,
          { color: C.primary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function OutlineButton({
  label,
  onPress,
  C,
}: {
  label: string;
  onPress: () => void;
  C: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.outlineBtn,
        { borderColor: C.primary, backgroundColor: C.card },
      ]}
    >
      <Text
        style={[
          styles.outlineBtnText,
          { color: C.primary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** ====== Time Field（DateTimePicker があれば使い、無ければテキスト） ====== */
function TimeField({
  label,
  value,
  onChange,
  inputAccessoryViewID,
  style,
  C,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  inputAccessoryViewID?: string;
  style?: any;
  C: any;
}) {
  const [show, setShow] = useState(false);
  const parsed = parseHHmm(value) ?? { hour: 9, minute: 0 };

  return (
    <View style={[{ marginTop: 8 }, style]}>
      <Text style={[styles.fieldLabel, { color: C.text }]}>{label}</Text>
      <View style={styles.timeRow}>
        {DateTimePicker ? (
          <>
            <TouchableOpacity
              onPress={() => setShow(true)}
              style={[
                styles.timeBtn,
                { borderColor: C.border, backgroundColor: C.card },
              ]}
            >
              <Text
                style={[
                  styles.timeBtnText,
                  { color: C.text },
                ]}
              >
                {value || "09:00"}
              </Text>
            </TouchableOpacity>
            {show && (
              <DateTimePicker
                mode="time"
                value={dateFromHM(parsed.hour, parsed.minute)}
                is24Hour
                onChange={(_, d) => {
                  setShow(false);
                  if (d) onChange(formatHHmm(d.getHours(), d.getMinutes()));
                }}
              />
            )}
          </>
        ) : (
          // フォールバック：テキスト入力（HH:mm）
          <TextInput
            style={[
              styles.timeInput,
              {
                borderColor: C.border,
                backgroundColor: C.card,
                color: C.text,
              },
            ]}
            value={value}
            onChangeText={(tStr) => onChange(sanitizeHHmm(tStr))}
            placeholder="09:00"
            placeholderTextColor={C.subtext}
            keyboardType={
              Platform.OS === "ios"
                ? "numbers-and-punctuation"
                : "numeric"
            }
            inputMode="numeric"
            inputAccessoryViewID={inputAccessoryViewID}
            maxLength={5}
          />
        )}
      </View>
    </View>
  );
}

/** ====== 通知スケジュール（安全ラッパー：channelId付与） ====== */
async function safeSchedule({
  title,
  body,
  hour,
  minute,
  weekday, // 0..6 (Sun..Sat). 未指定なら毎日
}: {
  title: string;
  body: string;
  hour: number;
  minute: number;
  weekday?: number;
}): Promise<string | null> {
  if (!Notifications) return null;

  // Expoのweekdayは 1=Sun..7=Sat。0..6から変換。
  const expoWeekday =
    typeof weekday === "number"
      ? ((weekday + 1) as number)
      : undefined;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: expoWeekday
        ? {
            channelId: CHANNEL_ID,
            weekday: expoWeekday,
            hour,
            minute,
            repeats: true,
          }
        : { channelId: CHANNEL_ID, hour, minute, repeats: true },
    });
    return id as string;
  } catch {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: { channelId: CHANNEL_ID, hour, minute, repeats: true }, // 曜日不可環境のフォールバック
      });
      return id as string;
    } catch {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: { channelId: CHANNEL_ID, seconds: 2 }, // 最終フォールバック
        });
        return id as string;
      } catch {
        return null;
      }
    }
  }
}

/** ====== Utils ====== */
function parseHHmm(
  s: string | null | undefined
): { hour: number; minute: number } | null {
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  let h = Math.max(0, Math.min(23, Number(m[1])));
  let mm = Math.max(0, Math.min(59, Number(m[2])));
  return { hour: h, minute: mm };
}

function formatHHmm(h: number, m: number): string {
  const hh = h.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function sanitizeHHmm(s: string): string {
  // 入力を HH:mm っぽく補正（数字以外除去→コロン挿入）
  const only = s.replace(/[^\d]/g, "").slice(0, 4);
  if (only.length <= 2) return only;
  const hh = only.slice(0, 2);
  const mm = only.slice(2, 4);
  // 範囲クリップ
  const H = Math.max(0, Math.min(23, Number(hh)));
  const M = Math.max(0, Math.min(59, Number(mm)));
  return `${H.toString().padStart(2, "0")}:${M.toString()
    .padStart(2, "0")}`;
}

function dateFromHM(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/** ====== Styles ====== */
const styles = StyleSheet.create({
  wrap: { flex: 1 },
  h1: { fontSize: 20, fontWeight: "800" },
  sub: { marginTop: 4, marginBottom: 12 },

  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.06 : 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: "800" },

  infoBox: {
    borderRadius: 10,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  infoText: { fontWeight: "700" },
  smallBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  smallBtnText: { fontWeight: "800" },

  rowSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowSwitchLabel: { fontWeight: "700" },

  slotCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  slotTitle: { fontWeight: "800" },
  removeBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeBtnText: { color: "#991B1B", fontWeight: "800" },

  dowRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  chipText: { color: "#374151", fontWeight: "700" },
  chipTextActive: { color: "#fff" },

  slotRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },

  fieldLabel: { fontWeight: "700", marginBottom: 6 },
  timeRow: { flexDirection: "row", alignItems: "center" },
  timeInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 10, android: 8 }),
    fontSize: 16,
  },
  timeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  timeBtnText: { fontSize: 16, fontWeight: "700" },

  preset: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },
  presetText: { color: "#1D4ED8", fontWeight: "700" },

  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { fontWeight: "800", fontSize: 15 },

  secondaryBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtnText: { fontWeight: "800", fontSize: 14 },

  outlineBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  outlineBtnText: { fontWeight: "800" },

  warnBox: {
    borderRadius: 10,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  warnText: { fontWeight: "700", fontSize: 12, lineHeight: 18 },

  actionsLabel: {
    marginTop: 8,
    marginBottom: 2,
    fontSize: 13,
    fontWeight: "600",
  },

  accessoryBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  accessoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  accessoryBtnText: { fontWeight: "700" },
  accessoryPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  accessoryPrimaryText: { color: "#FFFFFF", fontWeight: "800" },
});
