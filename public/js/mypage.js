// マイページ - API連携版
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    window.location.href = '/login.html?redirect=/mypage.html';
    return;
  }

  // ローディング表示
  showLoading();

  try {
    // ユーザー情報を取得
    const userResponse = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userResponse.ok) {
      throw new Error('認証エラー');
    }

    const userData = await userResponse.json();
    const user = userData.user;

    // ユーザー情報を表示
    displayUserInfo(user);

    // 最近の注文を取得
    await loadRecentOrders(user.id, token);

    // サービス申込み履歴を取得
    await loadServiceApplications(user.id, token);

  } catch (error) {
    console.error('Error loading mypage:', error);
    showError('データの読み込みに失敗しました。再度ログインしてください。');
    setTimeout(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/login.html';
    }, 2000);
  } finally {
    hideLoading();
  }
});

// ユーザー情報を表示
function displayUserInfo(user) {
  const userInfoEl = document.getElementById('user-info');
  userInfoEl.innerHTML = `
    <div style="margin-bottom: 15px;">
      <strong>お名前:</strong> ${user.lastName} ${user.firstName}
    </div>
    <div style="margin-bottom: 15px;">
      <strong>メールアドレス:</strong> ${user.email}
    </div>
    ${user.phone ? `
    <div style="margin-bottom: 15px;">
      <strong>電話番号:</strong> ${user.phone}
    </div>
    ` : ''}
    ${user.company ? `
    <div style="margin-bottom: 15px;">
      <strong>会社名:</strong> ${user.company}
    </div>
    ` : ''}
    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-size: 0.9em; color: #666;">
      登録日: ${new Date(user.createdAt).toLocaleDateString('ja-JP')}
    </div>
  `;
}

// 最近の注文を読み込み
async function loadRecentOrders(userId, token) {
  try {
    const response = await fetch(`/api/orders/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('注文履歴の取得に失敗しました');
    }

    const data = await response.json();
    const orders = data.orders || [];

    const recentOrdersEl = document.getElementById('recent-orders');
    
    if (orders.length === 0) {
      recentOrdersEl.innerHTML = '<p style="color: #666; font-size: 0.95em;">注文履歴はありません</p>';
      return;
    }

    // 最新3件のみ表示
    const recentOrders = orders.slice(0, 3);
    
    recentOrdersEl.innerHTML = recentOrders.map(order => `
      <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div>
            <strong>${order.order_number}</strong>
            <span style="display: inline-block; margin-left: 10px; padding: 2px 8px; background: ${getStatusColor(order.status)}; color: white; font-size: 0.8em; border-radius: 3px;">
              ${getStatusText(order.status)}
            </span>
          </div>
          <div style="font-weight: bold; color: #ff6b35;">
            ¥${order.total_amount.toLocaleString()}
          </div>
        </div>
        <div style="font-size: 0.9em; color: #666;">
          ${new Date(order.created_at).toLocaleDateString('ja-JP')}
          ${order.delivery_date ? `・配送予定: ${order.delivery_date}` : ''}
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading orders:', error);
    document.getElementById('recent-orders').innerHTML = '<p style="color: #e74c3c;">注文履歴の読み込みに失敗しました</p>';
  }
}

// サービス申込み履歴を読み込み
async function loadServiceApplications(userId, token) {
  try {
    const response = await fetch(`/api/services/applications/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      // サービス申込みがない場合はエラーにしない
      return;
    }

    const data = await response.json();
    const applications = data.applications || [];

    if (applications.length === 0) {
      return;
    }

    // サービス申込みカードを追加
    const mypageGrid = document.querySelector('.mypage-grid');
    const serviceCard = document.createElement('div');
    serviceCard.className = 'mypage-card';
    serviceCard.innerHTML = `
      <h3>サービス申込み状況</h3>
      <div id="service-applications">
        ${applications.slice(0, 2).map(app => `
          <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 10px;">
            <div style="margin-bottom: 8px;">
              <strong>${app.service_name}</strong>
              <span style="display: inline-block; margin-left: 10px; padding: 2px 8px; background: ${getApplicationStatusColor(app.status)}; color: white; font-size: 0.8em; border-radius: 3px;">
                ${getApplicationStatusText(app.status)}
              </span>
            </div>
            <div style="font-size: 0.9em; color: #666;">
              申込日: ${new Date(app.created_at).toLocaleDateString('ja-JP')}
            </div>
          </div>
        `).join('')}
      </div>
      <a href="/service-applications.html" class="btn-secondary" style="margin-top: 10px;">すべての申込みを見る</a>
    `;
    mypageGrid.appendChild(serviceCard);

  } catch (error) {
    console.error('Error loading service applications:', error);
  }
}

// ステータスの色を取得
function getStatusColor(status) {
  const colors = {
    'pending': '#6c757d',
    'paid': '#28a745',
    'processing': '#17a2b8',
    'shipped': '#007bff',
    'delivered': '#28a745',
    'cancelled': '#dc3545'
  };
  return colors[status] || '#6c757d';
}

// ステータスのテキストを取得
function getStatusText(status) {
  const texts = {
    'pending': '処理中',
    'paid': '支払済',
    'processing': '準備中',
    'shipped': '発送済',
    'delivered': '配送完了',
    'cancelled': 'キャンセル'
  };
  return texts[status] || status;
}

// 申込みステータスの色を取得
function getApplicationStatusColor(status) {
  const colors = {
    'pending': '#6c757d',
    'contacted': '#17a2b8',
    'in_progress': '#ffc107',
    'accepted': '#28a745',
    'rejected': '#dc3545',
    'cancelled': '#6c757d'
  };
  return colors[status] || '#6c757d';
}

// 申込みステータスのテキストを取得
function getApplicationStatusText(status) {
  const texts = {
    'pending': '受付中',
    'contacted': '連絡済',
    'in_progress': '進行中',
    'accepted': '契約済',
    'rejected': '見送り',
    'cancelled': 'キャンセル'
  };
  return texts[status] || status;
}

// ローディング表示
function showLoading() {
  const loading = document.createElement('div');
  loading.id = 'loading-overlay';
  loading.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255,255,255,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  loading.innerHTML = `
    <div style="text-align: center;">
      <div style="border: 4px solid #f3f3f3; border-top: 4px solid #ff6b35; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
      <p style="color: #666;">読み込み中...</p>
    </div>
  `;
  document.body.appendChild(loading);

  // CSS animation
  if (!document.getElementById('loading-style')) {
    const style = document.createElement('style');
    style.id = 'loading-style';
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
}

// ローディング非表示
function hideLoading() {
  const loading = document.getElementById('loading-overlay');
  if (loading) {
    loading.remove();
  }
}

// エラー表示
function showError(message) {
  const error = document.createElement('div');
  error.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 400px;
  `;
  error.textContent = message;
  document.body.appendChild(error);

  setTimeout(() => {
    error.remove();
  }, 5000);
}
