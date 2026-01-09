// カートページ
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  setupCheckout();
});

function renderCart() {
  const items = Cart.getItems();
  const content = document.getElementById('cart-content');
  
  if (items.length === 0) {
    content.innerHTML = `
      <div class="empty-cart">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <h2>カートは空です</h2>
        <p>お気に入りの商品をカートに追加しましょう</p>
        <a href="/products.html" class="btn-primary">製品を見る</a>
      </div>
    `;
    updateSummary(0, 0, 0);
    return;
  }

  content.innerHTML = items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-image">
        ${item.image ? `<img src="/images/${item.image}" alt="${item.name}">` : '📦'}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">¥${item.price.toLocaleString()}</div>
        <div class="cart-item-quantity">
          <button class="qty-button" onclick="updateQuantity(${item.id}, -1)">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-button" onclick="updateQuantity(${item.id}, 1)">+</button>
        </div>
      </div>
      <div class="cart-item-actions">
        <div class="cart-item-total">¥${(item.price * item.quantity).toLocaleString()}</div>
        <button class="remove-button" onclick="removeItem(${item.id})">削除</button>
      </div>
    </div>
  `).join('');

  const subtotal = Cart.getTotal();
  const shipping = subtotal > 0 ? (subtotal >= 10000 ? 0 : 500) : 0;
  const total = subtotal + shipping;
  
  updateSummary(subtotal, shipping, total);
}

function updateSummary(subtotal, shipping, total) {
  document.getElementById('subtotal').textContent = `¥${subtotal.toLocaleString()}`;
  document.getElementById('shipping').textContent = shipping === 0 ? '無料' : `¥${shipping.toLocaleString()}`;
  document.getElementById('total').textContent = `¥${total.toLocaleString()}`;
  
  const checkoutBtn = document.getElementById('checkout-btn');
  checkoutBtn.disabled = subtotal === 0;
}

function updateQuantity(id, delta) {
  const items = Cart.getItems();
  const item = items.find(i => i.id === id);
  
  if (!item) return;
  
  const newQuantity = item.quantity + delta;
  
  if (newQuantity <= 0) {
    removeItem(id);
    return;
  }
  
  item.quantity = newQuantity;
  Cart.saveItems(items);
  renderCart();
}

function removeItem(id) {
  Cart.removeItem(id);
  renderCart();
}

function setupCheckout() {
  document.getElementById('checkout-btn').addEventListener('click', () => {
    const items = Cart.getItems();
    if (items.length === 0) return;
    
    // Stripeチェックアウトへリダイレクト
    window.location.href = '/checkout.html';
  });
}
