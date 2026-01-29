/**
 * 財務管理JavaScript - 完全版
 * 見積書、請求書、領収書、継続課金管理 + モーダル + PDF
 */

// ==================== グローバル変数 ====================
let quotesManager, invoicesManager, subscriptionsManager;

// ==================== 見積管理 ====================
class QuotesManager {
  constructor() {
    this.quotes = [];
    this.currentSearchQuery = '';
    this.currentStatusFilter = '';
  }

  async init() {
    try {
      await this.loadQuotes();
      this.setupEventListeners();
    } catch (error) {
      console.error('Quotes manager init error:', error);
      window.toast.error('見積管理の初期化に失敗しました');
    }
  }

  setupEventListeners() {
    // 検索
    const searchInput = document.getElementById('quote-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentSearchQuery = e.target.value;
        this.filterQuotes();
      });
    }

    // ステータスフィルター
    const statusFilter = document.getElementById('quote-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.currentStatusFilter = e.target.value;
        this.filterQuotes();
      });
    }

    // 新規作成ボタン
    const createBtn = document.getElementById('create-quote-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.openCreateModal());
    }
  }

  async loadQuotes() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) throw new Error('認証トークンがありません');

      const response = await fetch('/api/admin/quotes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('見積書の取得に失敗しました');

      const data = await response.json();
      this.quotes = data.quotes || [];
      this.displayQuotes(this.quotes);
    } catch (error) {
      console.error('Load quotes error:', error);
      window.toast.error(error.message);
    }
  }

  filterQuotes() {
    let filtered = this.quotes;

    // 検索フィルター
    if (this.currentSearchQuery) {
      const query = this.currentSearchQuery.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.quote_number?.toLowerCase().includes(query) ||
        quote.customer_name?.toLowerCase().includes(query) ||
        quote.customer_email?.toLowerCase().includes(query)
      );
    }

    // ステータスフィルター
    if (this.currentStatusFilter) {
      filtered = filtered.filter(quote => quote.status === this.currentStatusFilter);
    }

    this.displayQuotes(filtered);
  }

  displayQuotes(quotes) {
    const container = document.getElementById('quotes-list');
    if (!container) return;

    if (quotes.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">見積書がありません</p>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>見積番号</th>
            <th>顧客名</th>
            <th>メールアドレス</th>
            <th>金額</th>
            <th>有効期限</th>
            <th>ステータス</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${quotes.map(quote => `
            <tr>
              <td>${quote.quote_number}</td>
              <td>${quote.customer_name}</td>
              <td>${quote.customer_email}</td>
              <td>¥${(quote.total_amount || 0).toLocaleString()}</td>
              <td>${new Date(quote.valid_until).toLocaleDateString('ja-JP')}</td>
              <td><span class="status-badge status-${quote.status}">${this.getStatusLabel(quote.status)}</span></td>
              <td>
                <button class="btn btn-sm" onclick="quotesManager.viewQuote(${quote.id})">詳細</button>
                <button class="btn btn-sm btn-primary" onclick="quotesManager.downloadPDF(${quote.id})">PDF</button>
                ${quote.status === 'draft' ? `<button class="btn btn-sm btn-success" onclick="quotesManager.convertToOrder(${quote.id})">注文化</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  getStatusLabel(status) {
    const labels = {
      'draft': '下書き',
      'sent': '送信済み',
      'approved': '承認済み',
      'rejected': '却下',
      'expired': '期限切れ',
      'converted': '注文化済み'
    };
    return labels[status] || status;
  }

  openCreateModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h2>新規見積書作成</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="create-quote-form">
            <div class="form-row">
              <div class="form-group">
                <label>顧客名 *</label>
                <input type="text" name="customer_name" required>
              </div>
              <div class="form-group">
                <label>メールアドレス *</label>
                <input type="email" name="customer_email" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>電話番号</label>
                <input type="tel" name="customer_phone">
              </div>
              <div class="form-group">
                <label>有効期限 *</label>
                <input type="date" name="valid_until" required>
              </div>
            </div>
            <div class="form-group">
              <label>件名 *</label>
              <input type="text" name="subject" required placeholder="例: セキュリティシステム導入見積">
            </div>
            <div class="form-group">
              <label>商品・サービス（JSON形式） *</label>
              <textarea name="items" rows="6" required placeholder='[{"name":"防犯カメラ","quantity":5,"unit_price":50000},{"name":"設置工事","quantity":1,"unit_price":100000}]'></textarea>
            </div>
            <div class="form-group">
              <label>備考</label>
              <textarea name="notes" rows="3"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="this.closest('.modal-overlay').remove()">キャンセル</button>
          <button class="btn btn-primary" onclick="quotesManager.submitCreateForm()">作成</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async submitCreateForm() {
    try {
      const form = document.getElementById('create-quote-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // ItemsをJSON変換
      try {
        data.items = JSON.parse(data.items);
      } catch (e) {
        throw new Error('商品・サービスのJSON形式が正しくありません');
      }

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('見積書の作成に失敗しました');

      window.toast.success('見積書を作成しました');
      document.querySelector('.modal-overlay').remove();
      await this.loadQuotes();
    } catch (error) {
      console.error('Create quote error:', error);
      window.toast.error(error.message);
    }
  }

  downloadPDF(quoteId) {
    const token = localStorage.getItem('admin_token');
    window.open(`/api/admin/quotes/${quoteId}/pdf?token=${token}`, '_blank');
  }

  async convertToOrder(quoteId) {
    if (!confirm('この見積書を注文に変換しますか？')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/quotes/${quoteId}/convert`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('注文への変換に失敗しました');

      window.toast.success('注文に変換しました');
      await this.loadQuotes();
    } catch (error) {
      console.error('Convert to order error:', error);
      window.toast.error(error.message);
    }
  }

  viewQuote(quoteId) {
    window.toast.info('見積詳細表示機能は準備中です');
  }
}

// ==================== 請求書管理 ====================
class InvoicesManager {
  constructor() {
    this.invoices = [];
  }

  async init() {
    try {
      await this.loadInvoices();
      this.setupEventListeners();
    } catch (error) {
      console.error('Invoices manager init error:', error);
      window.toast.error('請求書管理の初期化に失敗しました');
    }
  }

  setupEventListeners() {
    const createBtn = document.getElementById('create-invoice-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.openCreateModal());
    }
  }

  async loadInvoices() {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('請求書の取得に失敗しました');

      const data = await response.json();
      this.invoices = data.invoices || [];
      this.displayInvoices(this.invoices);
    } catch (error) {
      console.error('Load invoices error:', error);
      window.toast.error(error.message);
    }
  }

  displayInvoices(invoices) {
    const container = document.getElementById('invoices-list');
    if (!container) return;

    if (invoices.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">請求書がありません</p>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>請求書番号</th>
            <th>顧客名</th>
            <th>金額</th>
            <th>支払期限</th>
            <th>ステータス</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map(invoice => `
            <tr>
              <td>${invoice.invoice_number}</td>
              <td>${invoice.customer_name}</td>
              <td>¥${(invoice.total_amount || 0).toLocaleString()}</td>
              <td>${new Date(invoice.due_date).toLocaleDateString('ja-JP')}</td>
              <td><span class="status-badge status-${invoice.status}">${this.getStatusLabel(invoice.status)}</span></td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="invoicesManager.downloadPDF(${invoice.id})">PDF</button>
                ${invoice.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="invoicesManager.markAsPaid(${invoice.id})">入金済み</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  getStatusLabel(status) {
    const labels = {
      'draft': '下書き',
      'pending': '未払い',
      'paid': '支払済み',
      'overdue': '期限切れ',
      'cancelled': 'キャンセル'
    };
    return labels[status] || status;
  }

  openCreateModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h2>新規請求書作成</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="create-invoice-form">
            <div class="form-row">
              <div class="form-group">
                <label>顧客名 *</label>
                <input type="text" name="customer_name" required>
              </div>
              <div class="form-group">
                <label>メールアドレス *</label>
                <input type="email" name="customer_email" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>見積書ID（オプション）</label>
                <input type="number" name="quote_id">
              </div>
              <div class="form-group">
                <label>支払期限 *</label>
                <input type="date" name="due_date" required>
              </div>
            </div>
            <div class="form-group">
              <label>商品・サービス（JSON形式） *</label>
              <textarea name="items" rows="6" required placeholder='[{"name":"防犯カメラ","quantity":5,"unit_price":50000}]'></textarea>
            </div>
            <div class="form-group">
              <label>備考</label>
              <textarea name="notes" rows="3"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="this.closest('.modal-overlay').remove()">キャンセル</button>
          <button class="btn btn-primary" onclick="invoicesManager.submitCreateForm()">作成</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async submitCreateForm() {
    try {
      const form = document.getElementById('create-invoice-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      data.items = JSON.parse(data.items);

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('請求書の作成に失敗しました');

      window.toast.success('請求書を作成しました');
      document.querySelector('.modal-overlay').remove();
      await this.loadInvoices();
    } catch (error) {
      console.error('Create invoice error:', error);
      window.toast.error(error.message);
    }
  }

  downloadPDF(invoiceId) {
    const token = localStorage.getItem('admin_token');
    window.open(`/api/admin/invoices/${invoiceId}/pdf?token=${token}`, '_blank');
  }

  async markAsPaid(invoiceId) {
    if (!confirm('この請求書を入金済みにしますか？')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('入金処理に失敗しました');

      window.toast.success('入金済みにしました');
      await this.loadInvoices();
    } catch (error) {
      console.error('Mark as paid error:', error);
      window.toast.error(error.message);
    }
  }
}

// ==================== 継続課金管理 ====================
class SubscriptionsManager {
  constructor() {
    this.subscriptions = [];
  }

  async init() {
    try {
      await this.loadSubscriptions();
      this.setupEventListeners();
    } catch (error) {
      console.error('Subscriptions manager init error:', error);
      window.toast.error('継続課金管理の初期化に失敗しました');
    }
  }

  setupEventListeners() {
    const createBtn = document.getElementById('create-subscription-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.openCreateModal());
    }
  }

  async loadSubscriptions() {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('継続課金の取得に失敗しました');

      const data = await response.json();
      this.subscriptions = data.subscriptions || [];
      this.displaySubscriptions(this.subscriptions);
    } catch (error) {
      console.error('Load subscriptions error:', error);
      window.toast.error(error.message);
    }
  }

  displaySubscriptions(subscriptions) {
    const container = document.getElementById('subscriptions-list');
    if (!container) return;

    if (subscriptions.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">継続課金がありません</p>';
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>顧客名</th>
            <th>プラン</th>
            <th>金額</th>
            <th>請求サイクル</th>
            <th>次回請求日</th>
            <th>ステータス</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${subscriptions.map(sub => `
            <tr>
              <td>${sub.customer_name}</td>
              <td>${sub.plan_name}</td>
              <td>¥${(sub.amount || 0).toLocaleString()}</td>
              <td>${this.getBillingCycleLabel(sub.billing_cycle)}</td>
              <td>${new Date(sub.next_billing_date).toLocaleDateString('ja-JP')}</td>
              <td><span class="status-badge status-${sub.status}">${this.getStatusLabel(sub.status)}</span></td>
              <td>
                ${sub.status === 'active' ? `<button class="btn btn-sm btn-warning" onclick="subscriptionsManager.pauseSubscription(${sub.id})">停止</button>` : ''}
                ${sub.status === 'paused' ? `<button class="btn btn-sm btn-success" onclick="subscriptionsManager.resumeSubscription(${sub.id})">再開</button>` : ''}
                <button class="btn btn-sm btn-danger" onclick="subscriptionsManager.cancelSubscription(${sub.id})">解約</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  getBillingCycleLabel(cycle) {
    const labels = { 'monthly': '月次', 'yearly': '年次', 'weekly': '週次' };
    return labels[cycle] || cycle;
  }

  getStatusLabel(status) {
    const labels = { 'active': '有効', 'paused': '停止中', 'cancelled': '解約済み', 'expired': '期限切れ' };
    return labels[status] || status;
  }

  openCreateModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>新規継続課金プラン作成</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <form id="create-subscription-form">
            <div class="form-group">
              <label>顧客名 *</label>
              <input type="text" name="customer_name" required>
            </div>
            <div class="form-group">
              <label>メールアドレス *</label>
              <input type="email" name="customer_email" required>
            </div>
            <div class="form-group">
              <label>プラン名 *</label>
              <input type="text" name="plan_name" required placeholder="例: スタンダードプラン">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>金額（円） *</label>
                <input type="number" name="amount" required>
              </div>
              <div class="form-group">
                <label>請求サイクル *</label>
                <select name="billing_cycle" required>
                  <option value="monthly">月次</option>
                  <option value="yearly">年次</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>開始日 *</label>
              <input type="date" name="start_date" required>
            </div>
            <div class="form-group">
              <label>備考</label>
              <textarea name="notes" rows="3"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="this.closest('.modal-overlay').remove()">キャンセル</button>
          <button class="btn btn-primary" onclick="subscriptionsManager.submitCreateForm()">作成</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async submitCreateForm() {
    try {
      const form = document.getElementById('create-subscription-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('継続課金プランの作成に失敗しました');

      window.toast.success('継続課金プランを作成しました');
      document.querySelector('.modal-overlay').remove();
      await this.loadSubscriptions();
    } catch (error) {
      console.error('Create subscription error:', error);
      window.toast.error(error.message);
    }
  }

  async pauseSubscription(id) {
    if (!confirm('このプランを停止しますか？')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'paused' })
      });

      if (!response.ok) throw new Error('停止に失敗しました');

      window.toast.success('プランを停止しました');
      await this.loadSubscriptions();
    } catch (error) {
      console.error('Pause subscription error:', error);
      window.toast.error(error.message);
    }
  }

  async resumeSubscription(id) {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'active' })
      });

      if (!response.ok) throw new Error('再開に失敗しました');

      window.toast.success('プランを再開しました');
      await this.loadSubscriptions();
    } catch (error) {
      console.error('Resume subscription error:', error);
      window.toast.error(error.message);
    }
  }

  async cancelSubscription(id) {
    if (!confirm('このプランを解約しますか？この操作は取り消せません。')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (!response.ok) throw new Error('解約に失敗しました');

      window.toast.success('プランを解約しました');
      await this.loadSubscriptions();
    } catch (error) {
      console.error('Cancel subscription error:', error);
      window.toast.error(error.message);
    }
  }
}

// ==================== 初期化 ====================
document.addEventListener('DOMContentLoaded', () => {
  quotesManager = new QuotesManager();
  invoicesManager = new InvoicesManager();
  subscriptionsManager = new SubscriptionsManager();
});
