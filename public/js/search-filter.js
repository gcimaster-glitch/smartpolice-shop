/**
 * 検索・フィルター・ソート機能
 */

// グローバル変数
let searchQuery = '';
let priceRange = { min: null, max: null };
let searchTimeout = null;

// 検索機能の初期化
function initializeSearch() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search');
  const suggestions = document.getElementById('search-suggestions');
  const resultsCount = document.getElementById('search-results-count');
  
  if (!searchInput) return;
  
  // リアルタイム検索
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    
    // クリアボタンの表示/非表示
    if (searchQuery) {
      clearBtn.style.display = 'block';
    } else {
      clearBtn.style.display = 'none';
      suggestions.style.display = 'none';
    }
    
    // デバウンス処理（300ms待機）
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch();
      showSuggestions();
    }, 300);
  });
  
  // クリアボタン
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearBtn.style.display = 'none';
    suggestions.style.display = 'none';
    resultsCount.style.display = 'none';
    renderProducts();
  });
  
  // サジェスチョンクリック時
  suggestions.addEventListener('click', (e) => {
    if (e.target.classList.contains('suggestion-item')) {
      searchInput.value = e.target.textContent.trim();
      searchQuery = e.target.textContent.trim();
      suggestions.style.display = 'none';
      performSearch();
    }
  });
  
  // 外部クリックでサジェスチョンを閉じる
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
      suggestions.style.display = 'none';
    }
  });
}

// 検索実行
function performSearch() {
  const resultsCount = document.getElementById('search-results-count');
  const filtered = getFilteredProducts();
  
  if (searchQuery) {
    resultsCount.textContent = `${filtered.length}件の商品が見つかりました`;
    resultsCount.style.display = 'block';
  } else {
    resultsCount.style.display = 'none';
  }
  
  renderProducts();
}

// オートコンプリート候補を表示
function showSuggestions() {
  const suggestions = document.getElementById('search-suggestions');
  
  if (!searchQuery || searchQuery.length < 2) {
    suggestions.style.display = 'none';
    return;
  }
  
  // 候補を生成（商品名・タグから）
  const candidates = new Set();
  
  allProducts.forEach(product => {
    // 商品名
    if (product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      candidates.add(product.name);
    }
    
    // タグ
    if (product.tags) {
      const tags = Array.isArray(product.tags) ? product.tags : product.tags.split(',');
      tags.forEach(tag => {
        const cleanTag = tag.trim();
        if (cleanTag.toLowerCase().includes(searchQuery.toLowerCase())) {
          candidates.add(cleanTag);
        }
      });
    }
  });
  
  const candidateArray = Array.from(candidates).slice(0, 5);
  
  if (candidateArray.length === 0) {
    suggestions.style.display = 'none';
    return;
  }
  
  suggestions.innerHTML = candidateArray.map(text => {
    // ハイライト表示
    const highlightedText = text.replace(
      new RegExp(searchQuery, 'gi'),
      match => `<strong style="color: var(--primary-color);">${match}</strong>`
    );
    return `<div class="suggestion-item" style="padding: 0.75rem 1rem; cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">${highlightedText}</div>`;
  }).join('');
  
  suggestions.style.display = 'block';
}

// 価格フィルター初期化
function initializePriceFilter() {
  const applyBtn = document.getElementById('apply-price-filter');
  
  if (!applyBtn) return;
  
  applyBtn.addEventListener('click', () => {
    const minInput = document.getElementById('price-min');
    const maxInput = document.getElementById('price-max');
    
    priceRange.min = minInput.value ? parseInt(minInput.value) : null;
    priceRange.max = maxInput.value ? parseInt(maxInput.value) : null;
    
    renderProducts();
  });
  
  // Enterキーでも適用
  ['price-min', 'price-max'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          applyBtn.click();
        }
      });
    }
  });
}

// フィルター済み商品を取得
function getFilteredProducts() {
  let filtered = allProducts;
  
  // カテゴリフィルター
  if (currentCategory !== 'all') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }
  
  // 検索フィルター
  if (searchQuery) {
    filtered = filtered.filter(p => {
      const searchLower = searchQuery.toLowerCase();
      
      // 商品名で検索
      if (p.name.toLowerCase().includes(searchLower)) return true;
      
      // 説明で検索
      if (p.description && p.description.toLowerCase().includes(searchLower)) return true;
      
      // タグで検索
      if (p.tags) {
        const tags = Array.isArray(p.tags) ? p.tags : p.tags.split(',');
        if (tags.some(tag => tag.trim().toLowerCase().includes(searchLower))) return true;
      }
      
      return false;
    });
  }
  
  // 価格フィルター
  if (priceRange.min !== null) {
    filtered = filtered.filter(p => p.price >= priceRange.min);
  }
  if (priceRange.max !== null) {
    filtered = filtered.filter(p => p.price <= priceRange.max);
  }
  
  // ソート
  if (currentSort === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSort === 'newest') {
    filtered.sort((a, b) => b.id - a.id);
  }
  
  return filtered;
}

// 商品表示を更新（renderProductsをオーバーライド）
function renderProductsWithSearch() {
  const container = document.getElementById('products-grid');
  const filtered = getFilteredProducts();
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <p style="font-size: 3rem; margin-bottom: 1rem;">🔍</p>
        <p style="color: var(--text-light); font-size: 1.125rem;">条件に一致する商品が見つかりませんでした</p>
        <p style="color: var(--text-light); font-size: 0.875rem; margin-top: 0.5rem;">検索条件やフィルターを変更してお試しください</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(product => {
    // 検索クエリのハイライト
    let displayName = product.name;
    if (searchQuery) {
      displayName = product.name.replace(
        new RegExp(searchQuery, 'gi'),
        match => `<mark style="background: #fff3cd; padding: 0 0.25rem;">${match}</mark>`
      );
    }
    
    return `
      <div class="card product-card" onclick="location.href='/product-detail.html?id=${product.id}'" style="transition: all 0.3s; cursor: pointer;">
        <div style="height: 250px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 4rem; overflow: hidden; border-radius: 10px 10px 0 0;">
          ${product.image_urls && product.image_urls[0] ? `<img src="/images/${product.image_urls[0]}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` : '📦'}
        </div>
        <div class="product-info" style="padding: 1.5rem;">
          <div class="product-category" style="display: inline-block; background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem;">${product.category}</div>
          <h3 class="product-name" style="font-size: 1.125rem; font-weight: 700; margin: 0.5rem 0; line-height: 1.4;">${displayName}</h3>
          <p style="color: var(--text-light); font-size: 0.875rem; margin: 0.5rem 0; line-height: 1.5; height: 2.6em; overflow: hidden;">${product.description ? product.description.substring(0, 60) + '...' : ''}</p>
          <div class="product-price" style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin: 1rem 0;">${formatPrice(product.price)}</div>
          <button class="btn btn-primary" style="width: 100%; padding: 0.75rem; font-weight: 600;" onclick="event.stopPropagation(); addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price})">
            🛒 カートに追加
          </button>
        </div>
      </div>
    `;
  }).join('');
}
