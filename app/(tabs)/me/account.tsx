// app/(tabs)/me/account.tsx
//
// ・「端末内プロフィール（アカウント設定）」＋「合トレ用プロフィール」を一画面で編集
// ・自己紹介/年数/写真/身長/目標/頻度 を“完全一致”カラムに保存
// ・プロフィール写真はドラッグ並び替え・長押し削除・Storage同期
// ・性別は set_gender_once 経由（saveMyGender）で保存
// ・iOS InputAccessory（閉じる/保存）を全TextInputに対応
// ・KYCレスポンスのゆらぎに防御（approved/processing/submitted/created などを正規化）
// ・KYCが「rejected」になったら性別を 'unknown' に再読込して再選択を促す
// ・GenderOncePicker は使わずチップUIに固定（過去エラー根絶のため）

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
  InputAccessoryView,
  Keyboard,
  Modal,
  FlatList,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppPrefs } from "../../../lib/app-prefs";
import {
  getMyProfileAndGender,
  saveMyProfile,
  getMyKycAndGender,
  startKycSession,
  uploadProfilePhoto,
  saveProfilePhotos,
  saveMyGender,
} from "../../../lib/gotore/api";
import type { Gender } from "../../../lib/gotore/types";
import ReorderablePhotos from "../../../components/gotore/ReorderablePhotos";
import { supabase } from "../../../lib/supabase";
import { useTranslation } from "react-i18next";

// optional deps（未インストールでも落ちない動的 import）
let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {}
let ImagePicker: any = null;
try {
  ImagePicker = require("expo-image-picker");
} catch {}
let FileSystem: any = null;
try {
  FileSystem = require("expo-file-system/legacy");
} catch {}
let Location: any = null;
try {
  Location = require("expo-location");
} catch {}

const KEY_PROFILE = "me.profile";
const PROFILE_BUCKET = "profile-photos";
const MAX = 5;
const ADMIN_EMAILS = ["horita102011@gmail.com"];

const PREF_LIST = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

type LocalProfile = {
  displayName?: string | null;
  email?: string | null;
  timezone?: string | null;
  avatarUri?: string | null;
};

type VerifiedStatus = "unverified" | "pending" | "verified" | "rejected" | "failed";

/** 公開URL   object key（Storage削除用） */
function publicUrlToObjectKey(publicUrl: string): string | null {
  const marker = `/object/public/${PROFILE_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.substring(idx + marker.length);
}

/* --- 代替バッジ（VerifiedBadge が不安定な環境向け） --- */
function KycStatusPill({
  status,
  C,
  t,
}: {
  status: VerifiedStatus;
  C: any;
  t: (key: string, opt?: any) => string;
}) {
  const map: Record<VerifiedStatus, { bg: string; fg: string; label: string }> = {
    verified: {
      bg: "#16a34a",
      fg: "#fff",
      label: t("account.kyc.status.verified"),
    },
    pending: {
      bg: "#f59e0b",
      fg: "#111",
      label: t("account.kyc.status.pending"),
    },
    rejected: {
      bg: "#ef4444",
      fg: "#fff",
      label: t("account.kyc.status.rejected"),
    },
    failed: {
      bg: "#9ca3af",
      fg: "#111",
      label: t("account.kyc.status.failed"),
    },
    unverified: {
      bg: C.card,
      fg: C.text,
      label: t("account.kyc.status.unverified"),
    },
  };
  const s = map[status] ?? map.unverified;
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: s.bg,
      }}
    >
      <Text
        style={{
          color: s.fg,
          fontWeight: "800",
          fontSize: 12,
        }}
      >
        {s.label}
      </Text>
    </View>
  );
}

/* --- 性別チップUI（GenderOncePicker 非使用で安定運用） --- */
function ChipGenderUI({
  value,
  onChange,
  C,
  t,
}: {
  value: any;
  onChange: (g: any) => void;
  C: any;
  t: (key: string) => string;
}) {
  const Gs = ["male", "female", "other", "unknown"] as const;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {Gs.map((g) => (
        <TouchableOpacity
          key={g}
          onPress={() => onChange(g as any)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: value === g ? C.primary : C.border,
            backgroundColor: value === g ? C.primary : C.card,
            marginRight: 8,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color: value === g ? "#fff" : C.text,
              fontWeight: "700",
            }}
          >
            {t(`account.gender.${g}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* --- 安全ラッパー（常にチップUIを使用） --- */
function SafeGenderOncePicker({
  value,
  onChange,
  C,
  t,
}: {
  value: any;
  onChange: (g: any) => void;
  C: any;
  t: (key: string) => string;
}) {
  return <ChipGenderUI value={value} onChange={onChange} C={C} t={t} />;
}

export default function AccountScreen() {
  const { colors: C, haptic } = useAppPrefs();
  const router = useRouter();
  const { t } = useTranslation();

  // 端末内（ローカル）
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState(getDeviceTZ());
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [savingLocal, setSavingLocal] = useState(false);

  // 合トレ用（サーバ保存）
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender>("unknown");
  const [homeGym, setHomeGym] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [region, setRegion] = useState<string | null>(null);
  const [savingServer, setSavingServer] = useState(false);
  const [loadingServer, setLoadingServer] = useState(true);

  // “完全一致”フィールド群
  const [bio, setBio] = useState("");
  const [trainingYears, setTrainingYears] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [heightCm, setHeightCm] = useState("");
  const [goal, setGoal] = useState("");
  const [freqPerWeek, setFreqPerWeek] = useState("");

  // KYC
  const [kycStatus, setKycStatus] = useState<VerifiedStatus>("unverified");
  const [kycPersonId, setKycPersonId] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(false);

  // 管理者リンク表示
  const [isAdmin, setIsAdmin] = useState(false);
  const [canSelfPromote, setCanSelfPromote] = useState(false);

  // 地域モーダル
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionQuery, setRegionQuery] = useState("");

  // iOS InputAccessory
  const accessoryID = useRef("accountAccessory").current;

  /* ===== Util ===== */
  const normalizeGender = useCallback((g: any): Gender => {
    return (["male", "female", "other"].includes(g) ? g : "unknown") as Gender;
  }, []);

  const promoteSelfToAdmin = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke("admin-bootstrap", { body: {} });
      if (error) throw error;
      Alert.alert(
        t("account.admin.promoteSuccessTitle"),
        t("account.admin.promoteSuccessMessage"),
      );
      setIsAdmin(true);
      setCanSelfPromote(false);
    } catch (e: any) {
      Alert.alert(
        t("account.admin.promoteErrorTitle"),
        String(e?.message ?? e),
      );
    }
  }, [t]);

  /* ===== プロフィール再読込（初期ロード/手動更新で共通使用） ===== */
  const reloadProfile = useCallback(async () => {
    setLoadingServer(true);
    try {
      const { gender: g, profile } = await getMyProfileAndGender();

      setGender(normalizeGender(g));
      setNickname(profile?.nickname ?? "");
      setHomeGym(profile?.home_gym_location ?? "");
      setTagsText((profile?.preferred_training_tags ?? []).join(","));
      setRegion((profile as any)?.region ?? null);

      setBio(profile?.bio ?? "");
      setTrainingYears(
        typeof profile?.training_years === "number" && !Number.isNaN(profile.training_years)
          ? String(profile.training_years)
          : "",
      );
      setPhotos(
        Array.isArray((profile as any)?.photos) ? (profile as any).photos : [],
      );

      setHeightCm(
        typeof (profile as any)?.height_cm === "number"
          ? String((profile as any).height_cm)
          : typeof (profile as any)?.height === "number"
          ? String((profile as any).height)
          : "",
      );
      setGoal(((profile as any)?.goal ?? "") as string);
      setFreqPerWeek(
        typeof (profile as any)?.training_frequency_per_week === "number"
          ? String((profile as any).training_frequency_per_week)
          : typeof (profile as any)?.training_frequency === "number"
          ? String((profile as any).training_frequency)
          : "",
      );
    } catch (e: any) {
      if (String(e?.message ?? e) !== "not_authenticated") {
        Alert.alert(
          t("account.common.loadErrorTitle"),
          e?.message ?? t("account.common.loadErrorFallbackMessage"),
        );
      }
    } finally {
      setLoadingServer(false);
    }
  }, [normalizeGender, t]);

  /* ===== 初期ロード（ローカル） ===== */
  useEffect(() => {
    (async () => {
      if (!AsyncStorage) return;
      try {
        const raw = await AsyncStorage.getItem(KEY_PROFILE);
        const p: LocalProfile | null = raw ? JSON.parse(raw) : null;
        setDisplayName(safeStr(p?.displayName));
        setEmail(safeStr(p?.email));
        setTimezone(p?.timezone || getDeviceTZ());
        setAvatarUri(p?.avatarUri ?? null);
      } catch {}
    })();
  }, []);

  /* ===== 初期ロード（サーバ：プロフィール） ===== */
  useEffect(() => {
    reloadProfile();
  }, [reloadProfile]);

  /* ===== 管理者判定 ===== */
  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id ?? "";
        const email = auth?.user?.email ?? "";
        const allow = ADMIN_EMAILS.includes(email);

        let db = false;
        if (uid) {
          const { data } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("user_id", uid)
            .maybeSingle();
          db = !!data?.is_admin;
        }

        setIsAdmin(db || allow);
        setCanSelfPromote(allow && !db); // 許可メールだがDBはfalse → 復旧ボタンを出す
      } catch {}
    })();
  }, []);

  /* ===== KYC 状態の読込（防御的） ===== */
  const loadKyc = useCallback(async () => {
    setKycLoading(true);
    try {
      // サーバのKYC＋性別情報を取得（返却形のゆらぎに対応）
      const raw = await getMyKycAndGender().catch(() => undefined);

      const node: any =
        raw && typeof raw === "object"
          ? "kyc" in (raw as any)
            ? (raw as any).kyc
            : raw
          : undefined;

      const statusRaw: string =
        node?.verified_status ??
        node?.kyc_status ??
        node?.status ??
        "unverified";

      const normalized: VerifiedStatus =
        statusRaw === "approved"
          ? "verified"
          : ["processing", "submitted", "created", "pending"].includes(
              statusRaw,
            )
          ? "pending"
          : (["verified", "pending", "rejected", "failed", "unverified"].includes(
              statusRaw,
            )
              ? (statusRaw as VerifiedStatus)
              : "unverified");

      const personId: string | null =
        node?.verified_person_id ??
        node?.person_id ??
        node?.kyc_person_id ??
        null;

      setKycStatus(normalized);
      setKycPersonId(personId);

      //  否認 or 未確認時はサーバの最新プロフィールを取り直してUIへ反映
      if (normalized === "rejected" || normalized === "unverified") {
        try {
          const { gender: g } = await getMyProfileAndGender();
          setGender(
            (["male", "female", "other"].includes(g as any)
              ? (g as Gender)
              : "unknown"),
          );
        } catch {
          setGender("unknown");
        }
      }
    } catch (e: any) {
      setKycStatus("unverified");
      setKycPersonId(null);
      console.warn("KYC読み込みエラー:", String(e?.message ?? e));
    } finally {
      setKycLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKyc();
  }, [loadKyc]);

  /* ===== KYC 起動 ===== */
  const onStartKycInApp = useCallback(
    async () => {
      try {
        setKycLoading(true);
        const sid =
          "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        await startKycSession("persona", sid); // ← RPCがDBにpending行を作る

        // 楽観更新：すぐピルを pending に
        setKycStatus("pending");

        // 既存のKYCフローへ遷移（存在する前提）
        router.push({
          pathname: "/(tabs)/me/kyc",
          params: { sid, provider: "persona" },
        } as any);
      } catch (e: any) {
        Alert.alert(
          t("account.kyc.startErrorTitle"),
          String(e?.message ?? e),
        );
      } finally {
        setKycLoading(false);
      }
    },
    [router, t],
  );

  /* ===== 端末保存 ===== */
  const onSaveLocal = useCallback(async () => {
    setSavingLocal(true);
    try {
      const payload: LocalProfile = {
        displayName: displayName.trim() || null,
        email: email.trim() || null,
        timezone: timezone || getDeviceTZ(),
        avatarUri: avatarUri ?? null,
      };
      if (AsyncStorage)
        await AsyncStorage.setItem(KEY_PROFILE, JSON.stringify(payload));
      haptic("light");
      Alert.alert(
        t("account.local.saveSuccessTitle"),
        t("account.local.saveSuccessMessage"),
      );
    } catch {
      Alert.alert(
        t("account.local.saveErrorTitle"),
        t("account.local.saveErrorMessage"),
      );
    } finally {
      setSavingLocal(false);
    }
  }, [displayName, email, timezone, avatarUri, haptic, t]);

  /* ===== サーバ保存（合トレ） ===== */
  const onSaveServer = useCallback(async () => {
    if (!region) {
      Alert.alert(
        t("account.region.missingTitle"),
        t("account.region.missingMessage"),
      );
      return;
    }
    setSavingServer(true);
    try {
      const tags = tagsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const yearsNum = trainingYears
        ? Number(trainingYears.replace(/[^\d]/g, ""))
        : null;
      const heightNum = heightCm
        ? Number(heightCm.replace(/[^\d]/g, ""))
        : null;

      const freqNumRaw = freqPerWeek
        ? Number(freqPerWeek.replace(/[^\d]/g, ""))
        : null;
      const freqNum =
        freqNumRaw != null ? Math.max(1, Math.min(14, freqNumRaw)) : null;

      await saveMyProfile({
        nickname: nickname.trim() || null,
        home_gym_location: homeGym.trim() || null,
        preferred_training_tags: tags,
        region,
        bio: bio.trim() || null,
        training_years: yearsNum,
        photos, // 先頭がメイン
        height_cm: heightNum,
        goal: goal.trim() || null,
        training_frequency_per_week: freqNum,
      });

      //  性別は set_gender_once（saveMyGender throwで制御）
      await saveMyGender(gender);

      haptic("light");
      Alert.alert(
        t("account.gotore.saveSuccessTitle"),
        t("account.gotore.saveSuccessMessage"),
      );
    } catch (e: any) {
      const code = String(e?.message ?? e);
      if (code.includes("not_authenticated")) {
        Alert.alert(
          t("account.errors.notAuthenticatedTitle"),
          t("account.errors.notAuthenticatedMessage"),
        );
      } else {
        const map: Record<string, string> = {
          gender_locked: t("account.errors.genderLocked"),
          gender_update_blocked: t("account.errors.genderUpdateBlocked"),
          kyc_pending: t("account.errors.kycPending"),
          invalid_or_used_token: t("account.errors.invalidOrUsedToken"),
          invalid_gender: t("account.errors.invalidGender"),
          profile_not_found: t("account.errors.profileNotFound"),
          gender_update_not_allowed: t("account.errors.genderUpdateNotAllowed"),
          unknown: t("account.errors.unknown"),
        };
        Alert.alert(t("account.gotore.saveErrorTitle"), map[code] ?? code);
      }
    } finally {
      setSavingServer(false);
    }
  }, [
    nickname,
    homeGym,
    tagsText,
    gender,
    region,
    bio,
    trainingYears,
    photos,
    heightCm,
    goal,
    freqPerWeek,
    haptic,
    t,
  ]);

  /* ===== 画像変更（ローカル：端末アバター） ===== */
  const pickImage = useCallback(async () => {
    if (!ImagePicker) {
      Alert.alert(
        t("account.common.imagePickerMissingTitle"),
        t("account.common.imagePickerMissingMessage"),
      );
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
      if (perm && perm.status !== "granted") return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        copyToCacheDirectory: true,
      });
      if (res?.canceled) return;
      const src = res.assets?.[0]?.uri;
      if (!src) return;
      let storedUri = src;
      if (FileSystem?.documentDirectory) {
        const dir = FileSystem.documentDirectory + "profile";
        await FileSystem.makeDirectoryAsync?.(dir, { intermediates: true }).catch(
          () => {},
        );
        const dst = dir + "/avatar.jpg";
        await FileSystem.deleteAsync?.(dst, { idempotent: true }).catch(
          () => {},
        );
        await FileSystem.copyAsync?.({ from: src, to: dst });
        storedUri = dst;
      }
      setAvatarUri(storedUri);
      haptic("light");
      Alert.alert(
        t("account.local.imageUpdatedTitle"),
        t("account.local.imageUpdatedMessage"),
      );
    } catch {
      Alert.alert(
        t("account.local.imageLoadErrorTitle"),
        t("account.local.imageLoadErrorMessage"),
      );
    }
  }, [haptic, t]);

  const removeImage = useCallback(() => {
    setAvatarUri(null);
    haptic("light");
  }, [haptic]);

  /* ===== 地域候補 ===== */
  const regionFiltered = useMemo(() => {
    const q = regionQuery.trim();
    if (!q) return PREF_LIST as readonly string[];
    return PREF_LIST.filter((p) => p.includes(q));
  }, [regionQuery]);

  /* ===== 現在地から都道府県推定 ===== */
  const setRegionFromGPS = useCallback(async () => {
    if (!Location) {
      Alert.alert(
        t("account.region.locationLibMissingTitle"),
        t("account.region.locationLibMissingMessage"),
      );
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      const geos = await Location.reverseGeocodeAsync(pos.coords);
      const adm = (geos?.[0]?.region || geos?.[0]?.subregion || "").trim();
      const hit = matchPrefecture(adm);
      if (hit) setRegion(hit);
      else {
        Alert.alert(
          t("account.region.cannotDetectTitle"),
          t("account.region.cannotDetectMessage"),
        );
      }
    } catch {
      Alert.alert(
        t("account.region.locationErrorTitle"),
        t("account.region.locationErrorMessage"),
      );
    }
  }, [t]);

  /* ===== 合トレ写真：追加（Storage   DB） ===== */
  const pickServerPhoto = useCallback(
    async () => {
      if (!ImagePicker) {
        Alert.alert(
          t("account.common.imagePickerMissingTitle"),
          t("account.common.imagePickerMissingMessage"),
        );
        return;
      }
      try {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
        if (perm && perm.status !== "granted") return;

        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        });
        if (res?.canceled) return;

        const src = res.assets?.[0]?.uri;
        if (!src) return;

        setUploadingPhoto(true);

        // 共通アップローダ（RN安全版）
        const publicUrl = await uploadProfilePhoto(src);

        // 先頭に追加（＝メイン化）し、最大5枚
        const next = [publicUrl, ...photos].slice(0, MAX);
        setPhotos(next);

        // DBにも即反映
        await saveProfilePhotos(next);

        haptic("light");
      } catch (e: any) {
        Alert.alert(
          t("account.photos.uploadErrorTitle"),
          String(e?.message ?? t("account.photos.uploadErrorMessageFallback")),
        );
      } finally {
        setUploadingPhoto(false);
      }
    },
    [photos, haptic, t],
  );

  /* ===== 合トレ写真：並び替え/削除   即保存 & Storage同期 ===== */
  const onPhotosChange = useCallback(
    async (next: string[]) => {
      const capped = next.slice(0, MAX);

      // 同一なら何もしない（無駄保存防止）
      if (JSON.stringify(capped) === JSON.stringify(photos)) return;

      // 削除されたURLを検出し、Storageからも削除
      const removed = photos.filter((u) => !capped.includes(u));
      if (removed.length) {
        const keys = removed
          .map(publicUrlToObjectKey)
          .filter((k): k is string => !!k);
        if (keys.length) {
          await supabase.storage
            .from(PROFILE_BUCKET)
            .remove(keys)
            .catch(() => {});
        }
      }

      setPhotos(capped);
      try {
        await saveProfilePhotos(capped);
        haptic("light");
      } catch {}
    },
    [photos, haptic],
  );

  const removeServerPhotoAt = useCallback(
    async (idx: number) => {
      try {
        const next = photos.filter((_, i) => i !== idx);
        // Storage削除
        const key = publicUrlToObjectKey(photos[idx]);
        if (key) {
          await supabase.storage
            .from(PROFILE_BUCKET)
            .remove([key])
            .catch(() => {});
        }
        setPhotos(next);
        await saveProfilePhotos(next);
        haptic("light");
      } catch (e: any) {
        Alert.alert(
          t("account.photos.removeErrorTitle"),
          String(e?.message ?? t("account.photos.removeErrorMessageFallback")),
        );
      }
    },
    [photos, haptic, t],
  );

  /* ===== 表示 ===== */
  const inputAccessoryProp =
    Platform.OS === "ios" ? { inputAccessoryViewID: accessoryID } : {};

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 220 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={[styles.h1, { color: C.text }]}>{t("account.title")}</Text>
        <Text style={[styles.sub, { color: C.sub }]}>
          {t("account.subtitle")}
        </Text>

        {/* 端末内プロフィール（ローカル） */}
        <Card title={t("account.local.cardTitle")} C={C}>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.8}
              style={[styles.avatarWrap, { borderColor: C.border }]}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <Text
                  style={{
                    color: C.sub,
                    fontSize: 22,
                    fontWeight: "800",
                  }}
                >
                  ＋
                </Text>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.label, { color: C.sub }]}>
                {t("account.local.displayNameLabel")}
              </Text>
              <TextInput
                placeholder={t("account.local.displayNamePlaceholder")}
                placeholderTextColor={
                  Platform.OS === "ios" ? "#9CA3AF" : C.sub
                }
                value={displayName}
                onChangeText={setDisplayName}
                style={[
                  styles.input,
                  {
                    borderColor: C.border,
                    color: C.text,
                    backgroundColor: C.card,
                  },
                ]}
                returnKeyType="done"
                {...inputAccessoryProp}
              />
            </View>
          </View>

          <View style={{ height: 10 }} />
          <View>
            <Text style={[styles.label, { color: C.sub }]}>
              {t("account.local.emailLabel")}
            </Text>
            <TextInput
              placeholder={t("account.local.emailPlaceholder")}
              placeholderTextColor={
                Platform.OS === "ios" ? "#9CA3AF" : C.sub
              }
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={[
                styles.input,
                {
                  borderColor: C.border,
                  color: C.text,
                  backgroundColor: C.card,
                },
              ]}
              returnKeyType="done"
              {...inputAccessoryProp}
            />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            {!!avatarUri && (
              <TouchableOpacity
                onPress={removeImage}
                style={[
                  styles.linkBtn,
                  { backgroundColor: isDark(C) ? "#1f2a37" : "#F3F4F6" },
                ]}
              >
                <Text style={{ color: C.text, fontWeight: "700" }}>
                  {t("account.local.removeImageButton")}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={pickImage}
              style={[
                styles.linkBtn,
                { backgroundColor: isDark(C) ? "#0a1630" : "#F0F9FF" },
              ]}
            >
              <Text style={{ color: C.primary, fontWeight: "800" }}>
                {t("account.local.changeImageButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* 合トレ用プロフィール（サーバ保存） */}
        <Card title={t("account.gotore.cardTitle")} C={C}>
          {/* ニックネーム */}
          <Text style={[styles.label, { color: C.sub }]}>
            {t("account.gotore.nicknameLabel")}
          </Text>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder={t("account.gotore.nicknamePlaceholder")}
            placeholderTextColor={
              Platform.OS === "ios" ? "#9CA3AF" : C.sub
            }
            style={[
              styles.input,
              {
                borderColor: C.border,
                color: C.text,
                backgroundColor: C.card,
              },
            ]}
            {...inputAccessoryProp}
          />

          {/* 性別 */}
          <Text
            style={[
              styles.label,
              { color: C.sub, marginTop: 12 },
            ]}
          >
            {t("account.gotore.genderLabel")}
          </Text>
          <SafeGenderOncePicker
            value={gender}
            onChange={(g: any) => setGender(g)}
            C={C}
            t={t}
          />

          {/* 地域（必須） */}
          <Text
            style={[
              styles.label,
              { color: C.sub, marginTop: 12 },
            ]}
          >
            {t("account.region.label")}
          </Text>
          <TouchableOpacity
            onPress={() => setRegionOpen(true)}
            activeOpacity={0.8}
            style={[
              styles.input,
              {
                borderColor: C.border,
                backgroundColor: C.card,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
          >
            <Text
              style={{
                color: region ? C.text : "#9CA3AF",
                fontWeight: "700",
              }}
            >
              {region || t("account.region.placeholder")}
            </Text>
            <Text style={{ color: C.sub }}>
              {t("account.region.change")}
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              onPress={setRegionFromGPS}
              style={[
                styles.outlineBtn,
                { borderColor: C.primary, flex: 1 },
              ]}
            >
              <Text
                style={{
                  color: C.primary,
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                {t("account.region.setFromCurrentLocation")}
              </Text>
            </TouchableOpacity>
            {!!region && (
              <TouchableOpacity
                onPress={() => setRegion(null)}
                style={[
                  styles.outlineBtn,
                  { borderColor: "#ddd", flex: 1 },
                ]}
              >
                <Text
                  style={{
                    color: C.text,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {t("account.region.clear")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ホームジム */}
          <Text
            style={[
              styles.label,
              { color: C.sub, marginTop: 12 },
            ]}
          >
            {t("account.gotore.homeGymLabel")}
          </Text>
          <TextInput
            value={homeGym}
            onChangeText={setHomeGym}
            placeholder={t("account.gotore.homeGymPlaceholder")}
            placeholderTextColor={
              Platform.OS === "ios" ? "#9CA3AF" : C.sub
            }
            style={[
              styles.input,
              {
                borderColor: C.border,
                color: C.text,
                backgroundColor: C.card,
              },
            ]}
            {...inputAccessoryProp}
          />

          {/* 種目タグ */}
          <Text
            style={[
              styles.label,
              { color: C.sub, marginTop: 12 },
            ]}
          >
            {t("account.gotore.tagsLabel")}
          </Text>
          <TextInput
            value={tagsText}
            onChangeText={setTagsText}
            placeholder={t("account.gotore.tagsPlaceholder")}
            placeholderTextColor={
              Platform.OS === "ios" ? "#9CA3AF" : C.sub
            }
            style={[
              styles.input,
              {
                borderColor: C.border,
                color: C.text,
                backgroundColor: C.card,
              },
            ]}
            {...inputAccessoryProp}
          />

          {/* 自己紹介 */}
          <Text
            style={[
              styles.label,
              { color: C.sub, marginTop: 12 },
            ]}
          >
            {t("account.gotore.bioLabel")}
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder={t("account.gotore.bioPlaceholder")}
            placeholderTextColor={
              Platform.OS === "ios" ? "#9CA3AF" : C.sub
            }
            multiline
            style={[
              styles.input,
              {
                borderColor: C.border,
                color: C.text,
                backgroundColor: C.card,
                minHeight: 100,
                textAlignVertical: "top",
              },
            ]}
            {...inputAccessoryProp}
          />

          {/* トレーニング年数（年） */}
          <Text
            style={[
              styles.label,
              { color: C.sub, marginTop: 12 },
            ]}
          >
            {t("account.gotore.trainingYearsLabel")}
          </Text>
          <TextInput
            value={trainingYears}
            onChangeText={(tVal) =>
              setTrainingYears(tVal.replace(/[^\d]/g, ""))
            }
            placeholder={t("account.gotore.trainingYearsPlaceholder")}
            placeholderTextColor={
              Platform.OS === "ios" ? "#9CA3AF" : C.sub
            }
            keyboardType="number-pad"
            maxLength={2}
            style={[
              styles.input,
              {
                borderColor: C.border,
                color: C.text,
                backgroundColor: C.card,
              },
            ]}
            {...inputAccessoryProp}
          />

          {/* 身長（cm） */}
          <Text
            style={[
              styles.label,
              { color: C.sub, marginTop: 12 },
            ]}
          >
            {t("account.gotore.heightLabel")}
          </Text>
          <TextInput
            value={heightCm}
            onChangeText={(tVal) =>
              setHeightCm(tVal.replace(/[^\d]/g, ""))
            }
            placeholder={t("account.gotore.heightPlaceholder")}
            placeholderTextColor={
              Platform.OS === "ios" ? "#9CA3AF" : C.sub
            }
            keyboardType="number-pad"
            maxLength={3}
            style={[
              styles.input,
              {
                borderColor: C.border,
                color: C.text,
                backgroundColor: C.card,
              },
            ]}
            {...inputAccessoryProp}
          />

          {/* 目標 */}
          <Text
            style={[
              styles.label,
              { color: C.sub, marginTop: 12 },
            ]}
          >
            {t("account.gotore.goalLabel")}
          </Text>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            placeholder={t("account.gotore.goalPlaceholder")}
            placeholderTextColor={
              Platform.OS === "ios" ? "#9CA3AF" : C.sub
            }
            multiline
            style={[
              styles.input,
              {
                borderColor: C.border,
                color: C.text,
                backgroundColor: C.card,
                minHeight: 80,
                textAlignVertical: "top",
              },
            ]}
            {...inputAccessoryProp}
          />

          {/* 頻度（週あたり回数） */}
          <Text
            style={[
              styles.label,
              { color: C.sub, marginTop: 12 },
            ]}
          >
            {t("account.gotore.freqLabel")}
          </Text>
          <TextInput
            value={freqPerWeek}
            onChangeText={(tVal) =>
              setFreqPerWeek(tVal.replace(/[^\d]/g, ""))
            }
            placeholder={t("account.gotore.freqPlaceholder")}
            placeholderTextColor={
              Platform.OS === "ios" ? "#9CA3AF" : C.sub
            }
            keyboardType="number-pad"
            maxLength={2}
            style={[
              styles.input,
              {
                borderColor: C.border,
                color: C.text,
                backgroundColor: C.card,
              },
            ]}
            {...inputAccessoryProp}
          />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 8,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setFreqPerWeek(String(n))}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor:
                    freqPerWeek === String(n) ? C.primary : C.border,
                  backgroundColor:
                    freqPerWeek === String(n) ? C.primary : C.card,
                }}
              >
                <Text
                  style={{
                    color:
                      freqPerWeek === String(n) ? "#fff" : C.text,
                    fontWeight: "700",
                  }}
                >
                  {t("account.gotore.freqPill", { n })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* プロフィール写真（ドラッグで並び替え / 先頭がメイン / 長押しで削除 / ＋追加） */}
          <Text
            style={[
              styles.label,
              { color: C.sub, marginTop: 12 },
            ]}
          >
            {t("account.photos.label")}
          </Text>
          <Text
            style={{
              color: C.sub,
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            {t("account.photos.note", { max: MAX })}
          </Text>
          <ReorderablePhotos
            photos={photos}
            max={MAX}
            onChange={onPhotosChange}
            onPick={pickServerPhoto}
            onRemoveAt={removeServerPhotoAt}
            busy={uploadingPhoto}
          />

          {/* 保存ボタン */}
          <TouchableOpacity
            onPress={onSaveServer}
            disabled={savingServer || loadingServer}
            style={[
              styles.primaryBtn,
              { backgroundColor: "#111", marginTop: 14 },
              (savingServer || loadingServer) && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {loadingServer
                ? t("account.common.loading")
                : savingServer
                ? t("account.common.saving")
                : t("account.gotore.saveButton")}
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              color: C.sub,
              fontSize: 12,
              marginTop: 8,
            }}
          >
            {t("account.gotore.saveNote")}
          </Text>
        </Card>

        {/* 本人確認（KYC） */}
        <Card title={t("account.kyc.cardTitle")} C={C}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <KycStatusPill status={kycStatus} C={C} t={t} />
            {kycPersonId ? (
              <Text style={{ color: C.sub, fontSize: 12 }}>
                {t("account.kyc.personIdLabel")} {kycPersonId}
              </Text>
            ) : null}
          </View>

          {kycStatus === "verified" ? (
            <Text style={{ color: C.text }}>
              {t("account.kyc.description.verified")}
            </Text>
          ) : kycStatus === "pending" ? (
            <Text style={{ color: C.text }}>
              {t("account.kyc.description.pending")}
            </Text>
          ) : kycStatus === "rejected" ? (
            <Text style={{ color: C.text }}>
              {t("account.kyc.description.rejected")}
            </Text>
          ) : kycStatus === "failed" ? (
            <Text style={{ color: C.text }}>
              {t("account.kyc.description.failed")}
            </Text>
          ) : (
            <Text style={{ color: C.text }}>
              {t("account.kyc.description.unverified")}
            </Text>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            {kycStatus !== "verified" && (
              <TouchableOpacity
                onPress={onStartKycInApp}
                disabled={kycLoading}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: C.primary, flex: 1 },
                  kycLoading && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {kycStatus === "rejected"
                    ? kycLoading
                      ? t("account.kyc.retryButtonLoading")
                      : t("account.kyc.retryButton")
                    : kycLoading
                    ? t("account.kyc.startButtonLoading")
                    : t("account.kyc.startButton")}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                reloadProfile();
                loadKyc();
              }}
              disabled={kycLoading}
              style={[
                styles.outlineBtn,
                {
                  borderColor: C.border,
                  flex: kycStatus !== "verified" ? 0.6 : 1,
                },
                kycLoading && { opacity: 0.6 },
              ]}
            >
              <Text style={{ color: C.text, fontWeight: "700" }}>
                {kycLoading
                  ? t("account.kyc.refreshButtonLoading")
                  : t("account.kyc.refreshButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* 管理リンク（管理者のみ表示） */}
        {(isAdmin || canSelfPromote) && (
          <Card title={t("account.admin.cardTitle")} C={C}>
            {canSelfPromote && (
              <>
                <TouchableOpacity
                  onPress={promoteSelfToAdmin}
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: C.primary },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {t("account.admin.promoteButton")}
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    color: C.sub,
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  {t("account.admin.selfPromoteNote", {
                    emails: ADMIN_EMAILS.join(", "),
                  })}
                </Text>
              </>
            )}

            {isAdmin && (
              <TouchableOpacity
                onPress={() => router.push("/admin/kyc")}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: "#111", marginTop: 10 },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {t("account.admin.openKycListButton")}
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        )}
      </ScrollView>

      {/* 保存バー（ローカル） */}
      <View
        style={[
          styles.fixedBar,
          { backgroundColor: C.card, borderColor: C.border },
        ]}
      >
        <TouchableOpacity
          onPress={onSaveLocal}
          disabled={savingLocal}
          style={[
            styles.primaryBtn,
            { backgroundColor: C.primary },
            savingLocal && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {savingLocal
              ? t("account.local.saveBarSaving")
              : t("account.local.saveBarButton")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* iOS accessory */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={accessoryID}>
          <View
            style={[
              styles.accessory,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              style={[
                styles.accessoryBtn,
                { backgroundColor: isDark(C) ? "#1f2a37" : "#F3F4F6" },
              ]}
            >
              <Text style={{ color: C.text, fontWeight: "700" }}>
                {t("account.common.close")}
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={onSaveLocal}
              disabled={savingLocal}
              style={[
                styles.accessoryPrimary,
                { backgroundColor: C.primary },
                savingLocal && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.accessoryPrimaryText}>
                {savingLocal
                  ? t("account.common.saving")
                  : t("account.common.save")}
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      {/* 地域選択モーダル */}
      <Modal
        visible={regionOpen}
        animationType="slide"
        onRequestClose={() => setRegionOpen(false)}
      >
        <View style={[styles.modalWrap, { backgroundColor: C.bg }]}>
          <Text style={[styles.h1, { color: C.text }]}>
            {t("account.region.modalTitle")}
          </Text>
          <TextInput
            placeholder={t("account.region.searchPlaceholder")}
            placeholderTextColor={
              Platform.OS === "ios" ? "#9CA3AF" : C.sub
            }
            value={regionQuery}
            onChangeText={setRegionQuery}
            style={[
              styles.input,
              {
                borderColor: C.border,
                color: C.text,
                backgroundColor: C.card,
              },
            ]}
            autoCapitalize="none"
            {...inputAccessoryProp}
          />
          <FlatList
            data={regionFiltered as string[]}
            keyExtractor={(i) => i}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: C.border,
                }}
              />
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setRegion(item);
                  setRegionOpen(false);
                  setRegionQuery("");
                  haptic("light");
                }}
                style={{ paddingVertical: 12 }}
              >
                <Text
                  style={{
                    color: C.text,
                    fontWeight: region === item ? ("800" as any) : ("600" as any),
                  }}
                >
                  {item}
                  {region === item ? " ✓" : ""}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
            style={{ marginTop: 8 }}
          />
          <TouchableOpacity
            onPress={() => setRegionOpen(false)}
            style={[styles.outlineBtn, { borderColor: C.primary }]}
          >
            <Text style={{ color: C.primary, fontWeight: "800" }}>
              {t("account.common.close")}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ---------- 付属UI ---------- */
function Card({
  title,
  C,
  children,
}: {
  title: string;
  C: ReturnType<typeof useAppPrefs>["colors"];
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: C.card, borderColor: C.border },
      ]}
    >
      <Text style={[styles.cardTitle, { color: C.text }]}>{title}</Text>
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

/* ---------- Utils ---------- */
function getDeviceTZ() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tz === "string" && tz.includes("/")) return tz;
  } catch {}
  return "Asia/Tokyo";
}
const safeStr = (v: any) => (typeof v === "string" ? v : "") as string;
const isDark = (C: any) =>
  (C.text || "").toLowerCase() === "#e5e7eb";

/** 住所文字列から都道府県名を推定（都/府/県の有無ゆらぎに対応） */
function matchPrefecture(administrativeName: string): string | null {
  const adm = administrativeName.replace(/\s/g, "");
  const variants = new Set<string>();
  for (const pref of PREF_LIST) {
    variants.add(pref);
    variants.add(pref.replace(/(都|府|県)$/u, ""));
  }
  for (const v of variants) {
    if (adm.includes(v)) {
      const full = PREF_LIST.find(
        (p) => p === v || p.replace(/(都|府|県)$/u, "") === v,
      );
      if (full) return full;
    }
  }
  return null;
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
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

  row: { flexDirection: "row", alignItems: "center" },

  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "#eef2f7",
  },
  avatarImg: { width: "100%", height: "100%" },

  label: { fontSize: 12, marginBottom: 6, fontWeight: "700" },

  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  linkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
    marginLeft: 8,
  },

  fixedBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 10,
  },
  primaryBtn: {
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  accessory: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  accessoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  accessoryPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  accessoryPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  modalWrap: { flex: 1, padding: 16 },

  outlineBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
});
