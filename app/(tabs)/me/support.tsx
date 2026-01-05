import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  DevSettings,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, radius, shadow, alpha, getColorScheme } from "../../../ui/theme";
import { useTranslation } from "react-i18next";

import * as FileSystem from "expo-file-system/legacy";

let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {}

let Constants: any = null;
try {
  Constants = require("expo-constants").default;
} catch {}

let Device: any = null;
try {
  Device = require("expo-device");
} catch {}

let MailComposer: any = null;
try {
  MailComposer = require("expo-mail-composer");
} catch {}

let Sharing: any = null;
try {
  Sharing = require("expo-sharing");
} catch {}

let Clipboard: any = null;
try {
  Clipboard = require("expo-clipboard");
} catch {}

let dayjs: any = null;
try {
  dayjs = require("dayjs");
} catch {}

const DOC_DIR = FileSystem.documentDirectory || "";
const SQLITE_DIR = `${DOC_DIR}SQLite/`;
const TMP_DIR = FileSystem.cacheDirectory || DOC_DIR;

type Diag = {
  app: {
    name?: string | null;
    version?: string | null;
    runtimeVersion?: string | null;
    releaseChannel?: string | null;
    expoSdk?: string | null;
  };
  device: {
    os: string;
    osVersion?: string | null;
    model?: string | null;
    brand?: string | null;
    isDevice?: boolean | null;
  };
  theme: {
    scheme: "light" | "dark";
    platformAppearance?: string | null;
  };
  storage: {
    asyncStorage: { keys: number; approxBytes: number };
    sqlite: { files: Array<{ name: string; size: number }>; totalBytes: number };
  };
  timestamps: {
    collectedAt: string;
  };
};

async function ensureDir(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

async function listSQLiteFiles(): Promise<Array<{ path: string; name: string; size: number }>> {
  try {
    await ensureDir(SQLITE_DIR);
    const names: string[] = await FileSystem.readDirectoryAsync(SQLITE_DIR);
    const out: Array<{ path: string; name: string; size: number }> = [];
    for (const n of names) {
      const p = `${SQLITE_DIR}${n}`;
      const info = await FileSystem.getInfoAsync(p);
      out.push({ path: p, name: n, size: (info as any).size ?? 0 });
    }
    return out;
  } catch {
    return [];
  }
}

function prettyBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SupportScreen() {
  const C = useThemeColors();
  const { t } = useTranslation();

  const [busy, setBusy] = useState(false);
  const [diag, setDiag] = useState<Diag | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshDiag = useCallback(async () => {
    setLoading(true);
    try {
      let keysLen = 0;
      let approxBytes = 0;
      if (AsyncStorage) {
        try {
          const keys: string[] = await AsyncStorage.getAllKeys();
          keysLen = keys.length;
          const values = await AsyncStorage.multiGet(keys);
          for (const [, v] of values) approxBytes += v?.length ?? 0;
        } catch {}
      }

      const files = await listSQLiteFiles();
      const totalBytes = files.reduce((s, f) => s + (f.size || 0), 0);

      const collected: Diag = {
        app: {
          name:
            (Constants?.expoConfig?.name as string) ??
            (Constants?.manifest2?.extra?.expoClient?.name as string) ??
            null,
          version:
            (Constants?.expoConfig?.version as string) ??
            (Constants?.manifest2?.extra?.expoClient?.version as string) ??
            null,
          runtimeVersion: (Constants?.expoConfig?.runtimeVersion as string) ?? null,
          releaseChannel: (Constants?.expoConfig?.releaseChannel as string) ?? null,
          expoSdk: (Constants?.expoConfig?.sdkVersion as string) ?? null,
        },
        device: {
          os: Platform.OS,
          osVersion: Platform.Version ? String(Platform.Version) : null,
          model: Device?.modelName ?? null,
          brand: Device?.brand ?? null,
          isDevice: typeof Device?.isDevice === "boolean" ? Device.isDevice : null,
        },
        theme: {
          scheme: getColorScheme(),
          platformAppearance: (Platform as any)?.ColorScheme ?? null,
        },
        storage: {
          asyncStorage: { keys: keysLen, approxBytes },
          sqlite: {
            files: files.map((f) => ({ name: f.name, size: f.size })),
            totalBytes,
          },
        },
        timestamps: {
          collectedAt: new Date().toISOString(),
        },
      };
      setDiag(collected);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDiag();
  }, [refreshDiag]);

  const diagText = useMemo(() => (diag ? JSON.stringify(diag, null, 2) : ""), [diag]);

  const copyDiagnostics = useCallback(async () => {
    if (!diag) return;
    try {
      if (Clipboard) await Clipboard.setStringAsync(diagText);
      Alert.alert(
        t("support.alert_copy_done_title"),
        t("support.alert_copy_done_body")
      );
    } catch (e: any) {
      Alert.alert(
        t("support.alert_copy_fail_title"),
        String(e?.message ?? e)
      );
    }
  }, [diag, diagText, t]);

  const shareDiagnostics = useCallback(async () => {
    if (!diag) return;
    setBusy(true);
    try {
      const ts = dayjs ? dayjs().format("YYYYMMDD-HHmmss") : String(Date.now());
      const path = `${TMP_DIR}FitGear-diagnostics-${ts}.json`;
      await FileSystem.writeAsStringAsync(path, diagText, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (Sharing && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(path, {
          UTI: "public.json",
          mimeType: "application/json",
          dialogTitle: t("support.alert_share_dialog_title"),
        });
      } else {
        Alert.alert(t("support.alert_file_path_title"), path);
      }
    } catch (e: any) {
      Alert.alert(
        t("support.alert_share_error_title"),
        String(e?.message ?? e)
      );
    } finally {
      setBusy(false);
    }
  }, [diag, diagText, t]);

  const emailSupport = useCallback(async () => {
    const to = "horita.training1020@gmail.com";
    const subject = t("support.email_subject", {
      version: diag?.app?.version ?? "unknown",
    });
    const intro = t("support.email_intro");
    const body = `${intro}\n${diagText}`;

    try {
      if (MailComposer && (await MailComposer.isAvailableAsync())) {
        setBusy(true);
        const ts = dayjs ? dayjs().format("YYYYMMDD-HHmmss") : String(Date.now());
        const path = `${TMP_DIR}FitGear-diagnostics-${ts}.json`;
        await FileSystem.writeAsStringAsync(path, diagText, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await MailComposer.composeAsync({
          recipients: [to],
          subject,
          body: intro,
          attachments: [path],
        });
        setBusy(false);
        return;
      }
    } catch {
    } finally {
      setBusy(false);
    }

    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body.slice(0, 1800))}`;
    const can = await Linking.canOpenURL(mailto);
    if (can) {
      Linking.openURL(mailto);
    } else {
      if (Clipboard) await Clipboard.setStringAsync(body);
      Alert.alert(
        t("support.email_open_failed_title"),
        t("support.email_open_failed_body")
      );
    }
  }, [diag, diagText, t]);

  const openX = useCallback(async () => {
    const url = "https://x.com/hiroto_training";
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) Linking.openURL(url);
      else Alert.alert(t("support.open_url_failed_title"), url);
    } catch (e: any) {
      Alert.alert(
        t("support.alert_error_title"),
        String(e?.message ?? e)
      );
    }
  }, [t]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Header
        title={t("support.title")}
        subtitle={t("support.subtitle")}
        C={C}
      />

      <SectionCard C={C} title={t("support.section_contact_title")}>
        <PrimaryButton
          title={t("support.contact_button_email")}
          icon="mail-outline"
          onPress={emailSupport}
          disabled={busy}
          C={C}
        />
        <Tip C={C}>
          <Text>{t("support.contact_tip1_prefix")}</Text>
          <Text style={{ fontWeight: "800", color: C.text }}>
            {t("support.contact_tip1_emphasis")}
          </Text>
          <Text>{t("support.contact_tip1_suffix")}</Text>
        </Tip>
        <Tip C={C}>
          <Text
            style={{
              fontWeight: "800",
              color: C.text,
            }}
          >
            {t("support.contact_tip2")}
          </Text>
        </Tip>
      </SectionCard>

      <SectionCard
        C={C}
        title={t("support.section_diag_title")}
        subtitle={t("support.section_diag_subtitle")}
      >
        {loading || !diag ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ color: C.subtext, marginTop: 6 }}>
              {t("support.diag_loading")}
            </Text>
          </View>
        ) : (
          <>
            <Row
              icon="apps-outline"
              label={t("support.row_app_version")}
              value={`${diag.app.name ?? "—"} / ${diag.app.version ?? "—"}`}
              C={C}
            />
            <Divider C={C} />
            <Row
              icon="hardware-chip-outline"
              label={t("support.row_device_os")}
              value={`${diag.device.model ?? "—"} / ${diag.device.os} ${
                diag.device.osVersion ?? ""
              }`}
              C={C}
            />
            <Divider C={C} />
            <Row
              icon="color-palette-outline"
              label={t("support.row_theme")}
              value={
                diag.theme.scheme === "dark"
                  ? t("support.theme_dark")
                  : t("support.theme_light")
              }
              C={C}
            />
            <Divider C={C} />
            <Row
              icon="archive-outline"
              label={t("support.row_async")}
              value={`${diag.storage.asyncStorage.keys} keys・${prettyBytes(
                diag.storage.asyncStorage.approxBytes
              )}`}
              C={C}
            />
            <Divider C={C} />
            <Row
              icon="server-outline"
              label={t("support.row_sqlite")}
              value={prettyBytes(diag.storage.sqlite.totalBytes)}
              C={C}
            />

            <View style={{ height: 6 }} />
            <OutlineButton
              title={t("support.diag_copy_button")}
              onPress={copyDiagnostics}
              C={C}
            />
            <View style={{ height: 8 }} />
            <OutlineButton
              title={t("support.diag_share_button")}
              onPress={shareDiagnostics}
              C={C}
            />
          </>
        )}
      </SectionCard>

      <SectionCard C={C} title={t("support.section_faq_title")}>
        <FAQItem
          Q={t("support.faq_q1")}
          A={t("support.faq_a1", { dir: DOC_DIR })}
          C={C}
        />
        <FAQItem
          Q={t("support.faq_q2")}
          A={t("support.faq_a2")}
          C={C}
        />
        <FAQItem
          Q={t("support.faq_q3")}
          A={t("support.faq_a3")}
          C={C}
        />
        <View style={{ height: 6 }} />
      </SectionCard>

      <Text
        style={{
          color: C.subtext,
          textAlign: "center",
          marginTop: 8,
          marginBottom: 24,
          fontSize: 12,
        }}
      >
        {t("support.footer_version", {
          version: Constants?.expoConfig?.version ?? "—",
          sdk: Constants?.expoConfig?.sdkVersion ?? "—",
        })}
      </Text>
    </ScrollView>
  );
}

function Header({
  title,
  subtitle,
  C,
}: {
  title: string;
  subtitle?: string;
  C: any;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "900", color: C.text }}>
        {title}
      </Text>
      {!!subtitle && (
        <Text style={{ color: C.subtext, marginTop: 4 }}>{subtitle}</Text>
      )}
    </View>
  );
}

function SectionCard({
  C,
  title,
  subtitle,
  children,
}: {
  C: any;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: C.card, borderColor: C.border, ...shadow.card },
      ]}
    >
      {title && (
        <Text
          style={{
            color: C.text,
            fontWeight: "800",
            fontSize: 16,
            marginHorizontal: 12,
            marginTop: 10,
          }}
        >
          {title}
        </Text>
      )}
      {subtitle && (
        <Text
          style={{ color: C.subtext, marginHorizontal: 12, marginTop: 4 }}
        >
          {subtitle}
        </Text>
      )}
      {title || subtitle ? <View style={{ height: 8 }} /> : null}
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  C,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  C: any;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons
        name={icon}
        size={18}
        color={C.subtext}
        style={{ marginRight: 10 }}
      />
      <Text style={{ flex: 1, color: C.subtext }}>{label}</Text>
      <Text style={{ color: C.text, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}

function Divider({ C }: { C: any }) {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: C.border,
        marginHorizontal: 12,
      }}
    />
  );
}

function Tip({ C, children }: { C: any; children: React.ReactNode }) {
  return (
    <View
      style={{
        marginTop: 10,
        marginHorizontal: 12,
        borderRadius: radius.s,
        backgroundColor: alpha(C.primary, 0.06),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: alpha(C.primary, 0.22),
        padding: 10,
      }}
    >
      <Text style={{ color: C.text }}>{children}</Text>
    </View>
  );
}

function PrimaryButton({
  title,
  icon,
  onPress,
  disabled,
  C,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  C: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
      style={{
        marginTop: 12,
        marginHorizontal: 12,
        backgroundColor: disabled ? alpha(C.primary, 0.5) : C.primary,
        paddingVertical: 12,
        borderRadius: radius.m,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={C.primaryText}
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={{ color: C.primaryText, fontWeight: "900" }}>{title}</Text>
    </TouchableOpacity>
  );
}

function OutlineButton({
  title,
  onPress,
  C,
}: {
  title: string;
  onPress?: () => void;
  C: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: radius.s,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
        backgroundColor: C.card,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: C.text, fontWeight: "700" }}>{title}</Text>
    </TouchableOpacity>
  );
}

function FAQItem({ Q, A, C }: { Q: string; A: string; C: any }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginHorizontal: 8, marginVertical: 6 }}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 10,
          borderRadius: radius.s,
          backgroundColor: alpha(C.primary, open ? 0.08 : 0.04),
        }}
      >
        <Text style={{ color: C.text, fontWeight: "800" }}>Q. {Q}</Text>
        {open && (
          <Text style={{ color: C.text, marginTop: 6, lineHeight: 20 }}>
            A. {A}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
