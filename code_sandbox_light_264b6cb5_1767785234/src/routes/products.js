/**
 * 商品API ルート
 * /api/products/* のエンドポイント処理
 */

import { successResponse, errorResponse } from '../utils/response.js';
import { validateProduct } from '../utils/validator.js';
import { requireAdmin } from '../utils/auth.js';

/**
 * 商品一覧を取得
 * GET /api/products
 * クエリパラメータ: category, search, limit, offset
 */
export async function getProducts(request, env) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM products WHERE stock_status != ?';
    const params = ['discontinued'];

    // カテゴリーフィルター
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // 検索フィルター
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // JSON文字列をパース
    const products = results.map(product => ({
      ...product,
      image_urls: product.image_urls ? JSON.parse(product.image_urls) : [],
      specifications: product.specifications ? JSON.parse(product.specifications) : {}
    }));

    return successResponse({
      products,
      total: products.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get products error:', error);
    return errorResponse('商品一覧の取得に失敗しました', 500);
  }
}

/**
 * 商品詳細を取得
 * GET /api/products/:id
 */
export async function getProductById(productId, env) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM products WHERE id = ? AND stock_status != ?'
    ).bind(productId, 'discontinued').all();

    if (results.length === 0) {
      return errorResponse('商品が見つかりません', 404);
    }

    const product = results[0];
    
    // JSON文字列をパース
    product.image_urls = product.image_urls ? JSON.parse(product.image_urls) : [];
    product.specifications = product.specifications ? JSON.parse(product.specifications) : {};

    return successResponse({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return errorResponse('商品の取得に失敗しました', 500);
  }
}

/**
 * 商品を作成（管理者用）
 * POST /api/admin/products
 */
export async function createProduct(request, env) {
  try {
    // 管理者認証チェック
    const admin = requireAdmin(request);
    if (!admin) {
      return errorResponse('認証が必要です', 401);
    }

    const body = await request.json();
    
    // バリデーション
    const validation = validateProduct(body);
    if (!validation.valid) {
      return errorResponse('入力内容に誤りがあります', 400, validation.errors);
    }

    const {
      name,
      description = '',
      price,
      category,
      alibaba_url = '',
      alibaba_supplier_id = '',
      alibaba_price = null,
      stock_status = 'in_stock',
      image_urls = [],
      specifications = {}
    } = body;

    // JSON形式で保存
    const imageUrlsJson = JSON.stringify(image_urls);
    const specificationsJson = JSON.stringify(specifications);

    const result = await env.DB.prepare(`
      INSERT INTO products (
        name, description, price, category,
        alibaba_url, alibaba_supplier_id, alibaba_price,
        stock_status, image_urls, specifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name, description, price, category,
      alibaba_url, alibaba_supplier_id, alibaba_price,
      stock_status, imageUrlsJson, specificationsJson
    ).run();

    return successResponse({
      message: '商品を登録しました',
      productId: result.meta.last_row_id
    }, 201);
  } catch (error) {
    console.error('Create product error:', error);
    return errorResponse('商品の登録に失敗しました', 500);
  }
}

/**
 * 商品を更新（管理者用）
 * PUT /api/admin/products/:id
 */
export async function updateProduct(productId, request, env) {
  try {
    // 管理者認証チェック
    const admin = requireAdmin(request);
    if (!admin) {
      return errorResponse('認証が必要です', 401);
    }

    const body = await request.json();
    
    // バリデーション
    const validation = validateProduct(body);
    if (!validation.valid) {
      return errorResponse('入力内容に誤りがあります', 400, validation.errors);
    }

    const {
      name,
      description,
      price,
      category,
      alibaba_url,
      alibaba_supplier_id,
      alibaba_price,
      stock_status,
      image_urls,
      specifications
    } = body;

    // JSON形式で保存
    const imageUrlsJson = JSON.stringify(image_urls || []);
    const specificationsJson = JSON.stringify(specifications || {});

    await env.DB.prepare(`
      UPDATE products SET
        name = ?, description = ?, price = ?, category = ?,
        alibaba_url = ?, alibaba_supplier_id = ?, alibaba_price = ?,
        stock_status = ?, image_urls = ?, specifications = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name, description, price, category,
      alibaba_url || '', alibaba_supplier_id || '', alibaba_price,
      stock_status, imageUrlsJson, specificationsJson,
      productId
    ).run();

    return successResponse({ message: '商品を更新しました' });
  } catch (error) {
    console.error('Update product error:', error);
    return errorResponse('商品の更新に失敗しました', 500);
  }
}

/**
 * 商品を削除（管理者用）
 * DELETE /api/admin/products/:id
 */
export async function deleteProduct(productId, request, env) {
  try {
    // 管理者認証チェック
    const admin = requireAdmin(request);
    if (!admin) {
      return errorResponse('認証が必要です', 401);
    }

    // ソフトデリート（discontinued に設定）
    await env.DB.prepare(`
      UPDATE products SET stock_status = 'discontinued', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(productId).run();

    return successResponse({ message: '商品を削除しました' });
  } catch (error) {
    console.error('Delete product error:', error);
    return errorResponse('商品の削除に失敗しました', 500);
  }
}
