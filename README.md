# fitcoach（公開用）

面談で「どこ見ればいい？」となりがちなので、最初に見てほしい場所だけまとめました。  
忙しい方向けに **5分で追える順番**にしてあります。

※ この公開版は、安全のため `app.json` の Supabase URL/Key などは **ダミー値**にしています（実値は入れていません）。

---

### ざっくり何のコード？

- ルートの `package.json` を起点にした **Expo（React Native）アプリ**です。
- 画面は `app/` 配下で、`expo-router` のファイルベースルーティング構成です。

---

### 技術スタック（リポジトリから読み取れる範囲）

- Expo / React Native / React / TypeScript
- `expo-router`
- `@supabase/supabase-js`
- `supabase/functions/`（TypeScript）

---

### React / PHP はどこ？

- **React（Expo/React Native）**: `app/` / `components/` / `lib/` / `ui/`
- **PHP**: このリポジトリ内では `*.php` / `composer.json` / `<?php` は見つかりませんでした。  
  もしPHPのバックエンドが別である場合は、そちらは別リポジトリ/別環境として共有するのが分かりやすいです。

---

### 5分で追うなら（ここから見てください）

#### React

- `package.json`（起動コマンド・エントリ）
- `app/_layout.tsx`（アプリの骨格：ルートレイアウト/初期化/Stack）
- `app/(tabs)/home/index.tsx`（代表画面：状態/表示/データの扱い）

#### 参考（Functions）

- `supabase/functions/_shared/bbs.ts`
- `supabase/functions/*/index.ts`

---

### ざっくり構成

- `app/`：画面・ルーティング
- `components/`：共通コンポーネント
- `ui/`：UI部品・テーマ
- `lib/`：ロジック・データアクセス（例: `lib/supabase.ts`）
- `hooks/`：カスタムフック
- `locales/`：多言語
- `supabase/functions/`：Functions 実装

---

### ローカル実行（例）

```bash
yarn
yarn start
```

公開版には接続情報を入れていないので、動かす場合は環境変数を用意してください（例: `env.example`）。

---

### 秘密情報の扱い

- `.env` や `prod.env` のような実ファイルは公開しない方針です（`.example` のみ置いています）
- `app.json` の `expo.extra` は公開用にダミー化しています

