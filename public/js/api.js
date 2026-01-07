/**
 * API通信ラッパー
 * バックエンドAPIとの通信を簡単にするヘルパー関数
 */

const API_BASE = '/api';

class API {
  /**
   * GETリクエスト
   */
  static async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'リクエストに失敗しました');
      }
      
      return data.data;
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  }

  /**
   * POSTリクエスト
   */
  static async post(endpoint, body) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'リクエストに失敗しました');
      }
      
      return data.data;
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }

  /**
   * PUTリクエスト（管理者用）
   */
  static async put(endpoint, body, token) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'リクエストに失敗しました');
      }
      
      return data.data;
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  }

  // ==================== 商品API ====================
  
  /**
   * 商品一覧を取得
   */
  static async getProducts(category = null) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return await this.get(`/products${query}`);
  }

  /**
   * 商品詳細を取得
   */
  static async getProduct(productId) {
    return await this.get(`/products/${productId}`);
  }

  // ==================== 注文API ====================
  
  /**
   * 注文を作成
   */
  static async createOrder(orderData) {
    return await this.post('/orders', orderData);
  }

  /**
   * 注文詳細を取得
   */
  static async getOrder(orderNumber) {
    return await this.get(`/orders/${orderNumber}`);
  }

  // ==================== 決済API ====================
  
  /**
   * Stripe PaymentIntentを作成
   */
  static async createPaymentIntent(amount, metadata) {
    return await this.post('/payment/intent', {
      amount,
      description: `スマートポリスECショップ - 注文`,
      metadata
    });
  }
}

// ==================== カート管理 ====================

class Cart {
  static STORAGE_KEY = 'smartpolice_cart';

  /**
   * カートを取得
   */
  static get() {
    const cart = localStorage.getItem(this.STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  }

  /**
   * カートに商品を追加
   */
  static add(product, quantity = 1) {
    const cart = this.get();
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_urls[0],
        quantity
      });
    }

    this.save(cart);
    this.updateCartCount();
    return cart;
  }

  /**
   * カートから商品を削除
   */
  static remove(productId) {
    let cart = this.get();
    cart = cart.filter(item => item.id !== productId);
    this.save(cart);
    this.updateCartCount();
    return cart;
  }

  /**
   * 商品の数量を更新
   */
  static updateQuantity(productId, quantity) {
    const cart = this.get();
    const item = cart.find(item => item.id === productId);

    if (item) {
      if (quantity <= 0) {
        return this.remove(productId);
      }
      item.quantity = quantity;
      this.save(cart);
    }

    return cart;
  }

  /**
   * カートをクリア
   */
  static clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateCartCount();
  }

  /**
   * カートを保存
   */
  static save(cart) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
  }

  /**
   * カート内の商品総数を取得
   */
  static getCount() {
    const cart = this.get();
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * カート合計金額を取得
   */
  static getTotal() {
    const cart = this.get();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * カートアイコンの数を更新
   */
  static updateCartCount() {
    const countElement = document.querySelector('.cart-count');
    if (countElement) {
      const count = this.getCount();
      countElement.textContent = count;
      countElement.style.display = count > 0 ? 'flex' : 'none';
    }
  }
}

// ==================== 通知 ====================

class Notification {
  /**
   * 成功メッセージを表示
   */
  static success(message) {
    this.show(message, 'success');
  }

  /**
   * エラーメッセージを表示
   */
  static error(message) {
    this.show(message, 'error');
  }

  /**
   * 通知を表示
   */
  static show(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
      color: white;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// ==================== ユーティリティ ====================

/**
 * 価格をフォーマット
 */
function formatPrice(price) {
  return `¥${price.toLocaleString()}`;
}

/**
 * ローディング表示
 */
function showLoading(container) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

/**
 * エラー表示
 */
function showError(container, message) {
  container.innerHTML = `<div class="error-message">${message}</div>`;
}

// ページロード時にカートカウントを更新
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateCartCount();
});
