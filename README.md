# 🛡️ スマートポリスECショップ

Alibabaドロップシッピングを活用した防犯アイテムECサイト

**ドメイン**: https://shop.smartpolice.net  
**管理画面**: https://shop.smartpolice.net/admin.html

---

## 📊 プロジェクト状況

### ✅ Phase 1完了（本日実装済み）
1. ✅ AI商品登録（OpenAI GPT-4o-mini統合・価格手動入力）
2. ✅ 商品画像ズーム機能
3. ✅ レビュー・評価システム
4. ✅ お気に入り機能
5. ✅ 関連商品表示
6. ✅ リアルタイム在庫表示
7. ✅ クーポンコード機能
8. ✅ 初回10%OFF自動適用
9. ✅ リアルタイム検索（オートコンプリート）
10. ✅ 価格フィルター・ソート

### 🚧 Phase 2計画（次回セッション）
📋 **詳細は [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) を参照**

- 配送日時指定機能
- 購入後メール自動送信（Resend）
- 完全モバイル対応（ハンバーガーメニュー）
- デザイン完全リニューアル（グラスモーフィズム）
- 管理画面ダッシュボード強化

**予定実装時間**: 15-19時間

---

## 📚 目次

- [概要](#概要)
- [技術スタック](#技術スタック)
- [機能一覧](#機能一覧)
- [セットアップ](#セットアップ)
- [デプロイ](#デプロイ)
- [管理画面](#管理画面)
- [次回実装計画](#次回実装計画)

---

## 概要

スマートポリスECショップは、防犯アイテムのオンライン販売を行うECサイトです。

### 主な特徴

✅ **AI商品登録**: OpenAI APIによる自動翻訳・SEO最適化  
✅ **在庫リスクゼロ**: Alibabaドロップシッピングで在庫不要  
✅ **高速配信**: Cloudflare Pagesによるグローバル高速CDN  
✅ **安全な決済**: Stripe統合による安心決済  
✅ **リアルタイム検索**: 商品名・説明・タグで即座に検索  
✅ **画像管理**: Cloudflare R2による効率的な画像ストレージ  
✅ **管理画面**: AI商品登録・注文管理の専用ダッシュボード

---

## 技術スタック

### フロントエンド
- **HTML5 / CSS3 / JavaScript（ES6+）**
- レスポンシブデザイン
- Vanilla JS（軽量・高速）

### バックエンド
- **Cloudflare Workers**: サーバーレスエッジコンピューティング
- **Cloudflare D1**: SQLiteベースの分散データベース
- **Cloudflare R2**: オブジェクトストレージ（S3互換）
- **Hono Framework**: 軽量Webフレームワーク

### 外部サービス
- **Stripe**: 決済処理
- **Resend**: メール送信
- **OpenAI API**: AI商品登録（GPT-4o-mini）

---

## 機能一覧

### フロントエンド機能
- 🛍️ 商品一覧・詳細ページ
- 🔍 リアルタイム検索（オートコンプリート）
- 💰 価格フィルター・ソート
- 🛒 カート機能
- 🎫 クーポン適用
- ⭐ レビュー・評価表示
- 🤍 お気に入り機能
- 📦 在庫状況表示
- 🔍 商品画像ズーム
- 📱 モバイル対応（基本版）

### 管理画面機能
- 🤖 AI商品登録（OpenAI統合）
- ✍️ 手動商品登録
- 📋 注文管理
- 📦 在庫管理
- 🎫 クーポン管理
- ⭐ レビュー管理

---

## 管理画面

### アクセス情報
- **URL**: https://shop.smartpolice.net/admin.html
- **Email**: admin@smartpolice.net
- **Password**: SmartPolice2026!

### AI商品登録の使い方
1. AI商品登録タブを開く
2. Alibaba商品URLを入力
3. マージン率を入力（例: 100%）
4. AI分析を開始（10-20秒待機）
5. **価格を手動入力**（必須）
6. **画像URLをコピー＆ペースト**（必須）
7. プレビュー確認後、登録

**詳細**: [AI商品登録マニュアル](./docs/AI_PRODUCT_REGISTRATION.md)

---

## 次回実装計画

📋 **完全な実装計画は [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) を参照**

### Day 1-2（8-10時間）
- 配送日時指定カレンダー
- 購入後メール自動送信（4種類）
- 注文追跡機能

### Day 3（4-5時間）
- デザインリニューアル
- グラスモーフィズムUI
- マイクロインタラクション

### Day 4（3-4時間）
- モバイル完全対応
- ハンバーガーメニュー
- タッチ最適化

### Day 5（3-4時間）
- 管理画面ダッシュボード
- 売上統計グラフ
- 一括注文処理

**合計予定時間**: 15-19時間

---
- **Resend**: メール送信
- **Alibaba**: 商品仕入れ（ドロップシッピング）

### ホスティング
- **Cloudflare Pages**: 静的ファイルホスティング
- **カスタムドメイン**: shop.smartpolice.net

---

## 機能一覧

### 💻 フロントエンド（顧客向け）

| 機能 | 説明 | ステータス |
|------|------|---------|
| トップページ | 商品カテゴリー表示、ヒーローセクション | ✅ 実装済み |
| 商品一覧 | カテゴリーフィルター、検索機能 | ✅ 実装済み |
| 商品詳細 | 画像ギャラリー、仕様表示、カート追加 | ✅ 実装済み |
| ショッピングカート | 商品追加・削除・数量変更 | ✅ 実装済み |
| チェックアウト | 配送先入力、Stripe決済 | ✅ 実装済み |
| 注文完了 | 注文番号表示、確認メール送信 | ✅ 実装済み |

### 🔧 管理画面（管理者向け）

| 機能 | 説明 | ステータス |
|------|------|---------|
| ログイン | 管理者認証 | ✅ 実装済み |
| ダッシュボード | 売上サマリー、注文統計 | ✅ 実装済み |
| 商品管理 | CRUD操作、画像アップロード | ✅ 実装済み |
| 注文管理 | ステータス更新、Alibaba連携 | ✅ 実装済み |
| 発送通知 | メール一括送信 | ✅ 実装済み |

### 🔌 API エンドポイント

#### 商品API
```
GET    /api/products              - 商品一覧取得
GET    /api/products/:id          - 商品詳細取得
POST   /api/admin/products        - 商品作成（管理者）
PUT    /api/admin/products/:id    - 商品更新（管理者）
DELETE /api/admin/products/:id    - 商品削除（管理者）
```

#### 注文API
```
POST   /api/orders                - 注文作成
GET    /api/orders/:orderNumber   - 注文詳細取得
GET    /api/admin/orders          - 全注文取得（管理者）
PUT    /api/admin/orders/:id      - 注文更新（管理者）
```

#### 決済API
```
POST   /api/payment/intent        - Stripe PaymentIntent作成
POST   /api/webhooks/stripe       - Stripe Webhook受信
```

#### 画像API
```
POST   /api/admin/images/upload   - 画像アップロード（管理者）
GET    /images/:filename          - 画像取得
```

#### 認証API
```
POST   /api/admin/login           - 管理者ログイン
GET    /api/admin/me              - 管理者情報取得
```

---

## プロジェクト構造

```
smartpolice-shop/
├── src/                          # バックエンドソース
│   ├── index.js                  # Workers エントリーポイント
│   ├── routes/                   # APIルート
│   │   ├── products.js           # 商品API
│   │   └── orders.js             # 注文API
│   ├── services/                 # 外部サービス連携
│   │   ├── stripe.js             # Stripe決済
│   │   ├── resend.js             # Resendメール
│   │   └── r2.js                 # R2画像管理
│   └── utils/                    # ユーティリティ
│       ├── response.js           # レスポンスヘルパー
│       ├── validator.js          # バリデーション
│       └── auth.js               # 認証
├── public/                       # フロントエンド
│   ├── index.html                # トップページ
│   ├── products.html             # 商品一覧
│   ├── product-detail.html       # 商品詳細
│   ├── checkout.html             # チェックアウト
│   ├── order-complete.html       # 注文完了
│   ├── admin/                    # 管理画面
│   │   ├── login.html            # ログイン
│   │   ├── dashboard.html        # ダッシュボード
│   │   ├── products.html         # 商品管理
│   │   └── orders.html           # 注文管理
│   ├── css/
│   │   └── style.css             # 共通スタイル
│   └── js/
│       ├── api.js                # API呼び出し
│       ├── checkout.js           # チェックアウト処理
│       └── admin.js              # 管理画面JS
├── migrations/
│   └── 0001_initial.sql          # D1マイグレーション
├── wrangler.toml                 # Cloudflare設定
├── package.json
├── .env.example                  # 環境変数テンプレート
├── README.md                     # このファイル
├── DEPLOYMENT.md                 # デプロイ手順
├── API.md                        # API詳細仕様
└── ADMIN_GUIDE.md                # 管理者ガイド
```

---

## セットアップ

### 1. 必要なアカウント

以下のアカウントを事前に作成してください：

- [x] Cloudflareアカウント
- [ ] Stripeアカウント（テストモード）
- [ ] Resendアカウント
- [ ] Alibabaアカウント（ドロップシッピング用）

### 2. リポジトリのクローン

```bash
git clone <repository-url>
cd smartpolice-shop
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 環境変数の設定

`.env.example` をコピーして `.env` を作成：

```bash
cp .env.example .env
```

以下の値を設定：

```env
# Stripe（https://dashboard.stripe.com/test/apikeys）
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Resend（https://resend.com/api-keys）
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=order@smartpolice.net

# 管理者パスワード（初期設定: admin123）
ADMIN_EMAIL=admin@smartpolice.net
ADMIN_PASSWORD_HASH=<SHA-256 hash>
```

### 5. D1データベース作成

```bash
npx wrangler d1 create smartpolice-shop-db
```

出力される `database_id` を `wrangler.toml` に設定。

### 6. マイグレーション実行

```bash
npm run db:migrate
```

### 7. R2バケット作成

```bash
npx wrangler r2 bucket create smartpolice-shop-images
```

### 8. ローカル開発サーバー起動

```bash
npm run dev
```

→ http://localhost:8787 でアクセス可能

---

## デプロイ

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照。

### クイックデプロイ

```bash
# Workers のデプロイ
npm run deploy

# Pages のデプロイ
npx wrangler pages deploy public --project-name=smartpolice-shop
```

### カスタムドメイン設定

1. Cloudflareダッシュボード → Pages → smartpolice-shop
2. "Custom domains" → "Set up a custom domain"
3. `shop.smartpolice.net` を追加

---

## 開発ガイド

### コーディング規約

- **命名**: camelCase（JavaScript）、kebab-case（CSS）
- **インデント**: スペース2つ
- **コメント**: 関数ごとにJSDoc形式

### テスト

```bash
# ローカルでテスト
npm run dev

# 本番環境でテスト注文を実行
# （Stripeのテストカード: 4242 4242 4242 4242）
```

---

## トラブルシューティング

### D1接続エラー

```bash
# database_idが正しいか確認
npx wrangler d1 list

# マイグレーションを再実行
npm run db:migrate
```

### Stripe Webhookエラー

```bash
# Webhook URLを確認
# https://shop.smartpolice.net/api/webhooks/stripe

# Stripeダッシュボードで設定を確認
```

---

## ライセンス

MIT License

---

## サポート

問い合わせ: admin@smartpolice.net

---

**🛡️ 守る力を、あなたの手に。**
