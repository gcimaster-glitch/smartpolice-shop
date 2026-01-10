/**
 * XSS対策ユーティリティ - 入力サニタイズ
 * DOMPurifyの軽量代替（Cloudflare Workers対応）
 */

/**
 * HTMLエスケープ
 * @param {string} str - エスケープする文字列
 * @returns {string} - エスケープされた文字列
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'\/]/g, char => map[char]);
}

/**
 * テキスト入力のサニタイズ（一般的なテキストフィールド用）
 * @param {string} input - サニタイズする入力
 * @param {number} maxLength - 最大文字数（デフォルト: 500）
 * @returns {string} - サニタイズされた文字列
 */
export function sanitizeText(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  
  // 先頭・末尾の空白削除
  let sanitized = input.trim();
  
  // 最大文字数制限
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // HTMLエスケープ
  sanitized = escapeHTML(sanitized);
  
  // 制御文字削除
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * メールアドレスのバリデーション・サニタイズ
 * @param {string} email - メールアドレス
 * @returns {string|null} - サニタイズされたメールアドレス（無効な場合はnull）
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return null;
  
  const trimmed = email.trim().toLowerCase();
  
  // 基本的なメール形式チェック
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  
  // 最大長チェック（254文字がRFC標準）
  if (trimmed.length > 254) {
    return null;
  }
  
  return trimmed;
}

/**
 * 電話番号のサニタイズ
 * @param {string} phone - 電話番号
 * @returns {string} - サニタイズされた電話番号
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  
  // 数字とハイフンのみ許可
  return phone.replace(/[^0-9-]/g, '').substring(0, 20);
}

/**
 * URLのサニタイズ・バリデーション
 * @param {string} url - URL
 * @returns {string|null} - サニタイズされたURL（無効な場合はnull）
 */
export function sanitizeURL(url) {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // HTTPSまたはHTTPのみ許可
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.href;
  } catch (e) {
    return null;
  }
}

/**
 * 整数のバリデーション
 * @param {any} value - 検証する値
 * @param {number} min - 最小値
 * @param {number} max - 最大値
 * @returns {number|null} - 整数（無効な場合はnull）
 */
export function sanitizeInteger(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = parseInt(value, 10);
  
  if (isNaN(num) || num < min || num > max) {
    return null;
  }
  
  return num;
}

/**
 * 小数のバリデーション
 * @param {any} value - 検証する値
 * @param {number} min - 最小値
 * @param {number} max - 最大値
 * @returns {number|null} - 小数（無効な場合はnull）
 */
export function sanitizeFloat(value, min = 0, max = Number.MAX_VALUE) {
  const num = parseFloat(value);
  
  if (isNaN(num) || num < min || num > max) {
    return null;
  }
  
  return num;
}

/**
 * JSON文字列のサニタイズ
 * @param {string} jsonString - JSON文字列
 * @param {number} maxLength - 最大文字数（デフォルト: 10000）
 * @returns {Object|null} - パースされたオブジェクト（無効な場合はnull）
 */
export function sanitizeJSON(jsonString, maxLength = 10000) {
  if (typeof jsonString !== 'string') return null;
  
  if (jsonString.length > maxLength) {
    return null;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}

/**
 * リクエストボディ全体をサニタイズ
 * @param {Object} body - リクエストボディ
 * @param {Object} schema - バリデーションスキーマ
 * @returns {Object} - サニタイズされたボディ
 * 
 * スキーマ例:
 * {
 *   email: { type: 'email', required: true },
 *   name: { type: 'text', maxLength: 100, required: true },
 *   age: { type: 'integer', min: 0, max: 150 },
 *   website: { type: 'url' }
 * }
 */
export function sanitizeRequestBody(body, schema) {
  const sanitized = {};
  const errors = [];
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = body[key];
    
    // 必須チェック
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key}は必須項目です`);
      continue;
    }
    
    // 値がない場合はスキップ
    if (value === undefined || value === null || value === '') {
      continue;
    }
    
    // タイプ別サニタイズ
    switch (rules.type) {
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        if (sanitized[key] === null && rules.required) {
          errors.push(`${key}のメールアドレス形式が不正です`);
        }
        break;
        
      case 'text':
        sanitized[key] = sanitizeText(value, rules.maxLength || 500);
        break;
        
      case 'phone':
        sanitized[key] = sanitizePhone(value);
        break;
        
      case 'url':
        sanitized[key] = sanitizeURL(value);
        if (sanitized[key] === null && rules.required) {
          errors.push(`${key}のURL形式が不正です`);
        }
        break;
        
      case 'integer':
        sanitized[key] = sanitizeInteger(value, rules.min, rules.max);
        if (sanitized[key] === null && rules.required) {
          errors.push(`${key}は${rules.min}以上${rules.max}以下の整数である必要があります`);
        }
        break;
        
      case 'float':
        sanitized[key] = sanitizeFloat(value, rules.min, rules.max);
        if (sanitized[key] === null && rules.required) {
          errors.push(`${key}は${rules.min}以上${rules.max}以下の数値である必要があります`);
        }
        break;
        
      case 'json':
        sanitized[key] = sanitizeJSON(value, rules.maxLength);
        if (sanitized[key] === null && rules.required) {
          errors.push(`${key}のJSON形式が不正です`);
        }
        break;
        
      default:
        sanitized[key] = sanitizeText(value);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  return sanitized;
}
