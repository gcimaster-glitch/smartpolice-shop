// 新規登録処理
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

      // TODO: 実際のAPI呼び出しに置き換え
      // 現在はデモ用のローカル登録
      
      try {
        const user = {
          id: Date.now(),
          lastName: formData.get('lastName'),
          firstName: formData.get('firstName'),
          name: `${formData.get('lastName')} ${formData.get('firstName')}`,
          email: formData.get('email'),
          phone: formData.get('phone'),
          company: formData.get('company'),
          createdAt: new Date().toISOString()
        };

        // ローカルストレージに保存
        localStorage.setItem('currentUser', JSON.stringify(user));

        // 成功メッセージ
        alert('アカウント作成に成功しました！');

        // トップページへリダイレクト
        window.location.href = '/';

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
