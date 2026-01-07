-- スマートポリスECショップ データベーススキーマ
-- D1 (SQLite) マイグレーション v1

-- ==============================================
-- 1. 商品テーブル
-- ==============================================
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL CHECK(price >= 0),
  category TEXT NOT NULL,
  alibaba_url TEXT,
  alibaba_supplier_id TEXT,
  alibaba_price REAL,
  stock_status TEXT DEFAULT 'in_stock' CHECK(stock_status IN ('in_stock', 'out_of_stock', 'discontinued')),
  image_urls TEXT, -- JSON配列形式 例: ["image1.jpg", "image2.jpg"]
  specifications TEXT, -- JSON形式 例: {"resolution": "1080p", "wifi": true}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 商品テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);

-- ==============================================
-- 2. 注文テーブル
-- ==============================================
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  shipping_postal_code TEXT,
  total_amount REAL NOT NULL CHECK(total_amount >= 0),
  stripe_payment_id TEXT,
  stripe_payment_status TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  alibaba_order_id TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 注文テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ==============================================
-- 3. 注文明細テーブル
-- ==============================================
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price REAL NOT NULL CHECK(unit_price >= 0),
  subtotal REAL NOT NULL CHECK(subtotal >= 0),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 注文明細テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ==============================================
-- 4. 管理者テーブル
-- ==============================================
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 管理者テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- ==============================================
-- 5. サンプルデータ挿入
-- ==============================================

-- サンプル商品データ（防犯アイテム）
INSERT INTO products (name, description, price, category, image_urls, specifications, stock_status) VALUES
(
  'スマートドアベル Wi-Fi対応',
  'スマホでいつでも玄関を確認できるWi-Fi対応インターホン。1080p高画質カメラ、双方向音声通話、動体検知機能搭載。夜間でも鮮明に撮影できる赤外線ナイトビジョン付き。',
  8900,
  'スマートホーム',
  '["doorbell-1.jpg", "doorbell-2.jpg", "doorbell-3.jpg"]',
  '{"resolution": "1080p", "wifi": "2.4GHz/5GHz", "night_vision": true, "two_way_audio": true, "motion_detection": true, "storage": "クラウド/SD対応"}',
  'in_stock'
),
(
  '防犯ブザー コンパクトタイプ（女性向け）',
  '女性向けコンパクト防犯ブザー。大音量130dBで緊急時に周囲に知らせます。おしゃれなデザインでバッグやキーホルダーに取り付け可能。LEDライト付き。',
  2980,
  '個人向け',
  '["buzzer-1.jpg", "buzzer-2.jpg"]',
  '{"volume": "130dB", "battery": "CR2032", "size": "50x30x15mm", "weight": "25g", "led_light": true, "colors": ["ピンク", "ホワイト", "ブラック"]}',
  'in_stock'
),
(
  'GPS追跡デバイス 車両用',
  'リアルタイムで車両の位置を追跡できる小型GPSデバイス。専用アプリで移動履歴を確認可能。盗難対策に最適。バッテリー持続時間30日。',
  12800,
  '車両・バイク',
  '["gps-1.jpg", "gps-2.jpg", "gps-3.jpg"]',
  '{"battery_life": "30日", "tracking": "リアルタイム", "size": "60x40x20mm", "waterproof": "IP67", "geofence": true, "app": "iOS/Android対応"}',
  'in_stock'
),
(
  'スマートロック 指紋認証対応',
  '指紋認証・暗証番号・ICカード・スマホアプリの4つの方法で開錠可能。オートロック機能付き。電池切れ時の緊急用物理キー付属。',
  15900,
  'スマートホーム',
  '["smartlock-1.jpg", "smartlock-2.jpg", "smartlock-3.jpg"]',
  '{"auth_types": ["指紋", "暗証番号", "ICカード", "スマホアプリ"], "battery": "単3電池x4（約8ヶ月持続）", "emergency_key": true, "auto_lock": true, "users": "最大100人登録"}',
  'in_stock'
),
(
  '防犯カメラ 屋外用ワイヤレス',
  '完全ワイヤレスの屋外用防犯カメラ。2K高画質、赤外線夜間撮影、動体検知、双方向音声。IP66防水防塵規格で雨の日も安心。',
  9800,
  'スマートホーム',
  '["camera-1.jpg", "camera-2.jpg", "camera-3.jpg"]',
  '{"resolution": "2K (2304x1296)", "night_vision": "赤外線LED搭載", "waterproof": "IP66", "wifi": "2.4GHz", "storage": "microSD対応（最大128GB）", "battery": "充電式（約3ヶ月）"}',
  'in_stock'
),
(
  '窓用振動センサー 4個セット',
  '窓ガラスの振動を検知してスマホにアラート送信。簡単取り付け、電池式で配線不要。不正侵入を未然に防ぎます。',
  3500,
  'スマートホーム',
  '["sensor-1.jpg", "sensor-2.jpg"]',
  '{"sensitivity": "3段階調整", "battery": "CR2032x2（約1年持続）", "alert": "スマホアプリ通知", "quantity": "4個セット", "installation": "両面テープ"}',
  'in_stock'
),
(
  'ダミー防犯カメラ ソーラー充電式',
  '本物そっくりのダミーカメラ。ソーラー充電式LEDが点滅し、抑止力抜群。低コストで防犯効果を発揮。',
  1980,
  'スマートホーム',
  '["dummy-camera-1.jpg"]',
  '{"power": "ソーラー充電", "led": "赤色点滅", "material": "耐候性プラスチック", "installation": "壁掛け・天井取り付け"}',
  'in_stock'
),
(
  'ポータブル金庫 電子ロック',
  '貴重品を守る小型金庫。4桁暗証番号式電子ロック。持ち運び可能で旅行にも最適。',
  5800,
  '個人向け',
  '["safe-1.jpg", "safe-2.jpg"]',
  '{"lock_type": "電子ロック（4桁暗証番号）", "size": "内寸 200x150x150mm", "weight": "3.5kg", "material": "スチール製", "emergency_key": "2本付属"}',
  'in_stock'
);

-- 管理者アカウント（初期パスワード: admin123）
-- 注意: 本番環境では必ず変更してください！
INSERT INTO admins (email, password_hash, name) VALUES
('admin@smartpolice.net', '$2a$10$rZ5qH6yLxYvKd.QmR7J1xOJKvN7mX8bY1dL2pW9sE3fT4gU5hV6iC', 'システム管理者');

-- ==============================================
-- 6. トリガー作成（updated_at自動更新）
-- ==============================================

-- 商品の更新時刻自動更新トリガー
CREATE TRIGGER IF NOT EXISTS update_products_timestamp 
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 注文の更新時刻自動更新トリガー
CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ==============================================
-- マイグレーション完了
-- ==============================================
