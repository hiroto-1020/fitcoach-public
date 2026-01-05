// app/(tabs)/me/terms.tsx
import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useThemeColors, shadow } from "../../../ui/theme";

export default function TermsScreen() {
  const C = useThemeColors();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Header C={C} title="利用規約" subtitle="本サービスのご利用にあたって" />

      <Section C={C} title="1. 適用">
        <P C={C}>
          本利用規約（以下「本規約」）は、FitGear（以下「当社」）が提供する本サービスの利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。
        </P>
      </Section>

      <Section C={C} title="2. アカウントとセキュリティ">
        <UL C={C} items={[
          "登録情報は真実かつ最新の内容を保持してください。",
          "アカウント資格情報の管理はユーザーの責任です。",
          "不正利用が判明した場合は速やかに当社へご連絡ください。",
        ]}/>
      </Section>

      <Section C={C} title="3. 有料機能・サブスクリプション">
        <P C={C}>
          有料機能/サブスクリプションは各アプリストアの決済規約が適用されます。解約・返金の可否/方法はストアのポリシーに従います。更新日前に各ストアの管理画面から手続きを行ってください。
        </P>
      </Section>

      {/* ★ ここを強化 */}
      <Section C={C} title="4. 禁止事項">
        <P C={C}>ユーザーは、以下の行為を行ってはなりません。</P>
        <UL C={C} items={[
          "法令・公序良俗・本規約に違反する行為",
          "他者への嫌がらせ、差別、脅迫、誹謗中傷、スパム、ストーキング",
          "当社・第三者の権利（著作権、商標権、プライバシー、肖像権等）を侵害する行為",
          "不正アクセス、解析、リバースエンジニアリング等のセキュリティ侵害行為",
          "本サービスの運営を妨げる行為、虚偽情報の投稿、なりすまし",

          // --- 合トレ関連の追加禁止 ---
          "合トレ機能の目的に反する利用（出会い/恋愛/ナンパ目的、性的なやり取りの勧誘）",
          "風俗・違法サービス等の斡旋/紹介行為、またはそれに準ずる行為（※各種法令に抵触する可能性があるものを含む）",
          "事業・営業・勧誘目的での利用（ネットワークビジネス/MLM、情報商材、宗教/政治活動の勧誘、物販・サービスの宣伝、スカウト/キャスティング等）",
          "広告・プロモーション・アフィリエイト等、商用・集客を主目的とした利用",
          "金銭や物品の直接授受、チケット/クーポンの転売/譲渡の募集",
          "危険行為の募集（違法薬物の売買、無許可サプリ/医薬品の販売、暴力・危険トレーニングの助長 等）",
          "未成年者への不適切な接触、または年齢詐称",
          "位置情報や個人情報を不用意に公開/取得/共有する行為",
          "その他、当社が不適切と判断する行為",
        ]}/>
        <P C={C}>
          これらに該当すると当社が判断した場合、投稿削除・機能制限・一時停止・強制退会・関係機関への通報等の措置を行うことがあります。
        </P>
      </Section>

      <Section C={C} title="5. コンテンツの取扱い">
        <P C={C}>
          ユーザーが投稿・アップロードしたコンテンツは、法令・本規約に反しない範囲で、サービス提供・表示・品質改善の目的で利用されることがあります。ただし当社はコンテンツの常時監視義務を負いません。
        </P>
      </Section>

      {/* ★ ここを強化（免責） */}
      <Section C={C} title="6. 免責">
        <P C={C}>
          当社は、本サービスについて、事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有用性、特定目的適合性等）を含め、いかなる保証も行いません。
        </P>
        <P C={C}>
          また、ユーザー間で発生した一切のトラブル（例：待ち合わせ/合トレ中/オフライン活動に伴う事故・怪我・疾病、金銭トラブル、詐欺、窃盗、名誉毀損、プライバシー侵害、個人情報の漏えい、いかなる損害）について、当社は責任を負いません。必要な安全配慮・相手の確認・場所/時間帯の選定等はユーザー自身の責任で行ってください。緊急時は速やかに警察等の公的機関へ連絡してください。
        </P>
      </Section>

      {/* ★ 責任制限も明確化 */}
      <Section C={C} title="7. 責任の制限">
        <P C={C}>
          当社は、本サービスの利用に関連してユーザーに生じた損害について、当社の故意または重過失がある場合を除き、直接かつ通常の損害に限り、直近6か月間にユーザーが当社に支払った対価の総額を上限として責任を負うものとします。間接損害、特別損害、結果的損害、逸失利益については責任を負いません。
        </P>
      </Section>

      <Section C={C} title="8. サービス変更・中断・終了">
        <P C={C}>
          当社は、やむを得ない事情により、事前の予告なく本サービスの全部または一部を変更・中断・終了することがあります。
        </P>
      </Section>

      <Section C={C} title="9. 規約の変更">
        <P C={C}>
          当社は、必要に応じて本規約を改定できます。重要な変更はアプリ内等で周知します。
        </P>
      </Section>

      <Section C={C} title="10. 準拠法・裁判管轄">
        <P C={C}>
          本規約は日本法に準拠します。紛争が生じた場合、当社の所在地を管轄する裁判所を第一審の専属的合意管轄とします。
        </P>
      </Section>

      {/* 違反対応・通報窓口 */}
      <Section C={C} title="11. 違反の通報・対応">
        <P C={C}>
          規約違反を発見した場合は、アプリ内「サポート/お問い合わせ」からご連絡ください。当社は必要に応じて、投稿削除、機能制限、アカウント停止/退会、関係機関への通報等の措置を講じます。通報の有無/内容に関する個別の回答や結果の開示は行わない場合があります。
        </P>
      </Section>

      <Section C={C} title="12. 連絡方法">
        <P C={C}>
          お問い合わせは、アプリ内「サポート/お問い合わせ」からご連絡ください。
        </P>
      </Section>

      <Footer C={C} text={`最終更新日：${new Date().toLocaleDateString()}`} />
    </ScrollView>
  );
}

/* ---- 小物 ---- */
function Header({ C, title, subtitle }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "900", color: C.text }}>{title}</Text>
      {!!subtitle && <Text style={{ color: C.subtext, marginTop: 4 }}>{subtitle}</Text>}
    </View>
  );
}
function Section({ C, title, children }: any) {
  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border, ...shadow.card }]}>
      <Text style={{ color: C.text, fontWeight: "800", fontSize: 16, marginHorizontal: 12, marginTop: 10 }}>{title}</Text>
      <View style={{ height: 6 }} />
      <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>{children}</View>
    </View>
  );
}
function P({ C, children }: any) {
  return <Text style={{ color: C.text, lineHeight: 20, marginBottom: 8 }}>{children}</Text>;
}
function UL({ C, items }: any) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((t: string, i: number) => (
        <View key={i} style={{ flexDirection: "row" }}>
          <Text style={{ color: C.subtext, marginRight: 8 }}>•</Text>
          <Text style={{ color: C.text, flex: 1, lineHeight: 20 }}>{t}</Text>
        </View>
      ))}
    </View>
  );
}
function Footer({ C, text }: any) {
  return <Text style={{ color: C.subtext, textAlign: "center", marginTop: 8, marginBottom: 24, fontSize: 12 }}>{text}</Text>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 14, paddingVertical: 10, marginBottom: 14, borderWidth: StyleSheet.hairlineWidth },
});
