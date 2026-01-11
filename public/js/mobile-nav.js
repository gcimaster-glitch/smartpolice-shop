/**
 * モバイルナビゲーション - ハンバーガーメニュー
 */

class MobileNav {
  constructor() {
    this.isOpen = false;
    this.init();
  }

  init() {
    // ハンバーガーメニューボタンを作成
    this.createMobileMenuButton();
    // モバイルメニューオーバーレイを作成
    this.createMobileMenuOverlay();
    // イベントリスナーを設定
    this.setupEventListeners();
  }

  createMobileMenuButton() {
    // 既存のハンバーガーボタンがあれば削除
    const existingButton = document.getElementById('mobile-menu-button');
    if (existingButton) {
      existingButton.remove();
    }

    const header = document.querySelector('.header-new');
    if (!header) return;

    const button = document.createElement('button');
    button.id = 'mobile-menu-button';
    button.className = 'mobile-menu-button';
    button.setAttribute('aria-label', 'メニューを開く');
    button.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    `;

    // ヘッダーの最後に追加
    const headerContent = header.querySelector('.header-content');
    if (headerContent) {
      headerContent.appendChild(button);
    }
  }

  createMobileMenuOverlay() {
    // 既存のオーバーレイがあれば削除
    const existingOverlay = document.getElementById('mobile-menu-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'mobile-menu-overlay';
    overlay.className = 'mobile-menu-overlay';

    // メニュー内容を作成
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const authToken = localStorage.getItem('authToken');

    overlay.innerHTML = `
      <div class="mobile-menu-content">
        <div class="mobile-menu-header">
          <img src="/images/logo.png" alt="SmartPolice" style="height: 40px;">
          <button class="mobile-menu-close" aria-label="メニューを閉じる">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <nav class="mobile-menu-nav">
          <a href="/info.html" class="mobile-menu-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13H9v-2h2v2zm0-4H9V7h2v4z" fill="currentColor"/>
            </svg>
            INFO
          </a>
          <a href="/service.html" class="mobile-menu-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L2 7v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V7l-8-5z" fill="currentColor"/>
            </svg>
            SERVICE
          </a>
          <a href="/products.html" class="mobile-menu-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 4h10l2 2v10l-2 2H5l-2-2V6l2-2zm0 2v10h10V6H5z" fill="currentColor"/>
            </svg>
            PRODUCTS
          </a>
          <a href="/faq.html" class="mobile-menu-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M10 14v-1m0-4a2 2 0 112 2c-1 0-2 1-2 2" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            FAQ
          </a>
          <a href="/customer-support.html" class="mobile-menu-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.58 2 2 5.58 2 10c0 1.85.63 3.55 1.69 4.9L2 18l3.34-1.55C6.67 17.41 8.26 18 10 18c4.42 0 8-3.58 8-8s-3.58-8-8-8z" fill="currentColor"/>
            </svg>
            SUPPORT
          </a>
          <a href="/about.html" class="mobile-menu-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 12a1 1 0 110-2 1 1 0 010 2zm1-4V6H9v4h2z" fill="currentColor"/>
            </svg>
            ABOUT US
          </a>
          <a href="/contact.html" class="mobile-menu-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1zm0 2l7 4 7-4v8H3V6z" fill="currentColor"/>
            </svg>
            CONTACT
          </a>
        </nav>

        <div class="mobile-menu-divider"></div>

        ${authToken && currentUser ? `
          <div class="mobile-menu-user">
            <div class="mobile-user-info">
              <div class="mobile-user-avatar">
                ${this.getInitials(currentUser)}
              </div>
              <div class="mobile-user-details">
                <p class="mobile-user-name">${this.escapeHtml(currentUser.lastName + ' ' + currentUser.firstName)}</p>
                <p class="mobile-user-email">${this.escapeHtml(currentUser.email)}</p>
              </div>
            </div>
            <a href="/mypage.html" class="mobile-menu-link">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a4 4 0 100 8 4 4 0 000-8zM3 18a7 7 0 0114 0H3z" fill="currentColor"/>
              </svg>
              マイページ
            </a>
            <a href="/profile.html" class="mobile-menu-link">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M17 3H3v14h14V3zM7 7h6v2H7V7zm0 4h6v2H7v-2z" fill="currentColor"/>
              </svg>
              個人情報編集
            </a>
            <a href="/orders.html" class="mobile-menu-link">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 2h14v16H3V2zm2 2v12h10V4H5zm2 3h6v2H7V7zm0 4h4v2H7v-2z" fill="currentColor"/>
              </svg>
              購入履歴
            </a>
            <button class="mobile-menu-link mobile-logout-btn" id="mobile-logout-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M13 2v2h4v12h-4v2h6V2h-6zm-3 4l-6 4 6 4v-3h6V9H10V6z" fill="currentColor"/>
              </svg>
              ログアウト
            </button>
          </div>
        ` : `
          <div class="mobile-menu-actions">
            <a href="/login.html" class="mobile-menu-btn mobile-menu-btn-outline">
              ログイン
            </a>
            <a href="/register.html" class="mobile-menu-btn mobile-menu-btn-primary">
              新規登録
            </a>
          </div>
        `}
      </div>
    `;

    document.body.appendChild(overlay);
  }

  setupEventListeners() {
    // ハンバーガーボタンのクリック
    const menuButton = document.getElementById('mobile-menu-button');
    if (menuButton) {
      menuButton.addEventListener('click', () => this.toggleMenu());
    }

    // 閉じるボタンのクリック
    const closeButton = document.querySelector('.mobile-menu-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeMenu());
    }

    // オーバーレイの背景クリック
    const overlay = document.getElementById('mobile-menu-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeMenu();
        }
      });
    }

    // ログアウトボタン
    const logoutBtn = document.getElementById('mobile-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // メニューリンクのクリック
    const menuLinks = document.querySelectorAll('.mobile-menu-link');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (!link.classList.contains('mobile-logout-btn')) {
          this.closeMenu();
        }
      });
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    const overlay = document.getElementById('mobile-menu-overlay');
    const button = document.getElementById('mobile-menu-button');
    
    if (overlay && button) {
      this.isOpen = true;
      overlay.classList.add('mobile-menu-open');
      button.classList.add('mobile-menu-button-active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeMenu() {
    const overlay = document.getElementById('mobile-menu-overlay');
    const button = document.getElementById('mobile-menu-button');
    
    if (overlay && button) {
      this.isOpen = false;
      overlay.classList.remove('mobile-menu-open');
      button.classList.remove('mobile-menu-button-active');
      document.body.style.overflow = '';
    }
  }

  handleLogout() {
    if (confirm('ログアウトしますか？')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      
      if (window.toast) {
        window.toast.success('ログアウトしました');
      }
      
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  }

  getInitials(user) {
    if (!user) return '?';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (last + first).toUpperCase() || '?';
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
  // モバイルナビゲーションを初期化
  new MobileNav();
});
