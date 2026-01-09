// 商品一覧ページ
const API = {
  async getProducts() {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('商品の取得に失敗しました');
    return response.json();
  }
};

let allProducts = [];
let currentCategory = 'all';
let currentSort = 'default';
let searchQuery = '';
let priceMin = null;
let priceMax = null;

// ページロード時
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupFilters();
  
  // URLパラメータからカテゴリーを取得
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  if (category) {
    currentCategory = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      }
    });
  }
});

// 商品読み込み
async function loadProducts() {
  try {
    allProducts = await API.getProducts();
    renderProducts();
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('products-grid').innerHTML = `
      <div class="loading" style="color: #ef4444;">
        商品の読み込みに失敗しました
      </div>
    `;
  }
}

// フィルター設定
function setupFilters() {
  // カテゴリーフィルター
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderProducts();
    });
  });

  // 検索
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderProducts();
  });

  // ソート
  document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderProducts();
  });

  // 価格フィルター
  document.getElementById('apply-price-filter').addEventListener('click', () => {
    const minInput = document.getElementById('price-min');
    const maxInput = document.getElementById('price-max');
    priceMin = minInput.value ? parseFloat(minInput.value) : null;
    priceMax = maxInput.value ? parseFloat(maxInput.value) : null;
    renderProducts();
  });
}

// 商品レンダリング
function renderProducts() {
  let filtered = [...allProducts];

  // カテゴリーフィルター
  if (currentCategory !== 'all') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }

  // 検索フィルター
  if (searchQuery) {
    filtered = filtered.filter(p => {
      const searchText = `${p.name} ${p.description}`.toLowerCase();
      return searchText.includes(searchQuery);
    });
  }

  // 価格フィルター
  if (priceMin !== null) {
    filtered = filtered.filter(p => p.price >= priceMin);
  }
  if (priceMax !== null) {
    filtered = filtered.filter(p => p.price <= priceMax);
  }

  // ソート
  switch (currentSort) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
  }

  const grid = document.getElementById('products-grid');

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="loading">
        該当する商品が見つかりませんでした
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const images = product.image_urls ? JSON.parse(product.image_urls) : [];
    const imageUrl = images.length > 0 ? `/images/${images[0]}` : null;

    return `
      <a href="/product-detail.html?id=${product.id}" class="product-card">
        <div class="product-image">
          ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}">` : '📦'}
        </div>
        <div class="product-info">
          <div class="product-category">${product.category}</div>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description || ''}</p>
          <div class="product-price">¥${product.price.toLocaleString()}</div>
          <button class="product-button" onclick="event.preventDefault(); addToCart(${product.id}, '${product.name}', ${product.price})">
            カートに追加
          </button>
        </div>
      </a>
    `;
  }).join('');
}

// カートに追加
function addToCart(id, name, price) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  Cart.addItem({
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    image: product.image_urls ? JSON.parse(product.image_urls)[0] : null
  });

  // 通知を表示（簡易版）
  alert(`${name} をカートに追加しました`);
}
