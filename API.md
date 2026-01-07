# 📡 API仕様書

スマートポリスECショップ - RESTful API ドキュメント

**ベースURL**: `https://shop.smartpolice.net/api`

---

## 認証

管理者APIは `Authorization` ヘッダーにBearerトークンが必要です。

```
Authorization: Bearer <token>
```

トークンは `/api/admin/login` で取得できます。

---

## レスポンス形式

### 成功レスポンス

```json
{
  "success": true,
  "data": { ... }
}
```

### エラーレスポンス

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "details": [ ... ]  // オプション
}
```

---

## エンドポイント一覧

## 商品API

### GET /products

商品一覧を取得

**クエリパラメータ**:
- `category` (string, optional): カテゴリーでフィルター
- `search` (string, optional): 検索キーワード
- `limit` (integer, optional, default: 50): 取得件数
- `offset` (integer, optional, default: 0): オフセット

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "スマートドアベル",
        "description": "...",
        "price": 8900,
        "category": "スマートホーム",
        "image_urls": ["doorbell.jpg"],
        "specifications": { ... },
        "stock_status": "in_stock"
      }
    ],
    "total": 8,
    "limit": 50,
    "offset": 0
  }
}
```

### GET /products/:id

商品詳細を取得

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "スマートドアベル",
      "price": 8900,
      ...
    }
  }
}
```

### POST /admin/products 🔒

商品を作成（管理者のみ）

**リクエストボディ**:
```json
{
  "name": "新商品名",
  "description": "商品説明",
  "price": 10000,
  "category": "スマートホーム",
  "alibaba_url": "https://...",
  "image_urls": ["image1.jpg"],
  "specifications": { ... }
}
```

### PUT /admin/products/:id 🔒

商品を更新（管理者のみ）

### DELETE /admin/products/:id 🔒

商品を削除（管理者のみ）

---

## 注文API

### POST /orders

注文を作成

**リクエストボディ**:
```json
{
  "customer_name": "山田太郎",
  "customer_email": "yamada@example.com",
  "customer_phone": "090-1234-5678",
  "shipping_address": "東京都渋谷区...",
  "shipping_postal_code": "150-0001",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "message": "注文を受け付けました",
    "orderNumber": "SP-ABC123-XYZ",
    "orderId": 1,
    "totalAmount": 17800
  }
}
```

### GET /orders/:orderNumber

注文詳細を取得

### GET /admin/orders 🔒

全注文を取得（管理者のみ）

**クエリパラメータ**:
- `status` (string, optional): ステータスでフィルター
- `limit` (integer, optional, default: 100)
- `offset` (integer, optional, default: 0)

### PUT /admin/orders/:id 🔒

注文ステータスを更新（管理者のみ）

**リクエストボディ**:
```json
{
  "status": "shipped",
  "tracking_number": "1234567890",
  "alibaba_order_id": "ALI-123456"
}
```

---

## 決済API

### POST /payment/intent

Stripe PaymentIntentを作成

**リクエストボディ**:
```json
{
  "amount": 17800,
  "description": "注文",
  "metadata": {
    "order_number": "SP-ABC123-XYZ",
    "customer_email": "yamada@example.com"
  }
}
```

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

### POST /webhooks/stripe

Stripe Webhookを受信（自動処理）

---

## メールAPI

### POST /admin/email/shipping 🔒

発送通知メールを送信（管理者のみ）

**リクエストボディ**:
```json
{
  "to": "yamada@example.com",
  "customerName": "山田太郎",
  "orderNumber": "SP-ABC123-XYZ",
  "trackingNumber": "1234567890",
  "trackingUrl": "https://..."
}
```

---

## 画像API

### POST /admin/images/upload 🔒

画像をアップロード（管理者のみ）

**リクエスト**: `multipart/form-data`
- `image`: 画像ファイル（最大5MB、JPEG/PNG/GIF/WebP）

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "message": "画像をアップロードしました",
    "filename": "1234567890-product.jpg",
    "url": "/images/1234567890-product.jpg"
  }
}
```

### GET /images/:filename

画像を取得

---

## 認証API

### POST /admin/login

管理者ログイン

**リクエストボディ**:
```json
{
  "email": "admin@smartpolice.net",
  "password": "admin123"
}
```

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "message": "ログインしました",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "email": "admin@smartpolice.net",
      "name": "システム管理者"
    }
  }
}
```

### GET /admin/me 🔒

管理者情報を取得

---

## ヘルスチェック

### GET /health

APIの稼働状況を確認

**レスポンス例**:
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

## エラーコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエストエラー |
| 401 | 認証エラー |
| 404 | 見つからない |
| 500 | サーバーエラー |

---

## レート制限

- 一般API: 100リクエスト/分
- 管理者API: 200リクエスト/分

---

## JavaScript サンプルコード

### 商品一覧取得

```javascript
const response = await fetch('https://shop.smartpolice.net/api/products?category=スマートホーム');
const data = await response.json();
console.log(data.data.products);
```

### 注文作成

```javascript
const orderData = {
  customer_name: '山田太郎',
  customer_email: 'yamada@example.com',
  shipping_address: '東京都渋谷区...',
  items: [{ product_id: 1, quantity: 2 }]
};

const response = await fetch('https://shop.smartpolice.net/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});

const result = await response.json();
console.log(result.data.orderNumber);
```

### 管理者ログイン

```javascript
const response = await fetch('https://shop.smartpolice.net/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@smartpolice.net',
    password: 'admin123'
  })
});

const data = await response.json();
const token = data.data.token;
localStorage.setItem('adminToken', token);
```

---

**🛡️ 守る力を、あなたの手に。**
