-- 管理者パスワードを更新（パスワード: SmartPolice2026!）
-- 注意: 本番環境では必ず強力なパスワードに変更してください

UPDATE admins 
SET password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p38KTnLkzEm8qiEkVZD.Em'
WHERE email = 'admin@smartpolice.net';

SELECT email, name FROM admins WHERE email = 'admin@smartpolice.net';
