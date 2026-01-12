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
        users: parseFloat(usersGrowth)
      },
      total: {
        users: totalUsers.count
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
