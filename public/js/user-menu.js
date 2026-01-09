// ユーザーメニュー管理
class UserMenu {
  constructor() {
    this.init();
  }

  init() {
    this.checkLoginStatus();
    this.setupEventListeners();
  }

  // ログイン状態を確認
  checkLoginStatus() {
    const user = this.getCurrentUser();
    const navGuest = document.getElementById('nav-guest');
    const navUser = document.getElementById('nav-user');
    const userName = document.getElementById('user-name');

    if (user) {
      // ログイン済み
      if (navGuest) navGuest.style.display = 'none';
      if (navUser) navUser.style.display = 'flex';
      if (userName) userName.textContent = user.name || user.email;
    } else {
      // 未ログイン
      if (navGuest) navGuest.style.display = 'flex';
      if (navUser) navUser.style.display = 'none';
    }

    // カートバッジを更新
    this.updateCartBadge();
  }

  // 現在のユーザーを取得
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
        userDropdown.style.display = isVisible ? 'none' : 'block';
      });

      // ドロップダウン外をクリックで閉じる
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-user-menu')) {
          userDropdown.style.display = 'none';
        }
      });
    }

    // ログアウトボタン
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  // ログアウト処理
  logout() {
    if (confirm('ログアウトしますか？')) {
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
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
