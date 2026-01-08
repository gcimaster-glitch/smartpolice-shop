/**
 * EC拡張機能ライブラリ
 * - レビュー表示
 * - お気に入り機能  
 * - 関連商品表示
 */

// ==================== お気に入り機能 ====================
const Favorites = {
  STORAGE_KEY: 'smartpolice_favorites',
  
  get() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  add(productId) {
    const favorites = this.get();
    if (!favorites.includes(productId)) {
      favorites.push(productId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      this.notifyChange();
      return true;
    }
    return false;
  },

  remove(productId) {
    const favorites = this.get();
    const filtered = favorites.filter(id => id !== productId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    this.notifyChange();
    return true;
  },

  has(productId) {
    return this.get().includes(productId);
  },

  toggle(productId) {
    if (this.has(productId)) {
      this.remove(productId);
      return false;
    } else {
      this.add(productId);
      return true;
    }
  },

  count() {
    return this.get().length;
  },

  async getProducts() {
    const ids = this.get();
    if (ids.length === 0) return [];
    
    try {
      const response = await fetch(`/api/favorites?ids=${ids.join(',')}`);
      const data = await response.json();
      return data.success ? data.data.favorites : [];
    } catch (error) {
      console.error('Favorites fetch error:', error);
      return [];
    }
  },

  notifyChange() {
    window.dispatchEvent(new CustomEvent('favoritesChanged', { 
      detail: { count: this.count() } 
    }));
  },

  renderButton(productId, container) {
    const isFavorite = this.has(productId);
    const button = document.createElement('button');
    button.className = 'favorite-button' + (isFavorite ? ' active' : '');
    button.innerHTML = isFavorite ? '❤️ お気に入り登録済み' : '🤍 お気に入りに追加';
    button.style.cssText = `
      padding: 0.75rem 1.5rem;
      border: 2px solid ${isFavorite ? '#f44336' : '#ddd'};
      background: ${isFavorite ? '#ffebee' : 'white'};
      color: ${isFavorite ? '#f44336' : '#666'};
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
      width: 100%;
    `;
    
    button.onclick = () => {
      const isNowFavorite = this.toggle(productId);
      button.className = 'favorite-button' + (isNowFavorite ? ' active' : '');
      button.innerHTML = isNowFavorite ? '❤️ お気に入り登録済み' : '🤍 お気に入りに追加';
      button.style.borderColor = isNowFavorite ? '#f44336' : '#ddd';
      button.style.background = isNowFavorite ? '#ffebee' : 'white';
      button.style.color = isNowFavorite ? '#f44336' : '#666';
      
      showNotification(
        isNowFavorite ? 'お気に入りに追加しました' : 'お気に入りから削除しました',
        isNowFavorite ? 'success' : 'info'
      );
    };
    
    if (container) {
      container.appendChild(button);
    }
    
    return button;
  }
};

// ==================== レビュー表示 ====================
const Reviews = {
  async load(productId, container) {
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem;">読み込み中...</div>';
    
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      const data = await response.json();
      
      if (!data.success) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #f44336;">レビューの読み込みに失敗しました</div>';
        return;
      }
      
      const { reviews, review_count, average_rating, rating_breakdown } = data.data;
      
      if (reviews.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: #f8f9fa; border-radius: 10px;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">💬</div>
            <div style="color: #666; font-size: 1.125rem;">まだレビューがありません</div>
            <div style="color: #999; margin-top: 0.5rem;">最初のレビューを投稿してみませんか？</div>
          </div>
        `;
        return;
      }
      
      container.innerHTML = `
        <div style="background: #f8f9fa; padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; gap: 3rem; flex-wrap: wrap;">
            <div style="text-align: center;">
              <div style="font-size: 3rem; font-weight: 700; color: #ff9800;">${average_rating.toFixed(1)}</div>
              <div style="color: #ff9800; font-size: 1.5rem; margin: 0.5rem 0;">${this.renderStars(average_rating)}</div>
              <div style="color: #666;">${review_count}件のレビュー</div>
            </div>
            <div style="flex: 1; min-width: 200px;">
              ${[5,4,3,2,1].map(star => {
                const count = rating_breakdown[`${['', 'one', 'two', 'three', 'four', 'five'][star]}_star`] || 0;
                const percentage = review_count > 0 ? (count / review_count * 100).toFixed(0) : 0;
                return `
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <span style="color: #ff9800; min-width: 60px;">${'★'.repeat(star)}${'☆'.repeat(5-star)}</span>
                    <div style="flex: 1; background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${percentage}%; height: 100%; background: #ff9800;"></div>
                    </div>
                    <span style="min-width: 40px; color: #666; font-size: 0.875rem;">${count}件</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
        
        ${reviews.map(review => `
          <div style="border-bottom: 1px solid #e0e0e0; padding: 1.5rem 0;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
              <div>
                <div style="color: #ff9800; font-size: 1.25rem; margin-bottom: 0.5rem;">${this.renderStars(review.rating)}</div>
                ${review.title ? `<div style="font-weight: 600; font-size: 1.125rem;">${review.title}</div>` : ''}
              </div>
              ${review.verified_purchase ? '<span style="background: #4caf50; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem;">✓ 購入済み</span>' : ''}
            </div>
            <div style="color: #666; margin-bottom: 0.75rem; font-size: 0.875rem;">
              ${review.customer_name} - ${new Date(review.created_at).toLocaleDateString('ja-JP')}
            </div>
            ${review.comment ? `<div style="line-height: 1.6; color: #333;">${review.comment}</div>` : ''}
          </div>
        `).join('')}
      `;
    } catch (error) {
      console.error('Reviews load error:', error);
      container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #f44336;">レビューの読み込みに失敗しました</div>';
    }
  },

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return '★'.repeat(fullStars) + (hasHalfStar ? '⯨' : '') + '☆'.repeat(emptyStars);
  }
};

// ==================== 関連商品表示 ====================
const RelatedProducts = {
  async load(productId, category, container, limit = 4) {
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem;">読み込み中...</div>';
    
    try {
      const response = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
      const data = await response.json();
      
      if (!data.success || !data.data.products) {
        container.innerHTML = '';
        return;
      }
      
      // 現在の商品を除外
      const related = data.data.products
        .filter(p => p.id !== parseInt(productId))
        .slice(0, limit);
      
      if (related.length === 0) {
        container.innerHTML = '';
        return;
      }
      
      container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
          ${related.map(product => `
            <a href="/product-detail.html?id=${product.id}" style="text-decoration: none; color: inherit;">
              <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s; cursor: pointer;" 
                   onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';">
                <div style="aspect-ratio: 1; background: #f8f9fa; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  ${product.image_urls && product.image_urls[0] 
                    ? `<img src="/images/${product.image_urls[0]}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`
                    : '<div style="font-size: 3rem;">📦</div>'
                  }
                </div>
                <div style="padding: 1rem;">
                  <div style="font-weight: 600; margin-bottom: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${product.name}</div>
                  <div style="color: var(--primary-color); font-size: 1.25rem; font-weight: 700;">¥${product.price.toLocaleString()}</div>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error('Related products load error:', error);
      container.innerHTML = '';
    }
  }
};

// ==================== 通知ヘルパー ====================
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  const colors = {
    success: '#4caf50',
    error: '#f44336',
    info: '#2196f3',
    warning: '#ff9800'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// アニメーション定義
if (!document.getElementById('notification-animations')) {
  const style = document.createElement('style');
  style.id = 'notification-animations';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
