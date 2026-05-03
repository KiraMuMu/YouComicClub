/**
 * 登录/注册弹窗组件 v3.0
 * 改进：移除邮件验证，改为 Cloudflare Turnstile 人机验证，注册1步完成
 */

const authModalHTML = `
<div id="auth-modal" class="auth-modal" role="dialog" aria-modal="true">
  <div class="auth-modal-content">
    <button class="auth-modal-close" onclick="auth.hideLoginModal()" aria-label="关闭">&times;</button>

    <div class="auth-tabs">
      <button class="auth-tab active" data-tab="login">登录</button>
      <button class="auth-tab" data-tab="register">注册</button>
    </div>

    <!-- 登录面板 -->
    <div id="auth-login-panel" class="auth-panel active">
      <h3 class="auth-title">欢迎回来 👋</h3>

      <div class="auth-form-group">
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z"/>
            </svg>
          </span>
          <input type="text" id="login-username" class="auth-input" placeholder="用户名" autocomplete="username" required>
        </div>
        <span class="auth-field-hint" id="login-username-hint"></span>
      </div>

      <div class="auth-form-group">
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="8" width="14" height="10" rx="2"/>
              <path d="M7 8V6a3 3 0 016 0v2"/>
            </svg>
          </span>
          <input type="password" id="login-password" class="auth-input" placeholder="密码" autocomplete="current-password" required>
          <button type="button" class="auth-eye-btn" onclick="togglePwd('login-password', this)" tabindex="-1">
            <svg class="eye-show" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="10" cy="10" r="3"/></svg>
            <svg class="eye-hide" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" style="display:none"><path d="M2 2l16 16M7.5 7.5A3 3 0 0113 13M1 10s3.5-6 9-6c1.5 0 2.9.3 4.1.8M19 10s-1.1 1.8-3 3.2"/></svg>
          </button>
        </div>
      </div>

      <div id="login-msg" class="auth-msg"></div>

      <button class="auth-btn auth-btn-primary" id="login-submit-btn" onclick="handleLogin()">
        <span class="btn-text">登录</span>
        <span class="btn-loader" style="display:none">
          <span class="spinner"></span>
        </span>
      </button>

      <div class="auth-divider"><span>或使用</span></div>

      <button class="auth-btn auth-btn-bangumi" onclick="auth.bangumiLogin()">
        <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#F09199"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">B</text></svg>
        Bangumi 账号登录
      </button>
    </div>

    <!-- 注册面板（1步完成） -->
    <div id="auth-register-panel" class="auth-panel">
      <h3 class="auth-title">创建账号</h3>

      <div class="auth-form-group">
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z"/>
            </svg>
          </span>
          <input type="text" id="reg-username" class="auth-input" placeholder="用户名（2-20字符）" autocomplete="off" oninput="validateUsername(this)" required>
          <span class="auth-field-status" id="reg-username-status"></span>
        </div>
        <span class="auth-field-hint" id="reg-username-hint"></span>
      </div>

      <div class="auth-form-group">
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="8" width="14" height="10" rx="2"/><path d="M7 8V6a3 3 0 016 0v2"/>
            </svg>
          </span>
          <input type="password" id="reg-password" class="auth-input" placeholder="密码（至少6位）" autocomplete="new-password" oninput="validatePassword(this)" required>
          <button type="button" class="auth-eye-btn" onclick="togglePwd('reg-password', this)" tabindex="-1">
            <svg class="eye-show" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="10" cy="10" r="3"/></svg>
            <svg class="eye-hide" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" style="display:none"><path d="M2 2l16 16M7.5 7.5A3 3 0 0113 13M1 10s3.5-6 9-6c1.5 0 2.9.3 4.1.8M19 10s-1.1 1.8-3 3.2"/></svg>
          </button>
        </div>
        <!-- 密码强度条 -->
        <div class="pwd-strength-bar">
          <div id="pwd-strength-fill" class="pwd-strength-fill"></div>
        </div>
        <span class="auth-field-hint" id="reg-password-hint"></span>
      </div>

      <div class="auth-form-group">
        <div class="auth-input-wrap">
          <span class="auth-input-icon">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="8" width="14" height="10" rx="2"/><path d="M7 8V6a3 3 0 016 0v2"/>
            </svg>
          </span>
          <input type="password" id="reg-password-confirm" class="auth-input" placeholder="确认密码" autocomplete="new-password" oninput="validateConfirm(this)" required>
          <span class="auth-field-status" id="reg-confirm-status"></span>
        </div>
        <span class="auth-field-hint" id="reg-confirm-hint"></span>
      </div>

      <!-- Cloudflare Turnstile 人机验证 -->
      <div class="auth-form-group">
        <div class="cf-turnstile" id="reg-turnstile" data-sitekey="0x4AAAAAADIIO8k1wzhCAXgd" data-theme="dark"></div>
        <span class="auth-field-hint hint-error" id="reg-turnstile-hint"></span>
      </div>

      <div id="reg-step1-msg" class="auth-msg"></div>

      <button class="auth-btn auth-btn-primary" id="reg-submit-btn" onclick="handleRegister()">
        <span class="btn-text">注册</span>
        <span class="btn-loader" style="display:none"><span class="spinner"></span></span>
      </button>
    </div>

  </div>
</div>
`;

// ─── 样式 ────────────────────────────────────────────────
const authStyles = `
/* ===== 弹窗容器 ===== */
.auth-modal {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 2000;
  align-items: center;
  justify-content: center;
}
.auth-modal.active { display: flex; animation: authFadeIn 0.2s ease; }
@keyframes authFadeIn { from { opacity:0 } to { opacity:1 } }

.auth-modal-content {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 32px 28px 28px;
  width: 92%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 24px 80px rgba(0,0,0,0.4);
  border: 1px solid var(--card-border);
  animation: authSlideUp 0.25s cubic-bezier(.34,1.36,.64,1);
  max-height: 90vh;
  overflow-y: auto;
}
@keyframes authSlideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }

.auth-modal-close {
  position: absolute;
  top: 14px; right: 14px;
  width: 30px; height: 30px;
  background: rgba(255,255,255,0.06);
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.auth-modal-close:hover { background: rgba(255,255,255,0.15); color: var(--text-main); }

/* ===== 标签页 ===== */
.auth-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: rgba(0,0,0,0.12);
  border-radius: 10px;
  padding: 3px;
}
.auth-tab {
  flex: 1;
  padding: 9px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-muted);
  background: transparent;
  transition: all 0.2s;
}
.auth-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #F09199 0%, #e0788a 100%);
  box-shadow: 0 2px 8px rgba(240,145,153,0.35);
}
.auth-tab:not(.active):hover { color: var(--text-main); background: rgba(255,255,255,0.07); }

/* ===== 面板 ===== */
.auth-panel { display: none; }
.auth-panel.active { display: block; }
.auth-title { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: var(--text-main); }
.auth-subtitle { font-size: 13px; color: var(--text-muted); margin: 0 0 20px 0; line-height: 1.5; }
.email-highlight { color: #F09199; font-weight: 600; }

/* ===== 表单组 ===== */
.auth-form-group { margin-bottom: 14px; }

.auth-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.auth-input-icon {
  position: absolute;
  left: 12px;
  width: 17px; height: 17px;
  color: var(--text-muted);
  display: flex; align-items: center;
  pointer-events: none;
  flex-shrink: 0;
}
.auth-input-icon svg { width: 100%; height: 100%; }

.auth-input {
  width: 100%;
  padding: 11px 40px 11px 38px;
  border: 1.5px solid var(--card-border);
  border-radius: 10px;
  font-size: 14px;
  box-sizing: border-box;
  background: rgba(255,255,255,0.05);
  color: var(--text-main);
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.auth-input:focus {
  border-color: #F09199;
  box-shadow: 0 0 0 3px rgba(240,145,153,0.15);
}
.auth-input.input-valid { border-color: #4ade80; }
.auth-input.input-valid:focus { box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
.auth-input.input-error { border-color: #f87171; }
.auth-input.input-error:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.15); }
.auth-input::placeholder { color: var(--text-muted); font-size: 13px; }

/* 右侧状态图标 */
.auth-field-status {
  position: absolute;
  right: 38px;
  font-size: 15px;
  pointer-events: none;
}

/* 显示/隐藏密码按钮 */
.auth-eye-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex; align-items: center;
  padding: 4px;
}
.auth-eye-btn:hover { color: var(--text-main); }
.auth-eye-btn svg { width: 17px; height: 17px; }

/* 字段提示文字 */
.auth-field-hint {
  display: block;
  font-size: 12px;
  margin-top: 4px;
  margin-left: 4px;
  min-height: 16px;
  color: var(--text-muted);
  transition: color 0.2s;
}
.auth-field-hint.hint-error { color: #f87171; }
.auth-field-hint.hint-ok { color: #4ade80; }

/* 密码强度条 */
.pwd-strength-bar {
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}
.pwd-strength-fill {
  height: 100%;
  width: 0%;
  border-radius: 2px;
  transition: width 0.3s, background 0.3s;
}

/* ===== 消息提示 ===== */
.auth-msg {
  min-height: 18px;
  font-size: 13px;
  margin-bottom: 12px;
  padding: 0 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.auth-msg.msg-error { color: #f87171; }
.auth-msg.msg-ok { color: #4ade80; }
.auth-msg.msg-info { color: #60a5fa; }
.auth-msg.msg-loading { color: var(--text-muted); }

/* ===== 按钮 ===== */
.auth-btn {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
}
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
.auth-btn-primary {
  background: linear-gradient(135deg, #F09199 0%, #e06070 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(240,145,153,0.3);
}
.auth-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(240,145,153,0.45);
}
.auth-btn-primary:active:not(:disabled) { transform: translateY(0); }

.auth-btn-bangumi {
  background: rgba(255,255,255,0.06);
  color: var(--text-main);
  border: 1px solid var(--card-border);
}
.auth-btn-bangumi:hover { background: rgba(255,255,255,0.1); }

/* 加载动画 */
.spinner {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 分割线 ===== */
.auth-divider {
  display: flex;
  align-items: center;
  margin: 16px 0;
  color: var(--text-muted);
  font-size: 12px;
}
.auth-divider::before, .auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--card-border);
}
.auth-divider span { padding: 0 12px; }

/* ===== 底部链接 ===== */
.auth-footer-link {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 14px;
}
.auth-footer-link a { color: #F09199; text-decoration: none; }
.auth-footer-link a:hover { text-decoration: underline; }

/* ===== 导航栏用户区域 ===== */
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
  left: 0; right: 0; bottom: 0;
  height: 6px;
  pointer-events: auto;
}
.auth-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(240,145,153,0.4); }
.auth-username { font-size: 14px; color: var(--text-main); }

.auth-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--card-bg);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.25);
  padding: 6px 0;
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
  transition: background 0.15s;
}
.auth-dropdown-item:hover { background: rgba(240,145,153,0.1); }

/* 滚动条美化 */
.auth-modal-content::-webkit-scrollbar { width: 4px; }
.auth-modal-content::-webkit-scrollbar-track { background: transparent; }
.auth-modal-content::-webkit-scrollbar-thumb { background: var(--card-border); border-radius: 2px; }
`;

// ─── 注入样式和HTML ────────────────────────────────────────────────
if (!document.querySelector('style[data-auth-styles]')) {
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-auth-styles', 'true');
  styleEl.textContent = authStyles;
  document.head.appendChild(styleEl);
}
if (!document.getElementById('auth-modal')) {
  document.body.insertAdjacentHTML('beforeend', authModalHTML);
}

// ─── 标签切换 ──────────────────────────────────────────────
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#auth-login-panel, #auth-register-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panelId = `#auth-${tab.dataset.tab}-panel`;
    document.querySelector(panelId).classList.add('active');
    
    // 切换到注册面板时，渲染 Turnstile
    if (tab.dataset.tab === 'register') {
      renderTurnstile();
    }
  });
});

// ─── 回车提交 ─────────────────────────────────────────────
document.getElementById('auth-modal').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const loginPanel = document.getElementById('auth-login-panel');
  const registerPanel = document.getElementById('auth-register-panel');
  if (loginPanel.classList.contains('active')) handleLogin();
  else if (registerPanel.classList.contains('active')) handleRegister();
});

// ─── 工具函数 ─────────────────────────────────────────────
function setMsg(id, text, type = '') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `auth-msg${type ? ' msg-' + type : ''}`;
  el.textContent = text;
}

function setFieldState(inputId, statusId, hintId, valid, hint = '') {
  const input = document.getElementById(inputId);
  const status = document.getElementById(statusId);
  const hintEl = document.getElementById(hintId);
  if (!input) return;
  input.classList.toggle('input-valid', valid === true);
  input.classList.toggle('input-error', valid === false);
  if (status) status.textContent = valid === true ? '✓' : valid === false ? '✗' : '';
  if (hintEl) {
    hintEl.textContent = hint;
    hintEl.className = `auth-field-hint${valid === true ? ' hint-ok' : valid === false ? ' hint-error' : ''}`;
  }
}

function setBtnLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  if (text) text.style.display = loading ? 'none' : '';
  if (loader) loader.style.display = loading ? '' : 'none';
}

function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.querySelector('.eye-show').style.display = isHidden ? 'none' : '';
  btn.querySelector('.eye-hide').style.display = isHidden ? '' : 'none';
}

// ─── 实时校验 ─────────────────────────────────────────────
function validateUsername(input) {
  const v = input.value.trim();
  if (!v) setFieldState('reg-username', 'reg-username-status', 'reg-username-hint', null, '');
  else if (v.length < 2) setFieldState('reg-username', 'reg-username-status', 'reg-username-hint', false, '用户名至少2个字符');
  else if (v.length > 20) setFieldState('reg-username', 'reg-username-status', 'reg-username-hint', false, '用户名最多20个字符');
  else if (/[^\u4e00-\u9fa5a-zA-Z0-9_]/.test(v)) setFieldState('reg-username', 'reg-username-status', 'reg-username-hint', false, '只允许中文、字母、数字、下划线');
  else setFieldState('reg-username', 'reg-username-status', 'reg-username-hint', true, '用户名合法 ✓');
}

function validatePassword(input) {
  const v = input.value;
  const fill = document.getElementById('pwd-strength-fill');
  const hintEl = document.getElementById('reg-password-hint');
  let strength = 0, label = '', color = '';
  if (v.length >= 6) strength++;
  if (/[A-Z]/.test(v)) strength++;
  if (/[0-9]/.test(v)) strength++;
  if (/[^a-zA-Z0-9]/.test(v)) strength++;
  if (v.length === 0) { strength = 0; }
  const levels = ['', '弱', '一般', '强', '非常强'];
  const colors = ['', '#f87171', '#fbbf24', '#4ade80', '#22d3ee'];
  label = levels[strength] || '';
  color = colors[strength] || '';
  if (fill) { fill.style.width = `${strength * 25}%`; fill.style.background = color; }
  if (hintEl) {
    hintEl.textContent = v.length ? `密码强度：${label}` : '';
    hintEl.className = `auth-field-hint${strength <= 1 && v.length ? ' hint-error' : strength >= 3 ? ' hint-ok' : ''}`;
  }
  validateConfirmSilent();
}

function validateConfirm(input) {
  const pwd = document.getElementById('reg-password')?.value;
  const v = input.value;
  if (!v) setFieldState('reg-password-confirm', 'reg-confirm-status', 'reg-confirm-hint', null, '');
  else if (v !== pwd) setFieldState('reg-password-confirm', 'reg-confirm-status', 'reg-confirm-hint', false, '两次密码不一致');
  else setFieldState('reg-password-confirm', 'reg-confirm-status', 'reg-confirm-hint', true, '密码一致 ✓');
}

function validateConfirmSilent() {
  const v = document.getElementById('reg-password-confirm')?.value;
  if (v) validateConfirm(document.getElementById('reg-password-confirm'));
}

// ─── Turnstile 相关 ─────────────────────────────────────────
let turnstileWidgetId = null;

// 渲染 Turnstile widget
function renderTurnstile() {
  const container = document.getElementById('reg-turnstile');
  if (!container) return;
  
  // 清除提示
  const hint = document.getElementById('reg-turnstile-hint');
  if (hint) hint.textContent = '';
  
  // 如果 Turnstile API 还没加载，先加载
  if (!window.turnstile) {
    if (hint) hint.textContent = '人机验证加载中...';
    console.warn('Turnstile API not loaded yet');
    return;
  }
  
  // 清除旧 widget
  container.innerHTML = '';
  
  try {
    turnstileWidgetId = window.turnstile.render('#reg-turnstile', {
      sitekey: container.dataset.sitekey,
      theme: 'dark',
      callback: function(token) {
        console.log('Turnstile verified');
        const hint = document.getElementById('reg-turnstile-hint');
        if (hint && token) hint.textContent = '';
      },
      'error-callback': function(error) {
        console.error('Turnstile error:', error);
        const hint = document.getElementById('reg-turnstile-hint');
        if (hint) hint.textContent = '人机验证失败，请刷新页面';
      }
    });
  } catch (err) {
    console.error('Turnstile render error:', err);
    const hint = document.getElementById('reg-turnstile-hint');
    if (hint) hint.textContent = '人机验证加载失败';
  }
}

// 获取 Turnstile token
function getTurnstileToken() {
  if (!window.turnstile) return null;
  return window.turnstile.getResponse(turnstileWidgetId);
}

// 重置 Turnstile widget
function resetTurnstile() {
  const container = document.getElementById('reg-turnstile');
  if (!container) return;
  
  const hint = document.getElementById('reg-turnstile-hint');
  if (hint) hint.textContent = '';
  
  if (window.turnstile) {
    container.innerHTML = '';
    renderTurnstile();
  }
}

// ─── 登录处理 ─────────────────────────────────────────────
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) {
    setMsg('login-msg', '请填写用户名和密码', 'error');
    return;
  }
  setBtnLoading('login-submit-btn', true);
  setMsg('login-msg', '登录中...', 'loading');
  const result = await auth.login(username, password);
  setBtnLoading('login-submit-btn', false);
  if (result.success) {
    setMsg('login-msg', '登录成功！', 'ok');
    setTimeout(() => {
      auth.hideLoginModal();
      window.location.reload(); // 刷新页面以更新状态
    }, 600);
  } else {
    setMsg('login-msg', result.error || '登录失败，请检查用户名和密码', 'error');
    document.getElementById('login-password').classList.add('input-error');
    document.getElementById('login-password').addEventListener('input', () => {
      document.getElementById('login-password').classList.remove('input-error');
    }, { once: true });
  }
}

// ─── 注册处理（1步完成） ────────────────────────────────────
async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-password-confirm').value;

  // 全量校验
  if (!username || username.length < 2 || username.length > 20) {
    setMsg('reg-step1-msg', '请输入合法的用户名（2-20字符）', 'error');
    validateUsername(document.getElementById('reg-username'));
    return;
  }
  if (password.length < 6) {
    setMsg('reg-step1-msg', '密码至少6位', 'error');
    return;
  }
  if (password !== confirm) {
    setMsg('reg-step1-msg', '两次密码不一致', 'error');
    return;
  }
  
  // 获取 Turnstile token
  const turnstileToken = getTurnstileToken();
  if (!turnstileToken) {
    setMsg('reg-step1-msg', '请完成人机验证', 'error');
    const hint = document.getElementById('reg-turnstile-hint');
    if (hint && !hint.textContent) hint.textContent = '请完成人机验证';
    return;
  }

  setBtnLoading('reg-submit-btn', true);
  setMsg('reg-step1-msg', '注册中...', 'loading');

  const result = await auth.register(username, password, turnstileToken);

  setBtnLoading('reg-submit-btn', false);
  if (result.success) {
    setMsg('reg-step1-msg', '注册成功！正在登录...', 'ok');
    
    // 注册成功后自动登录并刷新页面
    setTimeout(() => {
      auth.hideLoginModal();
      window.location.reload(); // 刷新页面以更新状态
    }, 800);
  } else {
    setMsg('reg-step1-msg', result.error || '注册失败，请稍后重试', 'error');
    // 重置 Turnstile
    resetTurnstile();
  }
}

// ─── 初始化 ────────────────────────────────────────────────
// 检查 Turnstile API 是否已加载
if (!window.turnstile) {
  console.warn('Turnstile API not loaded. Make sure to add <script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script> to your HTML head.');
}
