/**
 * メールテンプレート
 * Resend用のHTMLメールテンプレート
 */

/**
 * 見積書送信メールテンプレート
 */
export function generateQuoteEmail(quote) {
  const { quote_number, customer_name, total_amount, valid_until, items } = quote;
  
  return {
    subject: `【SmartPolice】お見積書のご送付（見積番号: ${quote_number}）`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>お見積書</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f7;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #007aff;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #007aff;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 20px;
    }
    .quote-info {
      background: #f5f5f7;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .label {
      font-weight: 600;
      color: #666;
    }
    .value {
      color: #1d1d1f;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f5f5f7;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #ddd;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .total-section {
      text-align: right;
      margin-bottom: 30px;
    }
    .total-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }
    .total-label {
      margin-right: 20px;
      font-weight: 600;
    }
    .total-amount {
      font-size: 28px;
      font-weight: 700;
      color: #007aff;
      margin-top: 10px;
    }
    .button {
      display: inline-block;
      background: #007aff;
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ SmartPolice</div>
      <div style="color: #666;">守る力を、あなたの手に。</div>
    </div>
    
    <h1 class="title">お見積書のご送付</h1>
    
    <p>${customer_name} 様</p>
    
    <p>平素より格別のお引き立てを賜り、誠にありがとうございます。<br>
    ご依頼いただきました件につきまして、下記の通りお見積もりいたします。</p>
    
    <div class="quote-info">
      <div class="info-row">
        <span class="label">見積番号:</span>
        <span class="value">${quote_number}</span>
      </div>
      <div class="info-row">
        <span class="label">有効期限:</span>
        <span class="value">${new Date(valid_until).toLocaleDateString('ja-JP')}</span>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th>商品・サービス</th>
          <th style="text-align: center;">数量</th>
          <th style="text-align: right;">単価</th>
          <th style="text-align: right;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${JSON.parse(items).map(item => `
          <tr>
            <td>${item.name}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">¥${item.unit_price.toLocaleString()}</td>
            <td style="text-align: right;">¥${(item.quantity * item.unit_price).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="total-section">
      <div class="total-amount">
        合計金額: ¥${total_amount.toLocaleString()}（税込）
      </div>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://shop.smartpolice.net/admin-new.html#quotes" class="button">
        オンラインで確認する
      </a>
    </div>
    
    <p>ご不明な点がございましたら、お気軽にお問い合わせください。<br>
    何卒よろしくお願い申し上げます。</p>
    
    <div class="footer">
      <strong>SmartPolice株式会社</strong><br>
      〒100-0001 東京都千代田区千代田1-1<br>
      TEL: 03-1234-5678 / Email: order@smartpolice.net<br>
      <a href="https://shop.smartpolice.net" style="color: #007aff;">https://shop.smartpolice.net</a>
    </div>
  </div>
</body>
</html>
    `,
    text: `
【SmartPolice】お見積書のご送付

${customer_name} 様

平素より格別のお引き立てを賜り、誠にありがとうございます。
ご依頼いただきました件につきまして、下記の通りお見積もりいたします。

見積番号: ${quote_number}
有効期限: ${new Date(valid_until).toLocaleDateString('ja-JP')}

合計金額: ¥${total_amount.toLocaleString()}（税込）

オンラインで確認: https://shop.smartpolice.net/admin-new.html#quotes

ご不明な点がございましたら、お気軽にお問い合わせください。

SmartPolice株式会社
TEL: 03-1234-5678 / Email: order@smartpolice.net
https://shop.smartpolice.net
    `
  };
}

/**
 * 請求書送信メールテンプレート
 */
export function generateInvoiceEmail(invoice) {
  const { invoice_number, customer_name, total_amount, due_date, items } = invoice;
  
  return {
    subject: `【SmartPolice】ご請求書のご送付（請求番号: ${invoice_number}）`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ご請求書</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f7;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #ff3b30;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ff3b30;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 20px;
    }
    .invoice-info {
      background: #fff3f3;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #ff3b30;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .label {
      font-weight: 600;
      color: #666;
    }
    .value {
      color: #1d1d1f;
    }
    .due-date {
      color: #ff3b30;
      font-weight: 700;
      font-size: 18px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f5f5f7;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #ddd;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .total-section {
      text-align: right;
      margin-bottom: 30px;
    }
    .total-amount {
      font-size: 32px;
      font-weight: 700;
      color: #ff3b30;
      margin-top: 10px;
    }
    .button {
      display: inline-block;
      background: #ff3b30;
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️ SmartPolice</div>
      <div style="color: #666;">守る力を、あなたの手に。</div>
    </div>
    
    <h1 class="title">ご請求書のご送付</h1>
    
    <p>${customer_name} 様</p>
    
    <p>平素より格別のお引き立てを賜り、誠にありがとうございます。<br>
    下記の通りご請求申し上げます。</p>
    
    <div class="invoice-info">
      <div class="info-row">
        <span class="label">請求番号:</span>
        <span class="value">${invoice_number}</span>
      </div>
      <div class="info-row">
        <span class="label">お支払期限:</span>
        <span class="due-date">${new Date(due_date).toLocaleDateString('ja-JP')}</span>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th>商品・サービス</th>
          <th style="text-align: center;">数量</th>
          <th style="text-align: right;">単価</th>
          <th style="text-align: right;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${JSON.parse(items).map(item => `
          <tr>
            <td>${item.name}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">¥${item.unit_price.toLocaleString()}</td>
            <td style="text-align: right;">¥${(item.quantity * item.unit_price).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="total-section">
      <div class="total-amount">
        ご請求金額: ¥${total_amount.toLocaleString()}（税込）
      </div>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://shop.smartpolice.net/admin-new.html#invoices" class="button">
        オンラインで確認・お支払い
      </a>
    </div>
    
    <p style="background: #fff3f3; padding: 15px; border-radius: 8px; border-left: 4px solid #ff3b30;">
      <strong>お支払方法:</strong><br>
      クレジットカード決済またはオンライン決済をご利用いただけます。<br>
      上記ボタンよりお支払いページにアクセスしてください。
    </p>
    
    <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    
    <div class="footer">
      <strong>SmartPolice株式会社</strong><br>
      〒100-0001 東京都千代田区千代田1-1<br>
      TEL: 03-1234-5678 / Email: order@smartpolice.net<br>
      <a href="https://shop.smartpolice.net" style="color: #ff3b30;">https://shop.smartpolice.net</a>
    </div>
  </div>
</body>
</html>
    `,
    text: `
【SmartPolice】ご請求書のご送付

${customer_name} 様

平素より格別のお引き立てを賜り、誠にありがとうございます。
下記の通りご請求申し上げます。

請求番号: ${invoice_number}
お支払期限: ${new Date(due_date).toLocaleDateString('ja-JP')}

ご請求金額: ¥${total_amount.toLocaleString()}（税込）

オンラインで確認・お支払い: https://shop.smartpolice.net/admin-new.html#invoices

お支払方法:
クレジットカード決済またはオンライン決済をご利用いただけます。

SmartPolice株式会社
TEL: 03-1234-5678 / Email: order@smartpolice.net
https://shop.smartpolice.net
    `
  };
}

/**
 * 領収書送信メールテンプレート
 */
export function generateReceiptEmail(receipt) {
  const { receipt_number, customer_name, amount_paid, payment_date } = receipt;
  
  return {
    subject: `【SmartPolice】領収書のご送付（領収書番号: ${receipt_number}）`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>領収書</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f7;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #34c759;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #34c759;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 20px;
    }
    .receipt-info {
      background: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #34c759;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .label {
      font-weight: 600;
      color: #666;
    }
    .value {
      color: #1d1d1f;
    }
    .amount {
      font-size: 32px;
      font-weight: 700;
      color: #34c759;
      text-align: center;
      margin: 30px 0;
      padding: 20px;
      background: #f0fdf4;
      border-radius: 12px;
    }
    .button {
      display: inline-block;
      background: #34c759;
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">✅ SmartPolice</div>
      <div style="color: #666;">守る力を、あなたの手に。</div>
    </div>
    
    <h1 class="title">領収書のご送付</h1>
    
    <p>${customer_name} 様</p>
    
    <p>お支払いいただきありがとうございました。<br>
    下記の通り領収いたしました。</p>
    
    <div class="receipt-info">
      <div class="info-row">
        <span class="label">領収書番号:</span>
        <span class="value">${receipt_number}</span>
      </div>
      <div class="info-row">
        <span class="label">お支払日:</span>
        <span class="value">${new Date(payment_date).toLocaleDateString('ja-JP')}</span>
      </div>
    </div>
    
    <div class="amount">
      領収金額: ¥${amount_paid.toLocaleString()}
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://shop.smartpolice.net/admin-new.html#receipts" class="button">
        オンラインで確認
      </a>
    </div>
    
    <p style="text-align: center; color: #666; font-size: 14px;">
      この度はご利用いただき、誠にありがとうございました。<br>
      今後ともSmartPoliceをよろしくお願い申し上げます。
    </p>
    
    <div class="footer">
      <strong>SmartPolice株式会社</strong><br>
      〒100-0001 東京都千代田区千代田1-1<br>
      TEL: 03-1234-5678 / Email: order@smartpolice.net<br>
      <a href="https://shop.smartpolice.net" style="color: #34c759;">https://shop.smartpolice.net</a>
    </div>
  </div>
</body>
</html>
    `,
    text: `
【SmartPolice】領収書のご送付

${customer_name} 様

お支払いいただきありがとうございました。
下記の通り領収いたしました。

領収書番号: ${receipt_number}
お支払日: ${new Date(payment_date).toLocaleDateString('ja-JP')}

領収金額: ¥${amount_paid.toLocaleString()}

オンラインで確認: https://shop.smartpolice.net/admin-new.html#receipts

この度はご利用いただき、誠にありがとうございました。

SmartPolice株式会社
TEL: 03-1234-5678 / Email: order@smartpolice.net
https://shop.smartpolice.net
    `
  };
}

/**
 * 継続課金更新通知メールテンプレート
 */
export function generateSubscriptionRenewalEmail(subscription) {
  const { subscription_number, customer_name, product_name, amount, next_billing_date } = subscription;
  
  return {
    subject: `【SmartPolice】継続課金更新のお知らせ（${subscription_number}）`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>継続課金更新通知</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f7;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #5856d6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #5856d6;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 20px;
    }
    .subscription-info {
      background: #f5f3ff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #5856d6;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .label {
      font-weight: 600;
      color: #666;
    }
    .value {
      color: #1d1d1f;
    }
    .amount {
      font-size: 28px;
      font-weight: 700;
      color: #5856d6;
      text-align: center;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #5856d6;
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔄 SmartPolice</div>
      <div style="color: #666;">守る力を、あなたの手に。</div>
    </div>
    
    <h1 class="title">継続課金更新のお知らせ</h1>
    
    <p>${customer_name} 様</p>
    
    <p>いつもSmartPoliceをご利用いただき、誠にありがとうございます。<br>
    ご契約中の継続課金プランの更新が近づいております。</p>
    
    <div class="subscription-info">
      <div class="info-row">
        <span class="label">契約番号:</span>
        <span class="value">${subscription_number}</span>
      </div>
      <div class="info-row">
        <span class="label">プラン名:</span>
        <span class="value">${product_name}</span>
      </div>
      <div class="info-row">
        <span class="label">次回請求日:</span>
        <span class="value" style="color: #5856d6; font-weight: 700;">${new Date(next_billing_date).toLocaleDateString('ja-JP')}</span>
      </div>
    </div>
    
    <div class="amount">
      次回請求金額: ¥${amount.toLocaleString()}
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://shop.smartpolice.net/mypage.html" class="button">
        契約内容を確認する
      </a>
    </div>
    
    <p style="background: #f5f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #5856d6;">
      <strong>ご注意:</strong><br>
      次回請求日に、ご登録のお支払方法で自動的に決済されます。<br>
      契約内容の変更やキャンセルをご希望の場合は、マイページよりお手続きください。
    </p>
    
    <p>今後ともSmartPoliceをよろしくお願い申し上げます。</p>
    
    <div class="footer">
      <strong>SmartPolice株式会社</strong><br>
      〒100-0001 東京都千代田区千代田1-1<br>
      TEL: 03-1234-5678 / Email: order@smartpolice.net<br>
      <a href="https://shop.smartpolice.net" style="color: #5856d6;">https://shop.smartpolice.net</a>
    </div>
  </div>
</body>
</html>
    `,
    text: `
【SmartPolice】継続課金更新のお知らせ

${customer_name} 様

いつもSmartPoliceをご利用いただき、誠にありがとうございます。
ご契約中の継続課金プランの更新が近づいております。

契約番号: ${subscription_number}
プラン名: ${product_name}
次回請求日: ${new Date(next_billing_date).toLocaleDateString('ja-JP')}
次回請求金額: ¥${amount.toLocaleString()}

契約内容を確認: https://shop.smartpolice.net/mypage.html

次回請求日に、ご登録のお支払方法で自動的に決済されます。
契約内容の変更やキャンセルをご希望の場合は、マイページよりお手続きください。

SmartPolice株式会社
TEL: 03-1234-5678 / Email: order@smartpolice.net
https://shop.smartpolice.net
    `
  };
}

/**
 * 決済失敗通知メールテンプレート
 */
export function generatePaymentFailureEmail(data) {
  const {
    subscription_number,
    customer_name,
    product_name,
    amount,
    failed_at,
    retry_date,
    error_message
  } = data;

  return {
    subject: `【重要】SmartPolice お支払いエラーのお知らせ - ${subscription_number}`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>お支払いエラーのお知らせ</title>
  <style>
    body {
      font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', sans-serif;
      line-height: 1.8;
      color: #1d1d1f;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f7;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 0;
      font-size: 15px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .alert-box {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .info-table {
      width: 100%;
      margin: 25px 0;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-table td:first-child {
      font-weight: 600;
      color: #666;
      width: 140px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background: #f8f8f8;
      padding: 25px 30px;
      text-align: center;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ お支払いエラーのお知らせ</h1>
      <p>決済処理に失敗しました</p>
    </div>
    
    <div class="content">
      <p>${customer_name} 様</p>
      
      <p>いつもSmartPoliceをご利用いただき、誠にありがとうございます。</p>
      
      <div class="alert-box">
        <strong>⚠️ 重要なお知らせ</strong><br>
        ${new Date(failed_at).toLocaleDateString('ja-JP')} に実施された継続課金のお支払い処理が、以下の理由により完了できませんでした。
        <br><br>
        <strong>エラー内容:</strong> ${error_message}
      </div>
      
      <h2 style="color: #d32f2f; font-size: 18px; margin-top: 30px;">📋 課金情報</h2>
      <table class="info-table">
        <tr>
          <td>契約番号</td>
          <td><strong>${subscription_number}</strong></td>
        </tr>
        <tr>
          <td>プラン名</td>
          <td>${product_name}</td>
        </tr>
        <tr>
          <td>請求金額</td>
          <td><strong style="color: #d32f2f; font-size: 20px;">¥${amount.toLocaleString()}</strong></td>
        </tr>
        <tr>
          <td>再試行予定日</td>
          <td>${new Date(retry_date).toLocaleDateString('ja-JP')}</td>
        </tr>
      </table>
      
      <h2 style="color: #d32f2f; font-size: 18px; margin-top: 30px;">💳 必要なアクション</h2>
      <p style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
        <strong>お支払い方法の確認・更新をお願いいたします</strong><br>
        ${new Date(retry_date).toLocaleDateString('ja-JP')} に再度決済処理を実施いたします。<br>
        それまでに、マイページよりお支払い方法の確認・更新をお願いいたします。
      </p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://shop.smartpolice.net/mypage.html" class="button">
          お支払い方法を更新する
        </a>
      </div>
      
      <h2 style="color: #d32f2f; font-size: 18px; margin-top: 30px;">❓ よくある原因</h2>
      <ul style="background: #f8f8f8; padding: 20px 20px 20px 40px; border-radius: 8px;">
        <li>クレジットカードの有効期限切れ</li>
        <li>クレジットカードの利用限度額超過</li>
        <li>クレジットカード情報の変更</li>
        <li>口座残高不足</li>
      </ul>
      
      <p style="background: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #d32f2f;">
        <strong>ご注意:</strong><br>
        再試行後も決済が完了しない場合、サービスが一時停止される可能性がございます。<br>
        お早めのご対応をお願いいたします。
      </p>
      
      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    </div>
    
    <div class="footer">
      <strong>SmartPolice株式会社</strong><br>
      〒100-0001 東京都千代田区千代田1-1<br>
      TEL: 03-1234-5678 / Email: order@smartpolice.net<br>
      <a href="https://shop.smartpolice.net" style="color: #d32f2f;">https://shop.smartpolice.net</a>
    </div>
  </div>
</body>
</html>
    `,
    text: `
【重要】SmartPolice お支払いエラーのお知らせ

${customer_name} 様

いつもSmartPoliceをご利用いただき、誠にありがとうございます。

⚠️ 重要なお知らせ
${new Date(failed_at).toLocaleDateString('ja-JP')} に実施された継続課金のお支払い処理が、以下の理由により完了できませんでした。

エラー内容: ${error_message}

【課金情報】
契約番号: ${subscription_number}
プラン名: ${product_name}
請求金額: ¥${amount.toLocaleString()}
再試行予定日: ${new Date(retry_date).toLocaleDateString('ja-JP')}

【必要なアクション】
お支払い方法の確認・更新をお願いいたします。
${new Date(retry_date).toLocaleDateString('ja-JP')} に再度決済処理を実施いたします。
それまでに、マイページよりお支払い方法の確認・更新をお願いいたします。

お支払い方法を更新: https://shop.smartpolice.net/mypage.html

【よくある原因】
- クレジットカードの有効期限切れ
- クレジットカードの利用限度額超過
- クレジットカード情報の変更
- 口座残高不足

ご注意: 再試行後も決済が完了しない場合、サービスが一時停止される可能性がございます。

SmartPolice株式会社
TEL: 03-1234-5678 / Email: order@smartpolice.net
https://shop.smartpolice.net
    `
  };
}
