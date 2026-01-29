/**
 * Cloudflare Workers メインエントリーポイント
 * スマートポリスECショップ バックエンドAPI
 */

import { corsResponse, errorResponse } from './utils/response.js';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from './routes/products.js';
import { createOrder, getOrderByNumber, getUserOrders, getAllOrders, updateOrderStatus } from './routes/orders.js';
import { createPaymentIntent, verifyWebhookSignature, handleWebhookEvent } from './services/stripe.js';
import { sendShippingNotificationEmail } from './services/resend.js';
import { uploadImage, getImage } from './services/r2.js';
import { requireAdmin, hashPassword, verifyPassword, generateAdminToken } from './utils/auth.js';
import { isValidImageType, isValidImageSize } from './services/r2.js';
import { successResponse } from './utils/response.js';
import { scrapeAlibabaProduct, analyzeProductWithAI, downloadAndUploadImages } from './services/alibaba.js';
import { registerUser, loginUser, getCurrentUser, logoutUser, requireAuth, updateUser, updatePassword } from './routes/auth.js';
import { getServices, getServiceById, createServiceApplication, getUserServiceApplications, getAllServiceApplications, updateServiceApplicationStatus } from './routes/services.js';
import { getDashboardStats, getSalesTrend, getSalesByCategory, getOrderStatus, getPopularProducts, getRecentActivity, getMrrTrend, getSubscriptionStats, getFinancialReport } from './routes/dashboard.js';
import { createQuote, getQuotes, getQuoteById, updateQuoteStatus, convertQuoteToOrder, createInvoice, getInvoices, payInvoice, getReceipts, createSubscription, getSubscriptions, updateSubscriptionStatus, getPaymentTransactions } from './routes/financial.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS プリフライト対応
    if (method === 'OPTIONS') {
      return corsResponse();
    }

    try {
      // ==================== 認証API ====================
      
      // POST /api/auth/register - ユーザー新規登録
      if (path === '/api/auth/register' && method === 'POST') {
        return await registerUser(request, env);
      }

      // POST /api/auth/login - ユーザーログイン
      if (path === '/api/auth/login' && method === 'POST') {
        return await loginUser(request, env);
      }

      // GET /api/auth/me - 現在のユーザー情報取得
      if (path === '/api/auth/me' && method === 'GET') {
        return await getCurrentUser(request, env);
      }

      // POST /api/auth/logout - ログアウト
      if (path === '/api/auth/logout' && method === 'POST') {
        return await logoutUser(request, env);
      }

      // PUT /api/users/:id - ユーザー情報更新
      if (path.match(/^\/api\/users\/\d+$/) && method === 'PUT') {
        return await updateUser(request, env);
      }

      // PUT /api/users/:id/password - パスワード変更
      if (path.match(/^\/api\/users\/\d+\/password$/) && method === 'PUT') {
        return await updatePassword(request, env);
      }

      // ==================== サービスAPI ====================

      // GET /api/services - サービス一覧取得
      if (path === '/api/services' && method === 'GET') {
        return await getServices(request, env);
      }

      // GET /api/services/:id - サービス詳細取得
      if (path.match(/^\/api\/services\/\d+$/) && method === 'GET') {
        const serviceId = path.split('/').pop();
        return await getServiceById(serviceId, env);
      }

      // POST /api/services/apply - サービス申込み
      if (path === '/api/services/apply' && method === 'POST') {
        return await createServiceApplication(request, env);
      }

      // GET /api/services/applications/user/:userId - ユーザーの申込み履歴
      if (path.match(/^\/api\/services\/applications\/user\/\d+$/) && method === 'GET') {
        const userId = path.split('/').pop();
        return await getUserServiceApplications(userId, env);
      }

      // GET /api/admin/services/applications - 全申込み取得（管理者用）
      if (path === '/api/admin/services/applications' && method === 'GET') {
        return await getAllServiceApplications(request, env);
      }

      // PUT /api/admin/services/applications/:id - 申込みステータス更新（管理者用）
      if (path.match(/^\/api\/admin\/services\/applications\/\d+$/) && method === 'PUT') {
        const applicationId = path.split('/').pop();
        return await updateServiceApplicationStatus(applicationId, request, env);
      }

      // ==================== 商品API ====================
      
      // GET /api/products - 商品一覧取得
      if (path === '/api/products' && method === 'GET') {
        return await getProducts(request, env);
      }

      // GET /api/products/:id - 商品詳細取得
      if (path.match(/^\/api\/products\/\d+$/) && method === 'GET') {
        const productId = path.split('/').pop();
        return await getProductById(productId, env);
      }

      // POST /api/admin/products - 商品作成（管理者用）
      if (path === '/api/admin/products' && method === 'POST') {
        return await createProduct(request, env);
      }

      // PUT /api/admin/products/:id - 商品更新（管理者用）
      if (path.match(/^\/api\/admin\/products\/\d+$/) && method === 'PUT') {
        const productId = path.split('/').pop();
        return await updateProduct(productId, request, env);
      }

      // DELETE /api/admin/products/:id - 商品削除（管理者用）
      if (path.match(/^\/api\/admin\/products\/\d+$/) && method === 'DELETE') {
        const productId = path.split('/').pop();
        return await deleteProduct(productId, request, env);
      }

      // POST /api/admin/alibaba/analyze - Alibaba商品AI分析（管理者用）
      if (path === '/api/admin/alibaba/analyze' && method === 'POST') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }

        const body = await request.json();
        const { alibaba_url, profit_margin } = body;

        if (!alibaba_url) {
          return errorResponse('Alibaba URLが必要です', 400);
        }

        try {
          // 1. Alibaba商品ページをスクレイピング
          const scrapedData = await scrapeAlibabaProduct(alibaba_url);

          // 2. OpenAI APIで分析・最適化
          const analyzedData = await analyzeProductWithAI(
            scrapedData,
            profit_margin || 100,
            env.OPENAI_API_KEY
          );

          // 3. 画像をR2にアップロード
          const uploadedImages = await downloadAndUploadImages(
            scrapedData.images,
            env.IMAGES
          );

          // 4. 結果を返す
          return successResponse({
            product: {
              ...analyzedData,
              image_urls: uploadedImages.length > 0 ? uploadedImages : scrapedData.images,
              stock_status: 'in_stock'
            },
            originalData: scrapedData
          });

        } catch (error) {
          console.error('Alibaba analyze error:', error);
          return errorResponse(error.message || 'AI分析に失敗しました', 500);
        }
      }

      // ==================== 注文API ====================

      // POST /api/orders - 注文作成
      if (path === '/api/orders' && method === 'POST') {
        return await createOrder(request, env);
      }

      // GET /api/orders/:orderNumber - 注文詳細取得
      if (path.match(/^\/api\/orders\/SP\d+$/) && method === 'GET') {
        const orderNumber = path.split('/').pop();
        return await getOrderByNumber(orderNumber, env);
      }

      // GET /api/orders/user/:userId - ユーザーの注文履歴取得
      if (path.match(/^\/api\/orders\/user\/\d+$/) && method === 'GET') {
        const userId = path.split('/').pop();
        return await getUserOrders(userId, env);
      }

      // GET /api/admin/orders - 全注文取得（管理者用）
      if (path === '/api/admin/orders' && method === 'GET') {
        return await getAllOrders(request, env);
      }

      // PUT /api/admin/orders/:id - 注文ステータス更新（管理者用）
      if (path.match(/^\/api\/admin\/orders\/\d+$/) && method === 'PUT') {
        const orderId = path.split('/').pop();
        return await updateOrderStatus(orderId, request, env);
      }

      // ==================== 決済API（Stripe） ====================

      // GET /api/stripe/config - Stripe公開キー取得
      if (path === '/api/stripe/config' && method === 'GET') {
        return successResponse({
          publishableKey: env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef'
        });
      }

      // POST /api/payment/intent - PaymentIntent作成
      if (path === '/api/payment/intent' && method === 'POST') {
        const body = await request.json();
        const { amount, description, metadata } = body;

        const paymentIntent = await createPaymentIntent({
          amount,
          description,
          metadata
        }, env.STRIPE_SECRET_KEY);

        return successResponse({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        });
      }

      // POST /api/webhooks/stripe - Stripe Webhook
      if (path === '/api/webhooks/stripe' && method === 'POST') {
        const signature = request.headers.get('stripe-signature');
        const payload = await request.text();

        const isValid = await verifyWebhookSignature(
          payload,
          signature,
          env.STRIPE_WEBHOOK_SECRET
        );

        if (!isValid) {
          return errorResponse('Invalid webhook signature', 401);
        }

        const event = JSON.parse(payload);
        const result = await handleWebhookEvent(event, env);

        // 決済成功時に注文ステータスを更新
        if (result.type === 'payment_success' && result.metadata?.order_number) {
          const { results } = await env.DB.prepare(
            'SELECT id FROM orders WHERE order_number = ?'
          ).bind(result.metadata.order_number).all();

          if (results.length > 0) {
            await env.DB.prepare(
              'UPDATE orders SET status = ?, stripe_payment_id = ?, stripe_payment_status = ? WHERE id = ?'
            ).bind('paid', result.paymentIntentId, 'succeeded', results[0].id).run();
          }
        }

        return successResponse({ received: true });
      }

      // ==================== メール送信API ====================

      // POST /api/admin/email/shipping - 発送通知メール送信（管理者用）
      if (path === '/api/admin/email/shipping' && method === 'POST') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }

        const body = await request.json();
        const { to, customerName, orderNumber, trackingNumber, trackingUrl } = body;

        await sendShippingNotificationEmail({
          to,
          customerName,
          orderNumber,
          trackingNumber,
          trackingUrl
        }, env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);

        return successResponse({ message: '発送通知メールを送信しました' });
      }

      // ==================== 画像管理API（R2） ====================

      // POST /api/admin/images/upload - 画像アップロード（管理者用）
      if (path === '/api/admin/images/upload' && method === 'POST') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }

        const formData = await request.formData();
        const file = formData.get('image');

        if (!file) {
          return errorResponse('画像ファイルが指定されていません', 400);
        }

        if (!isValidImageType(file.type)) {
          return errorResponse('サポートされていない画像形式です', 400);
        }

        if (!isValidImageSize(file.size)) {
          return errorResponse('画像サイズが大きすぎます（最大5MB）', 400);
        }

        const filename = await uploadImage(file, file.name, env.IMAGES);

        return successResponse({
          message: '画像をアップロードしました',
          filename,
          url: `/images/${filename}`
        });
      }

      // GET /images/:filename - 画像取得
      if (path.startsWith('/images/') && method === 'GET') {
        const filename = path.replace('/images/', '');
        return await getImage(filename, env.IMAGES);
      }

      // ==================== ダッシュボードAPI ====================

      // GET /api/admin/dashboard/stats - ダッシュボード統計情報
      if (path === '/api/admin/dashboard/stats' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }
        return await getDashboardStats(env);
      }

      // GET /api/admin/dashboard/sales-trend - 売上推移
      if (path === '/api/admin/dashboard/sales-trend' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }
        return await getSalesTrend(env);
      }

      // GET /api/admin/dashboard/sales-by-category - カテゴリ別売上
      if (path === '/api/admin/dashboard/sales-by-category' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }
        return await getSalesByCategory(env);
      }

      // GET /api/admin/dashboard/order-status - 注文ステータス分布
      if (path === '/api/admin/dashboard/order-status' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }
        return await getOrderStatus(env);
      }

      // GET /api/admin/dashboard/popular-products - 人気商品ランキング
      if (path === '/api/admin/dashboard/popular-products' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }
        return await getPopularProducts(env);
      }

      // GET /api/admin/dashboard/recent-activity - 最近のアクティビティ
      if (path === '/api/admin/dashboard/recent-activity' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }
        return await getRecentActivity(env);
      }

      // GET /api/admin/dashboard/mrr-trend - MRR推移（過去12ヶ月）
      if (path === '/api/admin/dashboard/mrr-trend' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }
        return await getMrrTrend(env);
      }

      // GET /api/admin/dashboard/subscription-stats - 継続課金統計
      if (path === '/api/admin/dashboard/subscription-stats' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }
        return await getSubscriptionStats(env);
      }

      // GET /api/admin/dashboard/financial-report - 財務レポート
      if (path === '/api/admin/dashboard/financial-report' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }
        return await getFinancialReport(env);
      }

      // ==================== 管理者認証API ====================

      // POST /api/admin/login - 管理者ログイン
      if (path === '/api/admin/login' && method === 'POST') {
        const body = await request.json();
        const { email, password } = body;

        const { results } = await env.DB.prepare(
          'SELECT * FROM admins WHERE email = ?'
        ).bind(email).all();

        if (results.length === 0) {
          return errorResponse('メールアドレスまたはパスワードが正しくありません', 401);
        }

        const admin = results[0];
        const passwordHash = await hashPassword(password);
        const isValid = passwordHash === admin.password_hash;

        if (!isValid) {
          return errorResponse('メールアドレスまたはパスワードが正しくありません', 401);
        }

        // ログイン時刻を更新
        await env.DB.prepare(
          'UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(admin.id).run();

        const token = generateAdminToken(admin);

        return successResponse({
          message: 'ログインしました',
          token,
          admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name
          }
        });
      }

      // GET /api/admin/me - 管理者情報取得
      if (path === '/api/admin/me' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) {
          return errorResponse('認証が必要です', 401);
        }

        return successResponse({ admin });
      }

      // ==================== 財務管理API ====================

      // 見積書API
      if (path === '/api/admin/quotes' && method === 'POST') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        return await createQuote(request, env);
      }

      if (path === '/api/admin/quotes' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        const status = url.searchParams.get('status');
        return await getQuotes(env, status);
      }

      if (path.match(/^\/api\/admin\/quotes\/\d+$/) && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        const quoteId = path.split('/').pop();
        return await getQuoteById(quoteId, env);
      }

      if (path.match(/^\/api\/admin\/quotes\/\d+\/status$/) && method === 'PUT') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        const quoteId = path.split('/')[4];
        return await updateQuoteStatus(quoteId, request, env);
      }

      if (path.match(/^\/api\/admin\/quotes\/\d+\/convert$/) && method === 'POST') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        const quoteId = path.split('/')[4];
        return await convertQuoteToOrder(quoteId, env);
      }

      // 請求書API
      if (path === '/api/admin/invoices' && method === 'POST') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        return await createInvoice(request, env);
      }

      if (path === '/api/admin/invoices' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        const payment_status = url.searchParams.get('payment_status');
        return await getInvoices(env, payment_status);
      }

      if (path.match(/^\/api\/admin\/invoices\/\d+\/pay$/) && method === 'POST') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        const invoiceId = path.split('/')[4];
        return await payInvoice(invoiceId, request, env);
      }

      // 領収書API
      if (path === '/api/admin/receipts' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        return await getReceipts(env);
      }

      // 継続課金API
      if (path === '/api/admin/subscriptions' && method === 'POST') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        return await createSubscription(request, env);
      }

      if (path === '/api/admin/subscriptions' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        const status = url.searchParams.get('status');
        return await getSubscriptions(env, status);
      }

      if (path.match(/^\/api\/admin\/subscriptions\/\d+\/status$/) && method === 'PUT') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        const subscriptionId = path.split('/')[4];
        return await updateSubscriptionStatus(subscriptionId, request, env);
      }

      // 決済履歴API
      if (path === '/api/admin/payment-transactions' && method === 'GET') {
        const admin = requireAdmin(request);
        if (!admin) return errorResponse('認証が必要です', 401);
        return await getPaymentTransactions(env);
      }

      // ==================== クーポンAPI ====================

      // POST /api/coupons/validate - クーポン検証
      if (path === '/api/coupons/validate' && method === 'POST') {
        const { code, subtotal } = await request.json();
        
        if (!code) {
          return errorResponse('クーポンコードを入力してください', 400);
        }

        // クーポン取得
        const coupon = await env.DB.prepare(`
          SELECT * FROM coupons 
          WHERE code = ? AND is_active = 1
        `).bind(code.toUpperCase()).first();

        if (!coupon) {
          return errorResponse('無効なクーポンコードです', 404);
        }

        // 有効期限チェック
        const now = new Date().toISOString();
        if (coupon.valid_until && coupon.valid_until < now) {
          return errorResponse('このクーポンは有効期限が切れています', 400);
        }

        // 利用回数チェック
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
          return errorResponse('このクーポンは利用上限に達しています', 400);
        }

        // 最低購入金額チェック
        if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
          return errorResponse(
            `このクーポンは${coupon.min_purchase_amount}円以上のご購入で利用できます`,
            400
          );
        }

        // 割引額計算
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
          discountAmount = Math.floor(subtotal * (coupon.discount_value / 100));
          // 最大割引額の制限
          if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
            discountAmount = coupon.max_discount_amount;
          }
        } else if (coupon.discount_type === 'fixed') {
          discountAmount = coupon.discount_value;
        }

        return successResponse({
          coupon: {
            code: coupon.code,
            description: coupon.description,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: discountAmount
          }
        });
      }

      // ==================== レビューAPI ====================

      // GET /api/products/:id/reviews - 商品レビュー取得
      if (path.match(/^\/api\/products\/\d+\/reviews$/) && method === 'GET') {
        const productId = path.split('/')[3];
        
        const reviews = await env.DB.prepare(`
          SELECT * FROM reviews 
          WHERE product_id = ? 
          ORDER BY created_at DESC
        `).bind(productId).all();

        const rating = await env.DB.prepare(`
          SELECT * FROM product_ratings WHERE product_id = ?
        `).bind(productId).first();

        return successResponse({
          reviews: reviews.results || [],
          review_count: rating?.review_count || 0,
          average_rating: rating?.average_rating || 0,
          rating_breakdown: {
            five_star: rating?.five_star || 0,
            four_star: rating?.four_star || 0,
            three_star: rating?.three_star || 0,
            two_star: rating?.two_star || 0,
            one_star: rating?.one_star || 0
          }
        });
      }

      // POST /api/products/:id/reviews - レビュー投稿
      if (path.match(/^\/api\/products\/\d+\/reviews$/) && method === 'POST') {
        const productId = path.split('/')[3];
        const { customer_name, customer_email, rating, title, comment } = await request.json();

        if (!customer_name || !customer_email || !rating) {
          return errorResponse('必須項目を入力してください', 400);
        }

        if (rating < 1 || rating > 5) {
          return errorResponse('評価は1-5の範囲で指定してください', 400);
        }

        const result = await env.DB.prepare(`
          INSERT INTO reviews (product_id, customer_name, customer_email, rating, title, comment)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(productId, customer_name, customer_email, rating, title || '', comment || '').run();

        return successResponse({
          message: 'レビューを投稿しました',
          review_id: result.meta.last_row_id
        });
      }

      // ==================== お気に入りAPI ====================

      // GET /api/favorites - お気に入り一覧取得
      if (path === '/api/favorites' && method === 'GET') {
        const url = new URL(request.url);
        const productIds = url.searchParams.get('ids');
        
        if (!productIds) {
          return successResponse({ favorites: [] });
        }

        const ids = productIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        
        if (ids.length === 0) {
          return successResponse({ favorites: [] });
        }

        const placeholders = ids.map(() => '?').join(',');
        const products = await env.DB.prepare(`
          SELECT * FROM products WHERE id IN (${placeholders})
        `).bind(...ids).all();

        return successResponse({ favorites: products.results || [] });
      }

      // ==================== その他 ====================

      // GET /api/health - ヘルスチェック
      if (path === '/api/health' && method === 'GET') {
        return successResponse({
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'smartpolice-shop-api'
        });
      }

      // ==================== 静的ファイル配信 ====================
      
      // APIルート以外は静的ファイルを返す
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      // ルートが見つからない
      return errorResponse('エンドポイントが見つかりません', 404);

    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse('サーバーエラーが発生しました', 500, error.message);
    }
  }
};
