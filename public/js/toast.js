/**
 * トースト通知システム
 * 使い方: showToast('メッセージ', 'success|error|warning|info')
 */

class Toast {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // トーストコンテナを作成
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // アイコンを設定
    const icon = this.getIcon(type);
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <p class="toast-message">${this.escapeHtml(message)}</p>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    this.container.appendChild(toast);

    // アニメーション
    setTimeout(() => toast.classList.add('toast-show'), 10);

    // 自動削除
    if (duration > 0) {
      setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  }

  getIcon(type) {
    const icons = {
      success: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 6V10M10 14H10.01M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 6V10M10 14H10.01M8.27208 3.18305L1.82207 14.5C1.47331 15.0849 1.29893 15.3774 1.34324 15.6111C1.38206 15.8145 1.50622 15.9917 1.68433 16.0972C1.89011 16.2181 2.23953 16.2181 2.93836 16.2181H15.8382C16.537 16.2181 16.8865 16.2181 17.0922 16.0972C17.2704 15.9917 17.3945 15.8145 17.4333 15.6111C17.4777 15.3774 17.3033 15.0849 16.9545 14.5L10.5045 3.18305C10.1588 2.60313 9.98593 2.31317 9.76697 2.21821C9.57641 2.13584 9.35974 2.13584 9.16919 2.21821C8.95023 2.31317 8.77736 2.60313 8.43162 3.18305H8.27208Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 14V10M10 6H10.01M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`
    };
    return icons[type] || icons.info;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 4000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 3500) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  loading(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-loading';
    
    toast.innerHTML = `
      <div class="toast-icon">
        <div class="spinner"></div>
      </div>
      <div class="toast-content">
        <p class="toast-message">${this.escapeHtml(message)}</p>
      </div>
    `;

    this.container.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-show'), 10);

    return toast;
  }

  removeLoading(toast) {
    if (toast) {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }
  }
}

// グローバルインスタンス
const toast = new Toast();

// グローバル関数
window.showToast = (message, type, duration) => toast.show(message, type, duration);
window.toast = toast;
