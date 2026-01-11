// 購入履歴ページ - API連携版
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    window.location.href = '/login.html?redirect=/orders.html';
    return;
  }

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

    // 注文履歴を取得
    await loadOrders(user.id, token);

  } catch (error) {
    console.error('Error loading orders:', error);
    showError('データの読み込みに失敗しました。');
  } finally {
    hideLoading();
  }
});

// 注文履歴を読み込み
async function loadOrders(userId, token) {
  try {
    const response = await fetch(`/api/orders/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('注文履歴の取得に失敗しました');
    }

    const data = await response.json();
    const orders = data.orders || [];

    const ordersContainer = document.getElementById('orders-container');
    
    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" style="margin-bottom: 20px;">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <h3 style="color: #666; margin-bottom: 10px;">まだ注文がありません</h3>
          <p style="color: #999; margin-bottom: 30px;">商品をご注文いただくと、こちらに履歴が表示されます</p>
          <a href="/products.html" class="btn-primary">商品を見る</a>
        </div>
      `;
      return;
    }

    ordersContainer.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-header">
          <div>
            <h3 style="margin: 0 0 5px 0;">${order.order_number}</h3>
            <p style="margin: 0; font-size: 0.9em; color: #666;">
              注文日: ${new Date(order.created_at).toLocaleString('ja-JP')}
            </p>
          </div>
          <div style="text-align: right;">
            <span class="order-status" style="background: ${getStatusColor(order.status)};">
              ${getStatusText(order.status)}
            </span>
            <div style="margin-top: 8px; font-size: 1.2em; font-weight: bold; color: #ff6b35;">
              ¥${order.total_amount.toLocaleString()}
            </div>
          </div>
        </div>
        
        ${order.delivery_date || order.delivery_time ? `
        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin: 15px 0;">
          <div style="font-size: 0.9em; color: #666;">
            ${order.delivery_date ? `<div style="margin-bottom: 5px;"><strong>配送予定日:</strong> ${order.delivery_date}</div>` : ''}
            ${order.delivery_time ? `<div><strong>配送時間帯:</strong> ${order.delivery_time}</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        <div style="padding: 15px 0; border-top: 1px solid #eee;">
          <div style="font-size: 0.9em; color: #666; margin-bottom: 10px;">
            <strong>配送先:</strong> ${order.shipping_address || '未設定'}
          </div>
          ${order.tracking_number ? `
          <div style="font-size: 0.9em; color: #666;">
            <strong>追跡番号:</strong> ${order.tracking_number}
          </div>
          ` : ''}
        </div>
        
        <div class="order-actions">
          <button class="btn-secondary" onclick="viewOrderDetail('${order.order_number}')">
            詳細を見る
          </button>
          ${order.status === 'delivered' ? `
          <button class="btn-secondary" onclick="reorder('${order.id}')">
            再注文する
          </button>
          ` : ''}
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading orders:', error);
    document.getElementById('orders-container').innerHTML = `
      <div style="text-align: center; padding: 40px; color: #e74c3c;">
        <p>注文履歴の読み込みに失敗しました。</p>
        <button class="btn-primary" onclick="location.reload()">再読み込み</button>
      </div>
    `;
  }
}

// 注文詳細を表示
window.viewOrderDetail = function(orderNumber) {
  // モーダルまたは詳細ページに遷移
  alert(`注文詳細: ${orderNumber}\n（詳細ページは次のフェーズで実装）`);
  // 本番実装: window.location.href = `/order-detail.html?order=${orderNumber}`;
}

// 再注文
window.reorder = function(orderId) {
  alert('再注文機能は準備中です');
  // 本番実装: 注文内容をカートに追加
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
