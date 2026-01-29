/**
 * ダッシュボードAPI
 * 管理画面用の統計情報・KPI・売上データ取得
 */

import { successResponse, errorResponse } from '../utils/response.js';

/**
 * ダッシュボード統計情報取得
 * GET /api/admin/dashboard/stats
 */
export async function getDashboardStats(env) {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    // 前月の開始日・終了日
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const lastMonthEnd = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}-01`;

    // 今日の売上
    const todaySales = await env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders 
      WHERE DATE(created_at) = ? AND status != 'cancelled'
    `).bind(today).first();

    // 今月の売上
    const thisMonthSales = await env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders 
      WHERE created_at >= ? AND status != 'cancelled'
    `).bind(thisMonthStart).first();

    // 前月の売上
    const lastMonthSales = await env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders 
      WHERE created_at >= ? AND created_at < ? AND status != 'cancelled'
    `).bind(lastMonthStart, lastMonthEnd).first();

    // 今日の注文数
    const todayOrders = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM orders 
      WHERE DATE(created_at) = ?
    `).bind(today).first();

    // 今月の注文数
    const thisMonthOrders = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM orders 
      WHERE created_at >= ?
    `).bind(thisMonthStart).first();

    // 前月の注文数
    const lastMonthOrders = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM orders 
      WHERE created_at >= ? AND created_at < ?
    `).bind(lastMonthStart, lastMonthEnd).first();

    // 総ユーザー数
    const totalUsers = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM users WHERE status = 'active'
    `).first();

    // 今月の新規ユーザー数
    const thisMonthUsers = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE created_at >= ? AND status = 'active'
    `).bind(thisMonthStart).first();

    // 前月の新規ユーザー数
    const lastMonthUsers = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE created_at >= ? AND created_at < ? AND status = 'active'
    `).bind(lastMonthStart, lastMonthEnd).first();

    // サービス申込み数（今月）
    const thisMonthApplications = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM service_applications 
      WHERE created_at >= ?
    `).bind(thisMonthStart).first();

    // 前月比の計算
    const salesGrowth = lastMonthSales.total > 0 
      ? ((thisMonthSales.total - lastMonthSales.total) / lastMonthSales.total * 100).toFixed(1)
      : 100;

    const ordersGrowth = lastMonthOrders.count > 0
      ? ((thisMonthOrders.count - lastMonthOrders.count) / lastMonthOrders.count * 100).toFixed(1)
      : 100;

    const usersGrowth = lastMonthUsers.count > 0
      ? ((thisMonthUsers.count - lastMonthUsers.count) / lastMonthUsers.count * 100).toFixed(1)
      : 100;

    // MRR（月次経常収益）計算
    // アクティブな継続課金からの月次収益を計算
    const mrrData = await env.DB.prepare(`
      SELECT 
        SUM(CASE 
          WHEN billing_cycle = 'monthly' THEN amount
          WHEN billing_cycle = 'yearly' THEN amount / 12
          ELSE 0
        END) as mrr,
        COUNT(*) as active_subscriptions
      FROM subscriptions 
      WHERE status = 'active'
    `).first();

    const mrr = Math.floor(mrrData.mrr || 0);
    const arr = mrr * 12; // ARR（年次経常収益）

    // 前月のMRR（成長率計算用）
    const lastMonthMrrData = await env.DB.prepare(`
      SELECT 
        SUM(CASE 
          WHEN billing_cycle = 'monthly' THEN amount
          WHEN billing_cycle = 'yearly' THEN amount / 12
          ELSE 0
        END) as mrr
      FROM subscriptions 
      WHERE status = 'active' AND created_at < ?
    `).bind(lastMonthEnd).first();

    const lastMonthMrr = Math.floor(lastMonthMrrData.mrr || 0);
    const mrrGrowth = lastMonthMrr > 0 
      ? ((mrr - lastMonthMrr) / lastMonthMrr * 100).toFixed(1)
      : 100;

    // チャーン率計算（今月解約 / 先月アクティブ）
    const churnData = await env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'cancelled' AND updated_at >= ? AND updated_at < ?) as cancelled_this_month,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND created_at < ?) as active_last_month
    `).bind(thisMonthStart, now.toISOString(), thisMonthStart).first();

    const churnRate = churnData.active_last_month > 0
      ? ((churnData.cancelled_this_month / churnData.active_last_month) * 100).toFixed(1)
      : 0;

    return successResponse({
      today: {
        sales: todaySales.total,
        orders: todayOrders.count
      },
      thisMonth: {
        sales: thisMonthSales.total,
        orders: thisMonthOrders.count,
        users: thisMonthUsers.count,
        applications: thisMonthApplications.count
      },
      growth: {
        sales: parseFloat(salesGrowth),
        orders: parseFloat(ordersGrowth),
        users: parseFloat(usersGrowth),
        mrr: parseFloat(mrrGrowth)
      },
      total: {
        users: totalUsers.count
      },
      recurring: {
        mrr,
        arr,
        activeSubscriptions: mrrData.active_subscriptions,
        churnRate: parseFloat(churnRate)
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return errorResponse('統計情報の取得に失敗しました', 500, error.message);
  }
}

/**
 * 売上推移データ取得（過去7日間）
 * GET /api/admin/dashboard/sales-trend
 */
export async function getSalesTrend(env) {
  try {
    const days = [];
    const now = new Date();
    
    // 過去7日間の日付を生成
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }

    // 各日の売上を取得
    const salesData = await Promise.all(
      days.map(async (day) => {
        const result = await env.DB.prepare(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM orders 
          WHERE DATE(created_at) = ? AND status != 'cancelled'
        `).bind(day).first();

        return {
          date: day,
          sales: result.total
        };
      })
    );

    return successResponse({ trend: salesData });

  } catch (error) {
    console.error('Sales trend error:', error);
    return errorResponse('売上推移データの取得に失敗しました', 500, error.message);
  }
}

/**
 * カテゴリ別売上データ取得
 * GET /api/admin/dashboard/sales-by-category
 */
export async function getSalesByCategory(env) {
  try {
    const categoryData = await env.DB.prepare(`
      SELECT 
        p.category,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_sales,
        COUNT(DISTINCT o.id) as order_count
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
      GROUP BY p.category
      ORDER BY total_sales DESC
    `).all();

    return successResponse({ 
      categories: categoryData.results || [] 
    });

  } catch (error) {
    console.error('Sales by category error:', error);
    return errorResponse('カテゴリ別売上データの取得に失敗しました', 500, error.message);
  }
}

/**
 * 注文ステータス分布取得
 * GET /api/admin/dashboard/order-status
 */
export async function getOrderStatus(env) {
  try {
    const statusData = await env.DB.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `).all();

    return successResponse({ 
      statuses: statusData.results || [] 
    });

  } catch (error) {
    console.error('Order status error:', error);
    return errorResponse('注文ステータスの取得に失敗しました', 500, error.message);
  }
}

/**
 * 人気商品ランキング取得
 * GET /api/admin/dashboard/popular-products
 */
export async function getPopularProducts(env) {
  try {
    const products = await env.DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
      GROUP BY p.id, p.name, p.category, p.price
      ORDER BY total_sold DESC
      LIMIT 10
    `).all();

    return successResponse({ 
      products: products.results || [] 
    });

  } catch (error) {
    console.error('Popular products error:', error);
    return errorResponse('人気商品の取得に失敗しました', 500, error.message);
  }
}

/**
 * 最近のアクティビティ取得
 * GET /api/admin/dashboard/recent-activity
 */
export async function getRecentActivity(env) {
  try {
    // 最新注文（5件）
    const recentOrders = await env.DB.prepare(`
      SELECT 
        id,
        order_number,
        customer_name,
        total_amount,
        status,
        created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // 最新ユーザー登録（5件）
    const recentUsers = await env.DB.prepare(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        created_at
      FROM users
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // 最新サービス申込み（5件）
    const recentApplications = await env.DB.prepare(`
      SELECT 
        sa.id,
        sa.status,
        sa.created_at,
        s.name as service_name,
        u.email as user_email
      FROM service_applications sa
      LEFT JOIN services s ON sa.service_id = s.id
      LEFT JOIN users u ON sa.user_id = u.id
      ORDER BY sa.created_at DESC
      LIMIT 5
    `).all();

    return successResponse({
      orders: recentOrders.results || [],
      users: recentUsers.results || [],
      applications: recentApplications.results || []
    });

  } catch (error) {
    console.error('Recent activity error:', error);
    return errorResponse('アクティビティの取得に失敗しました', 500, error.message);
  }
}

/**
 * MRR推移データ取得（過去12ヶ月）
 * GET /api/admin/dashboard/mrr-trend
 */
export async function getMrrTrend(env) {
  try {
    const months = [];
    const now = new Date();
    
    // 過去12ヶ月の月初日を生成
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
      });
    }

    // 各月のMRRを計算
    const mrrData = await Promise.all(
      months.map(async ({ month, label }) => {
        const nextMonth = new Date(month + '-01');
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];

        const result = await env.DB.prepare(`
          SELECT 
            SUM(CASE 
              WHEN billing_cycle = 'monthly' THEN amount
              WHEN billing_cycle = 'yearly' THEN amount / 12
              ELSE 0
            END) as mrr
          FROM subscriptions 
          WHERE status = 'active' 
            AND created_at < ?
            AND (cancelled_at IS NULL OR cancelled_at >= ?)
        `).bind(nextMonthStr, month + '-01').first();

        return {
          month: label,
          mrr: Math.floor(result.mrr || 0)
        };
      })
    );

    return successResponse({ trend: mrrData });

  } catch (error) {
    console.error('MRR trend error:', error);
    return errorResponse('MRR推移データの取得に失敗しました', 500, error.message);
  }
}

/**
 * 継続課金プラン別統計
 * GET /api/admin/dashboard/subscription-stats
 */
export async function getSubscriptionStats(env) {
  try {
    // プラン別の売上とアクティブ数
    const planStats = await env.DB.prepare(`
      SELECT 
        billing_cycle,
        COUNT(*) as count,
        SUM(amount) as total_revenue
      FROM subscriptions 
      WHERE status = 'active'
      GROUP BY billing_cycle
    `).all();

    // 今月の新規継続課金数
    const now = new Date();
    const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    const newSubscriptions = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM subscriptions 
      WHERE created_at >= ?
    `).bind(thisMonthStart).first();

    // 今月の解約数
    const cancelledSubscriptions = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM subscriptions 
      WHERE status = 'cancelled' AND updated_at >= ?
    `).bind(thisMonthStart).first();

    return successResponse({
      plans: planStats.results || [],
      thisMonth: {
        new: newSubscriptions.count,
        cancelled: cancelledSubscriptions.count
      }
    });

  } catch (error) {
    console.error('Subscription stats error:', error);
    return errorResponse('継続課金統計の取得に失敗しました', 500, error.message);
  }
}

/**
 * 財務レポート（見積書・請求書・領収書）
 * GET /api/admin/dashboard/financial-report
 */
export async function getFinancialReport(env) {
  try {
    const now = new Date();
    const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // 見積書統計
    const quoteStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(total_amount) as total_amount
      FROM quotes
      WHERE created_at >= ?
    `).bind(thisMonthStart).first();

    // 請求書統計
    const invoiceStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN payment_status = 'overdue' THEN 1 ELSE 0 END) as overdue,
        SUM(total_amount) as total_amount,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_amount
      FROM invoices
      WHERE created_at >= ?
    `).bind(thisMonthStart).first();

    // 領収書統計
    const receiptStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(amount) as total_amount
      FROM receipts
      WHERE created_at >= ?
    `).bind(thisMonthStart).first();

    // 見積書コンバージョン率
    const conversionRate = quoteStats.sent > 0
      ? ((quoteStats.accepted / quoteStats.sent) * 100).toFixed(1)
      : 0;

    // 請求書回収率
    const collectionRate = invoiceStats.total_amount > 0
      ? ((invoiceStats.paid_amount / invoiceStats.total_amount) * 100).toFixed(1)
      : 0;

    // 平均取引額
    const avgTransactionValue = quoteStats.total > 0
      ? Math.floor(quoteStats.total_amount / quoteStats.total)
      : 0;

    return successResponse({
      quotes: {
        total: quoteStats.total,
        sent: quoteStats.sent,
        accepted: quoteStats.accepted,
        rejected: quoteStats.rejected,
        totalAmount: quoteStats.total_amount,
        conversionRate: parseFloat(conversionRate)
      },
      invoices: {
        total: invoiceStats.total,
        pending: invoiceStats.pending,
        paid: invoiceStats.paid,
        overdue: invoiceStats.overdue,
        totalAmount: invoiceStats.total_amount,
        paidAmount: invoiceStats.paid_amount,
        collectionRate: parseFloat(collectionRate)
      },
      receipts: {
        total: receiptStats.total,
        totalAmount: receiptStats.total_amount
      },
      kpis: {
        conversionRate: parseFloat(conversionRate),
        collectionRate: parseFloat(collectionRate),
        avgTransactionValue
      }
    });

  } catch (error) {
    console.error('Financial report error:', error);
    return errorResponse('財務レポートの取得に失敗しました', 500, error.message);
  }
}
