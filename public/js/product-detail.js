// 商品詳細ページ
const API = {
  async getProduct(id) {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) throw new Error('商品の取得に失敗しました');
    return response.json();
  }
};

let currentProduct = null;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (!productId) {
    window.location.href = '/products.html';
    return;
  }
  
  loadProduct(productId);
});

async function loadProduct(id) {
  try {
    currentProduct = await API.getProduct(id);
    renderProduct(currentProduct);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('product-detail').innerHTML = `
      <div class="loading" style="color: #ef4444;">
        商品の読み込みに失敗しました
      </div>
    `;
  }
}

function renderProduct(product) {
  const images = product.image_urls ? JSON.parse(product.image_urls) : [];
  const specs = product.specifications ? JSON.parse(product.specifications) : {};
  
  const mainImage = images.length > 0 ? `/images/${images[0]}` : null;
  
  document.getElementById('product-detail').innerHTML = `
    <div class="product-detail-layout">
      <!-- ギャラリー -->
      <div class="product-gallery">
        <div class="product-main-image" id="main-image">
          ${mainImage ? `<img src="${mainImage}" alt="${product.name}">` : '📦'}
        </div>
        ${images.length > 1 ? `
          <div class="product-thumbnails">
            ${images.map((img, index) => `
              <div class="product-thumbnail ${index === 0 ? 'active' : ''}" onclick="changeImage('${img}', ${index})">
                <img src="/images/${img}" alt="${product.name}">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- 商品情報 -->
      <div class="product-info-content">
        <div class="product-breadcrumb">
          <a href="/products.html">製品</a> / 
          <a href="/products.html?category=${encodeURIComponent(product.category)}">${product.category}</a> / 
          ${product.name}
        </div>

        <div class="product-detail-category">${product.category}</div>
        <h1 class="product-detail-title">${product.name}</h1>
        <div class="product-detail-price">¥${product.price.toLocaleString()}</div>

        <div class="product-stock-status">
          <span class="stock-dot"></span>
          <span>在庫あり</span>
        </div>

        <div class="product-detail-description">
          ${product.description || ''}
        </div>

        ${Object.keys(specs).length > 0 ? `
          <div class="product-specifications">
            <h3>製品仕様</h3>
            ${Object.entries(specs).map(([key, value]) => `
              <div class="spec-row">
                <div class="spec-label">${key}</div>
                <div class="spec-value">${value}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="product-actions">
          <button class="add-to-cart-btn" onclick="addToCart()">
            カートに追加
          </button>
          <button class="buy-now-btn" onclick="buyNow()">
            今すぐ購入
          </button>
        </div>

        ${product.alibaba_url ? `
          <div style="font-size: 12px; color: var(--color-text-light); padding: 16px; background: var(--color-surface); border-radius: 12px;">
            <strong>配送について:</strong> 本商品はAlibabaからの直送となります。通常7-14日でお届けします。
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function changeImage(imagePath, index) {
  document.getElementById('main-image').innerHTML = `
    <img src="/images/${imagePath}" alt="${currentProduct.name}">
  `;
  
  document.querySelectorAll('.product-thumbnail').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index);
  });
}

function addToCart() {
  if (!currentProduct) return;
  
  const images = currentProduct.image_urls ? JSON.parse(currentProduct.image_urls) : [];
  
  Cart.addItem({
    id: currentProduct.id,
    name: currentProduct.name,
    price: currentProduct.price,
    quantity: 1,
    image: images.length > 0 ? images[0] : null
  });
  
  alert(`${currentProduct.name} をカートに追加しました`);
}

function buyNow() {
  addToCart();
  window.location.href = '/cart.html';
}
