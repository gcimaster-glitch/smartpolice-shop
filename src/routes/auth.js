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
 * ユーザー情報更新
 * PUT /api/users/:id
 */
export async function updateUser(request, env) {
  try {
    // 認証チェック
    const currentUser = await requireAuth(request, env);
    if (!currentUser) {
      return errorResponse('認証が必要です', 401);
    }

    const url = new URL(request.url);
    const userId = parseInt(url.pathname.split('/').pop());

    // 自分のプロフィールのみ編集可能
    if (currentUser.userId !== userId) {
      return errorResponse('他のユーザーのプロフィールは編集できません', 403);
    }

    const body = await request.json();
    
    // 入力サニタイズ
    const sanitized = sanitizeRequestBody(body, {
      firstName: { type: 'text', maxLength: 50 },
      lastName: { type: 'text', maxLength: 50 },
      phone: { type: 'phone' },
      company: { type: 'text', maxLength: 100 },
      postalCode: { type: 'text', maxLength: 10 },
      prefecture: { type: 'text', maxLength: 20 },
      address: { type: 'text', maxLength: 200 },
      building: { type: 'text', maxLength: 100 }
    });

    // 更新するフィールドを動的に構築
    const updates = [];
    const values = [];
    
    if (sanitized.firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(sanitized.firstName);
    }
    if (sanitized.lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(sanitized.lastName);
    }
    if (sanitized.phone !== undefined) {
      updates.push('phone = ?');
      values.push(sanitized.phone || null);
    }
    if (sanitized.company !== undefined) {
      updates.push('company = ?');
      values.push(sanitized.company || null);
    }
    if (sanitized.postalCode !== undefined) {
      updates.push('postal_code = ?');
      values.push(sanitized.postalCode || null);
    }
    if (sanitized.prefecture !== undefined) {
      updates.push('prefecture = ?');
      values.push(sanitized.prefecture || null);
    }
    if (sanitized.address !== undefined) {
      updates.push('address = ?');
      values.push(sanitized.address || null);
    }
    if (sanitized.building !== undefined) {
      updates.push('building = ?');
      values.push(sanitized.building || null);
    }

    if (updates.length === 0) {
      return errorResponse('更新する項目がありません', 400);
    }

    // updated_atを追加
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    // SQL実行
    await env.DB.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    // 更新後のユーザー情報取得
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    return successResponse({
      message: 'プロフィールを更新しました',
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
    console.error('Update user error:', error);
    return errorResponse('プロフィールの更新に失敗しました', 500);
  }
}

/**
 * パスワード変更
 * PUT /api/users/:id/password
 */
export async function updatePassword(request, env) {
  try {
    // 認証チェック
    const currentUser = await requireAuth(request, env);
    if (!currentUser) {
      return errorResponse('認証が必要です', 401);
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = parseInt(pathParts[pathParts.length - 2]);

    // 自分のパスワードのみ変更可能
    if (currentUser.userId !== userId) {
      return errorResponse('他のユーザーのパスワードは変更できません', 403);
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return errorResponse('すべての項目を入力してください', 400);
    }

    if (newPassword !== confirmPassword) {
      return errorResponse('新しいパスワードが一致しません', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse('新しいパスワードは8文字以上にしてください', 400);
    }

    // 現在のユーザー情報取得
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return errorResponse('ユーザーが見つかりません', 404);
    }

    // 現在のパスワード検証
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return errorResponse('現在のパスワードが正しくありません', 401);
    }

    // 新しいパスワードをハッシュ化
    const newPasswordHash = await hashPassword(newPassword);

    // パスワード更新
    await env.DB.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newPasswordHash, userId).run();

    // 既存セッションを全て削除（再ログイン必須）
    await env.DB.prepare(
      'DELETE FROM user_sessions WHERE user_id = ?'
    ).bind(userId).run();

    return successResponse({
      message: 'パスワードを変更しました。再度ログインしてください。'
    });
  } catch (error) {
    console.error('Update password error:', error);
    return errorResponse('パスワードの変更に失敗しました', 500);
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
