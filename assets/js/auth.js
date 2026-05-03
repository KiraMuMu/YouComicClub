/**
 * YouComicClub 账号系统前端模块
 * 支持：本地账号 + Bangumi OAuth
 */

const API_BASE_URL = 'https://youclub-auth.kiramu.workers.dev' // Cloudflare Worker URL

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('auth_token')
    this.user = null
    this.init()
  }

  async init() {
    if (this.token) {
      await this.fetchUser()
    }
    this.updateUI()
    this.bindEvents()
  }

  // 获取当前用户信息
  async fetchUser() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      })
      const data = await res.json()
      this.user = data.user
      return this.user
    } catch (e) {
      this.logout()
      return null
    }
  }

  // 注册（需要 Turnstile 验证）
  async register(username, password, turnstileToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, turnstileToken })
      })
      const data = await res.json()
      if (data.success) {
        this.token = data.token
        this.user = data.user
        localStorage.setItem('auth_token', this.token)
        this.updateUI()
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch (e) {
      return { success: false, error: '网络错误，请稍后重试' }
    }
  }

  // 登录
  async login(username, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        this.token = data.token
        this.user = data.user
        localStorage.setItem('auth_token', this.token)
        this.updateUI()
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch (e) {
      return { success: false, error: '网络错误，请稍后重试' }
    }
  }

  // 登出
  async logout() {
    if (this.token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      })
    }
    this.token = null
    this.user = null
    localStorage.removeItem('auth_token')
    this.updateUI()
    window.location.reload() // 刷新页面以更新状态
  }

  // Bangumi OAuth 登录
  bangumiLogin() {
    window.location.href = `${API_BASE_URL}/api/auth/bangumi`
  }

  // 检查 URL 参数中的 token（OAuth 回调）
  checkOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    if (token) {
      this.token = token
      localStorage.setItem('auth_token', token)
      // 清理 URL
      window.history.replaceState({}, document.title, window.location.pathname)
      this.fetchUser().then(() => this.updateUI())
      return true
    }
    return false
  }

  // 更新 UI 状态
  updateUI() {
    const loginBtn = document.getElementById('auth-login-btn')
    const userInfo = document.getElementById('auth-user-info')
    const username = document.getElementById('auth-username')
    const avatar = document.getElementById('auth-avatar')

    if (!loginBtn && !userInfo) return

    if (this.user) {
      if (loginBtn) loginBtn.style.display = 'none'
      if (userInfo) {
        userInfo.style.display = 'flex'
        if (username) username.textContent = this.user.username
        if (avatar) avatar.src = this.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.user.username}`
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-flex'
      if (userInfo) userInfo.style.display = 'none'
    }
  }

  // 绑定事件
  bindEvents() {
    // 登录按钮
    const loginBtn = document.getElementById('auth-login-btn')
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.showLoginModal())
    }

    // 登出按钮
    const logoutBtn = document.getElementById('auth-logout-btn')
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout())
    }

    // 检查 OAuth 回调
    this.checkOAuthCallback()
  }

  // 显示登录弹窗
  showLoginModal() {
    const modal = document.getElementById('auth-modal')
    if (modal) {
      modal.style.display = 'flex'
      modal.classList.add('active')
    }
  }

  // 关闭登录弹窗
  hideLoginModal() {
    const modal = document.getElementById('auth-modal')
    if (modal) {
      modal.style.display = 'none'
      modal.classList.remove('active')
    }
  }

  // 获取请求头
  getAuthHeaders() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
  }

  // 是否已登录
  isLoggedIn() {
    return !!this.user
  }
}

// 追番状态管理
class AnimeTracker {
  constructor(authManager) {
    this.auth = authManager
  }

  async getStatus(animeId) {
    if (!this.auth.isLoggedIn()) return null
    const res = await fetch(`${API_BASE_URL}/api/user/anime?animeId=${animeId}`, {
      headers: this.auth.getAuthHeaders()
    })
    const data = await res.json()
    return data.status
  }

  async saveStatus(animeId, status, score = 0, progress = 0) {
    if (!this.auth.isLoggedIn()) {
      this.auth.showLoginModal()
      return { success: false, needLogin: true }
    }
    const res = await fetch(`${API_BASE_URL}/api/user/anime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.auth.getAuthHeaders()
      },
      body: JSON.stringify({ animeId, status, score, progress })
    })
    return await res.json()
  }

  async getAllStatuses() {
    if (!this.auth.isLoggedIn()) return []
    const res = await fetch(`${API_BASE_URL}/api/user/anime`, {
      headers: this.auth.getAuthHeaders()
    })
    const data = await res.json()
    return data.animeList || []
  }
}

// 全局实例
window.auth = new AuthManager()
window.animeTracker = new AnimeTracker(window.auth)
