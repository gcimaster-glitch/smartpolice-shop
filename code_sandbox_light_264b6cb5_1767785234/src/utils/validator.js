/**
 * バリデーションユーティリティ
 * フォームデータやAPIリクエストの検証
 */

/**
 * メールアドレスの形式を検証
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 電話番号の形式を検証（日本の電話番号）
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  const phoneRegex = /^0\d{9,10}$/;
  return phoneRegex.test(phone.replace(/-/g, ''));
}

/**
 * 郵便番号の形式を検証（日本）
 * @param {string} postalCode
 * @returns {boolean}
 */
export function isValidPostalCode(postalCode) {
  const postalRegex = /^\d{3}-?\d{4}$/;
  return postalRegex.test(postalCode);
}

/**
 * 商品データのバリデーション
 * @param {Object} product
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateProduct(product) {
  const errors = [];
  
  if (!product.name || product.name.trim().length === 0) {
    errors.push('商品名は必須です');
  }
  
  if (!product.price || product.price < 0) {
    errors.push('価格は0以上の数値である必要があります');
  }
  
  if (!product.category || product.category.trim().length === 0) {
    errors.push('カテゴリーは必須です');
  }
  
  const validCategories = ['個人向け', 'スマートホーム', '車両・バイク'];
  if (product.category && !validCategories.includes(product.category)) {
    errors.push(`カテゴリーは ${validCategories.join(', ')} のいずれかである必要があります`);
  }
  
  if (product.stock_status) {
    const validStatuses = ['in_stock', 'out_of_stock', 'discontinued'];
    if (!validStatuses.includes(product.stock_status)) {
      errors.push(`在庫ステータスは ${validStatuses.join(', ')} のいずれかである必要があります`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 注文データのバリデーション
 * @param {Object} order
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateOrder(order) {
  const errors = [];
  
  if (!order.customer_name || order.customer_name.trim().length === 0) {
    errors.push('お名前は必須です');
  }
  
  if (!order.customer_email || !isValidEmail(order.customer_email)) {
    errors.push('有効なメールアドレスを入力してください');
  }
  
  if (order.customer_phone && !isValidPhone(order.customer_phone)) {
    errors.push('有効な電話番号を入力してください');
  }
  
  if (!order.shipping_address || order.shipping_address.trim().length === 0) {
    errors.push('配送先住所は必須です');
  }
  
  if (order.shipping_postal_code && !isValidPostalCode(order.shipping_postal_code)) {
    errors.push('有効な郵便番号を入力してください（例: 123-4567）');
  }
  
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    errors.push('注文商品が指定されていません');
  }
  
  if (order.items) {
    order.items.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`商品${index + 1}: 商品IDが必要です`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`商品${index + 1}: 数量は1以上である必要があります`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 文字列のサニタイズ（XSS対策）
 * @param {string} str
 * @returns {string}
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * SQLインジェクション対策用の文字列エスケープ
 * 注意: D1はプリペアドステートメントを使用するため、通常は不要
 * @param {string} str
 * @returns {string}
 */
export function escapeSql(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/'/g, "''");
}
