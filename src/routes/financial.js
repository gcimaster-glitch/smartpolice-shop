/**
 * 財務管理API
 * 見積書、請求書、領収書、継続課金、決済管理
 */

import { successResponse, errorResponse } from '../utils/response.js';

/**
 * 見積番号生成
 */
function generateQuoteNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `Q${year}${month}${random}`;
}

/**
 * 請求書番号生成
 */
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV${year}${month}${random}`;
}

/**
 * 領収書番号生成
 */
function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `R${year}${month}${random}`;
}

/**
 * 継続課金番号生成
 */
function generateSubscriptionNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SUB${year}${month}${random}`;
}

// ==================== 見積書API ====================

/**
 * 見積書作成
 * POST /api/admin/quotes
 */
export async function createQuote(request, env) {
  try {
    const data = await request.json();
    const {
      customer_id,
      customer_name,
      customer_email,
      customer_company,
      customer_phone,
      customer_address,
      items,
      subtotal,
      tax_rate = 10.0,
      valid_until,
      notes,
      terms
    } = data;

    if (!customer_name || !customer_email || !items || !subtotal) {
      return errorResponse('必須項目が不足しています', 400);
    }

    const quote_number = generateQuoteNumber();
    const tax_amount = Math.floor(subtotal * (tax_rate / 100));
    const total_amount = subtotal + tax_amount;

    const result = await env.DB.prepare(`
      INSERT INTO quotes (
        quote_number, customer_id, customer_name, customer_email,
        customer_company, customer_phone, customer_address,
        items, subtotal, tax_rate, tax_amount, total_amount,
        valid_until, notes, terms, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).bind(
      quote_number, customer_id, customer_name, customer_email,
      customer_company, customer_phone, customer_address,
      JSON.stringify(items), subtotal, tax_rate, tax_amount, total_amount,
      valid_until, notes, terms
    ).run();

    return successResponse({
      message: '見積書を作成しました',
      quote_id: result.meta.last_row_id,
      quote_number
    });

  } catch (error) {
    console.error('Create quote error:', error);
    return errorResponse('見積書の作成に失敗しました', 500, error.message);
  }
}

/**
 * 見積書一覧取得
 * GET /api/admin/quotes
 */
export async function getQuotes(env, status = null) {
  try {
    let query = 'SELECT * FROM quotes';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await env.DB.prepare(query).bind(...params).all();

    return successResponse({
      quotes: result.results || []
    });

  } catch (error) {
    console.error('Get quotes error:', error);
    return errorResponse('見積書の取得に失敗しました', 500, error.message);
  }
}

/**
 * 見積書詳細取得
 * GET /api/admin/quotes/:id
 */
export async function getQuoteById(quoteId, env) {
  try {
    const quote = await env.DB.prepare(`
      SELECT * FROM quotes WHERE id = ?
    `).bind(quoteId).first();

    if (!quote) {
      return errorResponse('見積書が見つかりません', 404);
    }

    return successResponse({ quote });

  } catch (error) {
    console.error('Get quote error:', error);
    return errorResponse('見積書の取得に失敗しました', 500, error.message);
  }
}

/**
 * 見積書ステータス更新
 * PUT /api/admin/quotes/:id/status
 */
export async function updateQuoteStatus(quoteId, request, env) {
  try {
    const { status } = await request.json();

    if (!['draft', 'sent', 'accepted', 'rejected', 'expired'].includes(status)) {
      return errorResponse('無効なステータスです', 400);
    }

    await env.DB.prepare(`
      UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(status, quoteId).run();

    return successResponse({ message: 'ステータスを更新しました' });

  } catch (error) {
    console.error('Update quote status error:', error);
    return errorResponse('ステータスの更新に失敗しました', 500, error.message);
  }
}

/**
 * 見積→注文変換
 * POST /api/admin/quotes/:id/convert
 */
export async function convertQuoteToOrder(quoteId, env) {
  try {
    const quote = await env.DB.prepare(`
      SELECT * FROM quotes WHERE id = ? AND status = 'accepted'
    `).bind(quoteId).first();

    if (!quote) {
      return errorResponse('承認済みの見積書が見つかりません', 404);
    }

    // 注文番号生成
    const orderNumber = `SP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 注文作成
    const orderResult = await env.DB.prepare(`
      INSERT INTO orders (
        order_number, customer_name, customer_email, customer_phone,
        customer_address, subtotal_amount, tax_amount, total_amount,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      orderNumber, quote.customer_name, quote.customer_email,
      quote.customer_phone, quote.customer_address,
      quote.subtotal, quote.tax_amount, quote.total_amount
    ).run();

    const orderId = orderResult.meta.last_row_id;

    // 見積書に注文IDを記録
    await env.DB.prepare(`
      UPDATE quotes 
      SET converted_to_order = ?, converted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(orderId, quoteId).run();

    return successResponse({
      message: '見積書を注文に変換しました',
      order_id: orderId,
      order_number: orderNumber
    });

  } catch (error) {
    console.error('Convert quote to order error:', error);
    return errorResponse('注文への変換に失敗しました', 500, error.message);
  }
}

// ==================== 請求書API ====================

/**
 * 請求書作成
 * POST /api/admin/invoices
 */
export async function createInvoice(request, env) {
  try {
    const data = await request.json();
    const {
      order_id,
      subscription_id,
      customer_id,
      customer_name,
      customer_email,
      customer_company,
      customer_address,
      items,
      subtotal,
      tax_rate = 10.0,
      payment_due_date,
      issue_date,
      billing_period_start,
      billing_period_end,
      notes
    } = data;

    if (!customer_name || !customer_email || !items || !subtotal) {
      return errorResponse('必須項目が不足しています', 400);
    }

    const invoice_number = generateInvoiceNumber();
    const tax_amount = Math.floor(subtotal * (tax_rate / 100));
    const total_amount = subtotal + tax_amount;

    const result = await env.DB.prepare(`
      INSERT INTO invoices (
        invoice_number, order_id, subscription_id, customer_id,
        customer_name, customer_email, customer_company, customer_address,
        items, subtotal, tax_rate, tax_amount, total_amount,
        payment_due_date, issue_date, billing_period_start, billing_period_end,
        notes, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      invoice_number, order_id, subscription_id, customer_id,
      customer_name, customer_email, customer_company, customer_address,
      JSON.stringify(items), subtotal, tax_rate, tax_amount, total_amount,
      payment_due_date, issue_date || new Date().toISOString().split('T')[0],
      billing_period_start, billing_period_end, notes
    ).run();

    return successResponse({
      message: '請求書を作成しました',
      invoice_id: result.meta.last_row_id,
      invoice_number
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    return errorResponse('請求書の作成に失敗しました', 500, error.message);
  }
}

/**
 * 請求書一覧取得
 * GET /api/admin/invoices
 */
export async function getInvoices(env, payment_status = null) {
  try {
    let query = 'SELECT * FROM invoices';
    const params = [];

    if (payment_status) {
      query += ' WHERE payment_status = ?';
      params.push(payment_status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await env.DB.prepare(query).bind(...params).all();

    return successResponse({
      invoices: result.results || []
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    return errorResponse('請求書の取得に失敗しました', 500, error.message);
  }
}

/**
 * 請求書支払い処理
 * POST /api/admin/invoices/:id/pay
 */
export async function payInvoice(invoiceId, request, env) {
  try {
    const { payment_method, paid_amount } = await request.json();

    await env.DB.prepare(`
      UPDATE invoices 
      SET payment_status = 'paid',
          payment_method = ?,
          paid_amount = ?,
          paid_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(payment_method, paid_amount, invoiceId).run();

    // 領収書自動作成
    const invoice = await env.DB.prepare(`
      SELECT * FROM invoices WHERE id = ?
    `).bind(invoiceId).first();

    if (invoice) {
      const receipt_number = generateReceiptNumber();
      await env.DB.prepare(`
        INSERT INTO receipts (
          receipt_number, invoice_id, order_id, customer_name,
          customer_company, amount, payment_method, issue_date,
          received_date, purpose
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '品代として')
      `).bind(
        receipt_number, invoiceId, invoice.order_id, invoice.customer_name,
        invoice.customer_company, paid_amount, payment_method,
        new Date().toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ).run();
    }

    return successResponse({ message: '支払いを記録しました' });

  } catch (error) {
    console.error('Pay invoice error:', error);
    return errorResponse('支払いの記録に失敗しました', 500, error.message);
  }
}

// ==================== 領収書API ====================

/**
 * 領収書一覧取得
 * GET /api/admin/receipts
 */
export async function getReceipts(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM receipts ORDER BY created_at DESC
    `).all();

    return successResponse({
      receipts: result.results || []
    });

  } catch (error) {
    console.error('Get receipts error:', error);
    return errorResponse('領収書の取得に失敗しました', 500, error.message);
  }
}

// ==================== 継続課金API ====================

/**
 * 継続課金作成
 * POST /api/admin/subscriptions
 */
export async function createSubscription(request, env) {
  try {
    const data = await request.json();
    const {
      customer_id,
      product_id,
      service_id,
      product_name,
      product_description,
      amount,
      billing_cycle,
      billing_day = 1,
      start_date,
      payment_method
    } = data;

    if (!customer_id || !product_name || !amount || !billing_cycle) {
      return errorResponse('必須項目が不足しています', 400);
    }

    const subscription_number = generateSubscriptionNumber();
    
    // 次回請求日計算
    const startDate = new Date(start_date || Date.now());
    const nextBillingDate = new Date(startDate);
    nextBillingDate.setDate(billing_day);
    if (nextBillingDate <= startDate) {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    const result = await env.DB.prepare(`
      INSERT INTO subscriptions (
        subscription_number, customer_id, product_id, service_id,
        product_name, product_description, amount, billing_cycle,
        billing_day, start_date, next_billing_date, payment_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      subscription_number, customer_id, product_id, service_id,
      product_name, product_description, amount, billing_cycle,
      billing_day, startDate.toISOString().split('T')[0],
      nextBillingDate.toISOString().split('T')[0], payment_method
    ).run();

    return successResponse({
      message: '継続課金を作成しました',
      subscription_id: result.meta.last_row_id,
      subscription_number
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    return errorResponse('継続課金の作成に失敗しました', 500, error.message);
  }
}

/**
 * 継続課金一覧取得
 * GET /api/admin/subscriptions
 */
export async function getSubscriptions(env, status = null) {
  try {
    let query = `
      SELECT s.*, u.email as customer_email
      FROM subscriptions s
      LEFT JOIN users u ON s.customer_id = u.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE s.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await env.DB.prepare(query).bind(...params).all();

    return successResponse({
      subscriptions: result.results || []
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    return errorResponse('継続課金の取得に失敗しました', 500, error.message);
  }
}

/**
 * 継続課金ステータス更新
 * PUT /api/admin/subscriptions/:id/status
 */
export async function updateSubscriptionStatus(subscriptionId, request, env) {
  try {
    const { status } = await request.json();

    if (!['active', 'paused', 'cancelled', 'expired'].includes(status)) {
      return errorResponse('無効なステータスです', 400);
    }

    const updateData = {
      status,
      updated_at: 'CURRENT_TIMESTAMP'
    };

    if (status === 'cancelled') {
      updateData.cancelled_at = 'CURRENT_TIMESTAMP';
    }

    await env.DB.prepare(`
      UPDATE subscriptions 
      SET status = ?, 
          ${status === 'cancelled' ? 'cancelled_at = CURRENT_TIMESTAMP,' : ''}
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, subscriptionId).run();

    return successResponse({ message: 'ステータスを更新しました' });

  } catch (error) {
    console.error('Update subscription status error:', error);
    return errorResponse('ステータスの更新に失敗しました', 500, error.message);
  }
}

// ==================== 決済履歴API ====================

/**
 * 決済履歴一覧取得
 * GET /api/admin/payment-transactions
 */
export async function getPaymentTransactions(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT pt.*, u.email as customer_email
      FROM payment_transactions pt
      LEFT JOIN users u ON pt.customer_id = u.id
      ORDER BY pt.created_at DESC
    `).all();

    return successResponse({
      transactions: result.results || []
    });

  } catch (error) {
    console.error('Get payment transactions error:', error);
    return errorResponse('決済履歴の取得に失敗しました', 500, error.message);
  }
}
