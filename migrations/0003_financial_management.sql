-- Phase E: 財務・受注管理システム
-- 請求書、領収書、継続課金、見積管理

-- 見積書テーブル
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_company TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  
  -- 見積内容
  items TEXT NOT NULL, -- JSON: [{name, description, quantity, unit_price, amount}]
  subtotal REAL NOT NULL,
  tax_rate REAL DEFAULT 10.0,
  tax_amount REAL NOT NULL,
  total_amount REAL NOT NULL,
  
  -- ステータス管理
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  valid_until DATE, -- 見積有効期限
  
  -- メモ・条件
  notes TEXT,
  terms TEXT,
  
  -- 変換情報
  converted_to_order INTEGER, -- orders.idへの参照
  converted_at DATETIME,
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- 請求書テーブル
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  order_id INTEGER,
  subscription_id INTEGER,
  customer_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_company TEXT,
  customer_address TEXT,
  
  -- 請求内容
  items TEXT NOT NULL, -- JSON: [{name, description, quantity, unit_price, amount}]
  subtotal REAL NOT NULL,
  tax_rate REAL DEFAULT 10.0,
  tax_amount REAL NOT NULL,
  total_amount REAL NOT NULL,
  
  -- 決済情報
  payment_status TEXT DEFAULT 'pending', -- pending, paid, overdue, cancelled
  payment_method TEXT, -- credit_card, bank_transfer, etc.
  payment_due_date DATE,
  paid_at DATETIME,
  paid_amount REAL DEFAULT 0,
  
  -- 請求書情報
  issue_date DATE NOT NULL,
  billing_period_start DATE,
  billing_period_end DATE,
  
  -- メモ
  notes TEXT,
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- 領収書テーブル
CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT UNIQUE NOT NULL,
  invoice_id INTEGER NOT NULL,
  order_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_company TEXT,
  
  -- 領収内容
  amount REAL NOT NULL,
  tax_included BOOLEAN DEFAULT 1,
  payment_method TEXT NOT NULL,
  
  -- 領収書情報
  issue_date DATE NOT NULL,
  received_date DATE NOT NULL,
  purpose TEXT, -- 但し書き（品代として、等）
  
  -- メモ
  notes TEXT,
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 継続課金（サブスクリプション）テーブル
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL,
  product_id INTEGER,
  service_id INTEGER,
  
  -- 商品情報
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_type TEXT DEFAULT 'subscription', -- subscription, recurring
  
  -- 課金情報
  amount REAL NOT NULL,
  billing_cycle TEXT NOT NULL, -- monthly, quarterly, yearly
  billing_day INTEGER DEFAULT 1, -- 請求日（1-31）
  
  -- ステータス
  status TEXT DEFAULT 'active', -- active, paused, cancelled, expired
  
  -- 期間
  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE NOT NULL,
  last_billing_date DATE,
  
  -- 決済情報
  payment_method TEXT,
  stripe_subscription_id TEXT,
  
  -- カウント
  total_billing_count INTEGER DEFAULT 0,
  
  -- メモ
  notes TEXT,
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancelled_at DATETIME,
  
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- 決済履歴テーブル
CREATE TABLE IF NOT EXISTS payment_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_number TEXT UNIQUE NOT NULL,
  
  -- 関連情報
  order_id INTEGER,
  invoice_id INTEGER,
  subscription_id INTEGER,
  customer_id INTEGER NOT NULL,
  
  -- 決済情報
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'JPY',
  payment_method TEXT NOT NULL, -- credit_card, bank_transfer, cash, etc.
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  
  -- 外部決済サービス
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  -- 決済日時
  processed_at DATETIME,
  
  -- エラー情報
  error_message TEXT,
  
  -- メモ
  notes TEXT,
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- 商品タイプ拡張（products テーブルに列追加）
ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'spot'; -- spot, subscription, recurring

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
