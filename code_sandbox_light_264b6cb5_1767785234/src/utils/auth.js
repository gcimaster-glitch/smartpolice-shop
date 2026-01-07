/**
 * 認証ユーティリティ
 * 管理者認証とトークン管理
 */

/**
 * パスワードハッシュの検証
 * 注意: bcryptはCloudflare Workersで直接使用できないため、
 * シンプルなハッシュ比較を使用しています。
 * 本番環境では外部認証サービス（Auth0、Clerk等）の使用を推奨します。
 * 
 * @param {string} password - 平文パスワード
 * @param {string} hash - ハッシュ化されたパスワード
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  // 本番環境では、bcryptやArgon2などの適切なハッシュアルゴリズムを使用してください
  // この実装は簡易的なものです
  
  // Web Crypto APIを使用したハッシュ化
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHash === hash;
}

/**
 * パスワードをハッシュ化
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 管理者トークンを生成
 * @param {Object} admin - 管理者情報
 * @returns {string}
 */
export function generateAdminToken(admin) {
  // 簡易的なトークン生成（本番環境ではJWTなどを使用）
  const payload = {
    id: admin.id,
    email: admin.email,
    timestamp: Date.now()
  };
  
  return btoa(JSON.stringify(payload));
}

/**
 * 管理者トークンを検証
 * @param {string} token
 * @returns {Object|null}
 */
export function verifyAdminToken(token) {
  try {
    const payload = JSON.parse(atob(token));
    
    // トークンの有効期限チェック（24時間）
    const tokenAge = Date.now() - payload.timestamp;
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Authorizationヘッダーからトークンを抽出
 * @param {Request} request
 * @returns {string|null}
 */
export function extractToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * 管理者認証ミドルウェア
 * @param {Request} request
 * @returns {Object|null} - 認証成功時は管理者情報、失敗時はnull
 */
export function requireAdmin(request) {
  const token = extractToken(request);
  if (!token) return null;
  
  return verifyAdminToken(token);
}
