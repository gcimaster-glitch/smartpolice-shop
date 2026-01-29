/**
 * Resendメール送信サービス
 * Resend APIとの連携処理
 */

import { generateQuoteEmail, generateInvoiceEmail, generateReceiptEmail, generateSubscriptionRenewalEmail, generatePaymentFailureEmail } from '../utils/email-templates.js';

/**
 * 見積書送信メール
 */
export async function sendQuoteEmail(to, data, env) {
  const emailContent = generateQuoteEmail(data);
  return await sendEmail({
    to,
    subject: emailContent.subject,
    html: emailContent.html
  }, env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
}

/**
 * 請求書送信メール
 */
export async function sendInvoiceEmail(to, data, env) {
  const emailContent = generateInvoiceEmail(data);
  return await sendEmail({
    to,
    subject: emailContent.subject,
    html: emailContent.html
  }, env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
}

/**
 * 領収書送信メール
 */
export async function sendReceiptEmail(to, data, env) {
  const emailContent = generateReceiptEmail(data);
  return await sendEmail({
    to,
    subject: emailContent.subject,
    html: emailContent.html
  }, env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
}

/**
 * 継続課金更新通知メール
 */
export async function sendSubscriptionRenewalEmail(to, data, env) {
  const emailContent = generateSubscriptionRenewalEmail(data);
  return await sendEmail({
    to,
    subject: emailContent.subject,
    html: emailContent.html
  }, env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
}

/**
 * 決済失敗通知メールを送信
 * @param {string} to - 送信先メールアドレス
 * @param {Object} data - 決済失敗情報
 * @param {Object} env - 環境変数
 * @returns {Promise<Object>}
 */
export async function sendPaymentFailureEmail(to, data, env) {
  const emailContent = generatePaymentFailureEmail(data);
  return await sendEmail({
    to,
    subject: emailContent.subject,
    html: emailContent.html
  }, env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
}

/**
 * 注文確認メールを送信
 * @param {Object} params
 * @param {string} params.to - 送信先メールアドレス
 * @param {string} params.customerName - 顧客名
 * @param {string} params.orderNumber - 注文番号
 * @param {Array} params.items - 注文商品リスト
 * @param {number} params.totalAmount - 合計金額
 * @param {string} params.shippingAddress - 配送先住所
 * @param {string} resendApiKey - Resend API Key
 * @param {string} fromEmail - 送信元メールアドレス
 * @returns {Promise<Object>}
 */
export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderNumber,
  items,
  totalAmount,
  shippingAddress
}, resendApiKey, fromEmail) {
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">¥${item.unit_price.toLocaleString()}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">¥${item.subtotal.toLocaleString()}</td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Noto Sans JP', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🛡️ スマートポリス</h1>
    <p style="margin: 10px 0 0 0; font-size: 14px;">ご注文ありがとうございます</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
    <p>${customerName} 様</p>
    
    <p>この度は、スマートポリスECショップをご利用いただき、誠にありがとうございます。<br>
    ご注文を承りましたので、以下の内容をご確認ください。</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="margin-top: 0; color: #1e3a5f; font-size: 18px;">📦 注文情報</h2>
      <p style="margin: 5px 0;"><strong>注文番号:</strong> ${orderNumber}</p>
      <p style="margin: 5px 0;"><strong>注文日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
    </div>
    
    <h2 style="color: #1e3a5f; font-size: 18px; margin-top: 30px;">🛒 ご注文内容</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">商品名</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">数量</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">単価</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">小計</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 15px 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">合計金額</td>
          <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #ff6b35; border-top: 2px solid #ddd;">¥${totalAmount.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
    
    <h2 style="color: #1e3a5f; font-size: 18px; margin-top: 30px;">🚚 配送先情報</h2>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; white-space: pre-line;">${shippingAddress}</p>
    </div>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>📌 配送について</strong><br>
      商品は通常、ご注文確認後7〜15営業日でお届けいたします。<br>
      発送完了後、追跡番号をメールにてお知らせいたします。</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #666;">
      ご不明な点がございましたら、お気軽にお問い合わせください。<br>
      今後とも、スマートポリスECショップをよろしくお願いいたします。
    </p>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>スマートポリスECショップ</strong></p>
      <p style="margin: 5px 0; font-size: 12px; color: #999;">Email: ${fromEmail}</p>
      <p style="margin: 5px 0; font-size: 12px; color: #999;">Website: https://shop.smartpolice.net</p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to,
    subject: `【スマートポリス】ご注文確認 - ${orderNumber}`,
    html: htmlContent
  }, resendApiKey, fromEmail);
}

/**
 * 発送通知メールを送信
 * @param {Object} params
 * @param {string} params.to - 送信先メールアドレス
 * @param {string} params.customerName - 顧客名
 * @param {string} params.orderNumber - 注文番号
 * @param {string} params.trackingNumber - 追跡番号
 * @param {string} params.trackingUrl - 追跡URL
 * @param {string} resendApiKey - Resend API Key
 * @param {string} fromEmail - 送信元メールアドレス
 * @returns {Promise<Object>}
 */
export async function sendShippingNotificationEmail({
  to,
  customerName,
  orderNumber,
  trackingNumber,
  trackingUrl = ''
}, resendApiKey, fromEmail) {
  
  const trackingLink = trackingUrl 
    ? `<a href="${trackingUrl}" style="color: #ff6b35; text-decoration: none;">${trackingNumber}</a>`
    : trackingNumber;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Noto Sans JP', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🛡️ スマートポリス</h1>
    <p style="margin: 10px 0 0 0; font-size: 14px;">商品を発送いたしました</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
    <p>${customerName} 様</p>
    
    <p>いつもスマートポリスECショップをご利用いただき、ありがとうございます。<br>
    ご注文いただいた商品を発送いたしましたのでお知らせいたします。</p>
    
    <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h2 style="margin-top: 0; color: #155724; font-size: 18px;">✅ 発送完了</h2>
      <p style="margin: 5px 0;"><strong>注文番号:</strong> ${orderNumber}</p>
      <p style="margin: 5px 0;"><strong>追跡番号:</strong> ${trackingLink}</p>
      <p style="margin: 5px 0;"><strong>発送日:</strong> ${new Date().toLocaleDateString('ja-JP')}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>📦 お届けまでの目安</strong><br>
        通常、発送から3〜7営業日でお届け予定です。<br>
        配送状況は追跡番号にてご確認いただけます。
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      ${trackingUrl ? `
      <a href="${trackingUrl}" style="display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        配送状況を確認する
      </a>
      ` : ''}
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #666;">
      商品到着まで今しばらくお待ちください。<br>
      ご不明な点がございましたら、お気軽にお問い合わせください。
    </p>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="margin: 5px 0; font-size: 14px; color: #666;"><strong>スマートポリスECショップ</strong></p>
      <p style="margin: 5px 0; font-size: 12px; color: #999;">Email: ${fromEmail}</p>
      <p style="margin: 5px 0; font-size: 12px; color: #999;">Website: https://shop.smartpolice.net</p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to,
    subject: `【スマートポリス】商品発送のお知らせ - ${orderNumber}`,
    html: htmlContent
  }, resendApiKey, fromEmail);
}

/**
 * メール送信（汎用）
 * @param {Object} params
 * @param {string} params.to - 送信先
 * @param {string} params.subject - 件名
 * @param {string} params.html - HTML本文
 * @param {string} resendApiKey - Resend API Key
 * @param {string} fromEmail - 送信元メールアドレス
 * @returns {Promise<Object>}
 */
async function sendEmail({ to, subject, html }, resendApiKey, fromEmail) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `スマートポリスECショップ <${fromEmail}>`,
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Resend API Error: ${error.message || 'Unknown error'}`);
  }

  return await response.json();
}
