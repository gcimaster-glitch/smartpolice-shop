/**
 * Stripe決済サービス
 * Stripe APIとの連携処理
 */

/**
 * Stripe PaymentIntentを作成
 * @param {Object} params
 * @param {number} params.amount - 金額（円）
 * @param {string} params.currency - 通貨（デフォルト: jpy）
 * @param {string} params.description - 説明
 * @param {Object} params.metadata - メタデータ
 * @param {string} stripeSecretKey - Stripe Secret Key
 * @returns {Promise<Object>}
 */
export async function createPaymentIntent({
  amount,
  currency = 'jpy',
  description = '',
  metadata = {}
}, stripeSecretKey) {
  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      amount: amount.toString(),
      currency,
      description,
      'metadata[order_number]': metadata.order_number || '',
      'metadata[customer_email]': metadata.customer_email || ''
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stripe API Error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * PaymentIntentを取得
 * @param {string} paymentIntentId
 * @param {string} stripeSecretKey
 * @returns {Promise<Object>}
 */
export async function getPaymentIntent(paymentIntentId, stripeSecretKey) {
  const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stripe API Error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * Stripe Webhookの署名を検証
 * @param {string} payload - Webhookペイロード（文字列）
 * @param {string} signature - Stripe-Signature ヘッダー
 * @param {string} webhookSecret - Webhook Secret
 * @returns {Promise<boolean>}
 */
export async function verifyWebhookSignature(payload, signature, webhookSecret) {
  // Stripe Webhookの署名検証
  // 注意: この実装は簡易版です。本番環境では stripe-node ライブラリの使用を推奨
  
  try {
    const signatureParts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {});

    const timestamp = signatureParts.t;
    const expectedSignature = signatureParts.v1;

    // 署名の計算
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );
    
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const computedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return computedSignature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Webhookイベントを処理
 * @param {Object} event - Stripeイベント
 * @param {Object} env - 環境変数
 * @returns {Promise<Object>}
 */
export async function handleWebhookEvent(event, env) {
  const { type, data } = event;
  const object = data.object;

  switch (type) {
    case 'payment_intent.succeeded':
      // 決済成功時の処理
      return {
        type: 'payment_success',
        paymentIntentId: object.id,
        amount: object.amount,
        metadata: object.metadata
      };

    case 'payment_intent.payment_failed':
      // 決済失敗時の処理
      return {
        type: 'payment_failed',
        paymentIntentId: object.id,
        error: object.last_payment_error?.message
      };

    case 'payment_intent.canceled':
      // 決済キャンセル時の処理
      return {
        type: 'payment_canceled',
        paymentIntentId: object.id
      };

    // サブスクリプション関連イベント
    case 'customer.subscription.created':
      return {
        type: 'subscription_created',
        subscriptionId: object.id,
        customerId: object.customer,
        status: object.status,
        currentPeriodEnd: object.current_period_end
      };

    case 'customer.subscription.updated':
      return {
        type: 'subscription_updated',
        subscriptionId: object.id,
        status: object.status,
        currentPeriodEnd: object.current_period_end
      };

    case 'customer.subscription.deleted':
      return {
        type: 'subscription_deleted',
        subscriptionId: object.id,
        customerId: object.customer
      };

    case 'invoice.payment_succeeded':
      return {
        type: 'invoice_payment_succeeded',
        invoiceId: object.id,
        subscriptionId: object.subscription,
        amountPaid: object.amount_paid,
        customerId: object.customer
      };

    case 'invoice.payment_failed':
      return {
        type: 'invoice_payment_failed',
        invoiceId: object.id,
        subscriptionId: object.subscription,
        customerId: object.customer,
        error: object.last_finalization_error?.message
      };

    default:
      return {
        type: 'unhandled',
        eventType: type
      };
  }
}

/**
 * Stripe Customerを作成
 * @param {Object} params
 * @param {string} params.email - メールアドレス
 * @param {string} params.name - 顧客名
 * @param {Object} params.metadata - メタデータ
 * @param {string} stripeSecretKey
 * @returns {Promise<Object>}
 */
export async function createCustomer({ email, name, metadata = {} }, stripeSecretKey) {
  const response = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      email,
      name,
      ...Object.entries(metadata).reduce((acc, [key, value]) => {
        acc[`metadata[${key}]`] = value;
        return acc;
      }, {})
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stripe API Error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * Stripe Priceを作成
 * @param {Object} params
 * @param {number} params.amount - 金額（円）
 * @param {string} params.currency - 通貨
 * @param {string} params.interval - 請求サイクル（month/year）
 * @param {string} params.productName - 商品名
 * @param {string} stripeSecretKey
 * @returns {Promise<Object>}
 */
export async function createPrice({ amount, currency = 'jpy', interval, productName }, stripeSecretKey) {
  // まず商品を作成
  const productResponse = await fetch('https://api.stripe.com/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      name: productName
    })
  });

  if (!productResponse.ok) {
    const error = await productResponse.json();
    throw new Error(`Stripe API Error: ${error.error?.message || 'Unknown error'}`);
  }

  const product = await productResponse.json();

  // 価格を作成
  const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      product: product.id,
      unit_amount: amount.toString(),
      currency,
      'recurring[interval]': interval
    })
  });

  if (!priceResponse.ok) {
    const error = await priceResponse.json();
    throw new Error(`Stripe API Error: ${error.error?.message || 'Unknown error'}`);
  }

  return await priceResponse.json();
}

/**
 * Stripe Subscriptionを作成
 * @param {Object} params
 * @param {string} params.customerId - Stripe Customer ID
 * @param {string} params.priceId - Stripe Price ID
 * @param {Object} params.metadata - メタデータ
 * @param {string} stripeSecretKey
 * @returns {Promise<Object>}
 */
export async function createSubscription({ customerId, priceId, metadata = {} }, stripeSecretKey) {
  const response = await fetch('https://api.stripe.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      customer: customerId,
      'items[0][price]': priceId,
      ...Object.entries(metadata).reduce((acc, [key, value]) => {
        acc[`metadata[${key}]`] = value;
        return acc;
      }, {})
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stripe API Error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * Stripe Subscriptionをキャンセル
 * @param {string} subscriptionId
 * @param {string} stripeSecretKey
 * @returns {Promise<Object>}
 */
export async function cancelSubscription(subscriptionId, stripeSecretKey) {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stripe API Error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

/**
 * Stripe Subscriptionを取得
 * @param {string} subscriptionId
 * @param {string} stripeSecretKey
 * @returns {Promise<Object>}
 */
export async function getSubscription(subscriptionId, stripeSecretKey) {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stripe API Error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}
