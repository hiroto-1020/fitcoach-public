import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import Constants from "expo-constants";

export type AnalyzeResult = {
  title?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  reason?: string;
};

// 開発時の解析サーバーURL（必要なら環境変数で設定）
const DEV_NGROK_URL = "REDACTED";

function resolveBase() {
  if (!__DEV__) {
    return "";
  }

  const extra = (Constants.expoConfig?.extra as any)?.ANALYZER_URL;
  const envUrl = process.env.EXPO_PUBLIC_AI_ANALYZER_URL;

  let raw = envUrl || extra || DEV_NGROK_URL;
  raw = (raw || "").trim();
  if (!raw) return "";

  let base = raw.replace(/\/+$/, "");

  const isPrivate =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base) ||
    /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/i.test(base) ||
    /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/i.test(base) ||
    /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/i.test(base);

  if (isPrivate && DEV_NGROK_URL) {
    base = DEV_NGROK_URL;
  }

  return base;
}
export const AI_BASE = resolveBase();

const TIMEOUT_MS = 60000;
function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS) {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms);
    p.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch((e) => {
      clearTimeout(id);
      reject(e);
    });
  });
}

function guessMime(uri: string) {
  const ext = (uri.split("?")[0]?.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "application/octet-stream";
}
async function ensureJpeg(uri: string) {
  const mime = guessMime(uri);
  if (mime !== "image/heic" && mime !== "image/heif") {
    const name = uri.split("/").pop() || "image";
    return { uri, mime, name };
  }
  const out = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const name =
    (out.uri.split("/").pop() || "image").replace(/\.(heic|heif)$/i, "") +
    ".jpg";
  return { uri: out.uri, mime: "image/jpeg", name };
}

async function ping() {
  if (!AI_BASE) return;
  try {
    await withTimeout(fetch(`${AI_BASE}/health`), 3000);
  } catch {}
}
export async function warmupAnalyzer() {
  if (!AI_BASE) return;
  try {
    await withTimeout(
      fetch(`${AI_BASE}/warmup`, { method: "POST" }),
      5000
    );
  } catch {}
}

async function postMultipart(
  url: string,
  fileUri: string,
  field: "file" | "image",
  mime: string,
  name: string
) {
  try {
    const form = new FormData();
    form.append(field, { uri: fileUri, name, type: mime } as any);
    const r = await withTimeout(
      fetch(url, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: form,
      })
    );
    return { ok: r.ok, status: r.status, text: await r.text() };
  } catch (e) {
    try {
      const r2 = await withTimeout(
        FileSystem.uploadAsync(url, fileUri, {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: field,
          headers: { Accept: "application/json" },
        })
      );
      return {
        ok: r2.status >= 200 && r2.status < 300,
        status: r2.status,
        text: r2.body ?? "",
      };
    } catch (e2) {
      throw e2;
    }
  }
}

const toNum = (v: any) => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n)
    ? Math.round(n)
    : undefined;
};
function normalize(raw: any): AnalyzeResult {
  return {
    title: raw?.title ?? raw?.name ?? raw?.label,
    calories: toNum(raw?.calories ?? raw?.kcal ?? raw?.nutrition?.calories),
    protein: toNum(raw?.protein ?? raw?.P ?? raw?.nutrition?.protein),
    fat: toNum(raw?.fat ?? raw?.F ?? raw?.nutrition?.fat),
    carbs: toNum(raw?.carbs ?? raw?.C ?? raw?.nutrition?.carbs),
    reason: raw?.reason ?? raw?.explain,
  };
}

export async function analyzeMealPhoto(
  localUri: string
): Promise<AnalyzeResult> {
  if (!localUri) throw new Error("image uri is empty");

  //  本番はここで必ず止まる（AI_BASE = "" なので）
  if (!AI_BASE) {
    throw new Error(
      "『写真から自動入力』は現在準備中です。\n次回のアップデートまでお待ちください。"
    );
  }

  await ping();

  const { uri, mime, name } = await ensureJpeg(localUri);

  const candidates = [
    { url: `${AI_BASE}/v1/analyze-image`, field: "file" as const },
    { url: `${AI_BASE}/analyze`, field: "file" as const },
    { url: `${AI_BASE}/analyze`, field: "image" as const },
  ];

  let lastStatus = 0;
  let lastText = "";
  let hadNetworkError = false;

  for (const c of candidates) {
    try {
      const r = await postMultipart(c.url, uri, c.field, mime, name);
      lastStatus = r.status;
      lastText = r.text ?? "";

      if (r.ok) {
        let parsed: any = {};
        try {
          parsed = JSON.parse(r.text || "{}");
        } catch {}
        return normalize(parsed);
      }

      if (r.status === 413) {
        throw new Error(
          "画像が大きすぎます（25MB超など）。\nもう少し小さい写真でお試しください。"
        );
      }

      if (r.status === 404 || r.status === 405) continue;
    } catch {
      hadNetworkError = true;
      continue;
    }
  }

  if (hadNetworkError && lastStatus === 0) {
    throw new Error(
      "写真の解析サーバーに接続できませんでした。\n通信環境を確認してから再度お試しください。"
    );
  }

  if ([404, 502, 503].includes(lastStatus)) {
    console.warn("analyzeMealPhoto endpoint offline:", lastText);
    throw new Error(
      "写真から自動入力のサーバーが一時的に利用できません。\n時間をおいて再度お試しください。"
    );
  }

  throw new Error("写真の解析に失敗しました。\n手入力で記録を行ってください。");
}
