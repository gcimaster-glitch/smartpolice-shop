// ユーザーメニュー管理 - JWT認証対応
class UserMenu {
  constructor() {
    this.init();
  }

  init() {
    this.checkLoginStatus();
    this.setupEventListeners();
  }

  // ログイン状態を確認（JWT認証）
  async checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    const navGuest = document.getElementById('nav-guest');
    const navUser = document.getElementById('nav-user');
    const userName = document.getElementById('user-name');

    if (token) {
      // トークンが存在する場合、サーバーで検証
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const user = data.user;

          // ユーザー情報を更新
          localStorage.setItem('currentUser', JSON.stringify(user));

          // UIを更新
          if (navGuest) navGuest.style.display = 'none';
          if (navUser) navUser.style.display = 'flex';
          if (userName) userName.textContent = `${user.lastName} ${user.firstName}`;
        } else {
          // トークンが無効な場合、ログアウト
          this.forceLogout();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        this.forceLogout();
      }
    } else {
      // トークンがない場合、未ログイン
      if (navGuest) navGuest.style.display = 'flex';
      if (navUser) navUser.style.display = 'none';
    }

    // カートバッジを更新
    this.updateCartBadge();
  }

  // 現在のユーザーを取得（ローカルストレージから）
  getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  // イベントリスナーを設定
  setupEventListeners() {
    // ユーザーメニューボタン
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenuButton && userDropdown) {
      userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = userDropdown.style.display === 'block';
        
        // aria-expanded属性を更新（アクセシビリティ）
        userMenuButton.setAttribute('aria-expanded', !isVisible);
        
        userDropdown.style.display = isVisible ? 'none' : 'block';
      });

      // ドロップダウン外をクリックで閉じる
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-user-menu')) {
          userDropdown.style.display = 'none';
          userMenuButton.setAttribute('aria-expanded', 'false');
        }
      });
      
      // ESCキーで閉じる
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && userDropdown.style.display === 'block') {
          userDropdown.style.display = 'none';
          userMenuButton.setAttribute('aria-expanded', 'false');
          userMenuButton.focus();
        }
      });
    }

    // ログアウトボタン
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.logout();
      });
    }
  }

  // ログアウト処理（サーバー側でセッション削除）
  async logout() {
    if (!confirm('ログアウトしますか？')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    // ローカルデータをクリア
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  }

  // 強制ログアウト（トークン無効時）
  forceLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    const navGuest = document.getElementById('nav-guest');
    const navUser = document.getElementById('nav-user');
    if (navGuest) navGuest.style.display = 'flex';
    if (navUser) navUser.style.display = 'none';
  }

  // カートバッジを更新
  updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (!cartBadge) return;

    const cart = this.getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
      cartBadge.textContent = totalItems;
      cartBadge.style.display = 'block';
    } else {
      cartBadge.style.display = 'none';
    }
  }

  // カートデータを取得
  getCart() {
    const cartStr = localStorage.getItem('cart');
    if (!cartStr) return [];
    try {
      return JSON.parse(cartStr);
    } catch (e) {
      console.error('Error parsing cart data:', e);
      return [];
    }
  }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
  new UserMenu();
});

// カート更新イベントをリッスン
window.addEventListener('cartUpdated', () => {
  const userMenu = new UserMenu();
  userMenu.updateCartBadge();
});
