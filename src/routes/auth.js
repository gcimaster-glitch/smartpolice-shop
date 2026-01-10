/**
 * ユーザー認証API（register, login, me）
 */

import { generateJWT, verifyJWT, extractToken, hashPassword, verifyPassword } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { sanitizeRequestBody, sanitizeEmail, sanitizeText } from '../utils/sanitize.js';

/**
 * ユーザー新規登録
 * POST /api/auth/register
 */
export async function registerUser(request, env) {
  try {
    const body = await request.json();
    
    // 入力サニタイズ
    const sanitized = sanitizeRequestBody(body, {
      email: { type: 'email', required: true },
      password: { type: 'text', maxLength: 128, required: true },
      firstName: { type: 'text', maxLength: 50, required: true },
      lastName: { type: 'text', maxLength: 50, required: true },
      phone: { type: 'phone' },
      company: { type: 'text', maxLength: 100 }
    });

    const { email, password, firstName, lastName, phone, company } = sanitized;

    // パスワード長チェック
    if (password.length < 8) {
      return errorResponse('パスワードは8文字以上にしてください', 400);
    }

    // メールアドレス重複チェック
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return errorResponse('このメールアドレスは既に登録されています', 400);
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(password);

    // ユーザー作成
    const result = await env.DB.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, company)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(email, passwordHash, firstName, lastName, phone || null, company || null).run();

    const userId = result.meta.last_row_id;

    // JWTトークン生成
    const token = await generateJWT(
      { 
        userId, 
        email, 
        firstName,
        lastName,
        type: 'user' 
      },
      env.JWT_SECRET || 'smartpolice-jwt-secret-2026',
      7 * 24 * 60 * 60 // 7日間有効
    );

    // セッション保存
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare(`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(userId, token, expiresAt).run();

    return successResponse({
      message: '登録が完了しました',
      token,
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        phone,
        company
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('登録に失敗しました', 500);
  }
}

/**
 * ユーザーログイン
 * POST /api/auth/login
 */
export async function loginUser(request, env) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('メールアドレスとパスワードを入力してください', 400);
    }

    // ユーザー取得
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND status = ?'
    ).bind(email, 'active').first();

    if (!user) {
      return errorResponse('メールアドレスまたはパスワードが正しくありません', 401);
    }

    // パスワード検証
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return errorResponse('メールアドレスまたはパスワードが正しくありません', 401);
    }

    // JWTトークン生成
    const token = await generateJWT(
      { 
        userId: user.id, 
        email: user.email, 
        firstName: user.first_name,
        lastName: user.last_name,
        type: 'user' 
      },
      env.JWT_SECRET || 'smartpolice-jwt-secret-2026',
      7 * 24 * 60 * 60 // 7日間有効
    );

    // ログイン時刻更新
    await env.DB.prepare(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();

    // セッション保存
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare(`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, token, expiresAt).run();

    return successResponse({
      message: 'ログインしました',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        company: user.company,
        postalCode: user.postal_code,
        prefecture: user.prefecture,
        address: user.address,
        building: user.building
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('ログインに失敗しました', 500);
  }
}

/**
 * 現在のユーザー情報取得
 * GET /api/auth/me
 */
export async function getCurrentUser(request, env) {
  try {
    const token = extractToken(request);
    if (!token) {
      return errorResponse('認証が必要です', 401);
    }

    // トークン検証
    const payload = await verifyJWT(token, env.JWT_SECRET || 'smartpolice-jwt-secret-2026');
    if (!payload || payload.type !== 'user') {
      return errorResponse('無効なトークンです', 401);
    }

    // セッション確認
    const session = await env.DB.prepare(
      'SELECT * FROM user_sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first();

    if (!session) {
      return errorResponse('セッションが無効です', 401);
    }

    // ユーザー情報取得
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND status = ?'
    ).bind(payload.userId, 'active').first();

    if (!user) {
      return errorResponse('ユーザーが見つかりません', 404);
    }

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        company: user.company,
        postalCode: user.postal_code,
        prefecture: user.prefecture,
        address: user.address,
        building: user.building,
        emailVerified: user.email_verified === 1,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse('ユーザー情報の取得に失敗しました', 500);
  }
}

/**
 * ログアウト
 * POST /api/auth/logout
 */
export async function logoutUser(request, env) {
  try {
    const token = extractToken(request);
    if (!token) {
      return successResponse({ message: 'ログアウトしました' });
    }

    // セッション削除
    await env.DB.prepare(
      'DELETE FROM user_sessions WHERE token = ?'
    ).bind(token).run();

    return successResponse({ message: 'ログアウトしました' });
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('ログアウトに失敗しました', 500);
  }
}

/**
 * 認証ミドルウェア（他のAPIで使用）
 */
export async function requireAuth(request, env) {
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  const payload = await verifyJWT(token, env.JWT_SECRET || 'smartpolice-jwt-secret-2026');
  if (!payload || payload.type !== 'user') {
    return null;
  }

  // セッション確認
  const session = await env.DB.prepare(
    'SELECT * FROM user_sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();

  if (!session) {
    return null;
  }

  return payload;
}
