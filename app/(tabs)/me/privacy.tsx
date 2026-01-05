import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useThemeColors, radius, alpha, shadow } from "../../../ui/theme";

export default function PrivacyScreen() {
  const C = useThemeColors();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Header C={C} title="プライバシーポリシー" subtitle="ユーザーの皆さまの個人情報の取り扱いについて" />

      <Section C={C} title="1. はじめに">
        <P C={C}>
          本プライバシーポリシーは、FitGear（以下「本サービス」）において、ユーザーの個人情報をどのように収集・利用・共有・保護するかを定めるものです。
        </P>
      </Section>

      <Section C={C} title="2. 収集する情報">
        <UL C={C} items={[
          "アカウント情報（ニックネーム、メールアドレス、プロフィール等）",
          "記録データ（食事・体組成・トレーニング・合トレ用プロフィール・写真）",
          "端末情報/ログ情報（OS種別、アプリバージョン、IPアドレス、クラッシュログ等）",
          "クッキー/同等技術による利用状況",
        ]}/>
      </Section>

      <Section C={C} title="3. 利用目的">
        <UL C={C} items={[
          "本サービスの提供・維持・改善",
          "通知やサポート、重要なお知らせの配信",
          "不正利用の防止・セキュリティの確保",
          "法令遵守、紛争対応",
        ]}/>
      </Section>

      <Section C={C} title="4. 第三者への提供・委託">
        <P C={C}>
          当社は、法令に基づく場合やサービス運営上必要な範囲で、業務委託先に個人情報の取扱いを委託することがあります。
          主な委託・連携先の例：認証・データベース、課金・サブスク管理、プッシュ通知等。
        </P>
        <P C={C}>
          委託先に対しては適切な選定・監督を行い、機密保持契約等を締結します。
        </P>
      </Section>

      <Section C={C} title="5. 国外での取扱い">
        <P C={C}>
          利用するクラウドサービスの所在国により、個人情報が国外で保存・処理される場合があります。
          この場合も、適用法令に基づき適切な保護措置を講じます。
        </P>
      </Section>

      <Section C={C} title="6. 保管期間">
        <P C={C}>
          取得目的の達成に必要な範囲および関連法令に定める期間内で保管し、不要になった情報は安全な方法で削除します。
        </P>
      </Section>

      <Section C={C} title="7. ユーザーの権利">
        <UL C={C} items={[
          "ご自身のデータの閲覧・訂正・削除の請求",
          "通知・マーケティング配信の停止（オプトアウト）",
          "退会手続き",
        ]}/>
        <P C={C}>
          具体的な手続きはアプリ内の「サポート/お問い合わせ」よりご連絡ください。法令上、請求に応じられない場合があります。
        </P>
      </Section>

      <Section C={C} title="8. 未成年の方">
        <P C={C}>
          20歳未満の方は、保護者の同意を得た上で本サービスをご利用ください。
        </P>
      </Section>

      <Section C={C} title="9. 安全管理措置">
        <P C={C}>
          当社は、個人情報への不正アクセス、紛失、改ざん、漏えい等を防止するため、適切な技術的・組織的安全管理措置を講じます。
        </P>
      </Section>

      <Section C={C} title="10. 本ポリシーの変更">
        <P C={C}>
          本ポリシーの内容は、必要に応じて改定されることがあります。重要な変更はアプリ内等でお知らせします。
        </P>
      </Section>

      <Section C={C} title="11. お問い合わせ">
        <P C={C}>
          本ポリシーに関するご質問は、アプリ内「サポート/お問い合わせ」からご連絡ください。
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
