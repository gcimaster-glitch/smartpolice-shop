// ログイン処理 - 本番実装（JWT認証）
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      if (!email || !password) {
        alert('メールアドレスとパスワードを入力してください。');
        return;
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
          // トークンとユーザー情報を保存
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('currentUser', JSON.stringify(data.user));

          // 成功メッセージ
          alert('ログインしました！');

          // マイページへリダイレクト
          window.location.href = '/mypage.html';
        } else {
          alert(data.error || 'ログインに失敗しました。');
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

  // パスワードリセット
  const forgotPasswordLink = document.querySelector('.forgot-password');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('パスワードリセット機能は準備中です。\nサポートにお問い合わせください。');
    });
  }
});
