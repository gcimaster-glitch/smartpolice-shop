/**
 * 注文API ルート - 完全版（D1連携・配送日時・メール送信対応）
 * /api/orders/* のエンドポイント処理
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { requireAdmin } from '../utils/auth.js';
import { requireAuth } from './auth.js';
import { sendOrderConfirmationEmail } from '../services/resend.js';
import { sanitizeRequestBody, sanitizeText, sanitizeEmail, sanitizePhone } from '../utils/sanitize.js';

/**
 * 注文番号を生成
 */
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SP${year}${month}${day}${random}`;
}

/**
 * 送料を計算
 */
function calculateShippingFee(subtotal) {
  return subtotal >= 10000 ? 0 : 800; // 10,000円以上で送料無料
}

/**
 * 注文を作成
 * POST /api/orders
 */
export async function createOrder(request, env) {
  try {
    const body = await request.json();
    
    // 認証チェック（オプション：未ログインでも注文可能）
    const authUser = await requireAuth(request, env);
    const userId = authUser ? authUser.userId : null;

    // 入力サニタイズ
    const sanitized = sanitizeRequestBody(body, {
      customer_name: { type: 'text', maxLength: 100, required: true },
      customer_email: { type: 'email', required: true },
      customer_phone: { type: 'phone' },
      shipping_address: { type: 'text', maxLength: 200, required: true },
      shipping_postal_code: { type: 'text', maxLength: 10 },
      delivery_date: { type: 'text', maxLength: 20 },
      delivery_time: { type: 'text', maxLength: 50 },
      notes: { type: 'text', maxLength: 500 }
    });

    const {
      customer_name,
      customer_email,
      customer_phone = '',
      shipping_address,
      shipping_postal_code = '',
      delivery_date = null,
      delivery_time = null,
      notes = '',
      items
    } = body;

    // 商品アイテムのバリデーション
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse('商品が選択されていません', 400);
    }

    // 商品の合計金額を計算
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await env.DB.prepare(
        'SELECT * FROM products WHERE id = ?'
      ).bind(item.product_id || item.id).first();

      if (!product) {
        return errorResponse(`商品ID ${item.product_id || item.id} が見つかりません`, 400);
      }

      if (product.stock_status !== 'in_stock') {
        return errorResponse(`${product.name} は在庫切れです`, 400);
      }

      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        return errorResponse('数量は1以上である必要があります', 400);
      }

      const itemSubtotal = product.price * quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        subtotal: itemSubtotal
      });
    }

    // 送料計算
    const shippingFee = calculateShippingFee(subtotal);
    const totalAmount = subtotal + shippingFee;

    // 注文番号を生成
    const orderNumber = generateOrderNumber();

    // トランザクション開始（D1ではBATCH APIを使用）
    const statements = [];

    // 注文を保存
    statements.push(
      env.DB.prepare(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          shipping_address, shipping_postal_code,
          subtotal, shipping_fee, total_amount,
          delivery_date, delivery_time, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderNumber, userId, customer_name, customer_email, customer_phone,
        shipping_address, shipping_postal_code,
        subtotal, shippingFee, totalAmount,
        delivery_date, delivery_time, notes, 'pending'
      )
    );

    // 注文明細を保存
    for (const item of orderItems) {
      statements.push(
        env.DB.prepare(`
          INSERT INTO order_items (
            order_id, product_id, product_name, quantity, unit_price, subtotal
          ) VALUES (
            (SELECT id FROM orders WHERE order_number = ?),
            ?, ?, ?, ?, ?
          )
        `).bind(
          orderNumber,
          item.product_id, item.product_name,
          item.quantity, item.unit_price, item.subtotal
        )
      );
    }

    // バッチ実行
    await env.DB.batch(statements);

    // 注文IDを取得
    const orderResult = await env.DB.prepare(
      'SELECT id FROM orders WHERE order_number = ?'
    ).bind(orderNumber).first();

    const orderId = orderResult.id;

    // 注文確認メールを送信（非同期・エラーは無視）
    try {
      await sendOrderConfirmationEmail({
        to: customer_email,
        customerName: customer_name,
        orderNumber,
        items: orderItems,
        subtotal,
        shippingFee,
        total: totalAmount,
        deliveryDate: delivery_date,
        deliveryTime: delivery_time,
        shippingAddress: shipping_address
      }, env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // メール送信失敗してもエラーにしない
    }

    return successResponse({
      message: '注文が完了しました',
      order: {
        id: orderId,
        orderNumber,
        customerName: customer_name,
        customerEmail: customer_email,
        subtotal,
        shippingFee,
        total: totalAmount,
        deliveryDate: delivery_date,
        deliveryTime: delivery_time,
        items: orderItems
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    return errorResponse('注文の作成に失敗しました', 500);
  }
}

/**
 * 注文詳細を取得（注文番号）
 * GET /api/orders/:orderNumber
 */
export async function getOrderByNumber(orderNumber, env) {
  try {
    const order = await env.DB.prepare(`
      SELECT * FROM orders WHERE order_number = ?
    `).bind(orderNumber).first();

    if (!order) {
      return errorResponse('注文が見つかりません', 404);
    }

    // 注文明細を取得
    const items = await env.DB.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).bind(order.id).all();

    return successResponse({
      order: {
        ...order,
        items: items.results || []
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    return errorResponse('注文の取得に失敗しました', 500);
  }
}

/**
 * ユーザーの注文履歴を取得
 * GET /api/orders/user/:userId
 */
export async function getUserOrders(userId, env) {
  try {
    const orders = await env.DB.prepare(`
      SELECT * FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all();

    return successResponse({
      orders: orders.results || []
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    return errorResponse('注文履歴の取得に失敗しました', 500);
  }
}

/**
 * 全注文を取得（管理者用）
 * GET /api/admin/orders
 */
export async function getAllOrders(request, env) {
  try {
    const admin = requireAdmin(request);
    if (!admin) {
      return errorResponse('認証が必要です', 401);
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let query = 'SELECT * FROM orders';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const orders = await env.DB.prepare(query).bind(...params).all();

    return successResponse({
      orders: orders.results || [],
      pagination: {
        limit,
        offset,
        total: orders.results ? orders.results.length : 0
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    return errorResponse('注文一覧の取得に失敗しました', 500);
  }
}

/**
 * 注文ステータスを更新（管理者用）
 * PUT /api/admin/orders/:id
 */
export async function updateOrderStatus(orderId, request, env) {
  try {
    const admin = requireAdmin(request);
    if (!admin) {
      return errorResponse('認証が必要です', 401);
    }

    const body = await request.json();
    const { status, tracking_number, alibaba_order_id, notes } = body;

    // ステータスバリデーション
    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse('無効なステータスです', 400);
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (tracking_number) {
      updates.push('tracking_number = ?');
      params.push(tracking_number);
    }
    if (alibaba_order_id) {
      updates.push('alibaba_order_id = ?');
      params.push(alibaba_order_id);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return errorResponse('更新する内容がありません', 400);
    }

    params.push(orderId);

    await env.DB.prepare(`
      UPDATE orders SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return successResponse({ message: '注文情報を更新しました' });
  } catch (error) {
    console.error('Update order error:', error);
    return errorResponse('注文の更新に失敗しました', 500);
  }
}
