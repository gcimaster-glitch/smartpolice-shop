/**
 * 財務管理JavaScript
 * 見積書、請求書、領収書、継続課金管理
 */

// ==================== 見積管理 ====================

class QuotesManager {
  constructor() {
    this.quotes = [];
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
    const searchInput = document.getElementById('quote-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterQuotes(e.target.value);
      });
    }

    const statusFilter = document.getElementById('quote-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filterQuotes(null, e.target.value);
      });
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
      throw error;
    }
  }

  displayQuotes(quotes) {
    const tbody = document.getElementById('quotes-table-body');
    if (!tbody) return;

    if (quotes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data">見積書がありません</td></tr>';
      return;
    }

    tbody.innerHTML = quotes.map(quote => `
      <tr>
        <td><strong>${quote.quote_number}</strong></td>
        <td>${quote.customer_name}</td>
        <td>${quote.customer_company || '-'}</td>
        <td>¥${quote.total_amount.toLocaleString()}</td>
        <td>${quote.valid_until || '-'}</td>
        <td>
          <select class="filter-select" onchange="updateQuoteStatus(${quote.id}, this.value)">
            <option value="draft" ${quote.status === 'draft' ? 'selected' : ''}>下書き</option>
            <option value="sent" ${quote.status === 'sent' ? 'selected' : ''}>送信済</option>
            <option value="accepted" ${quote.status === 'accepted' ? 'selected' : ''}>承認済</option>
            <option value="rejected" ${quote.status === 'rejected' ? 'selected' : ''}>却下</option>
            <option value="expired" ${quote.status === 'expired' ? 'selected' : ''}>期限切れ</option>
          </select>
        </td>
        <td>
          <button class="btn-primary" onclick="viewQuoteDetails(${quote.id})" style="padding: 6px 12px; font-size: 13px; margin-right: 4px;">
            <i class="fas fa-eye"></i>
          </button>
          ${quote.status === 'accepted' ? `
            <button class="btn-primary" onclick="convertQuoteToOrder(${quote.id})" style="padding: 6px 12px; font-size: 13px; background: var(--success);">
              <i class="fas fa-check"></i> 注文化
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  }

  filterQuotes(searchTerm = null, status = null) {
    let filtered = [...this.quotes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.quote_number.toLowerCase().includes(term) ||
        quote.customer_name.toLowerCase().includes(term) ||
        (quote.customer_company && quote.customer_company.toLowerCase().includes(term))
      );
    }

    const statusFilter = document.getElementById('quote-status-filter');
    const selectedStatus = status || (statusFilter ? statusFilter.value : '');
    if (selectedStatus) {
      filtered = filtered.filter(quote => quote.status === selectedStatus);
    }

    this.displayQuotes(filtered);
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
    const searchInput = document.getElementById('invoice-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterInvoices(e.target.value);
      });
    }

    const statusFilter = document.getElementById('invoice-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filterInvoices(null, e.target.value);
      });
    }
  }

  async loadInvoices() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) throw new Error('認証トークンがありません');

      const response = await fetch('/api/admin/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('請求書の取得に失敗しました');

      const data = await response.json();
      this.invoices = data.invoices || [];
      this.displayInvoices(this.invoices);

    } catch (error) {
      console.error('Load invoices error:', error);
      throw error;
    }
  }

  displayInvoices(invoices) {
    const tbody = document.getElementById('invoices-table-body');
    if (!tbody) return;

    if (invoices.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-data">請求書がありません</td></tr>';
      return;
    }

    tbody.innerHTML = invoices.map(invoice => `
      <tr>
        <td><strong>${invoice.invoice_number}</strong></td>
        <td>${invoice.customer_name}</td>
        <td>${invoice.customer_company || '-'}</td>
        <td>¥${invoice.total_amount.toLocaleString()}</td>
        <td>${invoice.payment_due_date || '-'}</td>
        <td>
          <span class="activity-badge status-${invoice.payment_status}">
            ${this.getPaymentStatusLabel(invoice.payment_status)}
          </span>
        </td>
        <td>
          <button class="btn-primary" onclick="viewInvoiceDetails(${invoice.id})" style="padding: 6px 12px; font-size: 13px; margin-right: 4px;">
            <i class="fas fa-eye"></i>
          </button>
          ${invoice.payment_status === 'pending' ? `
            <button class="btn-primary" onclick="markInvoiceAsPaid(${invoice.id})" style="padding: 6px 12px; font-size: 13px; background: var(--success);">
              <i class="fas fa-check"></i> 支払済
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  }

  getPaymentStatusLabel(status) {
    const labels = {
      'pending': '未払い',
      'paid': '支払済',
      'overdue': '期限切れ',
      'cancelled': 'キャンセル'
    };
    return labels[status] || status;
  }

  filterInvoices(searchTerm = null, status = null) {
    let filtered = [...this.invoices];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(term) ||
        invoice.customer_name.toLowerCase().includes(term) ||
        (invoice.customer_company && invoice.customer_company.toLowerCase().includes(term))
      );
    }

    const statusFilter = document.getElementById('invoice-status-filter');
    const selectedStatus = status || (statusFilter ? statusFilter.value : '');
    if (selectedStatus) {
      filtered = filtered.filter(invoice => invoice.payment_status === selectedStatus);
    }

    this.displayInvoices(filtered);
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
    const searchInput = document.getElementById('subscription-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterSubscriptions(e.target.value);
      });
    }

    const statusFilter = document.getElementById('subscription-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filterSubscriptions(null, e.target.value);
      });
    }
  }

  async loadSubscriptions() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) throw new Error('認証トークンがありません');

      const response = await fetch('/api/admin/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('継続課金の取得に失敗しました');

      const data = await response.json();
      this.subscriptions = data.subscriptions || [];
      this.displaySubscriptions(this.subscriptions);

    } catch (error) {
      console.error('Load subscriptions error:', error);
      throw error;
    }
  }

  displaySubscriptions(subscriptions) {
    const tbody = document.getElementById('subscriptions-table-body');
    if (!tbody) return;

    if (subscriptions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="no-data">継続課金がありません</td></tr>';
      return;
    }

    tbody.innerHTML = subscriptions.map(sub => `
      <tr>
        <td><strong>${sub.subscription_number}</strong></td>
        <td>${sub.product_name}</td>
        <td>${sub.customer_email || '-'}</td>
        <td>¥${sub.amount.toLocaleString()}</td>
        <td>${this.getBillingCycleLabel(sub.billing_cycle)}</td>
        <td>${sub.next_billing_date || '-'}</td>
        <td>
          <select class="filter-select" onchange="updateSubscriptionStatus(${sub.id}, this.value)">
            <option value="active" ${sub.status === 'active' ? 'selected' : ''}>有効</option>
            <option value="paused" ${sub.status === 'paused' ? 'selected' : ''}>一時停止</option>
            <option value="cancelled" ${sub.status === 'cancelled' ? 'selected' : ''}>キャンセル</option>
            <option value="expired" ${sub.status === 'expired' ? 'selected' : ''}>期限切れ</option>
          </select>
        </td>
        <td>
          <button class="btn-primary" onclick="viewSubscriptionDetails(${sub.id})" style="padding: 6px 12px; font-size: 13px;">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  getBillingCycleLabel(cycle) {
    const labels = {
      'monthly': '月次',
      'quarterly': '四半期',
      'yearly': '年次'
    };
    return labels[cycle] || cycle;
  }

  filterSubscriptions(searchTerm = null, status = null) {
    let filtered = [...this.subscriptions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.subscription_number.toLowerCase().includes(term) ||
        sub.product_name.toLowerCase().includes(term) ||
        (sub.customer_email && sub.customer_email.toLowerCase().includes(term))
      );
    }

    const statusFilter = document.getElementById('subscription-status-filter');
    const selectedStatus = status || (statusFilter ? statusFilter.value : '');
    if (selectedStatus) {
      filtered = filtered.filter(sub => sub.status === selectedStatus);
    }

    this.displaySubscriptions(filtered);
  }
}

// ==================== グローバル関数 ====================

async function updateQuoteStatus(quoteId, newStatus) {
  try {
    window.toast.loading('ステータスを更新中...');

    const token = localStorage.getItem('admin_token');
    const response = await fetch(`/api/admin/quotes/${quoteId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error('ステータスの更新に失敗しました');

    window.toast.removeLoading();
    window.toast.success('ステータスを更新しました');

    if (window.quotesManager) {
      await window.quotesManager.loadQuotes();
    }

  } catch (error) {
    console.error('Update quote status error:', error);
    window.toast.removeLoading();
    window.toast.error('ステータスの更新に失敗しました');
  }
}

async function convertQuoteToOrder(quoteId) {
  if (!confirm('見積書を注文に変換しますか？')) return;

  try {
    window.toast.loading('注文に変換中...');

    const token = localStorage.getItem('admin_token');
    const response = await fetch(`/api/admin/quotes/${quoteId}/convert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('注文への変換に失敗しました');

    const data = await response.json();
    window.toast.removeLoading();
    window.toast.success(`注文に変換しました: ${data.order_number}`);

    if (window.quotesManager) {
      await window.quotesManager.loadQuotes();
    }

  } catch (error) {
    console.error('Convert quote error:', error);
    window.toast.removeLoading();
    window.toast.error('注文への変換に失敗しました');
  }
}

async function markInvoiceAsPaid(invoiceId) {
  const paymentMethod = prompt('支払方法を入力してください（例: 銀行振込、クレジットカード）');
  if (!paymentMethod) return;

  try {
    window.toast.loading('支払いを記録中...');

    const token = localStorage.getItem('admin_token');
    
    // 請求書情報取得
    const invoiceResponse = await fetch(`/api/admin/invoices`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const invoiceData = await invoiceResponse.json();
    const invoice = invoiceData.invoices.find(inv => inv.id === invoiceId);
    
    if (!invoice) throw new Error('請求書が見つかりません');

    const response = await fetch(`/api/admin/invoices/${invoiceId}/pay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        payment_method: paymentMethod,
        paid_amount: invoice.total_amount
      })
    });

    if (!response.ok) throw new Error('支払いの記録に失敗しました');

    window.toast.removeLoading();
    window.toast.success('支払いを記録しました（領収書も自動作成されました）');

    if (window.invoicesManager) {
      await window.invoicesManager.loadInvoices();
    }

  } catch (error) {
    console.error('Mark invoice as paid error:', error);
    window.toast.removeLoading();
    window.toast.error('支払いの記録に失敗しました');
  }
}

function viewQuoteDetails(quoteId) {
  window.toast.info(`見積詳細: ID ${quoteId}（準備中）`);
}

function viewInvoiceDetails(invoiceId) {
  window.toast.info(`請求書詳細: ID ${invoiceId}（準備中）`);
}

function viewSubscriptionDetails(subscriptionId) {
  window.toast.info(`継続課金詳細: ID ${subscriptionId}（準備中）`);
}

// グローバルに公開
window.QuotesManager = QuotesManager;
window.InvoicesManager = InvoicesManager;
window.SubscriptionsManager = SubscriptionsManager;
