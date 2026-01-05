// lib/supabase.ts
// ─────────────────────────────────────────────────────────────
// Supabase クライアント初期化（Expo/React Native）
// ・クライアントは **anon key** のみを使用（service role は禁止）
// ・.env と app.json(app.config.*) の expo.extra の両対応
// ・RN 向けの polyfill / AsyncStorage を利用
// ・誤設定防止のため、可能ならキーの JWT をデコードして role をチェック
// ─────────────────────────────────────────────────────────────
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// extra から public 変数を拾う（.env が優先）
type Extra = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
};

const extra: Extra =
  ((Constants as any).expoConfig?.extra ??
    (Constants as any).manifest2?.extra ??
    (Constants as any).manifest?.extra ??
    {}) as Extra;

const urlRaw =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.EXPO_PUBLIC_SUPABASE_URL ?? '';

const keyRaw =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  '';

// URL 正規化（末尾スラッシュ除去）
const normalizeUrl = (u: string) => u.replace(/\/+$/, '');

export const SUPABASE_URL = urlRaw ? normalizeUrl(urlRaw) : '';
export const SUPABASE_ANON_KEY = keyRaw || '';

// 入力チェック
if (!SUPABASE_URL || !/^https?:\/\//i.test(SUPABASE_URL) || !SUPABASE_ANON_KEY) {
  throw new Error(
    [
      'Supabase の URL または Anon Key が未設定です。',
      '次のいずれかで設定してください：',
      '',
      '1) .env.* に設定',
      '   EXPO_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"',
      '   EXPO_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"',
      '',
      '2) app.json / app.config.* の expo.extra に設定',
      '   { "expo": { "extra": {',
      '       "EXPO_PUBLIC_SUPABASE_URL": "https://xxxx.supabase.co",',
      '       "EXPO_PUBLIC_SUPABASE_ANON_KEY": "YOUR_SUPABASE_ANON_KEY"',
      '   }}}',
    ].join('\n')
  );
}

// 可能なら Anon/Service Role の取り違いを検出
(() => {
  try {
    const parts = SUPABASE_ANON_KEY.split('.');
    if (parts.length >= 2) {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // atob が無い環境でも落ちないように try/catch
      // @ts-ignore
      const json = globalThis.atob ? globalThis.atob(b64) : null;
      if (json) {
        const claims = JSON.parse(json);
        const role = claims?.role as string | undefined;
        if (role === 'service_role') {
          throw new Error(
            [
              '❌ クライアントに Service Role Key が設定されています。',
              'クライアントアプリには **anon key** を使用してください。',
              '・EXPO_PUBLIC_SUPABASE_ANON_KEY に anon key を入れる',
              '・Service role key は Edge Functions の Secrets のみで使用する',
            ].join('\n')
          );
        }
      }
    }
  } catch (e) {
    // デコードできない環境では黙って続行（機能には影響なし）
    // console.warn('[supabase] key check skipped:', e);
  }
})();

// React Native 向け設定
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // RN では URL 検出不要
    },
    global: {
      headers: {
        'X-Client-Info': 'FitGear-app',
      },
    },
  }
);

// ユーティリティ：現在のユーザーID
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

// ユーティリティ：現在の access_token（Studio Test 等で使用）
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
