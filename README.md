# fitcoach（公開用）

面談でコードを見てもらう用途で、**どこを見ればよいか**を最短で辿れるようにまとめています。  
この公開用フォルダでは、APIキー等の**設定値はダミー化**しています（実値は含めません）。

---

### 概要（このリポジトリで分かる範囲）

- ルートの `package.json` を起点とした **Expo（React Native）アプリ**のコードです。
- 画面は `app/` 配下にあり、`expo-router` のファイルベースルーティング構成です。

---

### 技術スタック（確認できたもの）

- **フロント**: Expo / React Native / React / TypeScript
- **ルーティング**: `expo-router`（`package.json` の `main: "expo-router/entry"` より）
- **BaaS/SDK**: `@supabase/supabase-js`（依存関係・`lib/supabase.ts` より）
- **Functions**: `supabase/functions/` に TypeScript 実装が含まれています

---

### まず結論（React / PHP がどこにあるか）

- **React（Expo/React Native）**: 主に `app/` / `components/` / `lib/` / `ui/`
- **PHP**: このリポジトリ内では `*.php` / `composer.json` / `<?php` を確認できませんでした。  
  ※ もしPHPのバックエンドが別で存在する場合は、別リポジトリ/別環境として共有するのが分かりやすいです。

---

### 5分で追うなら（まず見てほしいファイル）

#### React（2〜3個）

- **`package.json`**: 起動コマンドとエントリポイントがここにまとまっています。
- **`app/_layout.tsx`**: アプリの骨格（ルートレイアウト、初期化、`Stack` 構成）が読めます。
- **`app/(tabs)/home/index.tsx`**: 代表画面の例として、状態・UI・データ取り回しの実装がまとまっています。

#### 参考（Functions実装）

- **`supabase/functions/_shared/bbs.ts`**: Functions 間で共有される処理（CORS、HMAC、バリデーション等）
- **`supabase/functions/*/index.ts`**: 各エンドポイントの実装

---

### 構成メモ（主要パス）

- **`app/`**: 画面・ルーティング
- **`components/`**: 共通コンポーネント
- **`ui/`**: UI部品・テーマ
- **`lib/`**: アプリロジック・データアクセス（例: `lib/supabase.ts`）
- **`hooks/`**: カスタムフック
- **`locales/`**: 多言語リソース
- **`supabase/functions/`**: Functions 実装

---

### ローカル実行（例）

コマンドは `package.json` の `scripts` に定義されています。

```bash
yarn
yarn start
```

Supabaseの接続情報などは公開版には含めていないため、動作させる場合は `.env` などで環境変数を設定してください（例: `env.example` を参照）。

---

### 注意事項（秘密情報）

- `.env` や `prod.env` などの実ファイルは、公開用には含めません（`.example` のみ）。
- `app.json` の `expo.extra` も公開用にダミー化しています。

