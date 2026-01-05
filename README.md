# fitcoach（公開用）

面談でコードを見てもらう用に、**最初に見てほしい場所**だけまとめています。

---

### 見てほしいところ（最短ルート）

- `app/_layout.tsx`：アプリの入口（ルートレイアウト）
- `app/(tabs)/home/index.tsx`：代表画面の実装例
- `lib/`：ロジック・データアクセスまわり
- `supabase/functions/`：Functions（サーバー側相当）の実装

---

### ざっくり構成

- `app/`：画面・ルーティング
- `components/`：共通コンポーネント
- `ui/`：UI部品・テーマ
- `lib/`：ロジック・データアクセス
- `hooks/`：カスタムフック
- `locales/`：多言語
- `supabase/functions/`：Functions 実装

---

### 補足（公開用の扱い）

- 公開用のため、設定値（URL/キー等）はリポジトリに実値を入れていません。

