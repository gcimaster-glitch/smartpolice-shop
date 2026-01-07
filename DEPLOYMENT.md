# 🚀 デプロイメントガイド

スマートポリスECショップの本番環境へのデプロイ手順

---

## 📋 デプロイ前チェックリスト

- [ ] Cloudflareアカウント作成済み
- [ ] Stripeアカウント作成（テストモード）
- [ ] Resendアカウント作成＋API キー取得
- [ ] ドメイン smartpolice.net がCloudflareで管理されている
- [ ] wrangler CLI インストール済み（`npm install -g wrangler`）

---

## 1️⃣ Cloudflare Workers 設定

### ステップ1: Cloudflareにログイン

```bash
npx wrangler login
```

ブラウザが開いて認証が完了します。

### ステップ2: D1データベース作成

```bash
npx wrangler d1 create smartpolice-shop-db
```

**出力例**:
```
✅ Successfully created DB 'smartpolice-shop-db'!
database_id = "12345678-abcd-efgh-ijkl-mnopqrstuvwx"
```

この `database_id` をコピーして、`wrangler.toml` の以下の部分を更新：

```toml
[[d1_databases]]
binding = "DB"
database_name = "smartpolice-shop-db"
database_id = "12345678-abcd-efgh-ijkl-mnopqrstuvwx"  # ← ここに貼り付け
```

### ステップ3: データベースマイグレーション実行

```bash
npx wrangler d1 execute smartpolice-shop-db --file=./migrations/0001_initial.sql
```

成功すると、テーブルとサンプルデータが作成されます。

### ステップ4: R2バケット作成

```bash
npx wrangler r2 bucket create smartpolice-shop-images
```

---

## 2️⃣ 環境変数（シークレット）設定

Cloudflare Workers では、機密情報を環境変数として安全に保存します。

### Stripe設定

```bash
# Stripe Secret Key（https://dashboard.stripe.com/test/apikeysから取得）
npx wrangler secret put STRIPE_SECRET_KEY
# プロンプトで入力: sk_test_xxxxxxxxxxxxxxxxxxxxx

# Stripe Webhook Secret（後で設定）
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# プロンプトで入力: whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Resend設定

```bash
# Resend API Key（https://resend.com/api-keysから取得）
npx wrangler secret put RESEND_API_KEY
# プロンプトで入力: re_xxxxxxxxxxxxxxxxxxxxx
```

### 管理者パスワード設定

```bash
# 管理者パスワードのハッシュ値を生成
# （初期パスワード: admin123 のハッシュ値）
npx wrangler secret put ADMIN_PASSWORD_HASH
# プロンプトで入力: <SHA-256ハッシュ値>
```

**パスワードハッシュの生成方法**:
```javascript
// ブラウザのコンソールで実行
const encoder = new TextEncoder();
const data = encoder.encode('admin123');  // ← パスワード
crypto.subtle.digest('SHA-256', data).then(hash => {
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log(hashHex);
});
```

---

## 3️⃣ Cloudflare Workers デプロイ

### ステップ1: デプロイ実行

```bash
npm run deploy
```

または

```bash
npx wrangler deploy
```

**成功すると**:
```
✨ Compiled Worker successfully
✨ Uploaded smartpolice-shop
✨ Deployed smartpolice-shop
   https://smartpolice-shop.<your-account>.workers.dev
```

### ステップ2: 動作確認

```bash
curl https://smartpolice-shop.<your-account>.workers.dev/api/health
```

レスポンス:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-01-07T12:34:56.789Z",
    "service": "smartpolice-shop-api"
  }
}
```

---

## 4️⃣ Cloudflare Pages デプロイ

### ステップ1: Pagesプロジェクト作成＋デプロイ

```bash
npx wrangler pages deploy public --project-name=smartpolice-shop
```

初回実行時、プロジェクトが自動作成されます。

**成功すると**:
```
✨ Success! Uploaded 15 files
✨ Deployment complete!
   https://smartpolice-shop.pages.dev
```

### ステップ2: カスタムドメイン設定

1. Cloudflareダッシュボードにアクセス
2. **Pages** → **smartpolice-shop** を選択
3. **Custom domains** タブをクリック
4. **Set up a custom domain** をクリック
5. `shop.smartpolice.net` を入力
6. **Continue** → DNS設定が自動で行われます

**DNS設定の確認**:
- Cloudflare DNS に `CNAME` レコードが追加されます
  ```
  shop.smartpolice.net CNAME smartpolice-shop.pages.dev
  ```

---

## 5️⃣ Stripe Webhook 設定

### ステップ1: Webhook エンドポイント登録

1. Stripeダッシュボード: https://dashboard.stripe.com/test/webhooks
2. **Add endpoint** をクリック
3. **Endpoint URL**: `https://shop.smartpolice.net/api/webhooks/stripe`
4. **Events to send**: 以下を選択
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. **Add endpoint** をクリック

### ステップ2: Webhook Secret 取得＋設定

1. 作成したWebhookをクリック
2. **Signing secret** をコピー（`whsec_` で始まる文字列）
3. Cloudflare Workers に設定：

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# プロンプトで入力: whsec_xxxxxxxxxxxxxxxxxxxxx
```

4. Workersを再デプロイ：

```bash
npm run deploy
```

---

## 6️⃣ Resend ドメイン認証

### ステップ1: 送信元ドメインを追加

1. Resendダッシュボード: https://resend.com/domains
2. **Add Domain** をクリック
3. ドメイン: `smartpolice.net` を入力
4. **Add** をクリック

### ステップ2: DNS レコード追加

Resendが表示するDNSレコードをCloudflare DNSに追加：

1. Cloudflareダッシュボード → **DNS**
2. 以下のレコードを追加（Resendの指示に従う）：

```
TXT  resend._domainkey.smartpolice.net  "v=DKIM1; k=rsa; p=..."
TXT  smartpolice.net  "v=spf1 include:resend.com ~all"
```

3. Resendダッシュボードに戻り、**Verify** をクリック
4. ✅ ドメインが認証されます

---

## 7️⃣ 本番環境テスト

### ステップ1: サイトアクセス

ブラウザで https://shop.smartpolice.net にアクセス

### ステップ2: テスト注文

1. 商品を選択してカートに追加
2. チェックアウトに進む
3. Stripeテストカード情報を入力：
   - カード番号: `4242 4242 4242 4242`
   - 有効期限: 未来の日付（例: 12/34）
   - CVC: 任意の3桁（例: 123）
   - 郵便番号: 任意（例: 12345）
4. 注文を確定
5. 注文確認メールが届くことを確認

### ステップ3: 管理画面テスト

1. https://shop.smartpolice.net/admin/login.html にアクセス
2. ログイン情報を入力：
   - Email: `admin@smartpolice.net`
   - Password: `admin123`（または設定したパスワード）
3. ダッシュボードが表示されることを確認
4. 注文一覧から先ほどのテスト注文が表示されることを確認

---

## 8️⃣ 本番環境への切り替え

テストが完了したら、本番環境（Live Mode）に切り替えます。

### ステップ1: Stripe 本番キーに切り替え

1. Stripeダッシュボードで **View test data** を **OFF** に切り替え
2. 本番用APIキーを取得
3. Cloudflare Workers シークレットを更新：

```bash
npx wrangler secret put STRIPE_SECRET_KEY
# 本番用 sk_live_xxxxx を入力

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# 本番用 whsec_xxxxx を入力（本番Webhookを新規作成）
```

### ステップ2: 本番Webhook作成

1. Stripeダッシュボード（本番モード）: https://dashboard.stripe.com/webhooks
2. 新しいWebhookを作成（テストと同じ手順）
3. 新しいWebhook Secretを設定

### ステップ3: Workersを再デプロイ

```bash
npm run deploy
```

---

## 9️⃣ モニタリング設定

### Cloudflare Workers Analytics

1. Cloudflareダッシュボード → **Workers & Pages**
2. **smartpolice-shop** を選択
3. **Analytics** タブでリクエスト数、エラー率を確認

### ログ確認

```bash
npx wrangler tail smartpolice-shop
```

リアルタイムでログが表示されます。

---

## 🔟 セキュリティ強化（推奨）

### 1. 管理者パスワードの変更

初期パスワード `admin123` を必ず変更してください。

### 2. レート制限の追加

Cloudflare Firewall Rulesで以下を設定：

- `/api/admin/*` → IPアドレス制限
- `/api/orders` → レート制限（1分間に10リクエストまで）

### 3. WAF（Web Application Firewall）有効化

Cloudflareダッシュボード → **Security** → **WAF** → **On**

---

## ❓ トラブルシューティング

### エラー: "Database not found"

```bash
# D1データベースが作成されているか確認
npx wrangler d1 list

# マイグレーションを再実行
npx wrangler d1 execute smartpolice-shop-db --file=./migrations/0001_initial.sql
```

### エラー: "Stripe webhook signature verification failed"

```bash
# Webhook Secretが正しいか確認
npx wrangler secret list

# シークレットを再設定
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### Resendメールが届かない

1. Resendダッシュボードで**Logs**を確認
2. DNS認証が完了しているか確認
3. 送信元アドレス `order@smartpolice.net` がドメイン認証済みか確認

---

## 🎉 デプロイ完了！

おめでとうございます！スマートポリスECショップが本番環境で稼働しています。

**サイトURL**: https://shop.smartpolice.net  
**管理画面**: https://shop.smartpolice.net/admin/

---

**🛡️ 守る力を、あなたの手に。**
