import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors, radius, shadow, alpha } from "../../../ui/theme";
import { useTranslation } from "react-i18next";

// Expo SDK 54: 「legacy」API を明示利用（新APIへは後日移行可）
import * as FileSystem from "expo-file-system/legacy";

// lazy requires（未導入でも画面は落ちない）
let Sharing: any = null;
try {
  Sharing = require("expo-sharing");
} catch {}

let DocumentPicker: any = null;
try {
  DocumentPicker = require("expo-document-picker");
} catch {}

let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {}

let dayjs: any = null;
try {
  dayjs = require("dayjs");
} catch {}

// ====== バックアップのフォーマット ======
type BackupV1 = {
  app: "FitGear";
  formatVersion: 1;
  createdAt: string; // ISO
  device: string; // "ios" | "android" | "web" | ...
  asyncStorage: Record<string, string | null>;
  sqlite: { files: Record<string, string /* base64 */> };
};

const FORMAT_VERSION = 1 as const;

const KEY_LAST_EXPORT = "me.lastExportedAt";

const DOC_DIR = FileSystem.documentDirectory || "";
const SQLITE_DIR = `${DOC_DIR}SQLite/`;
const BACKUP_DIR = `${DOC_DIR}backups/`;

type BackupFile = { name: string; path: string; size: number; mtime: number };

// ====== FS utils ======
async function ensureDir(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

function prettySize(bytes: number | null | undefined) {
  const b = typeof bytes === "number" ? bytes : 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

async function listSQLiteFiles(): Promise<string[]> {
  try {
    await ensureDir(SQLITE_DIR);
    const names: string[] = await FileSystem.readDirectoryAsync(SQLITE_DIR);
    return names.map((n) => `${SQLITE_DIR}${n}`);
  } catch {
    return [];
  }
}

async function readFileBase64(path: string): Promise<string | null> {
  try {
    return await FileSystem.readAsStringAsync(path, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return null;
  }
}
async function writeFileBase64(path: string, base64: string) {
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function listBackups(): Promise<BackupFile[]> {
  try {
    await ensureDir(BACKUP_DIR);
    const names = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    const files: BackupFile[] = [];
    for (const name of names
      .filter((n) => n.endsWith(".json"))
      .sort()
      .reverse()) {
      const p = `${BACKUP_DIR}${name}`;
      const info = await FileSystem.getInfoAsync(p);
      files.push({
        name,
        path: p,
        size: (info as any).size ?? 0,
        mtime: (info as any).modificationTime
          ? Math.floor((info as any).modificationTime * 1000)
          : 0,
      });
    }
    return files;
  } catch {
    return [];
  }
}

export default function DataPrivacyScreen() {
  const C = useThemeColors();
  const { t } = useTranslation();

  const [busy, setBusy] = useState(false);
  const [asyncSize, setAsyncSize] = useState<number>(0);
  const [sqliteSize, setSqliteSize] = useState<number>(0);
  const [lastExportISO, setLastExportISO] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // サイズや最終エクスポート日時を再取得
  const refreshSizes = useCallback(async () => {
    // AsyncStorage の概算サイズ
    let aSize = 0;
    if (AsyncStorage) {
      try {
        const keys: string[] = await AsyncStorage.getAllKeys();
        const values = await AsyncStorage.multiGet(keys);
        for (const [, v] of values) aSize += v?.length ?? 0;
      } catch {}
    }
    setAsyncSize(aSize);

    // SQLite の合計サイズ
    let sSize = 0;
    try {
      const files = await listSQLiteFiles();
      for (const p of files) {
        const info = await FileSystem.getInfoAsync(p);
        if (info.exists && typeof (info as any).size === "number")
          sSize += (info as any).size;
      }
    } catch {}
    setSqliteSize(sSize);

    // 最終エクスポート日時
    try {
      if (AsyncStorage) {
        const iso = await AsyncStorage.getItem(KEY_LAST_EXPORT);
        setLastExportISO(iso || null);
      }
    } catch {}
  }, []);

  const refreshBackups = useCallback(async () => {
    setLoadingList(true);
    try {
      const xs = await listBackups();
      setBackups(xs);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refreshSizes();
    refreshBackups();
  }, [refreshSizes, refreshBackups]);

  const lastExportText = useMemo(() => {
    if (!lastExportISO) return "—";
    return dayjs
      ? dayjs(lastExportISO).format("YYYY/MM/DD HH:mm")
      : lastExportISO;
  }, [lastExportISO]);

  // ====== エクスポート ======
  const doExport = useCallback(async () => {
    if (!FileSystem.documentDirectory) {
      Alert.alert(
        t("data.alert_error_title"),
        t("data.alert_error_no_doc_dir")
      );
      return;
    }
    setBusy(true);
    try {
      const createdAt = new Date().toISOString();

      // AsyncStorage dump
      let asyncDump: Record<string, string | null> = {};
      if (AsyncStorage) {
        const keys: string[] = await AsyncStorage.getAllKeys();
        const pairs = await AsyncStorage.multiGet(keys);
        for (const [k, v] of pairs) asyncDump[k] = v;
      }

      // SQLite dump
      const sqliteFiles = await listSQLiteFiles();
      const fileMap: Record<string, string> = {};
      for (const fullPath of sqliteFiles) {
        const base64 = await readFileBase64(fullPath);
        if (base64) {
          const name = fullPath.replace(SQLITE_DIR, "");
          fileMap[name] = base64;
        }
      }

      const payload: BackupV1 = {
        app: "FitGear",
        formatVersion: FORMAT_VERSION,
        createdAt,
        device: Platform.OS,
        asyncStorage: asyncDump,
        sqlite: { files: fileMap },
      };

      await ensureDir(BACKUP_DIR);
      const ts = dayjs
        ? dayjs(createdAt).format("YYYYMMDD-HHmmss")
        : createdAt.replace(/[:.]/g, "-");
      const filename = `FitGear-backup-${ts}.json`;
      const outPath = `${BACKUP_DIR}${filename}`;

      await FileSystem.writeAsStringAsync(outPath, JSON.stringify(payload, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 共有ダイアログ
      if (Sharing && (await Sharing.isAvailableAsync())) {
        try {
          await Sharing.shareAsync(outPath, {
            UTI: "public.json",
            mimeType: "application/json",
            dialogTitle: t("data.export_share_dialog_title"),
          });
        } catch {
          /* cancel ok */
        }
      }

      // 記録
      if (AsyncStorage) await AsyncStorage.setItem(KEY_LAST_EXPORT, createdAt);
      setLastExportISO(createdAt);

      Alert.alert(
        t("data.alert_export_done_title"),
        t("data.alert_export_done_body")
      );
      refreshBackups();
    } catch (e: any) {
      Alert.alert(t("data.alert_error_title"), String(e?.message ?? e));
    } finally {
      setBusy(false);
      refreshSizes();
    }
  }, [refreshBackups, refreshSizes, t]);

  // ====== インポート（上書き復元 or DocumentPicker） ======
  const doImport = useCallback(async () => {
    if (!FileSystem.documentDirectory) {
      Alert.alert(
        t("data.alert_error_title"),
        t("data.alert_error_no_doc_dir")
      );
      return;
    }
    const ok = await new Promise<boolean>((resolve) => {
      Alert.alert(
        t("data.alert_import_confirm_title"),
        t("data.alert_import_confirm_body"),
        [
          {
            text: t("data.alert_import_confirm_cancel"),
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: t("data.alert_import_confirm_ok"),
            style: "destructive",
            onPress: () => resolve(true),
          },
        ]
      );
    });
    if (!ok) return;

    setBusy(true);
    try {
      let pickedUri: string | null = null;

      if (DocumentPicker) {
        const res = await DocumentPicker.getDocumentAsync({
          type: ["application/json", "public.json", "*/*"],
          multiple: false,
          copyToCacheDirectory: true,
        });
        if ((res as any).canceled) {
          setBusy(false);
          return;
        }
        pickedUri = (res as any).assets?.[0]?.uri ?? (res as any).uri ?? null;
      } else {
        // DocumentPicker が無い場合：最新バックアップ or 固定パス
        const xs = await listBackups();
        if (xs.length === 0) {
          const fallback = `${BACKUP_DIR}import.json`;
          const exists = await FileSystem.getInfoAsync(fallback);
          if (!exists.exists) {
            Alert.alert(
              t("data.alert_import_not_possible_title"),
              t("data.alert_import_not_possible_body", { path: fallback })
            );
            setBusy(false);
            return;
          }
          pickedUri = fallback;
        } else {
          pickedUri = xs[0].path; // 最新
        }
      }

      if (!pickedUri) {
        throw new Error(t("data.alert_import_no_file"));
      }

      const text = await FileSystem.readAsStringAsync(pickedUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(text) as BackupV1;

      if (parsed.app !== "FitGear" || parsed.formatVersion !== 1) {
        throw new Error(t("data.alert_import_not_supported"));
      }

      // AsyncStorage
      if (AsyncStorage && parsed.asyncStorage) {
        await AsyncStorage.clear();
        const pairs = Object.entries(parsed.asyncStorage).map(
          ([k, v]) => [k, v ?? ""] as [string, string]
        );
        if (pairs.length) await AsyncStorage.multiSet(pairs);
      }

      // SQLite
      if (parsed.sqlite?.files) {
        await ensureDir(SQLITE_DIR);
        for (const [name, b64] of Object.entries(parsed.sqlite.files)) {
          await writeFileBase64(`${SQLITE_DIR}${name}`, b64);
        }
      }

      Alert.alert(
        t("data.alert_import_done_title"),
        t("data.alert_import_done_body")
      );
      refreshSizes();
    } catch (e: any) {
      Alert.alert(t("data.alert_error_title"), String(e?.message ?? e));
    } finally {
      setBusy(false);
      refreshBackups();
    }
  }, [refreshBackups, refreshSizes, t]);

  // ====== 一つのバックアップから復元 ======
  const restoreFromPath = useCallback(
    async (path: string) => {
      const ok = await new Promise<boolean>((resolve) => {
        Alert.alert(
          t("data.alert_import_confirm_title"),
          t("data.alert_import_confirm_body"),
          [
            {
              text: t("data.alert_import_confirm_cancel"),
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: t("data.alert_import_confirm_ok"),
              style: "destructive",
              onPress: () => resolve(true),
            },
          ]
        );
      });
      if (!ok) return;

      setBusy(true);
      try {
        const text = await FileSystem.readAsStringAsync(path, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const parsed = JSON.parse(text) as BackupV1;
        if (parsed.app !== "FitGear" || parsed.formatVersion !== 1) {
          throw new Error(t("data.alert_import_not_supported"));
        }
        if (AsyncStorage && parsed.asyncStorage) {
          await AsyncStorage.clear();
          const pairs = Object.entries(parsed.asyncStorage).map(
            ([k, v]) => [k, v ?? ""] as [string, string]
          );
          if (pairs.length) await AsyncStorage.multiSet(pairs);
        }
        if (parsed.sqlite?.files) {
          await ensureDir(SQLITE_DIR);
          for (const [name, b64] of Object.entries(parsed.sqlite.files)) {
            await writeFileBase64(`${SQLITE_DIR}${name}`, b64);
          }
        }
        Alert.alert(
          t("data.alert_import_done_title"),
          t("data.alert_import_done_body")
        );
        refreshSizes();
      } catch (e: any) {
        Alert.alert(t("data.alert_error_title"), String(e?.message ?? e));
      } finally {
        setBusy(false);
      }
    },
    [refreshSizes, t]
  );

  // ====== 全データ消去 ======
  const wipeAll = useCallback(
    async () => {
      const ok = await new Promise<boolean>((resolve) => {
        Alert.alert(
          t("data.alert_wipe_confirm_title"),
          t("data.alert_wipe_confirm_body"),
          [
            {
              text: t("data.alert_wipe_confirm_cancel"),
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: t("data.alert_wipe_confirm_ok"),
              style: "destructive",
              onPress: () => resolve(true),
            },
          ]
        );
      });
      if (!ok) return;

      setBusy(true);
      try {
        if (AsyncStorage) await AsyncStorage.clear();
        const files = await listSQLiteFiles();
        for (const p of files) {
          const info = await FileSystem.getInfoAsync(p);
          if (info.exists)
            await FileSystem.deleteAsync(p, { idempotent: true });
        }
        Alert.alert(
          t("data.alert_wipe_done_title"),
          t("data.alert_wipe_done_body")
        );
        refreshSizes();
      } catch (e: any) {
        Alert.alert(
          t("data.alert_wipe_error_title"),
          String(e?.message ?? e)
        );
      } finally {
        setBusy(false);
      }
    },
    [refreshSizes, t]
  );

  // ====== UI ======
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Header
        title={t("data.title")}
        subtitle={t("data.subtitle")}
        C={C}
      />

      {/* 概要カード */}
      <SectionCard C={C}>
        <Row
          icon="archive-outline"
          label={t("data.row_async")}
          value={prettySize(asyncSize)}
          C={C}
        />
        <Divider C={C} />
        <Row
          icon="server-outline"
          label={t("data.row_sqlite")}
          value={prettySize(sqliteSize)}
          C={C}
        />
        <Divider C={C} />
        <Row
          icon="time-outline"
          label={t("data.row_lastExport")}
          value={lastExportText}
          C={C}
        />
      </SectionCard>

      {/* エクスポート */}
      <SectionCard
        C={C}
        title={t("data.export_title")}
        subtitle={t("data.export_subtitle")}
      >
        <PrimaryButton
          title={busy ? t("data.export_processing") : t("data.export_button")}
          icon="download-outline"
          onPress={doExport}
          disabled={busy}
          C={C}
        />
        {!Sharing && (
          <Tip C={C}>
            {t("data.export_tip", { dir: BACKUP_DIR })}
          </Tip>
        )}
      </SectionCard>

      {/* インポート */}
      <SectionCard
        C={C}
        title={t("data.import_title")}
        subtitle={t("data.import_subtitle")}
      >
        <PrimaryButton
          title={busy ? t("data.import_processing") : t("data.import_button")}
          icon="upload-outline"
          onPress={doImport}
          disabled={busy}
          C={C}
        />
        {!DocumentPicker && (
          <Tip C={C}>
            {t("data.import_tip", { path: `${BACKUP_DIR}import.json` })}
          </Tip>
        )}
      </SectionCard>

      {/* バックアップ一覧 */}
      <SectionCard
        C={C}
        title={t("data.list_title")}
        subtitle={t("data.list_subtitle")}
      >
        {loadingList ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ color: C.subtext, marginTop: 6 }}>
              {t("data.list_loading")}
            </Text>
          </View>
        ) : backups.length === 0 ? (
          <Text style={{ color: C.subtext, padding: 12 }}>
            {t("data.list_empty")}
          </Text>
        ) : (
          backups.map((b, i) => (
            <View key={b.path}>
              {i !== 0 && <Divider C={C} />}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={C.subtext}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "700" }}>
                    {b.name}
                  </Text>
                  <Text style={{ color: C.subtext, marginTop: 2 }}>
                    {dayjs ? dayjs(b.mtime).format("YYYY/MM/DD HH:mm") : ""} ・{" "}
                    {prettySize(b.size)}
                  </Text>
                </View>
                <OutlineButton
                  title={t("data.list_share_button")}
                  onPress={async () => {
                    try {
                      if (Sharing && (await Sharing.isAvailableAsync()))
                        await Sharing.shareAsync(b.path, {
                          mimeType: "application/json",
                        });
                      else
                        Alert.alert(
                          t("data.list_share_path_title"),
                          b.path
                        );
                    } catch (e: any) {
                      Alert.alert(
                        t("data.list_share_failed_title"),
                        String(e?.message ?? e)
                      );
                    }
                  }}
                  C={C}
                  compact
                />
                <View style={{ width: 8 }} />
                <OutlineButton
                  title={t("data.list_restore_button")}
                  onPress={() => restoreFromPath(b.path)}
                  C={C}
                  compact
                />
              </View>
            </View>
          ))
        )}
      </SectionCard>

      {/* リセット */}
      <SectionCard
        C={C}
        title={t("data.reset_title")}
        subtitle={t("data.reset_subtitle")}
      >
        <DangerButton
          title={t("data.reset_button")}
          icon="warning-outline"
          onPress={wipeAll}
          disabled={busy}
          C={C}
        />
      </SectionCard>
    </ScrollView>
  );
}

/* ---------- 共通UI ---------- */
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
  compact,
}: {
  title: string;
  onPress?: () => void;
  C: any;
  compact?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingVertical: compact ? 6 : 10,
        paddingHorizontal: compact ? 10 : 14,
        borderRadius: radius.s,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
        backgroundColor: C.card,
      }}
    >
      <Text style={{ color: C.text, fontWeight: "700" }}>{title}</Text>
    </TouchableOpacity>
  );
}

function DangerButton({
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
        backgroundColor: disabled ? alpha(C.danger, 0.5) : C.danger,
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
          color="#fff"
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={{ color: "#fff", fontWeight: "900" }}>{title}</Text>
    </TouchableOpacity>
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
