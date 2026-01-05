// ui/components/OutOfLikesModal.tsx （完全版）
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { initRevenueCat, purchaseLikesPack, canUsePurchases } from '../../lib/revenuecat';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** ← 購入成功後に呼ぶ（親でreloadを渡す） */
  onPurchased?: () => void | Promise<void>;
};

export function OutOfLikesModal({ visible, onClose, onPurchased }: Props) {
  const [busy, setBusy] = useState<null | 10 | 30 | 50 | 100>(null);

  const buy = async (pack: 10 | 30 | 50 | 100) => {
    if (!canUsePurchases()) {
      Alert.alert('購入できません', Platform.OS === 'web' ? 'モバイル端末でお試しください' : '一時的に無効化されています');
      return;
    }
    try {
      setBusy(pack);
      await initRevenueCat();
      const res: any = await purchaseLikesPack({ pack });
      if ((res as any)?.cancelled) {
        setBusy(null);
        return;
      }
      // ★ 成功 → 親に通知して残数再取得
      if (onPurchased) await onPurchased();
      Alert.alert('購入完了', `いいねを +${pack} 付与しました`);
      onClose();
    } catch (e: any) {
      Alert.alert('購入エラー', String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 420, borderRadius: 16, backgroundColor: '#fff', padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '800' }}>いいねが上限に達しました</Text>
          <Text style={{ marginTop: 8, color: '#374151' }}>追加で購入すると、すぐにスワイプを再開できます。</Text>

          {[10, 30, 50, 100].map((n) => (
            <TouchableOpacity
              key={n}
              disabled={!!busy}
              onPress={() => buy(n as 10 | 30 | 50 | 100)}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#111',
                backgroundColor: busy === n ? '#111' : '#fff',
                alignItems: 'center',
              }}
            >
              {busy === n ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontWeight: '800', color: busy ? '#999' : '#111' }}>＋{n} いいねを購入</Text>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={onClose} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: '#6b7280' }}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
