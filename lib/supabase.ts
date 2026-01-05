import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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

const normalizeUrl = (u: string) => u.replace(/\/+$/, '');

export const SUPABASE_URL = urlRaw ? normalizeUrl(urlRaw) : '';
export const SUPABASE_ANON_KEY = keyRaw || '';

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

(() => {
  try {
    const parts = SUPABASE_ANON_KEY.split('.');
    if (parts.length >= 2) {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
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
  }
})();

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'FitGear-app',
      },
    },
  }
);

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
