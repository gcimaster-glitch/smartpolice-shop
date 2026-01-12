/**
 * 管理画面メイン制御
 */

let dashboard = null;

/**
 * ログイン処理
 */
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    window.toast.error('メールアドレスとパスワードを入力してください');
    return;
  }

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'ログインに失敗しました');
    }

    const data = await response.json();
    
    // トークンとユーザー情報を保存
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin', JSON.stringify(data.admin));

    // ログイン画面を非表示にしてメイン画面を表示
    document.getElementById('login-screen').classList.add('hidden');
    
    // 管理画面初期化
    await initAdmin();

    window.toast.success('ログインしました');

  } catch (error) {
    console.error('Login error:', error);
    window.toast.error(error.message || 'ログインに失敗しました');
  }
}

/**
 * ログアウト処理
 */
function logout() {
  if (!confirm('ログアウトしますか？')) {
    return;
  }

  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin');
  
  // ダッシュボードクリーンアップ
  if (dashboard) {
    dashboard.destroy();
    dashboard = null;
  }
  
  // ログイン画面表示
  document.getElementById('login-screen').classList.remove('hidden');
  
  window.toast.success('ログアウトしました');
}

/**
 * ページ切り替え
 */
function switchPage(pageName) {
  // すべてのページとナビゲーションアイテムを非アクティブ化
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // 指定されたページとナビゲーションアイテムをアクティブ化
  const page = document.getElementById(`page-${pageName}`);
  if (page) {
    page.classList.add('active');
  }

  const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }

  // ページごとの初期化処理
  switch (pageName) {
    case 'dashboard':
      if (dashboard) {
        dashboard.refresh();
      }
      break;
    case 'orders':
      if (window.OrdersManager) {
        window.ordersManager = new window.OrdersManager();
        window.ordersManager.init();
      }
      break;
    case 'services':
      if (window.ServicesManager) {
        window.servicesManager = new window.ServicesManager();
        window.servicesManager.init();
      }
      break;
  }
}

/**
 * 管理画面初期化
 */
async function initAdmin() {
  try {
    // 管理者情報を表示
    const admin = JSON.parse(localStorage.getItem('admin'));
    if (admin) {
      document.getElementById('admin-name').textContent = admin.name;
      document.getElementById('admin-email').textContent = admin.email;
      
      // アバターのイニシャル
      const avatar = document.querySelector('.admin-avatar');
      if (avatar && admin.name) {
        avatar.textContent = admin.name.charAt(0).toUpperCase();
      }
    }

    // ダッシュボード初期化
    dashboard = new window.AdminDashboard();
    await dashboard.init();

    // ナビゲーションイベントリスナー
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = item.getAttribute('data-page');
        switchPage(pageName);
      });
    });

  } catch (error) {
    console.error('Admin init error:', error);
    window.toast.error('管理画面の初期化に失敗しました');
  }
}

/**
 * 注文エクスポート
 */
async function exportOrders() {
  try {
    window.toast.loading('エクスポート中...');
    
    const token = localStorage.getItem('admin_token');
    if (!token) {
      throw new Error('認証トークンがありません');
    }

    const response = await fetch('/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('注文データの取得に失敗しました');
    }

    const data = await response.json();
    const orders = data.orders || [];

    // CSVデータ作成
    const headers = ['注文番号', '顧客名', 'メール', '電話番号', '金額', 'ステータス', '配送日', '注文日'];
    const rows = orders.map(order => [
      order.order_number,
      order.customer_name,
      order.customer_email,
      order.customer_phone,
      order.total_amount,
      order.status,
      order.delivery_date,
      new Date(order.created_at).toLocaleString('ja-JP')
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // ダウンロード
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    window.toast.removeLoading();
    window.toast.success('エクスポートが完了しました');

  } catch (error) {
    console.error('Export error:', error);
    window.toast.removeLoading();
    window.toast.error('エクスポートに失敗しました');
  }
}

/**
 * 商品追加モーダル表示
 */
function showAddProductModal() {
  window.toast.info('商品追加機能は準備中です');
}

/**
 * ページロード時の初期化
 */
document.addEventListener('DOMContentLoaded', () => {
  // トークンチェック
  const token = localStorage.getItem('admin_token');
  
  if (token) {
    // トークンがあればログイン画面を非表示にして管理画面を表示
    document.getElementById('login-screen').classList.add('hidden');
    initAdmin();
  } else {
    // トークンがなければログイン画面を表示
    document.getElementById('login-screen').classList.remove('hidden');
  }
});
