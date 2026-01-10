/**
 * JWT認証ユーティリティ（Cloudflare Workers対応）
 * Web Crypto APIを使用した軽量JWT実装
 */

/**
 * JWT署名用の秘密鍵を生成（初回のみ）
 * 本番環境では環境変数 JWT_SECRET を使用
 */
async function getSecretKey(secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret || 'smartpolice-jwt-secret-2026');
  
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Base64URL エンコード
 */
function base64urlEncode(data) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64URL デコード
 */
function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

/**
 * JWTトークンを生成
 * @param {Object} payload - トークンに含めるデータ
 * @param {string} secret - 署名用秘密鍵
 * @param {number} expiresIn - 有効期限（秒）デフォルト: 7日間
 * @returns {Promise<string>} - JWTトークン
 */
export async function generateJWT(payload, secret, expiresIn = 7 * 24 * 60 * 60) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  // エンコード
  const encoder = new TextEncoder();
  const headerEncoded = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const payloadEncoded = base64urlEncode(encoder.encode(JSON.stringify(jwtPayload)));
  
  const message = `${headerEncoded}.${payloadEncoded}`;
  
  // 署名生成
  const key = await getSecretKey(secret);
  const messageData = encoder.encode(message);
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureEncoded = base64urlEncode(signature);

  return `${message}.${signatureEncoded}`;
}

/**
 * JWTトークンを検証・デコード
 * @param {string} token - 検証するJWTトークン
 * @param {string} secret - 署名用秘密鍵
 * @returns {Promise<Object|null>} - デコードされたペイロード（無効な場合はnull）
 */
export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    
    // 署名検証
    const encoder = new TextEncoder();
    const message = `${headerEncoded}.${payloadEncoded}`;
    const messageData = encoder.encode(message);
    
    const key = await getSecretKey(secret);
    const signature = base64urlDecode(signatureEncoded);
    
    const isValid = await crypto.subtle.verify('HMAC', key, signature, messageData);
    
    if (!isValid) {
      return null;
    }

    // ペイロードデコード
    const payloadData = base64urlDecode(payloadEncoded);
    const decoder = new TextDecoder();
    const payload = JSON.parse(decoder.decode(payloadData));

    // 有効期限チェック
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // 期限切れ
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * リクエストからJWTトークンを抽出
 * @param {Request} request - HTTPリクエスト
 * @returns {string|null} - JWTトークン
 */
export function extractToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * パスワードをハッシュ化（SHA-256）
 * @param {string} password - 平文パスワード
 * @returns {Promise<string>} - ハッシュ化されたパスワード（Hex）
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * パスワードを検証
 * @param {string} password - 検証する平文パスワード
 * @param {string} hash - 保存されているハッシュ
 * @returns {Promise<boolean>} - 一致するか
 */
export async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
