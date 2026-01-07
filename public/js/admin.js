// 管理画面用JavaScript
class AdminAPI {
    static async login(email, password) {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('adminToken', data.data.token);
            return data.data;
        } else {
            throw new Error(data.error || 'ログインに失敗しました');
        }
    }

    static async getProducts() {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.error || '商品の取得に失敗しました');
        }
    }

    static async createProduct(productData) {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.error || '商品の登録に失敗しました');
        }
    }

    static async updateProduct(productId, productData) {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.error || '商品の更新に失敗しました');
        }
    }

    static async deleteProduct(productId) {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.error || '商品の削除に失敗しました');
        }
    }

    static async analyzeAlibabaProduct(alibabaUrl, profitMargin) {
        const token = localStorage.getItem('adminToken');
        showLoading('商品情報を分析中...');
        
        try {
            const response = await fetch('/api/admin/alibaba/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    alibaba_url: alibabaUrl,
                    profit_margin: parseFloat(profitMargin)
                })
            });
            
            const data = await response.json();
            hideLoading();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.error || '商品の分析に失敗しました');
            }
        } catch (error) {
            hideLoading();
            throw error;
        }
    }

    static async getOrders() {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.error || '注文の取得に失敗しました');
        }
    }

    static async updateOrderStatus(orderId, status) {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.error || '注文ステータスの更新に失敗しました');
        }
    }

    static async uploadImage(file) {
        const token = localStorage.getItem('adminToken');
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/admin/images/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.error || '画像のアップロードに失敗しました');
        }
    }
}

// ローディング表示
function showLoading(message = '処理中...') {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    loadingDiv.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center;">
            <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p style="margin: 0; font-size: 1.2rem; color: #333;">${message}</p>
        </div>
    `;
    
    document.body.appendChild(loadingDiv);
    
    // スピンアニメーション
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// 通知表示
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 価格フォーマット
function formatPrice(price) {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
    }).format(price);
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// ログインチェック
function checkLogin() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin-login.html';
    }
}

// ログアウト
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login.html';
}
