/**
 * 管理画面ダッシュボード - Chart.js統合
 */

class AdminDashboard {
  constructor() {
    this.charts = {};
    this.refreshInterval = null;
  }

  /**
   * ダッシュボード初期化
   */
  async init() {
    try {
      await this.loadStats();
      await this.loadCharts();
      await this.loadRecentActivity();
      
      // 30秒ごとに自動更新
      this.refreshInterval = setInterval(() => {
        this.refresh();
      }, 30000);

    } catch (error) {
      console.error('Dashboard init error:', error);
      if (window.toast) {
        window.toast.error('ダッシュボードの初期化に失敗しました');
      }
    }
  }

  /**
   * ダッシュボード更新
   */
  async refresh() {
    try {
      await this.loadStats();
      await this.loadRecentActivity();
    } catch (error) {
      console.error('Dashboard refresh error:', error);
    }
  }

  /**
   * 統計情報読み込み
   */
  async loadStats() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('統計情報の取得に失敗しました');
      }

      const data = await response.json();
      this.renderStats(data);

    } catch (error) {
      console.error('Load stats error:', error);
      throw error;
    }
  }

  /**
   * 統計情報表示
   */
  renderStats(data) {
    // 今日の売上
    document.getElementById('today-sales').textContent = 
      `¥${data.today.sales.toLocaleString()}`;
    
    // 今月の売上
    document.getElementById('month-sales').textContent = 
      `¥${data.thisMonth.sales.toLocaleString()}`;
    document.getElementById('sales-growth').textContent = 
      `${data.growth.sales >= 0 ? '+' : ''}${data.growth.sales}%`;
    document.getElementById('sales-growth').className = 
      `growth ${data.growth.sales >= 0 ? 'positive' : 'negative'}`;

    // 注文数
    document.getElementById('month-orders').textContent = 
      data.thisMonth.orders;
    document.getElementById('orders-growth').textContent = 
      `${data.growth.orders >= 0 ? '+' : ''}${data.growth.orders}%`;
    document.getElementById('orders-growth').className = 
      `growth ${data.growth.orders >= 0 ? 'positive' : 'negative'}`;

    // ユーザー数
    document.getElementById('total-users').textContent = 
      data.total.users;
    document.getElementById('users-growth').textContent = 
      `${data.growth.users >= 0 ? '+' : ''}${data.growth.users}%`;
    document.getElementById('users-growth').className = 
      `growth ${data.growth.users >= 0 ? 'positive' : 'negative'}`;

    // サービス申込み数
    document.getElementById('month-applications').textContent = 
      data.thisMonth.applications;

    // MRR/ARR（継続課金収益）
    if (data.recurring) {
      document.getElementById('mrr-value').textContent = 
        `¥${data.recurring.mrr.toLocaleString()}`;
      document.getElementById('arr-value').textContent = 
        `¥${data.recurring.arr.toLocaleString()}`;
      document.getElementById('active-subscriptions').textContent = 
        data.recurring.activeSubscriptions;
      document.getElementById('churn-rate').textContent = 
        `${data.recurring.churnRate}%`;
      
      // MRR成長率
      if (data.growth.mrr !== undefined) {
        document.getElementById('mrr-growth').textContent = 
          `${data.growth.mrr >= 0 ? '+' : ''}${data.growth.mrr}%`;
        document.getElementById('mrr-growth').className = 
          `growth ${data.growth.mrr >= 0 ? 'positive' : 'negative'}`;
      }
    }
  }

  /**
   * グラフ読み込み
   */
  async loadCharts() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      // 売上推移グラフ
      const trendResponse = await fetch('/api/admin/dashboard/sales-trend', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const trendData = await trendResponse.json();
      this.renderSalesTrendChart(trendData.trend);

      // カテゴリ別売上グラフ
      const categoryResponse = await fetch('/api/admin/dashboard/sales-by-category', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const categoryData = await categoryResponse.json();
      this.renderCategoryChart(categoryData.categories);

      // 注文ステータス分布グラフ
      const statusResponse = await fetch('/api/admin/dashboard/order-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statusData = await statusResponse.json();
      this.renderStatusChart(statusData.statuses);

      // 人気商品ランキング
      const productsResponse = await fetch('/api/admin/dashboard/popular-products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const productsData = await productsResponse.json();
      this.renderPopularProducts(productsData.products);

      // MRR推移グラフ
      const mrrTrendResponse = await fetch('/api/admin/dashboard/mrr-trend', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const mrrTrendData = await mrrTrendResponse.json();
      this.renderMrrTrendChart(mrrTrendData.trend);

      // 継続課金統計
      const subscriptionStatsResponse = await fetch('/api/admin/dashboard/subscription-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subscriptionStatsData = await subscriptionStatsResponse.json();
      this.renderSubscriptionStats(subscriptionStatsData);

      // 財務レポート
      const financialReportResponse = await fetch('/api/admin/dashboard/financial-report', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const financialReportData = await financialReportResponse.json();
      this.renderFinancialReport(financialReportData);

    } catch (error) {
      console.error('Load charts error:', error);
      throw error;
    }
  }

  /**
   * 売上推移グラフ描画
   */
  renderSalesTrendChart(trend) {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;

    if (this.charts.salesTrend) {
      this.charts.salesTrend.destroy();
    }

    const labels = trend.map(d => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const data = trend.map(d => d.sales);

    this.charts.salesTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '売上',
          data: data,
          borderColor: '#007aff',
          backgroundColor: 'rgba(0, 122, 255, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `¥${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `¥${value.toLocaleString()}`
            }
          }
        }
      }
    });
  }

  /**
   * カテゴリ別売上グラフ描画
   */
  renderCategoryChart(categories) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (this.charts.category) {
      this.charts.category.destroy();
    }

    const colors = [
      '#007aff', '#5856d6', '#34c759', '#ff9500', '#ff3b30',
      '#ff2d55', '#af52de', '#5ac8fa', '#ffcc00', '#ff6482'
    ];

    this.charts.category = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => c.category || '未分類'),
        datasets: [{
          data: categories.map(c => c.total_sales),
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ¥${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * 注文ステータス分布グラフ描画
   */
  renderStatusChart(statuses) {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    if (this.charts.status) {
      this.charts.status.destroy();
    }

    const statusLabels = {
      'pending': '保留中',
      'paid': '支払済',
      'processing': '処理中',
      'shipped': '発送済',
      'delivered': '配達完了',
      'cancelled': 'キャンセル'
    };

    const statusColors = {
      'pending': '#ff9500',
      'paid': '#34c759',
      'processing': '#007aff',
      'shipped': '#5856d6',
      'delivered': '#34c759',
      'cancelled': '#ff3b30'
    };

    this.charts.status = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: statuses.map(s => statusLabels[s.status] || s.status),
        datasets: [{
          label: '注文数',
          data: statuses.map(s => s.count),
          backgroundColor: statuses.map(s => statusColors[s.status] || '#8e8e93')
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  /**
   * 人気商品ランキング表示
   */
  renderPopularProducts(products) {
    const container = document.getElementById('popular-products-list');
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = '<p class="no-data">データがありません</p>';
      return;
    }

    container.innerHTML = products.map((product, index) => `
      <div class="popular-product-item">
        <div class="rank">${index + 1}</div>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div class="product-meta">${product.category || '未分類'}</div>
        </div>
        <div class="product-stats">
          <div class="stat">
            <span class="stat-value">${product.total_sold || 0}</span>
            <span class="stat-label">販売数</span>
          </div>
          <div class="stat">
            <span class="stat-value">¥${(product.total_revenue || 0).toLocaleString()}</span>
            <span class="stat-label">売上</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * 最近のアクティビティ読み込み
   */
  async loadRecentActivity() {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const response = await fetch('/api/admin/dashboard/recent-activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('アクティビティの取得に失敗しました');
      }

      const data = await response.json();
      this.renderRecentActivity(data);

    } catch (error) {
      console.error('Load recent activity error:', error);
      throw error;
    }
  }

  /**
   * 最近のアクティビティ表示
   */
  renderRecentActivity(data) {
    // 最新注文
    const ordersContainer = document.getElementById('recent-orders-list');
    if (ordersContainer) {
      if (data.orders.length === 0) {
        ordersContainer.innerHTML = '<p class="no-data">データがありません</p>';
      } else {
        ordersContainer.innerHTML = data.orders.map(order => `
          <div class="activity-item">
            <div class="activity-icon">📦</div>
            <div class="activity-content">
              <div class="activity-title">${order.order_number}</div>
              <div class="activity-meta">${order.customer_name} - ¥${order.total_amount.toLocaleString()}</div>
            </div>
            <div class="activity-badge status-${order.status}">
              ${this.getStatusLabel(order.status)}
            </div>
          </div>
        `).join('');
      }
    }

    // 最新ユーザー
    const usersContainer = document.getElementById('recent-users-list');
    if (usersContainer) {
      if (data.users.length === 0) {
        usersContainer.innerHTML = '<p class="no-data">データがありません</p>';
      } else {
        usersContainer.innerHTML = data.users.map(user => `
          <div class="activity-item">
            <div class="activity-icon">👤</div>
            <div class="activity-content">
              <div class="activity-title">${user.last_name} ${user.first_name}</div>
              <div class="activity-meta">${user.email}</div>
            </div>
            <div class="activity-time">${this.formatDate(user.created_at)}</div>
          </div>
        `).join('');
      }
    }
  }

  /**
   * ステータスラベル取得
   */
  getStatusLabel(status) {
    const labels = {
      'pending': '保留中',
      'paid': '支払済',
      'processing': '処理中',
      'shipped': '発送済',
      'delivered': '配達完了',
      'cancelled': 'キャンセル'
    };
    return labels[status] || status;
  }

  /**
   * 日付フォーマット
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  /**
   * クリーンアップ
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
  }

  /**
   * MRR推移グラフ描画
   */
  renderMrrTrendChart(trend) {
    const ctx = document.getElementById('mrrTrendChart');
    if (!ctx) return;

    if (this.charts.mrrTrend) {
      this.charts.mrrTrend.destroy();
    }

    const labels = trend.map(d => d.month);
    const data = trend.map(d => d.mrr);

    this.charts.mrrTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'MRR（月次経常収益）',
          data: data,
          borderColor: '#5856d6',
          backgroundColor: 'rgba(88, 86, 214, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `MRR: ¥${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '¥' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }

  /**
   * 継続課金統計表示
   */
  renderSubscriptionStats(data) {
    const container = document.getElementById('subscription-stats');
    if (!container) return;

    const plans = data.plans || [];
    const monthlyPlan = plans.find(p => p.billing_cycle === 'monthly') || { count: 0, total_revenue: 0 };
    const yearlyPlan = plans.find(p => p.billing_cycle === 'yearly') || { count: 0, total_revenue: 0 };

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">月額プラン</div>
          <div class="stat-value">${monthlyPlan.count}件</div>
          <div class="stat-amount">¥${monthlyPlan.total_revenue.toLocaleString()}/月</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">年額プラン</div>
          <div class="stat-value">${yearlyPlan.count}件</div>
          <div class="stat-amount">¥${yearlyPlan.total_revenue.toLocaleString()}/年</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">今月の新規</div>
          <div class="stat-value positive">${data.thisMonth.new}件</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">今月の解約</div>
          <div class="stat-value negative">${data.thisMonth.cancelled}件</div>
        </div>
      </div>
    `;
  }

  /**
   * 財務レポート表示
   */
  renderFinancialReport(data) {
    const container = document.getElementById('financial-report');
    if (!container) return;

    container.innerHTML = `
      <div class="financial-grid">
        <div class="financial-card">
          <h3>📋 見積書</h3>
          <div class="financial-stats">
            <div class="stat-row">
              <span>総数</span>
              <strong>${data.quotes.total}件</strong>
            </div>
            <div class="stat-row">
              <span>送信済</span>
              <strong>${data.quotes.sent}件</strong>
            </div>
            <div class="stat-row">
              <span>承認済</span>
              <strong class="positive">${data.quotes.accepted}件</strong>
            </div>
            <div class="stat-row">
              <span>却下</span>
              <strong class="negative">${data.quotes.rejected}件</strong>
            </div>
            <div class="stat-row highlight">
              <span>コンバージョン率</span>
              <strong class="positive">${data.kpis.conversionRate}%</strong>
            </div>
          </div>
        </div>

        <div class="financial-card">
          <h3>💳 請求書</h3>
          <div class="financial-stats">
            <div class="stat-row">
              <span>総数</span>
              <strong>${data.invoices.total}件</strong>
            </div>
            <div class="stat-row">
              <span>未払い</span>
              <strong>${data.invoices.pending}件</strong>
            </div>
            <div class="stat-row">
              <span>支払済</span>
              <strong class="positive">${data.invoices.paid}件</strong>
            </div>
            <div class="stat-row">
              <span>延滞</span>
              <strong class="negative">${data.invoices.overdue}件</strong>
            </div>
            <div class="stat-row highlight">
              <span>回収率</span>
              <strong class="positive">${data.kpis.collectionRate}%</strong>
            </div>
          </div>
        </div>

        <div class="financial-card">
          <h3>📄 領収書</h3>
          <div class="financial-stats">
            <div class="stat-row">
              <span>総数</span>
              <strong>${data.receipts.total}件</strong>
            </div>
            <div class="stat-row highlight">
              <span>合計金額</span>
              <strong>¥${data.receipts.totalAmount.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div class="financial-card">
          <h3>💰 KPI</h3>
          <div class="financial-stats">
            <div class="stat-row highlight">
              <span>平均取引額</span>
              <strong>¥${data.kpis.avgTransactionValue.toLocaleString()}</strong>
            </div>
            <div class="stat-row">
              <span>請求総額</span>
              <strong>¥${data.invoices.totalAmount.toLocaleString()}</strong>
            </div>
            <div class="stat-row">
              <span>回収済額</span>
              <strong class="positive">¥${data.invoices.paidAmount.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// グローバルに公開
window.AdminDashboard = AdminDashboard;
