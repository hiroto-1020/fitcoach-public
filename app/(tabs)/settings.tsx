// apps/mobile/app/settings.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { BuddyMode } from '../../lib/gotore/types';
import { getMyUserAndSettings, updateMyBuddyMode } from '../../lib/gotore/api';

const modeLabel: Record<BuddyMode, string> = {
  any: '男女問わず',
  male_only: '男同士のみ',
  female_only: '女同士のみ',
};

export default function SettingsScreen() {
  const [mode, setMode] = useState<BuddyMode>('any');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { settings } = await getMyUserAndSettings();
        setMode(settings.buddy_gender_mode);
      } catch (e: any) {
        Alert.alert('読み込みエラー', e.message ?? '不明なエラー');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const change = async (next: BuddyMode) => {
    try {
      setLoading(true);
      await updateMyBuddyMode(next);
      setMode(next);
      Alert.alert('条件を更新しました');
    } catch (e: any) {
      Alert.alert('更新エラー', e.message ?? '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>読み込み中…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>マッチ対象</Text>
      {(['any', 'male_only', 'female_only'] as BuddyMode[]).map((opt) => (
        <Pressable key={opt} onPress={() => change(opt)} style={{ paddingVertical: 12 }}>
          <Text style={{ fontSize: 16 }}>{modeLabel[opt]} {opt === mode ? '✓' : ''}</Text>
        </Pressable>
      ))}
      <Text style={{ color: '#666', marginTop: 12 }}>
        ※ 既存のマッチには影響しません。新しい候補・いいね・マッチに反映されます。
      </Text>
    </View>
  );
}
