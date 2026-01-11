/**
 * プロフィール編集ページ
 */

// 認証チェック
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
if (!currentUser) {
  window.location.href = '/login.html';
}

// ページ読み込み時に現在のユーザー情報を取得
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserProfile();
  setupProfileForm();
  setupPasswordForm();
});

/**
 * ユーザープロフィール読み込み
 */
async function loadUserProfile() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('ログインセッションが切れました。再度ログインしてください。');
      window.location.href = '/login.html';
      return;
    }

    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('ユーザー情報の取得に失敗しました');
    }

    const data = await response.json();
    const user = data.user;

    // フォームに値を設定
    document.getElementById('lastName').value = user.lastName || '';
    document.getElementById('firstName').value = user.firstName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('company').value = user.company || '';
    document.getElementById('postalCode').value = user.postalCode || '';
    document.getElementById('prefecture').value = user.prefecture || '';
    document.getElementById('address').value = user.address || '';
    document.getElementById('building').value = user.building || '';

  } catch (error) {
    console.error('プロフィール読み込みエラー:', error);
    alert('プロフィール情報の読み込みに失敗しました');
  }
}

/**
 * プロフィール更新フォームのセットアップ
 */
function setupProfileForm() {
  const form = document.getElementById('profile-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const lastName = document.getElementById('lastName').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const company = document.getElementById('company').value.trim();
    const postalCode = document.getElementById('postalCode').value.trim();
    const prefecture = document.getElementById('prefecture').value;
    const address = document.getElementById('address').value.trim();
    const building = document.getElementById('building').value.trim();

    if (!lastName || !firstName) {
      alert('姓と名は必須項目です');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('currentUser'));
      
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = '保存中...';

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          company,
          postalCode,
          prefecture,
          address,
          building
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'プロフィールの更新に失敗しました');
      }

      // ローカルストレージのユーザー情報を更新
      const updatedUser = {
        ...user,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        phone: data.user.phone,
        company: data.user.company,
        postalCode: data.user.postalCode,
        prefecture: data.user.prefecture,
        address: data.user.address,
        building: data.user.building
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      alert('プロフィールを更新しました！');
      
      // ユーザーメニューを更新
      window.dispatchEvent(new Event('userUpdated'));
      
      // マイページにリダイレクト
      setTimeout(() => {
        window.location.href = '/mypage.html';
      }, 500);

    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      alert(error.message || 'プロフィールの更新に失敗しました');
      
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = '保存する';
    }
  });
}

/**
 * パスワード変更フォームのセットアップ
 */
function setupPasswordForm() {
  const form = document.getElementById('password-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      alert('新しいパスワードが一致しません');
      return;
    }

    if (newPassword.length < 8) {
      alert('新しいパスワードは8文字以上で入力してください');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('currentUser'));
      
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = '変更中...';

      const response = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'パスワードの変更に失敗しました');
      }

      alert('パスワードを変更しました！\n再度ログインしてください。');
      
      // ログアウト処理
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      
      // ログインページにリダイレクト
      window.location.href = '/login.html';

    } catch (error) {
      console.error('パスワード変更エラー:', error);
      alert(error.message || 'パスワードの変更に失敗しました');
      
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'パスワードを変更';
    }
  });
}
