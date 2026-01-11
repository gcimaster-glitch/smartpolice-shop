/**
 * 管理画面 - 注文管理・サービス申込み管理
 */

// 注文管理
async function loadOrders() {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('注文の取得に失敗しました');
    }

    const data = await response.json();
    displayOrders(data.orders || []);
  } catch (error) {
    console.error('注文取得エラー:', error);
    toast.error('注文の取得に失敗しました');
  }
}

function displayOrders(orders) {
  const container = document.getElementById('orders-list');
  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #718096;">
        <p style="font-size: 16px;">注文はまだありません</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="orders-table">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left; font-weight: 600;">注文番号</th>
            <th style="padding: 12px; text-align: left; font-weight: 600;">顧客名</th>
            <th style="padding: 12px; text-align: left; font-weight: 600;">メール</th>
            <th style="padding: 12px; text-align: right; font-weight: 600;">金額</th>
            <th style="padding: 12px; text-align: center; font-weight: 600;">配送日</th>
            <th style="padding: 12px; text-align: center; font-weight: 600;">ステータス</th>
            <th style="padding: 12px; text-align: center; font-weight: 600;">操作</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-family: monospace;">${order.order_number}</td>
              <td style="padding: 12px;">${escapeHtml(order.customer_name || '-')}</td>
              <td style="padding: 12px;">${escapeHtml(order.customer_email || '-')}</td>
              <td style="padding: 12px; text-align: right; font-weight: 600;">¥${(order.total_amount || 0).toLocaleString()}</td>
              <td style="padding: 12px; text-align: center;">${order.delivery_date || '-'}</td>
              <td style="padding: 12px; text-align: center;">
                ${getStatusBadge(order.status)}
              </td>
              <td style="padding: 12px; text-align: center;">
                <select 
                  onchange="updateOrderStatus(${order.id}, this.value)"
                  style="padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; cursor: pointer;"
                >
                  <option value="">変更...</option>
                  <option value="pending">保留中</option>
                  <option value="paid">支払済</option>
                  <option value="processing">処理中</option>
                  <option value="shipped">発送済</option>
                  <option value="delivered">配達完了</option>
                  <option value="cancelled">キャンセル</option>
                </select>
                <button 
                  onclick="viewOrderDetail(${order.id})"
                  style="margin-left: 8px; padding: 6px 12px; background: #007aff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;"
                >
                  詳細
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getStatusBadge(status) {
  const statusMap = {
    pending: { label: '保留中', color: '#fbbf24' },
    paid: { label: '支払済', color: '#10b981' },
    processing: { label: '処理中', color: '#3b82f6' },
    shipped: { label: '発送済', color: '#8b5cf6' },
    delivered: { label: '配達完了', color: '#059669' },
    cancelled: { label: 'キャンセル', color: '#ef4444' }
  };
  
  const s = statusMap[status] || { label: status, color: '#6b7280' };
  return `<span style="display: inline-block; padding: 4px 12px; background: ${s.color}20; color: ${s.color}; border-radius: 12px; font-size: 12px; font-weight: 600;">${s.label}</span>`;
}

async function updateOrderStatus(orderId, newStatus) {
  if (!newStatus) return;
  
  if (!confirm(`注文のステータスを「${newStatus}」に変更しますか？`)) {
    return;
  }

  const loadingToast = toast.loading('ステータスを更新中...');

  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('ステータスの更新に失敗しました');
    }

    toast.removeLoading(loadingToast);
    toast.success('ステータスを更新しました');
    
    // 注文リストを再読み込み
    await loadOrders();
  } catch (error) {
    console.error('ステータス更新エラー:', error);
    toast.removeLoading(loadingToast);
    toast.error(error.message || 'ステータスの更新に失敗しました');
  }
}

function viewOrderDetail(orderId) {
  alert(`注文詳細ページは今後実装予定です。注文ID: ${orderId}`);
}

// サービス申込み管理
async function loadServiceApplications() {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/admin/services/applications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('サービス申込みの取得に失敗しました');
    }

    const data = await response.json();
    displayServiceApplications(data.applications || []);
  } catch (error) {
    console.error('サービス申込み取得エラー:', error);
    toast.error('サービス申込みの取得に失敗しました');
  }
}

function displayServiceApplications(applications) {
  const container = document.getElementById('service-applications-list');
  if (!applications || applications.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #718096;">
        <p style="font-size: 16px;">サービス申込みはまだありません</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="applications-table">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f7fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left; font-weight: 600;">申込ID</th>
            <th style="padding: 12px; text-align: left; font-weight: 600;">サービス名</th>
            <th style="padding: 12px; text-align: left; font-weight: 600;">申込者</th>
            <th style="padding: 12px; text-align: left; font-weight: 600;">メール</th>
            <th style="padding: 12px; text-align: center; font-weight: 600;">申込日</th>
            <th style="padding: 12px; text-align: center; font-weight: 600;">ステータス</th>
            <th style="padding: 12px; text-align: center; font-weight: 600;">操作</th>
          </tr>
        </thead>
        <tbody>
          ${applications.map(app => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-family: monospace;">#${app.id}</td>
              <td style="padding: 12px; font-weight: 600;">${escapeHtml(app.service_name || '-')}</td>
              <td style="padding: 12px;">${escapeHtml(app.company_name || app.customer_name || '-')}</td>
              <td style="padding: 12px;">${escapeHtml(app.email || '-')}</td>
              <td style="padding: 12px; text-align: center;">${formatDate(app.created_at)}</td>
              <td style="padding: 12px; text-align: center;">
                ${getApplicationStatusBadge(app.status)}
              </td>
              <td style="padding: 12px; text-align: center;">
                <select 
                  onchange="updateApplicationStatus(${app.id}, this.value)"
                  style="padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; cursor: pointer;"
                >
                  <option value="">変更...</option>
                  <option value="pending">保留中</option>
                  <option value="reviewing">審査中</option>
                  <option value="approved">承認済</option>
                  <option value="rejected">却下</option>
                  <option value="completed">完了</option>
                </select>
                <button 
                  onclick="viewApplicationDetail(${app.id})"
                  style="margin-left: 8px; padding: 6px 12px; background: #007aff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;"
                >
                  詳細
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getApplicationStatusBadge(status) {
  const statusMap = {
    pending: { label: '保留中', color: '#fbbf24' },
    reviewing: { label: '審査中', color: '#3b82f6' },
    approved: { label: '承認済', color: '#10b981' },
    rejected: { label: '却下', color: '#ef4444' },
    completed: { label: '完了', color: '#059669' }
  };
  
  const s = statusMap[status] || { label: status, color: '#6b7280' };
  return `<span style="display: inline-block; padding: 4px 12px; background: ${s.color}20; color: ${s.color}; border-radius: 12px; font-size: 12px; font-weight: 600;">${s.label}</span>`;
}

async function updateApplicationStatus(applicationId, newStatus) {
  if (!newStatus) return;
  
  if (!confirm(`申込みのステータスを「${newStatus}」に変更しますか？`)) {
    return;
  }

  const loadingToast = toast.loading('ステータスを更新中...');

  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/admin/services/applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('ステータスの更新に失敗しました');
    }

    toast.removeLoading(loadingToast);
    toast.success('ステータスを更新しました');
    
    // サービス申込みリストを再読み込み
    await loadServiceApplications();
  } catch (error) {
    console.error('ステータス更新エラー:', error);
    toast.removeLoading(loadingToast);
    toast.error(error.message || 'ステータスの更新に失敗しました');
  }
}

function viewApplicationDetail(applicationId) {
  alert(`申込み詳細ページは今後実装予定です。申込みID: ${applicationId}`);
}

// ユーティリティ関数
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
