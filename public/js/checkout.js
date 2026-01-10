// チェックアウトページ - Stripe統合 + メール送信
document.addEventListener('DOMContentLoaded', () => {
  // カートデータを取得
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  if (cart.length === 0) {
    alert('カートが空です');
    window.location.href = '/products.html';
    return;
  }

  // ユーザー情報を取得
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (user) {
    document.getElementById('lastName').value = user.lastName || '';
    document.getElementById('firstName').value = user.firstName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('company').value = user.company || '';
  }

  // 最小配送日を設定（3営業日後）
  const today = new Date();
  today.setDate(today.getDate() + 3);
  document.getElementById('deliveryDate').min = today.toISOString().split('T')[0];

  // Stripe初期化（デモ用公開キー - 本番では環境変数から取得）
  const stripe = Stripe('pk_test_51234567890abcdef'); // デモキー
  const elements = stripe.elements();
  const cardElement = elements.create('card', {
    style: {
      base: {
        fontSize: '16px',
        color: '#1d1d1f',
        '::placeholder': {
          color: '#86868b',
        },
      },
    },
  });
  cardElement.mount('#card-element');

  // カードエラー表示
  cardElement.on('change', (event) => {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
      displayError.textContent = event.error.message;
    } else {
      displayError.textContent = '';
    }
  });

  // 注文サマリーを表示
  displayOrderSummary();

  // 支払い方法の切り替え
  const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
  paymentMethods.forEach(method => {
    method.addEventListener('change', (e) => {
      document.getElementById('stripe-card-section').style.display = 
        e.target.value === 'stripe' ? 'block' : 'none';
      document.getElementById('bank-transfer-info').style.display = 
        e.target.value === 'bank' ? 'block' : 'none';
      document.getElementById('invoice-info').style.display = 
        e.target.value === 'invoice' ? 'block' : 'none';
    });
  });

  // フォーム送信
  const form = document.getElementById('checkout-form');
  const submitButton = document.getElementById('submit-button');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitButton.disabled = true;
    submitButton.textContent = '処理中...';

    try {
      const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
      
      // 注文データを作成
      const orderData = {
        // 配送先情報
        customer: {
          lastName: document.getElementById('lastName').value,
          firstName: document.getElementById('firstName').value,
          name: `${document.getElementById('lastName').value} ${document.getElementById('firstName').value}`,
          email: document.getElementById('email').value,
          phone: document.getElementById('phone').value,
          company: document.getElementById('company').value,
        },
        shipping: {
          postalCode: document.getElementById('postalCode').value,
          prefecture: document.getElementById('prefecture').value,
          address: document.getElementById('address').value,
          building: document.getElementById('building').value,
        },
        // 配送日時
        delivery: {
          date: document.getElementById('deliveryDate').value,
          time: document.getElementById('deliveryTime').value,
          notes: document.getElementById('notes').value,
        },
        // 注文内容
        items: cart,
        // 料金
        subtotal: calculateSubtotal(),
        shipping: calculateShipping(),
        total: calculateTotal(),
        // 支払い方法
        paymentMethod: paymentMethod,
        // 注文番号
        orderNumber: generateOrderNumber(),
        // 注文日時
        orderDate: new Date().toISOString(),
      };

      // 支払い方法に応じた処理
      if (paymentMethod === 'stripe') {
        // Stripe決済処理
        const result = await processStripePayment(stripe, cardElement, orderData);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // 注文をバックエンドに送信（デモ版：ローカルストレージに保存）
      await saveOrder(orderData);

      // メール送信（デモ版：コンソールに出力）
      await sendOrderConfirmationEmail(orderData);

      // カートをクリア
      localStorage.removeItem('cart');

      // 完了ページへリダイレクト
      sessionStorage.setItem('lastOrder', JSON.stringify(orderData));
      window.location.href = '/order-complete.html';

    } catch (error) {
      console.error('Order error:', error);
      alert(`エラーが発生しました: ${error.message}\n\n現在はデモ版のため、実際の決済は行われません。`);
      submitButton.disabled = false;
      submitButton.textContent = '注文を確定する';
    }
  });

  // 注文サマリー表示
  function displayOrderSummary() {
    const orderItemsEl = document.getElementById('order-items');
    orderItemsEl.innerHTML = cart.map(item => `
      <div class="order-item">
        <img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.name}" class="order-item-image">
        <div class="order-item-details">
          <div class="order-item-name">${item.name}</div>
          <div class="order-item-quantity">数量: ${item.quantity}</div>
        </div>
        <div class="order-item-price">¥${(item.price * item.quantity).toLocaleString()}</div>
      </div>
    `).join('');

    document.getElementById('subtotal').textContent = `¥${calculateSubtotal().toLocaleString()}`;
    document.getElementById('shipping').textContent = `¥${calculateShipping().toLocaleString()}`;
    document.getElementById('total').textContent = `¥${calculateTotal().toLocaleString()}`;
  }

  function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function calculateShipping() {
    const subtotal = calculateSubtotal();
    return subtotal >= 10000 ? 0 : 800; // 10,000円以上で送料無料
  }

  function calculateTotal() {
    return calculateSubtotal() + calculateShipping();
  }

  function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SP${year}${month}${day}${random}`;
  }

  // Stripe決済処理
  async function processStripePayment(stripe, cardElement, orderData) {
    try {
      // デモ版: 実際のStripe APIは呼ばない
      console.log('Stripe payment processing (demo mode):', orderData);
      
      // 実際の実装では以下のようなコード
      // const { token, error } = await stripe.createToken(cardElement);
      // if (error) {
      //   return { success: false, error: error.message };
      // }
      
      // const response = await fetch('/api/charge', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     token: token.id,
      //     amount: orderData.total,
      //     orderNumber: orderData.orderNumber,
      //   }),
      // });
      
      // const result = await response.json();
      // return { success: result.success };

      // デモ版: 常に成功
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 注文を保存
  async function saveOrder(orderData) {
    // デモ版: ローカルストレージに保存
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));

    console.log('Order saved:', orderData);

    // 実際の実装では以下のようなコード
    // const response = await fetch('/api/orders', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(orderData),
    // });
    // return response.json();
  }

  // 注文確認メール送信
  async function sendOrderConfirmationEmail(orderData) {
    // デモ版: コンソールにメール内容を出力
    const emailContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SmartPolice ご注文確認
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${orderData.customer.name} 様

この度はSmartPoliceをご利用いただき、
誠にありがとうございます。

ご注文を承りました。

【注文番号】
${orderData.orderNumber}

【注文内容】
${orderData.items.map(item => `・${item.name} × ${item.quantity} - ¥${(item.price * item.quantity).toLocaleString()}`).join('\n')}

【お支払い金額】
小計: ¥${orderData.subtotal.toLocaleString()}
配送料: ¥${orderData.shipping.toLocaleString()}
合計: ¥${orderData.total.toLocaleString()}

【配送先】
〒${orderData.shipping.postalCode}
${orderData.shipping.prefecture}${orderData.shipping.address}
${orderData.shipping.building || ''}
${orderData.customer.company ? orderData.customer.company + '\n' : ''}
${orderData.customer.name} 様
TEL: ${orderData.customer.phone}

【配送希望日時】
${orderData.delivery.date} ${orderData.delivery.time || '指定なし'}

【お支払い方法】
${orderData.paymentMethod === 'stripe' ? 'クレジットカード' : 
  orderData.paymentMethod === 'bank' ? '銀行振込' : '請求書払い'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

商品の発送が完了しましたら、
改めてメールにてご連絡いたします。

今後ともSmartPoliceを
よろしくお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SmartPolice SERVICE & PRODUCTS
https://shop.smartpolice.net
order@smartpolice.net
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    console.log('Email sent (demo mode):\n', emailContent);

    // 実際の実装では以下のようなコード（Resend APIを使用）
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: orderData.customer.email,
    //     subject: `【SmartPolice】ご注文確認 - ${orderData.orderNumber}`,
    //     text: emailContent,
    //   }),
    // });
    // return response.json();
  }
});
