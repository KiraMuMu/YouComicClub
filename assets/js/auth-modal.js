/**
 * 登录/注册弹窗组件
 * 样式与网站深色主题统一
 */

const authModalHTML = `
<div id="auth-modal" class="auth-modal">
  <div class="auth-modal-content">
    <button class="auth-modal-close" onclick="auth.hideLoginModal()">&times;</button>
    
    <div class="auth-tabs">
      <button class="auth-tab active" data-tab="login">登录</button>
      <button class="auth-tab" data-tab="register">注册</button>
    </div>
    
    <!-- 登录面板 -->
    <div id="auth-login-panel" class="auth-panel active">
      <h3>欢迎回来</h3>
      
      <div class="auth-form-group">
        <input type="text" id="login-username" placeholder="用户名" required>
      </div>
      <div class="auth-form-group">
        <input type="password" id="login-password" placeholder="密码" required>
      </div>
      
      <div id="login-error" class="auth-error"></div>
      
      <button class="auth-btn auth-btn-primary" onclick="handleLogin()">登录</button>
      
      <div class="auth-divider">
        <span>或使用</span>
      </div>
      
      <button class="auth-btn auth-btn-bangumi" onclick="auth.bangumiLogin()">
        <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px; vertical-align: middle;">
          <circle cx="12" cy="12" r="10" fill="#F09199"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">B</text>
        </svg>
        Bangumi 账号登录
      </button>
    </div>
    
    <!-- 注册面板 -->
    <div id="auth-register-panel" class="auth-panel">
      <h3>创建账号</h3>
      
      <div class="auth-form-group">
        <input type="text" id="register-username" placeholder="用户名（2-20字符）" required>
      </div>
      <div class="auth-form-group">
        <input type="email" id="register-email" placeholder="邮箱（可选）">
      </div>
      <div class="auth-form-group">
        <input type="password" id="register-password" placeholder="密码（至少6位）" required>
      </div>
      <div class="auth-form-group">
        <input type="password" id="register-password-confirm" placeholder="确认密码" required>
      </div>
      
      <div id="register-error" class="auth-error"></div>
      
      <button class="auth-btn auth-btn-primary" onclick="handleRegister()">注册</button>
    </div>
  </div>
</div>
`;

const authStyles = `
.auth-modal {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 5, 20, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 2000;
}

.auth-modal.active {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-modal-content {
  background: linear-gradient(145deg, rgba(12, 28, 70, 0.98) 0%, rgba(8, 18, 50, 0.98) 100%);
  border: 1px solid rgba(91, 143, 212, 0.35);
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  color: #e8f4ff;
  position: relative;
  animation: fadeInUp 0.3s ease;
}

.auth-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: rgba(200, 225, 255, 0.5);
  line-height: 1;
  padding: 4px 8px;
  border-radius: 6px;
  transition: 0.2s;
}

.auth-modal-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.auth-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(91, 143, 212, 0.2);
}

.auth-tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  font-size: 15px;
  cursor: pointer;
  color: rgba(200, 225, 255, 0.5);
  position: relative;
  transition: 0.2s;
  font-weight: 500;
}

.auth-tab:hover {
  color: rgba(200, 225, 255, 0.8);
}

.auth-tab.active {
  color: #a8d5ff;
  font-weight: 700;
}

.auth-tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #5B8FD4, #a8d5ff);
  border-radius: 1px;
}

.auth-panel {
  display: none;
}

.auth-panel.active {
  display: block;
}

.auth-panel h3 {
  margin: 0 0 20px 0;
  font-size: 22px;
  font-weight: 800;
  color: #e8f4ff;
  letter-spacing: -0.01em;
}

.auth-form-group {
  margin-bottom: 16px;
}

.auth-form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(91, 143, 212, 0.3);
  border-radius: 10px;
  font-size: 15px;
  background: rgba(91, 143, 212, 0.08);
  color: #e8f4ff;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.auth-form-group input::placeholder {
  color: rgba(200, 225, 255, 0.35);
}

.auth-form-group input:focus {
  border-color: rgba(91, 143, 212, 0.7);
  box-shadow: 0 0 0 3px rgba(91, 143, 212, 0.15);
}

.auth-error {
  color: #ff6b8a;
  font-size: 13px;
  margin-bottom: 12px;
  min-height: 18px;
}

.auth-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  box-sizing: border-box;
}

.auth-btn-primary {
  background: linear-gradient(135deg, #5B8FD4 0%, #3A6CB8 100%);
  color: #fff;
  box-shadow: 0 4px 20px rgba(91, 143, 212, 0.4);
  margin-bottom: 4px;
}

.auth-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 30px rgba(91, 143, 212, 0.6);
}

.auth-btn-bangumi {
  background: rgba(240, 145, 153, 0.12);
  color: #F09199;
  border: 1px solid rgba(240, 145, 153, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-btn-bangumi:hover {
  background: rgba(240, 145, 153, 0.22);
  border-color: rgba(240, 145, 153, 0.5);
}

.auth-divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: rgba(200, 225, 255, 0.35);
  font-size: 13px;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(91, 143, 212, 0.2);
}

.auth-divider span {
  padding: 0 16px;
}

/* 导航栏用户区域 */
.auth-user-info {
  display: none;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  padding-bottom: 8px;         /* 桥接区域，消除死亡间隙 */
}

/* 用伪元素扩大 hover 触发范围，防止下拉菜单闪退 */
.auth-user-info::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 8px;
  cursor: pointer;
}

.auth-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(91, 143, 212, 0.4);
}

.auth-username {
  font-size: 14px;
  color: #e8f4ff;
  font-weight: 500;
}

.auth-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(12, 28, 70, 0.98);
  border: 1px solid rgba(91, 143, 212, 0.3);
  border-radius: 10px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  padding: 6px 0;
  min-width: 160px;
  display: none;
  z-index: 100;
}

.auth-user-info:hover .auth-dropdown {
  display: block;
}

.auth-dropdown-item {
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  color: rgba(200, 225, 255, 0.8);
  transition: 0.15s;
}

.auth-dropdown-item:hover {
  background: rgba(91, 143, 212, 0.15);
  color: #fff;
}
`;

// 插入样式
const styleEl = document.createElement('style');
styleEl.textContent = authStyles;
document.head.appendChild(styleEl);

// 插入弹窗 HTML
document.body.insertAdjacentHTML('beforeend', authModalHTML);

// 标签切换
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`auth-${tab.dataset.tab}-panel`).classList.add('active');
  });
});

// 登录处理
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  
  if (!username || !password) {
    errorEl.textContent = '请填写用户名和密码';
    return;
  }
  
  errorEl.textContent = '登录中...';
  const result = await auth.login(username, password);
  
  if (result.success) {
    auth.hideLoginModal();
    errorEl.textContent = '';
  } else {
    errorEl.textContent = result.error || '登录失败';
  }
}

// 注册处理
async function handleRegister() {
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-password-confirm').value;
  const errorEl = document.getElementById('register-error');
  
  if (!username || !password) {
    errorEl.textContent = '请填写用户名和密码';
    return;
  }
  
  if (password.length < 6) {
    errorEl.textContent = '密码长度至少6位';
    return;
  }
  
  if (password !== confirm) {
    errorEl.textContent = '两次输入的密码不一致';
    return;
  }
  
  errorEl.textContent = '注册中...';
  const result = await auth.register(username, password, email);
  
  if (result.success) {
    auth.hideLoginModal();
    errorEl.textContent = '';
  } else {
    errorEl.textContent = result.error || '注册失败';
  }
}

// 回车提交
document.querySelectorAll('#auth-modal input').forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const panel = input.closest('.auth-panel');
      if (panel.id === 'auth-login-panel') {
        handleLogin();
      } else {
        handleRegister();
      }
    }
  });
});

// 点击外部关闭
const modal = document.getElementById('auth-modal');
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    auth.hideLoginModal();
  }
});
