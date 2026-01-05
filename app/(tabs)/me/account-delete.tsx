import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

let Haptics: any = null; try { Haptics = require('expo-haptics'); } catch {}

export default function AccountDelete() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const withTimeout = <T,>(p: Promise<T>, ms = 15000) =>
    Promise.race<T>([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)) as any,
    ]);

  const showError = (e: any) => {
    const msg = String(e?.message ?? e);
    const status = (e as any)?.context?.status;
    Alert.alert(
      '削除に失敗しました',
      status ? `[${status}] ${msg}` : msg === 'timeout'
        ? '通信がタイムアウトしました。電波状況をご確認のうえ、しばらくして再度お試しください。'
        : msg
    );
  };

  const onDelete = async () => {
    Alert.alert(
      'アカウント削除',
      'この操作は取り消せません。すべてのデータが削除されます。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Medium);

              const { error } = await withTimeout(
                supabase.functions.invoke('account-delete-lite', { body: {} }),
                15000
              );
              if (error) throw error;

              await supabase.auth.signOut();
              Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Success);

              router.dismissAll();
              router.replace('/(tabs)/home');
            } catch (e) {
              Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Error);
              showError(e);
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>アカウント削除</Text>

        <View style={styles.card}>
          <Text style={styles.desc}>
            アカウントと関連データ（プロフィール・投稿・画像 等）を完全に削除します。
            この操作は取り消せません。
          </Text>
          <Text style={styles.bullet}>• 削除後は再ログインできません</Text>
          <Text style={styles.bullet}>• 必要なデータは事前にバックアップしてください</Text>
        </View>

        <TouchableOpacity
          disabled={busy}
          onPress={onDelete}
          activeOpacity={0.8}
          style={[styles.deleteBtn, busy && { opacity: 0.7 }]}
        >
          {busy ? <ActivityIndicator /> : <Text style={styles.deleteText}>アカウントを削除する</Text>}
        </TouchableOpacity>

        <TouchableOpacity disabled={busy} onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>やめる</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0d12' },
  container: { flex: 1, padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 4 },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  desc: { color: '#e6e6e6', lineHeight: 20 },
  bullet: { color: '#c9c9c9', marginTop: 8 },
  deleteBtn: {
    backgroundColor: '#E53935',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#E53935', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 2 },
    }),
  },
  deleteText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: '#9aa3ab', fontWeight: '700' },
});
