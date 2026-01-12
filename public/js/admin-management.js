/**
 * 注文管理クラス
 */
class OrdersManager {
  constructor() {
    this.orders = [];
  }

  async init() {
    try {
      await this.loadOrders();
      this.setupEventListeners();
    } catch (error) {
      console.error('Orders manager init error:', error);
      window.toast.error('注文管理の初期化に失敗しました');
    }
  }

  setupEventListeners() {
    // 検索
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterOrders(e.target.value);
      });
    }

    // ステータスフィルター
    const statusFilter = document.getElementById('order-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filterOrders(null, e.target.value);
      });
    }

    // 全選択
    const selectAll = document.getElementById('select-all-orders');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        this.selectAllOrders(e.target.checked);
      });
    }
  }

  async loadOrders() {
    try {
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
        throw new Error('注文の取得に失敗しました');
      }

      const data = await response.json();
      this.orders = data.orders || [];
      this.displayOrders(this.orders);

    } catch (error) {
      console.error('Load orders error:', error);
      throw error;
    }
  }

  displayOrders(orders) {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="no-data">注文がありません</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders.map(order => `
      <tr>
        <td><input type="checkbox" class="order-checkbox" data-id="${order.id}"></td>
        <td><strong>${order.order_number}</strong></td>
        <td>${order.customer_name}</td>
        <td>¥${order.total_amount.toLocaleString()}</td>
        <td>${order.delivery_date || '-'}</td>
        <td>
          <select class="filter-select" onchange="updateOrderStatus(${order.id}, this.value)">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>保留中</option>
            <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>支払済</option>
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>処理中</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>発送済</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>配達完了</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>キャンセル</option>
          </select>
        </td>
        <td>${new Date(order.created_at).toLocaleDateString('ja-JP')}</td>
        <td>
          <button class="btn-primary" onclick="viewOrderDetails('${order.order_number}')" style="padding: 6px 12px; font-size: 13px;">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  filterOrders(searchTerm = null, status = null) {
    let filtered = [...this.orders];

    // 検索フィルター
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(term) ||
        order.customer_name.toLowerCase().includes(term)
      );
    }

    // ステータスフィルター
    const statusFilter = document.getElementById('order-status-filter');
    const selectedStatus = status || (statusFilter ? statusFilter.value : '');
    if (selectedStatus) {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    this.displayOrders(filtered);
  }

  selectAllOrders(checked) {
    document.querySelectorAll('.order-checkbox').forEach(checkbox => {
      checkbox.checked = checked;
    });
  }
}

/**
 * サービス申込み管理クラス
 */
class ServicesManager {
  constructor() {
    this.applications = [];
  }

  async init() {
    try {
      await this.loadApplications();
      this.setupEventListeners();
    } catch (error) {
      console.error('Services manager init error:', error);
      window.toast.error('サービス管理の初期化に失敗しました');
    }
  }

  setupEventListeners() {
    // 検索
    const searchInput = document.getElementById('service-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterApplications(e.target.value);
      });
    }

    // ステータスフィルター
    const statusFilter = document.getElementById('service-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filterApplications(null, e.target.value);
      });
    }
  }

  async loadApplications() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const response = await fetch('/api/admin/services/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('申込みの取得に失敗しました');
      }

      const data = await response.json();
      this.applications = data.applications || [];
      this.displayApplications(this.applications);

    } catch (error) {
      console.error('Load applications error:', error);
      throw error;
    }
  }

  displayApplications(applications) {
    const tbody = document.getElementById('services-table-body');
    if (!tbody) return;

    if (applications.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="no-data">申込みがありません</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = applications.map(app => `
      <tr>
        <td>${app.id}</td>
        <td>${app.service_name || '-'}</td>
        <td>${app.user_name || '-'}</td>
        <td>${app.user_email || '-'}</td>
        <td>${new Date(app.created_at).toLocaleDateString('ja-JP')}</td>
        <td>
          <select class="filter-select" onchange="updateApplicationStatus(${app.id}, this.value)">
            <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>保留中</option>
            <option value="reviewing" ${app.status === 'reviewing' ? 'selected' : ''}>審査中</option>
            <option value="approved" ${app.status === 'approved' ? 'selected' : ''}>承認済</option>
            <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>却下</option>
          </select>
        </td>
        <td>
          <button class="btn-primary" onclick="viewApplicationDetails(${app.id})" style="padding: 6px 12px; font-size: 13px;">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  filterApplications(searchTerm = null, status = null) {
    let filtered = [...this.applications];

    // 検索フィルター
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        (app.service_name && app.service_name.toLowerCase().includes(term)) ||
        (app.user_name && app.user_name.toLowerCase().includes(term)) ||
        (app.user_email && app.user_email.toLowerCase().includes(term))
      );
    }

    // ステータスフィルター
    const statusFilter = document.getElementById('service-status-filter');
    const selectedStatus = status || (statusFilter ? statusFilter.value : '');
    if (selectedStatus) {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }

    this.displayApplications(filtered);
  }
}

/**
 * 注文ステータス更新
 */
async function updateOrderStatus(orderId, newStatus) {
  try {
    window.toast.loading('ステータスを更新中...');

    const token = localStorage.getItem('admin_token');
    if (!token) {
      throw new Error('認証トークンがありません');
    }

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('ステータスの更新に失敗しました');
    }

    window.toast.removeLoading();
    window.toast.success('ステータスを更新しました');

    // リストを再読み込み
    if (window.ordersManager) {
      await window.ordersManager.loadOrders();
    }

  } catch (error) {
    console.error('Update order status error:', error);
    window.toast.removeLoading();
    window.toast.error('ステータスの更新に失敗しました');
  }
}

/**
 * サービス申込みステータス更新
 */
async function updateApplicationStatus(applicationId, newStatus) {
  try {
    window.toast.loading('ステータスを更新中...');

    const token = localStorage.getItem('admin_token');
    if (!token) {
      throw new Error('認証トークンがありません');
    }

    const response = await fetch(`/api/admin/services/applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('ステータスの更新に失敗しました');
    }

    window.toast.removeLoading();
    window.toast.success('ステータスを更新しました');

    // リストを再読み込み
    if (window.servicesManager) {
      await window.servicesManager.loadApplications();
    }

  } catch (error) {
    console.error('Update application status error:', error);
    window.toast.removeLoading();
    window.toast.error('ステータスの更新に失敗しました');
  }
}

/**
 * 注文詳細表示
 */
function viewOrderDetails(orderNumber) {
  window.toast.info(`注文詳細: ${orderNumber}（準備中）`);
}

/**
 * サービス申込み詳細表示
 */
function viewApplicationDetails(applicationId) {
  window.toast.info(`申込み詳細: ID ${applicationId}（準備中）`);
}

// グローバルに公開
window.OrdersManager = OrdersManager;
window.ServicesManager = ServicesManager;
