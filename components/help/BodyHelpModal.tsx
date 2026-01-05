// components/help/BodyHelpModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { spacing, radius } from '../../ui/theme.body';
import { useAppPrefs } from '../../lib/app-prefs';

type Props = { visible: boolean; onClose: () => void };

export default function BodyHelpModal({ visible, onClose }: Props) {
  const { colors: C } = useAppPrefs();

  // 内部コンポーネントは C を閉じ込めて使う
  const H2 = ({ children }: { children: React.ReactNode }) => (
    <Text
      style={{
        color: C.text,
        fontSize: 16,
        fontWeight: '700',
        marginTop: spacing.m,
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );

  const P = ({ children }: { children: React.ReactNode }) => (
    <Text style={{ color: C.text, lineHeight: 20, marginBottom: 8 }}>{children}</Text>
  );

  const Small = ({ children }: { children: React.ReactNode }) => (
    <Text style={{ color: C.sub, fontSize: 12, lineHeight: 18, marginTop: 2 }}>
      {children}
    </Text>
  );

  const Bullet = ({ children }: { children: React.ReactNode }) => (
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      <Text style={{ color: C.text, marginRight: 6 }}>{'•'}</Text>
      <Text style={{ color: C.text, flex: 1, lineHeight: 20 }}>{children}</Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0006', justifyContent: 'flex-end' }}>
        <View
          style={{
            maxHeight: '82%',
            backgroundColor: C.card,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.l,
              paddingVertical: spacing.m,
            }}
          >
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', flex: 1 }}>
              体組成の使い方
            </Text>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ color: C.primary, fontWeight: '700' }}>閉じる</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.l,
              paddingBottom: spacing.l,
            }}
          >
            <H2>できること</H2>
            <Bullet>日 / 週 / 月の切り替えで推移を確認できます。</Bullet>
            <Bullet>体重・体脂肪率の個別表示、両方表示、7日移動平均のON/OFFができます。</Bullet>
            <Bullet>目標体重（任意で体脂肪率）を設定し、グラフ上に目標ラインを表示できます。</Bullet>
            <Bullet>CSVとして書き出し、他アプリで加工できます。</Bullet>

            <H2>記録の追加</H2>
            <P>
              右上の <Text style={{ fontWeight: '700' }}>［＋ 記録する］</Text> から入力します。
            </P>
            <Bullet>
              日付は <Text style={{ fontWeight: '700' }}>YYYY/MM/DD</Text> 形式で入力できます。
            </Bullet>
            <Bullet>小数点入力時はiOSの「完了」バーでキーボードを閉じられます。</Bullet>
            <Small>範囲: 体重 20〜300 / 体脂肪率 2〜60（%）。範囲外は保存できません。</Small>

            <H2>グラフの見方</H2>
            <Bullet>点をタップするとその日の値をハイライトし、下にサマリーが表示されます。</Bullet>
            <Bullet>当日は日付ラベルが強調表示されます。</Bullet>
            <Bullet>点数が多い場合は左右にスクロールできます。</Bullet>

            <H2>目標値</H2>
            <P>
              右上の <Text style={{ fontWeight: '700' }}>［目標］</Text> から編集します。体重のみ必須、体脂肪率は任意です。
            </P>

            <H2>CSV書き出し</H2>
            <P>
              右上の <Text style={{ fontWeight: '700' }}>［書き出し］</Text> で出力します。保存先はアラートに表示されます。
            </P>

            <H2>よくある質問</H2>
            <Bullet>
              「キーボードで入力欄が隠れる」→ 入力画面は自動で押し上がります。iOSは上部
              <Text style={{ fontWeight: '700' }}>「完了」</Text> で閉じられます。
            </Bullet>
            <Bullet>「今日の色がつかない」→ 日表示のときだけ当日ラベルを強調します（週/月では非表示）。</Bullet>
            <Bullet>「グラフの横ズレ」→ ラベルはグラフの実測x座標に合わせて補正しています。</Bullet>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
