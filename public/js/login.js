// ログイン処理
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(loginForm);
      const email = formData.get('email');
      const password = formData.get('password');
      const remember = formData.get('remember');

      // TODO: 実際のAPI呼び出しに置き換え
      // 現在はデモ用のローカル認証
      
      try {
        // デモ用: 任意のメールアドレスでログイン可能
        const user = {
          id: Date.now(),
          email: email,
          name: email.split('@')[0],
          createdAt: new Date().toISOString()
        };

        // ローカルストレージに保存
        localStorage.setItem('currentUser', JSON.stringify(user));

        if (remember) {
          localStorage.setItem('rememberLogin', 'true');
        }

        // 成功メッセージ
        alert('ログインに成功しました！');

        // カートに商品がある場合はカートへ、なければトップへ
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cart.length > 0) {
          window.location.href = '/cart.html';
        } else {
          window.location.href = '/';
        }

      } catch (error) {
        console.error('Login error:', error);
        alert('ログインに失敗しました。もう一度お試しください。');
      }
    });
  }

  // Google ログイン（デモ）
  const googleBtn = document.querySelector('.btn-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      alert('Google ログインは準備中です。\n通常のログインをご利用ください。');
    });
  }
});
