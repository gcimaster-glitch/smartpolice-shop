-- マイグレーション v2: ユーザーテーブル・サービステーブル追加
-- 実行日: 2026-01-09

-- ==============================================
-- 1. ユーザーテーブル（顧客アカウント）
-- ==============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  postal_code TEXT,
  prefecture TEXT,
  address TEXT,
  building TEXT,
  email_verified INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

-- ユーザーテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ==============================================
-- 2. サービステーブル
-- ==============================================
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('企業向け', '学校・教育機関向け', 'その他専門サービス')),
  description TEXT NOT NULL,
  price_from REAL NOT NULL CHECK(price_from >= 0),
  price_type TEXT NOT NULL CHECK(price_type IN ('月額', '初期費用', '1回あたり')),
  features TEXT NOT NULL, -- JSON配列 ["特徴1", "特徴2", ...]
  target_audience TEXT, -- ターゲット顧客
  icon TEXT, -- アイコン名（例: "shield", "camera", "alert-triangle"）
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- サービステーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);

-- ==============================================
-- 3. サービス申込みテーブル
-- ==============================================
CREATE TABLE IF NOT EXISTS service_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  user_id INTEGER,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  address TEXT,
  employee_count TEXT, -- 企業規模（例: "1-10名", "11-50名"）
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'contacted', 'in_progress', 'accepted', 'rejected', 'cancelled')),
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- サービス申込みテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_service_applications_service_id ON service_applications(service_id);
CREATE INDEX IF NOT EXISTS idx_service_applications_user_id ON service_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_service_applications_status ON service_applications(status);
CREATE INDEX IF NOT EXISTS idx_service_applications_created_at ON service_applications(created_at DESC);

-- ==============================================
-- 4. セッショントークンテーブル（JWT管理）
-- ==============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- セッショントークンテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ==============================================
-- 5. 注文テーブル拡張（ユーザーID・配送日時追加）
-- ==============================================
ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN delivery_date TEXT;
ALTER TABLE orders ADD COLUMN delivery_time TEXT;
ALTER TABLE orders ADD COLUMN subtotal REAL DEFAULT 0 CHECK(subtotal >= 0);
ALTER TABLE orders ADD COLUMN shipping_fee REAL DEFAULT 0 CHECK(shipping_fee >= 0);

-- 注文テーブルの新しいインデックス
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);

-- ==============================================
-- 6. サンプルサービスデータ挿入
-- ==============================================
INSERT INTO services (name, category, description, price_from, price_type, features, target_audience, icon, display_order) VALUES
-- 企業向けサービス
(
  '24時間遠隔監視サービス',
  '企業向け',
  '専門スタッフが24時間365日、お客様の施設を遠隔監視。異常を検知した際は即座にご連絡し、必要に応じて警備員を派遣します。',
  50000,
  '月額',
  '["24時間365日監視", "異常時即座連絡", "警備員緊急派遣", "月次レポート提供", "専用アプリで状況確認"]',
  '中小企業、オフィス、工場',
  'shield',
  1
),
(
  '入退室管理システム',
  '企業向け',
  '社員の入退室を管理し、セキュリティを強化。ICカード・顔認証・指紋認証に対応。勤怠管理システムとの連携も可能です。',
  300000,
  '初期費用',
  '["ICカード・顔認証対応", "入退室履歴記録", "不正侵入アラート", "勤怠管理連携", "リモート管理可能"]',
  '企業、オフィス、研究施設',
  'lock',
  2
),
(
  '防犯カメラ設置・運用サポート',
  '企業向け',
  '最適な防犯カメラの選定から設置、運用まで一貫サポート。クラウド録画・AI人物検知機能で高度なセキュリティを実現。',
  150000,
  '初期費用',
  '["最適機器選定", "プロ施工", "クラウド録画", "AI人物検知", "定期メンテナンス"]',
  '店舗、オフィス、倉庫',
  'camera',
  3
),
-- 学校・教育機関向けサービス
(
  '校門監視システム',
  '学校・教育機関向け',
  '登下校時の児童・生徒の安全を守る総合監視システム。顔認証で保護者へ通知、不審者検知機能も搭載。',
  80000,
  '月額',
  '["顔認証登下校通知", "不審者検知", "緊急時一斉連絡", "保護者専用アプリ", "録画データ保管"]',
  '小学校、中学校、高校',
  'users',
  4
),
(
  '緊急通報システム',
  '学校・教育機関向け',
  '教室・職員室・体育館に緊急ボタンを設置。押すと職員全員に即座通知、位置情報を共有し迅速な対応を実現。',
  200000,
  '初期費用',
  '["ワンタッチ緊急通報", "位置情報共有", "職員一斉通知", "警察・消防連携", "訓練モード搭載"]',
  '学校、保育園、学習塾',
  'alert-triangle',
  5
),
(
  '総合セキュリティパッケージ',
  '学校・教育機関向け',
  '防犯カメラ・入退室管理・緊急通報システムを統合した学校向けパッケージ。一元管理で運用も簡単。',
  150000,
  '月額',
  '["防犯カメラ設置", "入退室管理", "緊急通報システム", "一元管理画面", "24時間サポート"]',
  '小中高校、大学、専門学校',
  'package',
  6
),
-- その他専門サービス
(
  'セキュリティコンサルティング',
  'その他専門サービス',
  'セキュリティ専門家が現地調査を実施し、最適な防犯対策を提案。リスク評価から改善計画まで総合的にサポートします。',
  100000,
  '1回あたり',
  '["現地セキュリティ診断", "リスク評価レポート", "改善提案書作成", "費用対効果分析", "実装サポート"]',
  '企業、学校、公共施設',
  'clipboard',
  7
),
(
  '防犯機器 保守・メンテナンス',
  'その他専門サービス',
  '既設の防犯機器の定期点検・清掃・修理を実施。機器の長寿命化とトラブル予防で安心をお届けします。',
  20000,
  '月額',
  '["定期点検（月1回）", "清掃・調整", "故障時優先対応", "消耗品交換", "動作確認レポート"]',
  '防犯機器設置済みのお客様',
  'tool',
  8
),
(
  'セキュリティ研修・訓練',
  'その他専門サービス',
  '従業員向けセキュリティ研修と緊急時対応訓練を実施。防犯意識の向上と実践的なスキルを習得します。',
  50000,
  '1回あたり',
  '["防犯意識向上研修", "緊急時対応訓練", "実践シミュレーション", "修了証発行", "カスタマイズ可能"]',
  '企業、学校、店舗',
  'book-open',
  9
);

-- ==============================================
-- 7. トリガー作成（updated_at自動更新）
-- ==============================================
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_services_timestamp 
AFTER UPDATE ON services
FOR EACH ROW
BEGIN
  UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_service_applications_timestamp 
AFTER UPDATE ON service_applications
FOR EACH ROW
BEGIN
  UPDATE service_applications SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ==============================================
-- マイグレーション v2 完了
-- ==============================================
