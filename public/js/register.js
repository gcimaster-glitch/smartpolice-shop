// 新規登録処理 - 本番実装（JWT認証）
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(registerForm);
      const password = formData.get('password');
      const passwordConfirm = formData.get('passwordConfirm');

      // パスワード確認
      if (password !== passwordConfirm) {
        alert('パスワードが一致しません。');
        return;
      }

      // パスワードの強度チェック
      if (password.length < 8) {
        alert('パスワードは8文字以上にしてください。');
        return;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.get('email'),
            password: password,
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone'),
            company: formData.get('company')
          })
        });

        const data = await response.json();

        if (response.ok && data.token) {
          // トークンとユーザー情報を保存
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('currentUser', JSON.stringify(data.user));

          // 成功メッセージ
          alert('アカウント作成に成功しました！');

          // マイページへリダイレクト
          window.location.href = '/mypage.html';
        } else {
          alert(data.error || '登録に失敗しました。');
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('登録に失敗しました。もう一度お試しください。');
      }
    });
  }

  // Google 登録（デモ）
  const googleBtn = document.querySelector('.btn-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      alert('Google 登録は準備中です。\n通常の登録をご利用ください。');
    });
  }
});
