// apps/mobile/app/onboarding.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { BuddyMode, Gender } from '../lib/gotore/types';
import { ensureMyUserRow, ensureMySettingsRow, updateMyBuddyMode, setSeekingBuddyOn } from '../lib/gotore/api';
import { useRouter } from 'expo-router';

export default function Onboarding() {
  const [gender, setGender] = useState<Gender>('unknown');
  const [mode, setMode] = useState<BuddyMode>('any');
  const router = useRouter();

  const save = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        Alert.alert('ログインが必要です');
        return;
      }
      // users（性別）を確保
      await ensureMyUserRow(gender);
      // settings（行確保）  モード更新
      await ensureMySettingsRow();
      await updateMyBuddyMode(mode);
      // プロフィールを合トレ募集ON
      await setSeekingBuddyOn();

      Alert.alert('設定を保存しました');
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('保存エラー', e.message ?? '不明なエラー');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>合トレ相手を見つけよう</Text>
      <Text style={{ color: '#666' }}>目的は「一緒に鍛える」こと。出会い目的の利用はできません。</Text>

      <View style={{ marginTop: 8 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>性別</Text>
        {(['male', 'female', 'unknown'] as Gender[]).map((g) => (
          <Pressable key={g} onPress={() => setGender(g)} style={{ paddingVertical: 10 }}>
            <Text style={{ fontSize: 16 }}>
              {g === 'male' ? '男' : g === 'female' ? '女' : '回答しない'} {gender === g ? '✓' : ''}
            </Text>
          </Pressable>
        ))}
        <Text style={{ color: '#888' }}>※ “回答しない”は、男女問わずモードの相手にのみ表示されます。</Text>
      </View>

      <View style={{ marginTop: 8 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>マッチ対象</Text>
        {(['any', 'male_only', 'female_only'] as BuddyMode[]).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={{ paddingVertical: 10 }}>
            <Text style={{ fontSize: 16 }}>
              {m === 'any' ? '男女問わず（推奨）' : m === 'male_only' ? '男同士のみ' : '女同士のみ'} {mode === m ? '✓' : ''}
            </Text>
          </Pressable>
        ))}
        <Text style={{ color: '#888' }}>※ あなたと相手の設定が“両方”一致したときに表示されます。</Text>
      </View>

      <Pressable onPress={save} style={{ marginTop: 'auto', backgroundColor: '#111', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>保存してはじめる</Text>
      </Pressable>
    </View>
  );
}
