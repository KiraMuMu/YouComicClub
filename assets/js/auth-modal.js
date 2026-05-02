/**
 * 登录/注册弹窗组件（主题感知版）
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
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}
.auth-modal.active { display: flex; }

.auth-modal-content {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 32px;
  width: 90%;
  max-width: 380px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
  border: 1px solid var(--card-border);
}

.auth-modal-close {
  position: absolute;
  top: 16px; right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
  line-height: 1;
}
.auth-modal-close:hover { color: var(--text-main); }

.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid var(--card-border);
}

.auth-tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-muted);
  position: relative;
}
.auth-tab.active { color: #F09199; font-weight: 600; }
.auth-tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0; right: 0;
  height: 2px;
  background: #F09199;
}

.auth-panel { display: none; }
.auth-panel.active { display: block; }
.auth-panel h3 { margin: 0 0 20px 0; font-size: 20px; color: var(--text-main); }

.auth-form-group { margin-bottom: 16px; }
.auth-form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
  background: rgba(255,255,255,0.06);
  color: var(--text-main);
  transition: border-color 0.2s;
}
.auth-form-group input:focus { outline: none; border-color: #F09199; }
.auth-form-group input::placeholder { color: var(--text-muted); }

.auth-error { color: #e74c3c; font-size: 13px; margin-bottom: 12px; min-height: 18px; }

.auth-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}
.auth-btn-primary {
  background: linear-gradient(135deg, #F09199 0%, #e67e8a 100%);
  color: white;
  font-weight: 600;
}
.auth-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(240,145,153,0.4);
}
.auth-btn-bangumi {
  background: rgba(255,255,255,0.06);
  color: var(--text-main);
  border: 1px solid var(--card-border);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.auth-btn-bangumi:hover { background: rgba(255,255,255,0.1); }

.auth-divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: var(--text-muted);
  font-size: 13px;
}
.auth-divider::before, .auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--card-border);
}
.auth-divider span { padding: 0 16px; }

/* 导航栏用户区域（含死亡间隙修复） */
.auth-user-info {
  display: none;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  padding-bottom: 6px;
}
.auth-user-info::after {
  content: '';
  position: absolute;
  left: 0; right: 0;
  bottom: 0;
  height: 6px;
  pointer-events: auto;
}

.auth-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.auth-username { font-size: 14px; color: var(--text-main); }

.auth-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  padding: 8px 0;
  min-width: 150px;
  display: none;
  border: 1px solid var(--card-border);
  z-index: 1001;
}
.auth-user-info:hover .auth-dropdown,
.auth-dropdown:hover { display: block; }

.auth-dropdown-item {
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-main);
}
.auth-dropdown-item:hover { background: rgba(91,143,212,0.1); }
`;

// 插入样式
const styleEl = document.createElement('style')
styleEl.textContent = authStyles
document.head.appendChild(styleEl)

// 插入弹窗 HTML
document.body.insertAdjacentHTML('beforeend', authModalHTML)

// 标签切换
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'))
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'))
    tab.classList.add('active')
    document.getElementById(`auth-${tab.dataset.tab}-panel`).classList.add('active')
  })
})

// 登录处理
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim()
  const password = document.getElementById('login-password').value
  const errorEl = document.getElementById('login-error')
  
  if (!username || !password) {
    errorEl.textContent = '请填写用户名和密码'
    return
  }
  
  errorEl.textContent = '登录中...'
  const result = await auth.login(username, password)
  
  if (result.success) {
    auth.hideLoginModal()
    errorEl.textContent = ''
  } else {
    errorEl.textContent = result.error || '登录失败'
  }
}

// 注册处理
async function handleRegister() {
  const username = document.getElementById('register-username').value.trim()
  const email = document.getElementById('register-email').value.trim()
  const password = document.getElementById('register-password').value
  const confirm = document.getElementById('register-password-confirm').value
  const errorEl = document.getElementById('register-error')
  
  if (!username || !password) {
    errorEl.textContent = '请填写用户名和密码'
    return
  }
  
  if (password.length < 6) {
    errorEl.textContent = '密码长度至少6位'
    return
  }
  
  if (password !== confirm) {
    errorEl.textContent = '两次输入的密码不一致'
    return
  }
  
  errorEl.textContent = '注册中...'
  const result = await auth.register(username, password, email)
  
  if (result.success) {
    auth.hideLoginModal()
    errorEl.textContent = ''
  } else {
    errorEl.textContent = result.error || '注册失败'
  }
}

// 回车提交
document.querySelectorAll('#auth-modal input').forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const panel = input.closest('.auth-panel')
      if (panel.id === 'auth-login-panel') {
        handleLogin()
      } else {
        handleRegister()
      }
    }
  })
})

// 点击外部关闭
const modal = document.getElementById('auth-modal')
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    auth.hideLoginModal()
  }
})
