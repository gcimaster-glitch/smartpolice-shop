/**
 * サービス申込みAPI
 * /api/services/* のエンドポイント処理
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { requireAuth } from './auth.js';
import { requireAdmin } from '../utils/auth.js';
import { sanitizeRequestBody } from '../utils/sanitize.js';

/**
 * サービス一覧を取得
 * GET /api/services
 */
export async function getServices(request, env) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const isActive = url.searchParams.get('is_active');

    let query = 'SELECT * FROM services WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (isActive !== null) {
      query += ' AND is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    query += ' ORDER BY display_order ASC, id ASC';

    const services = await env.DB.prepare(query).bind(...params).all();

    return successResponse({
      services: services.results || []
    });
  } catch (error) {
    console.error('Get services error:', error);
    return errorResponse('サービス一覧の取得に失敗しました', 500);
  }
}

/**
 * サービス詳細を取得
 * GET /api/services/:id
 */
export async function getServiceById(serviceId, env) {
  try {
    const service = await env.DB.prepare(
      'SELECT * FROM services WHERE id = ?'
    ).bind(serviceId).first();

    if (!service) {
      return errorResponse('サービスが見つかりません', 404);
    }

    return successResponse({ service });
  } catch (error) {
    console.error('Get service error:', error);
    return errorResponse('サービスの取得に失敗しました', 500);
  }
}

/**
 * サービス申込みを作成
 * POST /api/services/apply
 */
export async function createServiceApplication(request, env) {
  try {
    const body = await request.json();

    // 認証チェック（オプション：未ログインでも申込み可能）
    const authUser = await requireAuth(request, env);
    const userId = authUser ? authUser.userId : null;

    // 入力サニタイズ
    const sanitized = sanitizeRequestBody(body, {
      service_id: { type: 'integer', required: true, min: 1 },
      company_name: { type: 'text', maxLength: 100, required: true },
      contact_name: { type: 'text', maxLength: 100, required: true },
      contact_email: { type: 'email', required: true },
      contact_phone: { type: 'phone', required: true },
      address: { type: 'text', maxLength: 200 },
      employee_count: { type: 'text', maxLength: 50 },
      message: { type: 'text', maxLength: 1000 }
    });

    const {
      service_id,
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      address = '',
      employee_count = '',
      message = ''
    } = sanitized;

    // サービス存在確認
    const service = await env.DB.prepare(
      'SELECT * FROM services WHERE id = ? AND is_active = 1'
    ).bind(service_id).first();

    if (!service) {
      return errorResponse('指定されたサービスが見つかりません', 404);
    }

    // 申込みを保存
    const result = await env.DB.prepare(`
      INSERT INTO service_applications (
        service_id, user_id, company_name, contact_name, contact_email,
        contact_phone, address, employee_count, message, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      service_id, userId, company_name, contact_name, contact_email,
      contact_phone, address, employee_count, message, 'pending'
    ).run();

    const applicationId = result.meta.last_row_id;

    // 申込み確認メールを送信（非同期・エラーは無視）
    try {
      await sendServiceApplicationEmail({
        to: contact_email,
        contactName: contact_name,
        companyName: company_name,
        serviceName: service.name,
        message
      }, env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    return successResponse({
      message: 'サービスの申込みが完了しました。担当者より3営業日以内にご連絡いたします。',
      application: {
        id: applicationId,
        serviceName: service.name,
        companyName: company_name,
        contactName: contact_name,
        contactEmail: contact_email
      }
    });
  } catch (error) {
    console.error('Create service application error:', error);
    return errorResponse('サービス申込みに失敗しました', 500);
  }
}

/**
 * ユーザーのサービス申込み履歴を取得
 * GET /api/services/applications/user/:userId
 */
export async function getUserServiceApplications(userId, env) {
  try {
    const applications = await env.DB.prepare(`
      SELECT 
        sa.*,
        s.name as service_name,
        s.category as service_category
      FROM service_applications sa
      JOIN services s ON sa.service_id = s.id
      WHERE sa.user_id = ?
      ORDER BY sa.created_at DESC
    `).bind(userId).all();

    return successResponse({
      applications: applications.results || []
    });
  } catch (error) {
    console.error('Get user service applications error:', error);
    return errorResponse('申込み履歴の取得に失敗しました', 500);
  }
}

/**
 * 全サービス申込みを取得（管理者用）
 * GET /api/admin/services/applications
 */
export async function getAllServiceApplications(request, env) {
  try {
    const admin = requireAdmin(request);
    if (!admin) {
      return errorResponse('認証が必要です', 401);
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let query = `
      SELECT 
        sa.*,
        s.name as service_name,
        s.category as service_category
      FROM service_applications sa
      JOIN services s ON sa.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND sa.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sa.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const applications = await env.DB.prepare(query).bind(...params).all();

    return successResponse({
      applications: applications.results || [],
      pagination: {
        limit,
        offset,
        total: applications.results ? applications.results.length : 0
      }
    });
  } catch (error) {
    console.error('Get all service applications error:', error);
    return errorResponse('申込み一覧の取得に失敗しました', 500);
  }
}

/**
 * サービス申込みステータスを更新（管理者用）
 * PUT /api/admin/services/applications/:id
 */
export async function updateServiceApplicationStatus(applicationId, request, env) {
  try {
    const admin = requireAdmin(request);
    if (!admin) {
      return errorResponse('認証が必要です', 401);
    }

    const body = await request.json();
    const { status, admin_notes } = body;

    // ステータスバリデーション
    const validStatuses = ['pending', 'contacted', 'in_progress', 'accepted', 'rejected', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse('無効なステータスです', 400);
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(admin_notes);
    }

    if (updates.length === 0) {
      return errorResponse('更新する内容がありません', 400);
    }

    params.push(applicationId);

    await env.DB.prepare(`
      UPDATE service_applications SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return successResponse({ message: '申込み情報を更新しました' });
  } catch (error) {
    console.error('Update service application error:', error);
    return errorResponse('申込みの更新に失敗しました', 500);
  }
}

/**
 * サービス申込み確認メールを送信
 */
async function sendServiceApplicationEmail({
  to,
  contactName,
  companyName,
  serviceName,
  message
}, resendApiKey, fromEmail) {
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Noto Sans JP', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🛡️ スマートポリス</h1>
    <p style="margin: 10px 0 0 0; font-size: 14px;">サービス申込み受付完了</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
    <p>${contactName} 様</p>
    
    <p>この度は、スマートポリスのサービスにお申し込みいただき、誠にありがとうございます。<br>
    お申し込み内容を確認いたしました。</p>
    
    <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h2 style="margin-top: 0; color: #155724; font-size: 18px;">✅ 申込み受付完了</h2>
      <p style="margin: 5px 0;"><strong>申込みサービス:</strong> ${serviceName}</p>
      <p style="margin: 5px 0;"><strong>会社名:</strong> ${companyName}</p>
      <p style="margin: 5px 0;"><strong>担当者:</strong> ${contactName}</p>
    </div>
    
    ${message ? `
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; font-size: 16px;">📝 ご要望内容</h3>
      <p style="margin: 0; white-space: pre-line;">${message}</p>
    </div>
    ` : ''}
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>📌 今後の流れ</strong><br>
      1. 担当者がお申し込み内容を確認いたします<br>
      2. 3営業日以内に詳細のご連絡をいたします<br>
      3. 訪問またはオンラインでのヒアリング実施<br>
      4. お見積もりのご提示</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #666;">
      ご不明な点がございましたら、お気軽にお問い合わせください。<br>
      今後とも、スマートポリスをよろしくお願いいたします。
    </p>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>スマートポリス</strong></p>
      <p style="margin: 5px 0; font-size: 12px; color: #999;">Email: ${fromEmail}</p>
      <p style="margin: 5px 0; font-size: 12px; color: #999;">Website: https://shop.smartpolice.net</p>
    </div>
  </div>
</body>
</html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `スマートポリス <${fromEmail}>`,
      to: [to],
      subject: `【スマートポリス】サービス申込み受付完了 - ${serviceName}`,
      html: htmlContent
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Resend API Error: ${error.message || 'Unknown error'}`);
  }

  return await response.json();
}
