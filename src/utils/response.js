/**
 * レスポンスヘルパー関数
 * Cloudflare Workersで統一されたレスポンスフォーマットを提供
 */

/**
 * 成功レスポンスを返す
 * @param {any} data - レスポンスデータ
 * @param {number} status - HTTPステータスコード（デフォルト: 200）
 * @returns {Response}
 */
export function successResponse(data, status = 200) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

/**
 * エラーレスポンスを返す
 * @param {string} message - エラーメッセージ
 * @param {number} status - HTTPステータスコード（デフォルト: 400）
 * @param {any} details - 追加のエラー詳細（オプション）
 * @returns {Response}
 */
export function errorResponse(message, status = 400, details = null) {
  const body = {
    success: false,
    error: message
  };
  
  if (details) {
    body.details = details;
  }
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

/**
 * CORS プリフライトリクエストに対応
 * @returns {Response}
 */
export function corsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * JSONリクエストボディをパースする
 * @param {Request} request
 * @returns {Promise<any>}
 */
export async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}
