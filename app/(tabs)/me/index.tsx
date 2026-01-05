// app/(tabs)/me/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import type { GestureResponderEvent } from "react-native";
import { useThemeColors, spacing, radius, shadow } from "../../../ui/theme";
import { supabase } from "../../../lib/supabase";
import {
  ensureMyUserRow,
  ensureMySettingsRow,
  ensureMyProfileRow,
  setSeekingBuddyOn,
} from "../../../lib/gotore/api";
import type { Gender } from "../../../lib/gotore/types";
import { useTranslation } from "react-i18next";

// ====== オプショナル依存（無くても落ちない） ======
let AsyncStorage: any = null;
try {
  AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
} catch {}

let Constants: any = null;
try {
  Constants = require("expo-constants").default;
} catch {}

let dayjs: any = null;
try {
  dayjs = require("dayjs");
} catch {}

type Summary = {
  // プロフィール
  displayName: string | null;
  email: string | null;
  timezone: string | null;

  // 目標・体データ
  weightTarget: number | null; // kg
  bodyFatTarget: number | null; // %
  kcalPerDay: number | null;
  p: number | null;
  f: number | null;
  c: number | null;

  // 通知
  trainingTimes: number;
  mealTimes: number;
  weeklyReview: boolean;

  // アプリ設定
  theme: "auto" | "light" | "dark" | null;
  haptics: boolean | null;

  // 体組成の最新（オプション）
  latestWeight: number | null;
  latestBodyFat: number | null;
  latestMeasuredAt: string | null; // ISO

  // 食事合計（オプション）
  todayCalories: number | null;

  // その他
  lastExportedAt: string | null;
  appVersion: string | null;
};

const DEFAULT_SUMMARY: Summary = {
  displayName: null,
  email: null,
  timezone: null,
  weightTarget: null,
  bodyFatTarget: null,
  kcalPerDay: null,
  p: null,
  f: null,
  c: null,
  trainingTimes: 0,
  mealTimes: 0,
  weeklyReview: false,
  theme: null,
  haptics: null,
  latestWeight: null,
  latestBodyFat: null,
  latestMeasuredAt: null,
  todayCalories: null,
  lastExportedAt: null,
  appVersion:
    (Constants?.expoConfig?.version as string | undefined) ||
    (Constants?.manifest2?.extra?.expoClient?.version as string | undefined) ||
    null,
};

// 既定の保存キー
const KEYS = {
  PROFILE: "me.profile",
  GOALS: "me.goals",
  NOTI: "me.notifications",
  APP: "me.appPrefs",
  SNAP_BODY: "snapshot.latestBody",
  SNAP_MEAL_TODAY: "snapshot.todayCalories",
  LAST_EXPORT: "me.lastExportedAt",
} as const;

/** カード（テーマ対応） */
function Card({ children }: { children: React.ReactNode }) {
  const C = useThemeColors();
  return (
    <View
      style={{
        borderRadius: radius.l,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
        paddingVertical: 4,
        marginBottom: spacing.md,
        ...shadow.card,
      }}
    >
      {children}
    </View>
  );
}

/** 行リンク（テーマ対応） */
function RowLink({
  href,
  title,
  subtitle,
  emoji,
  rightExtra,
  onLongPress,
}: {
  href: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  rightExtra?: React.ReactNode;
  onLongPress?: (e: GestureResponderEvent) => void;
}) {
  const C = useThemeColors();
  const { t } = useTranslation();

  return (
    <Link href={href} asChild>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t("settings.rowOpen", { title })}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: C.border,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
            {emoji ? `${emoji} ${title}` : title}
          </Text>
          {!!subtitle && (
            <Text
              style={{ fontSize: 12, color: C.subtext, marginTop: 2 }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {rightExtra}
        <Text style={{ marginLeft: 8, fontSize: 22, color: C.subtext }}>
          ›
        </Text>
      </TouchableOpacity>
    </Link>
  );
}

export default function SettingsHome() {
  const C = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();

  // ===== Auth 状態 =====
  const [authLoading, setAuthLoading] = useState(true);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ===== 既存サマリー =====
  const [summary, setSummary] = useState<Summary>(DEFAULT_SUMMARY);
  const [refreshing, setRefreshing] = useState(false);

  // 起動時：ログイン中か確認
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setMeEmail(data.user?.email ?? null);
      } catch {
        // noop
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  // ===== Auth 操作 =====
  const signIn = async () => {
    try {
      setAuthLoading(true);
      const { data, error } =
        await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMeEmail(data.user?.email ?? null);

      // 初回ログイン時に必要行を確保（性別は未回答として unknown）
      await ensureMyUserRow("unknown" as Gender);
      await ensureMySettingsRow();
      await ensureMyProfileRow();

      Alert.alert(t("settings.alert.signInSuccess"));
    } catch (e: any) {
      Alert.alert(
        t("settings.alert.signInFailTitle"),
        e?.message ?? t("settings.alert.unknownError")
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const signUp = async () => {
    try {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      setMeEmail(data.user?.email ?? null);
      await ensureMyUserRow("unknown" as Gender);
      await ensureMySettingsRow();
      await ensureMyProfileRow();

      Alert.alert(t("settings.alert.signUpSuccess"));
    } catch (e: any) {
      Alert.alert(
        t("settings.alert.signUpFailTitle"),
        e?.message ?? t("settings.alert.unknownError")
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthLoading(true);
      await supabase.auth.signOut();
      setMeEmail(null);
      Alert.alert(t("settings.alert.signOutSuccess"));
    } catch (e: any) {
      Alert.alert(
        t("settings.alert.signOutFailTitle"),
        e?.message ?? t("settings.alert.unknownError")
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const enableBuddy = async () => {
    try {
      setAuthLoading(true);
      await setSeekingBuddyOn();
      Alert.alert(t("settings.alert.buddyOnSuccess"));
      router.push("/(tabs)/gotore");
    } catch (e: any) {
      Alert.alert(
        t("settings.alert.updateFailTitle"),
        e?.message ?? t("settings.alert.unknownError")
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // ===== 設定サマリーのロード =====
  const loadSummary = useCallback(async () => {
    const safeParse = (s: string | null) => {
      if (!s) return null;
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    };

    // プロフィール
    let displayName: string | null = null;
    let emailV: string | null = null;
    let timezone: string | null = null;

    // 目標
    let weightTarget: number | null = null;
    let bodyFatTarget: number | null = null;
    let kcalPerDay: number | null = null;
    let p: number | null = null;
    let f: number | null = null;
    let c: number | null = null;

    // 通知
    let trainingTimes = 0;
    let mealTimes = 0;
    let weeklyReview = false;

    // アプリ設定
    let theme: "auto" | "light" | "dark" | null = null;
    let haptics: boolean | null = null;

    // スナップショット
    let latestWeight: number | null = null;
    let latestBodyFat: number | null = null;
    let latestMeasuredAt: string | null = null;
    let todayCalories: number | null = null;

    let lastExportedAt: string | null = null;

    if (AsyncStorage) {
      const [
        rawProfile,
        rawGoals,
        rawNoti,
        rawApp,
        rawBody,
        rawMealToday,
        rawExport,
      ] = await Promise.all([
        AsyncStorage.getItem(KEYS.PROFILE),
        AsyncStorage.getItem(KEYS.GOALS),
        AsyncStorage.getItem(KEYS.NOTI),
        AsyncStorage.getItem(KEYS.APP),
        AsyncStorage.getItem(KEYS.SNAP_BODY),
        AsyncStorage.getItem(KEYS.SNAP_MEAL_TODAY),
        AsyncStorage.getItem(KEYS.LAST_EXPORT),
      ]);

      const pr = safeParse(rawProfile);
      displayName = pr?.displayName ?? null;
      emailV = pr?.email ?? null;
      timezone = pr?.timezone ?? null;

      const gl = safeParse(rawGoals);
      weightTarget = numOrNull(gl?.weightTarget);
      bodyFatTarget = numOrNull(gl?.bodyFatTarget);
      kcalPerDay = numOrNull(gl?.kcalPerDay);
      p = numOrNull(gl?.p);
      f = numOrNull(gl?.f);
      c = numOrNull(gl?.c);

      const nt = safeParse(rawNoti);
      trainingTimes = Array.isArray(nt?.training?.times)
        ? nt.training.times.length
        : nt?.trainingTimes ?? 0;
      mealTimes = Array.isArray(nt?.meals?.times)
        ? nt.meals.times.length
        : nt?.mealTimes ?? 0;
      weeklyReview = !!(nt?.weeklyReview?.enabled ?? nt?.weeklyReview);

      const ap = safeParse(rawApp);
      theme = ap?.theme ?? null;
      haptics = typeof ap?.haptics === "boolean" ? ap.haptics : null;

      const lb = safeParse(rawBody);
      latestWeight = numOrNull(lb?.weight);
      latestBodyFat = numOrNull(lb?.bodyFat);
      latestMeasuredAt = lb?.measuredAt ?? null;

      const mt = safeParse(rawMealToday);
      todayCalories = numOrNull(mt?.kcal);

      lastExportedAt = rawExport || null;
    }

    setSummary((s) => ({
      ...s,
      displayName,
      email: emailV,
      timezone,
      weightTarget,
      bodyFatTarget,
      kcalPerDay,
      p,
      f,
      c,
      trainingTimes,
      mealTimes,
      weeklyReview,
      theme,
      haptics,
      latestWeight,
      latestBodyFat,
      latestMeasuredAt,
      todayCalories,
      lastExportedAt,
    }));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadSummary(),
        (async () => {
          try {
            const { data } = await supabase.auth.getUser();
            setMeEmail(data.user?.email ?? null);
          } catch {}
        })(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadSummary]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // ===== 表示用文字列 =====
  const profileSub = useMemo(() => {
    const name =
      summary.displayName ?? t("settings.profile.nameUnset");
    const mail =
      summary.email ??
      (meEmail ?? t("settings.profile.emailSignedOut"));
    return t("settings.profile.summary", { name, email: mail });
  }, [summary.displayName, summary.email, meEmail, t]);

  const goalSub = useMemo(() => {
    const dash = "—";
    const tW = isNum(summary.weightTarget)
      ? t("settings.goals.weightWithUnit", {
          value: summary.weightTarget,
        })
      : dash;
    const tB = isNum(summary.bodyFatTarget)
      ? t("settings.goals.bodyFatWithUnit", {
          value: summary.bodyFatTarget,
        })
      : dash;
    const kcal = isNum(summary.kcalPerDay)
      ? t("settings.goals.kcalWithUnit", {
          value: summary.kcalPerDay,
        })
      : dash;
    const p = isNum(summary.p)
      ? t("settings.goals.macroP", { value: summary.p })
      : t("settings.goals.macroP", { value: dash });
    const f = isNum(summary.f)
      ? t("settings.goals.macroF", { value: summary.f })
      : t("settings.goals.macroF", { value: dash });
    const c = isNum(summary.c)
      ? t("settings.goals.macroC", { value: summary.c })
      : t("settings.goals.macroC", { value: dash });

    return t("settings.goals.summary", {
      weight: tW,
      bodyFat: tB,
      kcal,
      p,
      f,
      c,
    });
  }, [summary, t]);

  const notiSub = useMemo(() => {
    const training = t("settings.notifications.countTimes", {
      count: summary.trainingTimes,
    });
    const meals = t("settings.notifications.countTimes", {
      count: summary.mealTimes,
    });
    const weekly = summary.weeklyReview
      ? t("settings.notifications.weeklyOn")
      : t("settings.notifications.weeklyOff");
    return t("settings.notifications.summary", {
      training,
      meals,
      weekly,
    });
  }, [
    summary.trainingTimes,
    summary.mealTimes,
    summary.weeklyReview,
    t,
  ]);

  const appSub = useMemo(() => {
    let themeKey: "light" | "dark" | "auto" | "unset" = "unset";
    if (summary.theme === "light") themeKey = "light";
    else if (summary.theme === "dark") themeKey = "dark";
    else if (summary.theme === "auto") themeKey = "auto";

    const themeLabel = t(`settings.app.theme.${themeKey}`);
    const hapticsLabel =
      summary.haptics === null
        ? t("settings.app.haptics.unset")
        : summary.haptics
        ? t("settings.app.haptics.on")
        : t("settings.app.haptics.off");

    return t("settings.app.summary", {
      theme: themeLabel,
      haptics: hapticsLabel,
    });
  }, [summary.theme, summary.haptics, t]);

  const bodyBadge = useMemo(() => {
    const dash = "—";
    const w = isNum(summary.latestWeight)
      ? t("settings.body.weightWithUnit", {
          value: summary.latestWeight,
        })
      : dash;
    const b = isNum(summary.latestBodyFat)
      ? t("settings.body.bodyFatWithUnit", {
          value: summary.latestBodyFat,
        })
      : dash;
    const at = summary.latestMeasuredAt
      ? dayjs
        ? dayjs(summary.latestMeasuredAt).format("M/D HH:mm")
        : summary.latestMeasuredAt
      : dash;
    return t("settings.body.summary", { weight: w, bodyFat: b, at });
  }, [summary.latestWeight, summary.latestBodyFat, summary.latestMeasuredAt, t]);

  const exportSub = useMemo(() => {
    if (!summary.lastExportedAt) {
      return t("settings.export.never");
    }
    const d = dayjs
      ? dayjs(summary.lastExportedAt).format("YYYY/MM/DD HH:mm")
      : summary.lastExportedAt;
    return t("settings.export.latest", { datetime: d });
  }, [summary.lastExportedAt, t]);

  const versionSub = useMemo(() => {
    if (!summary.appVersion) {
      return t("settings.version.none");
    }
    return t("settings.version.value", { version: summary.appVersion });
  }, [summary.appVersion, t]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={C.subtext}
          titleColor={C.subtext}
        />
      }
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          marginBottom: 4,
          color: C.text,
        }}
      >
        {t("settings.title")}
      </Text>
      <Text
        style={{ color: C.subtext, marginBottom: spacing.md }}
      >
        {t("settings.description")}
      </Text>

      {/* アカウント（ここでログイン/登録/ログアウト/合トレON） */}
      <Card>
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: C.text,
              marginBottom: 8,
            }}
          >
            {t("settings.account.title")}
          </Text>

          {authLoading ? (
            <View
              style={{
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <ActivityIndicator />
              <Text style={{ marginLeft: 8, color: C.subtext }}>
                {t("settings.account.checking")}
              </Text>
            </View>
          ) : meEmail ? (
            <>
              <Text style={{ color: C.text }}>
                {t("settings.account.currentEmail", { email: meEmail })}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  marginTop: 12,
                }}
              >
                <TouchableOpacity
                  onPress={enableBuddy}
                  style={{
                    backgroundColor: "#111",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                    }}
                  >
                    {t("settings.account.enableBuddy")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/gotore")}
                  style={{
                    marginLeft: 10,
                    backgroundColor: "#333",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                    }}
                  >
                    {t("settings.account.goBuddy")}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={signOut}
                style={{
                  marginTop: 12,
                  backgroundColor: "#c00",
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  alignSelf: "flex-start",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  {t("settings.account.signOut")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/me/account-delete")}
                style={{
                  marginTop: 12,
                  backgroundColor: "#c00",
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  alignSelf: "flex-start",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  {t("settings.account.deleteAccount")}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text
                style={{ color: C.subtext, marginBottom: 6 }}
              >
                {t("settings.account.emailLabel")}
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t("settings.account.emailPlaceholder")}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.card,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: C.text,
                }}
                placeholderTextColor={C.subtext}
              />

              <Text
                style={{
                  color: C.subtext,
                  marginTop: 10,
                  marginBottom: 6,
                }}
              >
                {t("settings.account.passwordLabel")}
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t(
                  "settings.account.passwordPlaceholder"
                )}
                secureTextEntry
                style={{
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.card,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: C.text,
                }}
                placeholderTextColor={C.subtext}
              />

              <TouchableOpacity
                onPress={signIn}
                style={{
                  marginTop: 12,
                  backgroundColor: "#111",
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  {t("settings.account.signIn")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={signUp}
                style={{
                  marginTop: 8,
                  backgroundColor: "#444",
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  {t("settings.account.signUp")}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Card>

      {/* 基本セクション */}
      <Card>
        <RowLink
          href="/(tabs)/me/account"
          title={t("settings.rows.profile.title")}
          subtitle={profileSub}
          emoji="👤"
        />
        <RowLink
          href="/(tabs)/me/goals"
          title={t("settings.rows.goals.title")}
          subtitle={goalSub}
          emoji="🎯"
        />
        <RowLink
          href="/(tabs)/me/notifications"
          title={t("settings.rows.notifications.title")}
          subtitle={notiSub}
          emoji="🔔"
        />
      </Card>

      <Card>
        <RowLink
          href="/(tabs)/settings/language"
          title={t("settings.rows.language.title")}
          subtitle={t("settings.rows.language.subtitle")}
          emoji="🗣️"
        />
        <RowLink
          href="/(tabs)/me/app-settings"
          title={t("settings.rows.appSettings.title")}
          subtitle={appSub}
          emoji="⚙️"
        />
        <RowLink
          href="/(tabs)/me/data-privacy"
          title={t("settings.rows.dataPrivacy.title")}
          subtitle={exportSub}
          emoji="🗂️"
        />
      </Card>

      <Card>
        <RowLink
          href="/(tabs)/me/support"
          title={t("settings.rows.support.title")}
          subtitle={t("settings.rows.support.subtitle")}
          emoji="🆘"
        />
        <RowLink
          href="/(tabs)/me/about"
          title={t("settings.rows.about.title")}
          subtitle={versionSub}
          emoji="ℹ️"
        />
        <RowLink
          href="/(tabs)/help"
          title={t("settings.rows.help.title")}
          subtitle={versionSub}
          emoji="❓"
        />
      </Card>

      <Text
        style={{
          textAlign: "center",
          color: C.subtext,
          fontSize: 12,
          marginTop: 8,
          marginBottom: 24,
        }}
      >
        {t("settings.readonlyNote")}
      </Text>
    </ScrollView>
  );
}

// ====== ユーティリティ ======
function isNum(v: any): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function numOrNull(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
