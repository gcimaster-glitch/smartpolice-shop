/**
 * 注文API ルート
 * /api/orders/* のエンドポイント処理
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { validateOrder } from '../utils/validator.js';
import { requireAdmin } from '../utils/auth.js';
import { sendOrderConfirmationEmail } from '../services/resend.js';

/**
 * 注文番号を生成
 */
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SP-${timestamp}-${random}`;
}

/**
 * 注文を作成
 * POST /api/orders
 */
export async function createOrder(request, env) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validation = validateOrder(body);
    if (!validation.valid) {
      return errorResponse('入力内容に誤りがあります', 400, validation.errors);
    }

    const {
      customer_name,
      customer_email,
      customer_phone = '',
      shipping_address,
      shipping_postal_code = '',
      items,
      notes = ''
    } = body;

    // 商品の合計金額を計算
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const { results } = await env.DB.prepare(
        'SELECT * FROM products WHERE id = ? AND stock_status = ?'
      ).bind(item.product_id, 'in_stock').all();

      if (results.length === 0) {
        return errorResponse(`商品ID ${item.product_id} は在庫切れまたは存在しません`, 400);
      }

      const product = results[0];
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal
      });
    }

    // 注文番号を生成
    const orderNumber = generateOrderNumber();

    // 注文を保存
    const orderResult = await env.DB.prepare(`
      INSERT INTO orders (
        order_number, customer_name, customer_email, customer_phone,
        shipping_address, shipping_postal_code, total_amount, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderNumber, customer_name, customer_email, customer_phone,
      shipping_address, shipping_postal_code, totalAmount, notes, 'pending'
    ).run();

    const orderId = orderResult.meta.last_row_id;

    // 注文明細を保存
    for (const item of orderItems) {
      await env.DB.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, quantity, unit_price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        orderId, item.product_id, item.product_name,
        item.quantity, item.unit_price, item.subtotal
      ).run();
    }

    // 注文確認メールを送信（非同期）
    try {
      await sendOrderConfirmationEmail({
        to: customer_email,
        customerName: customer_name,
        orderNumber,
        items: orderItems,
        totalAmount,
        shippingAddress: shipping_address
      }, env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // メール送信失敗は注文作成を妨げない
    }

    return successResponse({
      message: '注文を受け付けました',
      orderNumber,
      orderId,
      totalAmount
    }, 201);
  } catch (error) {
    console.error('Create order error:', error);
    return errorResponse('注文の作成に失敗しました', 500);
  }
}

/**
 * 注文詳細を取得
 * GET /api/orders/:orderNumber
 */
export async function getOrderByNumber(orderNumber, env) {
  try {
    const { results: orders } = await env.DB.prepare(
      'SELECT * FROM orders WHERE order_number = ?'
    ).bind(orderNumber).all();

    if (orders.length === 0) {
      return errorResponse('注文が見つかりません', 404);
    }

    const order = orders[0];

    // 注文明細を取得
    const { results: items } = await env.DB.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).bind(order.id).all();

    return successResponse({
      order,
      items
    });
  } catch (error) {
    console.error('Get order error:', error);
    return errorResponse('注文の取得に失敗しました', 500);
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
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM orders';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    return successResponse({
      orders: results,
      total: results.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    return errorResponse('注文一覧の取得に失敗しました', 500);
  }
}

/**
 * 注文ステータスを更新（管理者用）
 * PUT /api/admin/orders/:orderId
 */
export async function updateOrderStatus(orderId, request, env) {
  try {
    const admin = requireAdmin(request);
    if (!admin) {
      return errorResponse('認証が必要です', 401);
    }

    const body = await request.json();
    const { status, tracking_number, alibaba_order_id } = body;

    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse('無効なステータスです', 400);
    }

    // 注文を更新
    await env.DB.prepare(`
      UPDATE orders SET
        status = COALESCE(?, status),
        tracking_number = COALESCE(?, tracking_number),
        alibaba_order_id = COALESCE(?, alibaba_order_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, tracking_number, alibaba_order_id, orderId).run();

    return successResponse({ message: '注文を更新しました' });
  } catch (error) {
    console.error('Update order error:', error);
    return errorResponse('注文の更新に失敗しました', 500);
  }
}
