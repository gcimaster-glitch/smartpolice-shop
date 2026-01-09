#!/bin/bash

# 共通のナビゲーションとフッターを変数に格納（前回と同じ）
NAV='<nav class="nav"><div class="nav-content"><a href="/" class="nav-logo"><img src="/images/logo.png" alt="SmartPolice"><span class="nav-service-label">SERVICE & PRODUCTS</span></a><ul class="nav-links"><li><a href="/info.html">INFO</a></li><li><a href="/service.html">SERVICE</a></li><li><a href="/products.html">PRODUCTS</a></li><li><a href="/faq.html">FAQ</a></li><li><a href="/support.html">SUPPORT</a></li><li><a href="/about.html">ABOUT US</a></li><li><a href="/contact.html">CONTACT</a></li></ul><div class="nav-actions"><div class="nav-guest" id="nav-guest"><a href="/login.html" class="nav-link-btn">ログイン</a><a href="/register.html" class="nav-link-btn primary">新規登録</a></div><div class="nav-user" id="nav-user" style="display: none;"><div class="nav-user-menu"><button class="nav-user-button" id="user-menu-button"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span id="user-name">ユーザー</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><div class="nav-user-dropdown" id="user-dropdown" style="display: none;"><a href="/mypage.html" class="dropdown-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>マイページ</a><a href="/profile.html" class="dropdown-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>個人情報編集</a><a href="/orders.html" class="dropdown-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>購入履歴</a><a href="/nda.html" class="dropdown-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>NDA契約</a><a href="/customer-support.html" class="dropdown-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/></svg>サポート</a><a href="/chat.html" class="dropdown-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>チャット</a><div class="dropdown-divider"></div><button class="dropdown-item logout-btn" id="logout-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>ログアウト</button></div></div></div><a href="/cart.html" class="nav-cart"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><span class="cart-badge" id="cart-badge" style="display: none;">0</span></a></div></div></nav>'

FOOTER='<footer class="footer-new"><div class="container"><div class="footer-main"><div class="footer-brand"><img src="/images/logo.png" alt="SmartPolice" class="footer-logo-img"><p class="footer-tagline">守る力を、あなたの手に。</p></div><div class="footer-links-grid"><div class="footer-column"><h4>サービス</h4><a href="/service.html">サービス一覧</a></div><div class="footer-column"><h4>製品</h4><a href="/products.html">製品一覧</a></div><div class="footer-column"><h4>サポート</h4><a href="/faq.html">よくある質問</a></div><div class="footer-column"><h4>企業情報</h4><a href="/about.html">会社概要</a></div></div></div><div class="footer-bottom"><div class="footer-bottom-content"><p class="copyright">© 2026 SmartPolice. All rights reserved.</p></div></div></div></footer>'

echo "Creating user pages..."

# Mypage
cat > mypage.html << 'MYPAGEEOF'
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>マイページ | SmartPolice</title>
  <link rel="stylesheet" href="/css/store.css">
</head>
<body>
MYPAGEEOF
echo "$NAV" >> mypage.html
cat >> mypage.html << 'MYPAGEEOF2'
  <section class="page-header">
    <div class="container">
      <h1>マイページ</h1>
      <p>アカウント情報とご利用状況</p>
    </div>
  </section>
  <section class="content-section">
    <div class="container">
      <div class="mypage-grid">
        <div class="mypage-card">
          <h3>最近の注文</h3>
          <div id="recent-orders">注文履歴はありません</div>
          <a href="/orders.html" class="btn-secondary">すべての注文を見る</a>
        </div>
        <div class="mypage-card">
          <h3>アカウント情報</h3>
          <p id="user-info">読み込み中...</p>
          <a href="/profile.html" class="btn-secondary">編集する</a>
        </div>
        <div class="mypage-card">
          <h3>サポート</h3>
          <p>ご不明な点がございましたらお気軽にお問い合わせください</p>
          <a href="/customer-support.html" class="btn-secondary">サポートセンター</a>
        </div>
      </div>
    </div>
  </section>
MYPAGEEOF2
echo "$FOOTER" >> mypage.html
cat >> mypage.html << 'MYPAGEEOF3'
  <script src="/js/user-menu.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!user) {
        window.location.href = '/login.html';
        return;
      }
      document.getElementById('user-info').textContent = `${user.name || user.email}`;
    });
  </script>
</body>
</html>
MYPAGEEOF3

echo "mypage.html created"

# Profile
cat > profile.html << 'PROFEOF'
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>個人情報編集 | SmartPolice</title>
  <link rel="stylesheet" href="/css/store.css">
</head>
<body>
PROFEOF
echo "$NAV" >> profile.html
cat >> profile.html << 'PROFEOF2'
  <section class="page-header">
    <div class="container">
      <h1>個人情報編集</h1>
      <p>アカウント情報の変更</p>
    </div>
  </section>
  <section class="auth-section">
    <div class="container">
      <div class="auth-container" style="max-width: 640px;">
        <div class="auth-card">
          <form id="profile-form" class="auth-form">
            <div class="form-row">
              <div class="form-group">
                <label>姓</label>
                <input type="text" id="lastName" required>
              </div>
              <div class="form-group">
                <label>名</label>
                <input type="text" id="firstName" required>
              </div>
            </div>
            <div class="form-group">
              <label>メールアドレス</label>
              <input type="email" id="email" required>
            </div>
            <div class="form-group">
              <label>電話番号</label>
              <input type="tel" id="phone">
            </div>
            <div class="form-group">
              <label>会社名</label>
              <input type="text" id="company">
            </div>
            <button type="submit" class="btn-primary btn-full">保存する</button>
          </form>
        </div>
      </div>
    </div>
  </section>
PROFEOF2
echo "$FOOTER" >> profile.html
cat >> profile.html << 'PROFEOF3'
  <script src="/js/user-menu.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!user) {
        window.location.href = '/login.html';
        return;
      }
      document.getElementById('lastName').value = user.lastName || '';
      document.getElementById('firstName').value = user.firstName || '';
      document.getElementById('email').value = user.email || '';
      document.getElementById('phone').value = user.phone || '';
      document.getElementById('company').value = user.company || '';

      document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        user.lastName = document.getElementById('lastName').value;
        user.firstName = document.getElementById('firstName').value;
        user.name = `${user.lastName} ${user.firstName}`;
        user.email = document.getElementById('email').value;
        user.phone = document.getElementById('phone').value;
        user.company = document.getElementById('company').value;
        localStorage.setItem('currentUser', JSON.stringify(user));
        alert('個人情報を更新しました');
        window.location.href = '/mypage.html';
      });
    });
  </script>
</body>
</html>
PROFEOF3

echo "profile.html created"

# Orders
cat > orders.html << 'ORDEOF'
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>購入履歴 | SmartPolice</title>
  <link rel="stylesheet" href="/css/store.css">
</head>
<body>
ORDEOF
echo "$NAV" >> orders.html
cat >> orders.html << 'ORDEOF2'
  <section class="page-header">
    <div class="container">
      <h1>購入履歴</h1>
      <p>ご注文の確認とステータス</p>
    </div>
  </section>
  <section class="content-section">
    <div class="container">
      <div class="info-list">
        <div class="info-item">
          <p>現在、ご注文履歴はありません。</p>
          <a href="/products.html" class="btn-primary">製品を見る</a>
        </div>
      </div>
    </div>
  </section>
ORDEOF2
echo "$FOOTER" >> orders.html
cat >> orders.html << 'ORDEOF3'
  <script src="/js/user-menu.js"></script>
  <script>
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) window.location.href = '/login.html';
  </script>
</body>
</html>
ORDEOF3

echo "orders.html created"

# NDA, Support, Chat - 簡易版
for page in nda customer-support chat; do
  title=""
  heading=""
  desc=""
  case $page in
    nda)
      title="NDA契約"
      heading="NDA契約"
      desc="機密保持契約の確認と締結"
      ;;
    customer-support)
      title="サポート"
      heading="カスタマーサポート"
      desc="お困りの際はこちらからお問い合わせください"
      ;;
    chat)
      title="チャット"
      heading="チャットサポート"
      desc="リアルタイムでサポートスタッフと会話"
      ;;
  esac

  cat > ${page}.html << SIMPLEEOF
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | SmartPolice</title>
  <link rel="stylesheet" href="/css/store.css">
</head>
<body>
SIMPLEEOF
  echo "$NAV" >> ${page}.html
  cat >> ${page}.html << SIMPLEEOF2
  <section class="page-header">
    <div class="container">
      <h1>${heading}</h1>
      <p>${desc}</p>
    </div>
  </section>
  <section class="content-section">
    <div class="container">
      <div class="about-content">
        <p>この機能は現在準備中です。近日公開予定です。</p>
        <p class="cta-text"><a href="/contact.html">お問い合わせはこちら</a></p>
      </div>
    </div>
  </section>
SIMPLEEOF2
  echo "$FOOTER" >> ${page}.html
  cat >> ${page}.html << SIMPLEEOF3
  <script src="/js/user-menu.js"></script>
  <script>
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) window.location.href = '/login.html';
  </script>
</body>
</html>
SIMPLEEOF3
  echo "${page}.html created"
done

# Support (別名)
cp customer-support.html support.html
echo "support.html created"

echo "All user pages created successfully!"
