// ui/components/GenderOncePicker.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { setGenderOnce, MyProfileLite, Gender } from '../../lib/gotore/api';

type Props = {
  profile: MyProfileLite;
  onChanged?: (g: Gender) => void;   // 反映後に親へ通知
};

const OPTIONS: Gender[] = ['male','female','nonbinary'];

export default function GenderOncePicker({ profile, onChanged }: Props) {
  const [busy, setBusy] = useState(false);

  const state = useMemo(() => {
    const { kyc_status, gender_locked_at } = profile;
    if (kyc_status === 'approved' || gender_locked_at) return 'locked';
    if (kyc_status === 'pending') return 'pending';
    if (kyc_status === 'rejected') return 'rejected';
    return 'not_started'; // 初回
  }, [profile]);

  const disabled = state === 'locked' || state === 'pending';

  async function handleSelect(g: Gender) {
    if (disabled) return;

    try {
      setBusy(true);
      await setGenderOnce({
        gender: g,
        token: state === 'rejected' ? (profile.gender_edit_token ?? null) : null,
      });
      onChanged?.(g);
      Alert.alert('性別を更新しました', state === 'rejected' ? '本人確認を再申請してください。' : '');
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      let friendly = '更新に失敗しました。時間をおいて再度お試しください。';
      if (msg.includes('gender_locked')) friendly = '本人確認済みのため性別は変更できません。';
      if (msg.includes('kyc_pending')) friendly = '本人確認の審査中は性別を変更できません。';
      if (msg.includes('invalid_or_used_token')) friendly = '再設定トークンが無効です。サポートへお問い合わせください。';
      Alert.alert('エラー', friendly);
    } finally {
      setBusy(false);
    }
  }

  function StatusChip() {
    if (state === 'locked') return <Text style={{opacity:0.8}}>🔒 本人確認済み：変更不可</Text>;
    if (state === 'pending') return <Text style={{opacity:0.8}}>⏳ 審査中：一時的に変更不可</Text>;
    if (state === 'rejected') return <Text style={{opacity:0.8}}>⚠️ 棄却：1回だけ再設定が必要</Text>;
    return <Text style={{opacity:0.8}}>✨ 初回設定のみ可</Text>;
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: '600' }}>性別</Text>
      <StatusChip />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {OPTIONS.map((g) => {
          const active = profile.gender === g;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => handleSelect(g)}
              disabled={disabled || busy}
              style={{
                paddingVertical: 10, paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: active ? '#0ea5e9' : 'rgba(255,255,255,0.1)',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Text style={{ fontWeight: active ? '700' : '500' }}>
                {g === 'male' ? '男性' : g === 'female' ? '女性' : 'ノンバイナリー'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
