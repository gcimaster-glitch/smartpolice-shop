/**
 * PDF生成用HTMLテンプレート
 * 見積書・請求書・領収書のHTML生成
 */

/**
 * 見積書HTMLテンプレート生成
 */
export function generateQuoteHTML(quote) {
  const items = JSON.parse(quote.items);
  
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>見積書 - ${quote.quote_number}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    body {
      font-family: 'MS Gothic', 'Hiragino Kaku Gothic ProN', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 20px;
    }
    
    .document {
      max-width: 210mm;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    
    .header h1 {
      font-size: 24pt;
      margin: 0 0 10px 0;
      font-weight: bold;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .info-section {
      border: 1px solid #000;
      padding: 10px;
    }
    
    .info-section h3 {
      margin: 0 0 10px 0;
      font-size: 12pt;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 5px;
    }
    
    .info-label {
      width: 100px;
      font-weight: bold;
    }
    
    .info-value {
      flex: 1;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .items-table th,
    .items-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    
    .items-table th {
      background: #f0f0f0;
      font-weight: bold;
    }
    
    .items-table td.number {
      text-align: right;
    }
    
    .summary {
      float: right;
      width: 300px;
      margin-bottom: 30px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #ccc;
    }
    
    .summary-row.total {
      font-size: 14pt;
      font-weight: bold;
      border-bottom: 2px solid #000;
      border-top: 2px solid #000;
      margin-top: 5px;
      padding: 10px 0;
    }
    
    .notes {
      clear: both;
      margin-top: 30px;
      padding: 10px;
      border: 1px solid #000;
    }
    
    .notes h3 {
      margin: 0 0 10px 0;
      font-size: 12pt;
    }
    
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 10pt;
      color: #666;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <h1>御 見 積 書</h1>
      <p>見積番号: ${quote.quote_number}</p>
      <p>発行日: ${new Date().toLocaleDateString('ja-JP')}</p>
    </div>
    
    <div class="info-grid">
      <div class="info-section">
        <h3>お客様情報</h3>
        <div class="info-row">
          <div class="info-label">会社名:</div>
          <div class="info-value">${quote.customer_company || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">お名前:</div>
          <div class="info-value">${quote.customer_name} 様</div>
        </div>
        <div class="info-row">
          <div class="info-label">メール:</div>
          <div class="info-value">${quote.customer_email}</div>
        </div>
        <div class="info-row">
          <div class="info-label">電話番号:</div>
          <div class="info-value">${quote.customer_phone || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">住所:</div>
          <div class="info-value">${quote.customer_address || '-'}</div>
        </div>
      </div>
      
      <div class="info-section">
        <h3>発行元情報</h3>
        <div class="info-row">
          <div class="info-label">会社名:</div>
          <div class="info-value">株式会社スマートポリス</div>
        </div>
        <div class="info-row">
          <div class="info-label">住所:</div>
          <div class="info-value">〒100-0001<br>東京都千代田区千代田1-1-1</div>
        </div>
        <div class="info-row">
          <div class="info-label">電話:</div>
          <div class="info-value">03-1234-5678</div>
        </div>
        <div class="info-row">
          <div class="info-label">有効期限:</div>
          <div class="info-value">${quote.valid_until || '-'}</div>
        </div>
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50px;">No.</th>
          <th>品名・サービス名</th>
          <th style="width: 80px;">数量</th>
          <th style="width: 100px;">単価</th>
          <th style="width: 120px;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, index) => `
        <tr>
          <td class="number">${index + 1}</td>
          <td>
            ${item.name}
            ${item.description ? `<br><small>${item.description}</small>` : ''}
          </td>
          <td class="number">${item.quantity}</td>
          <td class="number">¥${item.unit_price.toLocaleString()}</td>
          <td class="number">¥${item.amount.toLocaleString()}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="summary">
      <div class="summary-row">
        <span>小計:</span>
        <span>¥${quote.subtotal.toLocaleString()}</span>
      </div>
      <div class="summary-row">
        <span>消費税 (${quote.tax_rate}%):</span>
        <span>¥${quote.tax_amount.toLocaleString()}</span>
      </div>
      <div class="summary-row total">
        <span>合計金額:</span>
        <span>¥${quote.total_amount.toLocaleString()}</span>
      </div>
    </div>
    
    ${quote.notes ? `
    <div class="notes">
      <h3>備考</h3>
      <p>${quote.notes.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}
    
    ${quote.terms ? `
    <div class="notes">
      <h3>取引条件</h3>
      <p>${quote.terms.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>本見積書は${quote.valid_until || '発行日より30日間'}まで有効です。</p>
      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    </div>
    
    <div class="no-print" style="text-align: center; margin-top: 20px;">
      <button onclick="window.print()" style="padding: 10px 30px; font-size: 14pt; cursor: pointer;">印刷 / PDF保存</button>
      <button onclick="window.close()" style="padding: 10px 30px; font-size: 14pt; cursor: pointer; margin-left: 10px;">閉じる</button>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 請求書HTMLテンプレート生成
 */
export function generateInvoiceHTML(invoice) {
  const items = JSON.parse(invoice.items);
  
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>請求書 - ${invoice.invoice_number}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'MS Gothic', 'Hiragino Kaku Gothic ProN', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 20px;
    }
    .document { max-width: 210mm; margin: 0 auto; }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .header h1 {
      font-size: 24pt;
      margin: 0 0 10px 0;
      font-weight: bold;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .info-section {
      border: 1px solid #000;
      padding: 10px;
    }
    .info-section h3 {
      margin: 0 0 10px 0;
      font-size: 12pt;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    .info-row {
      display: flex;
      margin-bottom: 5px;
    }
    .info-label {
      width: 100px;
      font-weight: bold;
    }
    .info-value { flex: 1; }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th,
    .items-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    .items-table th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .items-table td.number { text-align: right; }
    .summary {
      float: right;
      width: 300px;
      margin-bottom: 30px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #ccc;
    }
    .summary-row.total {
      font-size: 14pt;
      font-weight: bold;
      border-bottom: 2px solid #000;
      border-top: 2px solid #000;
      margin-top: 5px;
      padding: 10px 0;
    }
    .payment-info {
      clear: both;
      margin-top: 30px;
      padding: 15px;
      border: 2px solid #000;
      background: #fff9e6;
    }
    .payment-info h3 {
      margin: 0 0 10px 0;
      font-size: 14pt;
      color: #d00;
    }
    .notes {
      margin-top: 20px;
      padding: 10px;
      border: 1px solid #000;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 10pt;
      color: #666;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <h1>請 求 書</h1>
      <p>請求書番号: ${invoice.invoice_number}</p>
      <p>発行日: ${invoice.issue_date}</p>
    </div>
    
    <div class="info-grid">
      <div class="info-section">
        <h3>請求先情報</h3>
        <div class="info-row">
          <div class="info-label">会社名:</div>
          <div class="info-value">${invoice.customer_company || '-'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">お名前:</div>
          <div class="info-value">${invoice.customer_name} 様</div>
        </div>
        <div class="info-row">
          <div class="info-label">メール:</div>
          <div class="info-value">${invoice.customer_email}</div>
        </div>
        <div class="info-row">
          <div class="info-label">住所:</div>
          <div class="info-value">${invoice.customer_address || '-'}</div>
        </div>
      </div>
      
      <div class="info-section">
        <h3>請求元情報</h3>
        <div class="info-row">
          <div class="info-label">会社名:</div>
          <div class="info-value">株式会社スマートポリス</div>
        </div>
        <div class="info-row">
          <div class="info-label">住所:</div>
          <div class="info-value">〒100-0001<br>東京都千代田区千代田1-1-1</div>
        </div>
        <div class="info-row">
          <div class="info-label">電話:</div>
          <div class="info-value">03-1234-5678</div>
        </div>
        ${invoice.billing_period_start ? `
        <div class="info-row">
          <div class="info-label">請求期間:</div>
          <div class="info-value">${invoice.billing_period_start} 〜 ${invoice.billing_period_end}</div>
        </div>
        ` : ''}
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50px;">No.</th>
          <th>品名・サービス名</th>
          <th style="width: 80px;">数量</th>
          <th style="width: 100px;">単価</th>
          <th style="width: 120px;">金額</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item, index) => `
        <tr>
          <td class="number">${index + 1}</td>
          <td>
            ${item.name}
            ${item.description ? `<br><small>${item.description}</small>` : ''}
          </td>
          <td class="number">${item.quantity}</td>
          <td class="number">¥${item.unit_price.toLocaleString()}</td>
          <td class="number">¥${item.amount.toLocaleString()}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="summary">
      <div class="summary-row">
        <span>小計:</span>
        <span>¥${invoice.subtotal.toLocaleString()}</span>
      </div>
      <div class="summary-row">
        <span>消費税 (${invoice.tax_rate}%):</span>
        <span>¥${invoice.tax_amount.toLocaleString()}</span>
      </div>
      <div class="summary-row total">
        <span>ご請求金額:</span>
        <span>¥${invoice.total_amount.toLocaleString()}</span>
      </div>
    </div>
    
    <div class="payment-info">
      <h3>お支払い情報</h3>
      <div class="info-row">
        <div class="info-label">お支払期限:</div>
        <div class="info-value" style="color: #d00; font-weight: bold;">${invoice.payment_due_date}</div>
      </div>
      <div class="info-row">
        <div class="info-label">振込先:</div>
        <div class="info-value">
          ○○銀行 ○○支店<br>
          普通 1234567<br>
          カ）スマートポリス
        </div>
      </div>
      <p style="margin-top: 10px; font-size: 10pt;">
        ※ 振込手数料はお客様負担となります。<br>
        ※ お振込み後、領収書が必要な場合はご連絡ください。
      </p>
    </div>
    
    ${invoice.notes ? `
    <div class="notes">
      <h3>備考</h3>
      <p>${invoice.notes.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>お支払期限: ${invoice.payment_due_date}</p>
      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    </div>
    
    <div class="no-print" style="text-align: center; margin-top: 20px;">
      <button onclick="window.print()" style="padding: 10px 30px; font-size: 14pt; cursor: pointer;">印刷 / PDF保存</button>
      <button onclick="window.close()" style="padding: 10px 30px; font-size: 14pt; cursor: pointer; margin-left: 10px;">閉じる</button>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 領収書HTMLテンプレート生成
 */
export function generateReceiptHTML(receipt) {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>領収書 - ${receipt.receipt_number}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'MS Gothic', 'Hiragino Kaku Gothic ProN', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 20px;
    }
    .document {
      max-width: 210mm;
      margin: 0 auto;
      border: 3px solid #000;
      padding: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 28pt;
      margin: 0 0 20px 0;
      font-weight: bold;
      letter-spacing: 10px;
    }
    .receipt-number {
      text-align: right;
      font-size: 11pt;
      margin-bottom: 30px;
    }
    .customer-info {
      margin-bottom: 30px;
      font-size: 14pt;
    }
    .customer-name {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    .amount-section {
      text-align: center;
      margin: 40px 0;
      padding: 20px;
      border: 2px solid #000;
      background: #f9f9f9;
    }
    .amount-label {
      font-size: 14pt;
      margin-bottom: 10px;
    }
    .amount-value {
      font-size: 32pt;
      font-weight: bold;
      color: #000;
      margin: 10px 0;
    }
    .purpose-section {
      margin: 30px 0;
      padding: 15px;
      border: 1px solid #000;
    }
    .purpose-label {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .purpose-value {
      font-size: 14pt;
      padding: 10px;
      background: #fff;
      border: 1px dashed #666;
    }
    .payment-info {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 10px;
      margin: 20px 0;
    }
    .payment-label {
      font-weight: bold;
    }
    .issuer-info {
      margin-top: 50px;
      text-align: right;
    }
    .issuer-info h3 {
      font-size: 14pt;
      margin-bottom: 10px;
    }
    .stamp-area {
      width: 100px;
      height: 100px;
      border: 2px solid #d00;
      border-radius: 50%;
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10pt;
      color: #d00;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 10pt;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <h1>領 収 書</h1>
    </div>
    
    <div class="receipt-number">
      領収書番号: ${receipt.receipt_number}<br>
      発行日: ${receipt.issue_date}
    </div>
    
    <div class="customer-info">
      <div class="customer-name">
        ${receipt.customer_company ? `${receipt.customer_company}<br>` : ''}
        ${receipt.customer_name} 様
      </div>
    </div>
    
    <div class="amount-section">
      <div class="amount-label">領収金額</div>
      <div class="amount-value">¥ ${receipt.amount.toLocaleString()} ${receipt.tax_included ? '（税込）' : ''}</div>
    </div>
    
    <div class="purpose-section">
      <div class="purpose-label">但し書き</div>
      <div class="purpose-value">${receipt.purpose || '品代として'}</div>
    </div>
    
    <div class="payment-info">
      <div class="payment-label">お支払方法:</div>
      <div>${receipt.payment_method}</div>
      
      <div class="payment-label">領収日:</div>
      <div>${receipt.received_date}</div>
    </div>
    
    <div class="issuer-info">
      <h3>発行元</h3>
      <p>
        株式会社スマートポリス<br>
        〒100-0001<br>
        東京都千代田区千代田1-1-1<br>
        TEL: 03-1234-5678
      </p>
      <div class="stamp-area">
        社印
      </div>
    </div>
    
    ${receipt.notes ? `
    <div style="margin-top: 20px; padding: 10px; border: 1px solid #ccc; font-size: 10pt;">
      <strong>備考:</strong> ${receipt.notes}
    </div>
    ` : ''}
    
    <div class="footer">
      <p>※ 本領収書は再発行いたしませんので、大切に保管してください。</p>
    </div>
    
    <div class="no-print" style="text-align: center; margin-top: 20px;">
      <button onclick="window.print()" style="padding: 10px 30px; font-size: 14pt; cursor: pointer;">印刷 / PDF保存</button>
      <button onclick="window.close()" style="padding: 10px 30px; font-size: 14pt; cursor: pointer; margin-left: 10px;">閉じる</button>
    </div>
  </div>
</body>
</html>
  `;
}
