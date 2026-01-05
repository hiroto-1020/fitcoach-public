// lib/gotore/push.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,  // フォアグラウンドでもバナー表示
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushToken() {
  // 実機のみ
  if (!Device.isDevice) return null;

  // iOS: 通知許可
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  // Expo Push Token を取得
  const projectId = (await Notifications.getExpoPushTokenAsync()).data;
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  // ログイン済ユーザーに紐づけて保存（重複は上書き扱い）
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return null;

  await supabase.from('push_tokens').upsert({
    token: projectId,
    user_id: user.user.id,
    platform,
  });

  return projectId;
}

export async function unregisterPushToken() {
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return;
  await supabase.from('push_tokens').delete().eq('token', token).eq('user_id', user.user.id);
}

// ルートで呼び出す初期化用コンポーネント
import React, { useEffect } from 'react';

export function PushBootstrap() {
  useEffect(() => {
    let sub: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;

    (async () => {
      // 起動時 & ログイン時に登録
      const { data: u } = await supabase.auth.getUser();
      if (u?.user) { await registerPushToken(); }

      sub = supabase.auth.onAuthStateChange(async (evt) => {
        if (evt.event === 'SIGNED_IN') {
          await registerPushToken();
        } else if (evt.event === 'SIGNED_OUT') {
          await unregisterPushToken();
        }
      });
    })();

    return () => { sub?.data?.subscription?.unsubscribe?.(); };
  }, []);

  // 受信時の任意ハンドラ（アプリ内ジャンプ等したければここで）
  useEffect(() => {
    const rcvSub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as any;
      // 例: data.type === 'message' ならチャットに遷移…など
      // 画面から使いたければ EventEmitter 等で流す
    });
    return () => rcvSub.remove();
  }, []);

  return null;
}
