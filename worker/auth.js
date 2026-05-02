/**
 * YouComicClub 账号系统 Worker
 * 支持：本地注册登录 + Bangumi OAuth
 */

import { verifyJWT, signJWT, hashPassword, verifyPassword } from './crypto.js'
import {
  createLocalUser,
  findLocalUserByUsername,
  findUserById,
  findUserByBangumiId,
  createBangumiUser,
  verifyLocalUser,
  saveSession,
  getSession,
  deleteSession,
  saveAnimeStatus,
  getAnimeStatus,
  getUserAnimeList
} from './kv-helpers.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // CORS
    if (method === 'OPTIONS') {
      return corsResponse()
    }

    try {
      // ===== 本地账号注册 =====
      if (path === '/api/auth/register' && method === 'POST') {
        return await handleRegister(request, env)
      }

      // ===== 本地账号登录 =====
      if (path === '/api/auth/login' && method === 'POST') {
        return await handleLogin(request, env)
      }

      // ===== 登出 =====
      if (path === '/api/auth/logout' && method === 'POST') {
        return await handleLogout(request, env)
      }

      // ===== 获取当前用户信息 =====
      if (path === '/api/auth/me' && method === 'GET') {
        return await handleGetMe(request, env)
      }

      // ===== Bangumi OAuth 发起 =====
      if (path === '/api/auth/bangumi' && method === 'GET') {
        return handleBangumiAuth(url, env)
      }

      // ===== Bangumi OAuth 回调 =====
      if (path === '/api/auth/bangumi/callback' && method === 'GET') {
        return await handleBangumiCallback(request, url, env)
      }

      // ===== 保存追番状态 =====
      if (path === '/api/user/anime' && method === 'POST') {
        return await handleSaveAnime(request, env)
      }

      // ===== 获取追番状态 =====
      if (path === '/api/user/anime' && method === 'GET') {
        return await handleGetAnime(request, env)
      }

      // ===== 更新用户信息 =====
      if (path === '/api/user/profile' && method === 'PATCH') {
        return await handleUpdateProfile(request, env)
      }

      return corsResponse(JSON.stringify({ error: 'Not Found' }), 404)
    } catch (err) {
      console.error(err)
      return corsResponse(JSON.stringify({ error: err.message }), 500)
    }
  }
}

// ==================== 本地账号 ====================

async function handleRegister(request, env) {
  const { username, password, email } = await request.json()

  if (!username || !password) {
    return corsResponse(JSON.stringify({ error: '用户名和密码不能为空' }), 400)
  }
  if (password.length < 6) {
    return corsResponse(JSON.stringify({ error: '密码长度至少6位' }), 400)
  }
  if (username.length < 2 || username.length > 20) {
    return corsResponse(JSON.stringify({ error: '用户名长度2-20个字符' }), 400)
  }

  // 检查用户名是否已存在
  const existing = await findLocalUserByUsername(env, username)
  if (existing) {
    return corsResponse(JSON.stringify({ error: '用户名已存在' }), 409)
  }

  const user = await createLocalUser(env, { username, password, email })
  const token = await signJWT({ userId: user.id, username: user.username }, env.JWT_SECRET)

  // 保存 session 到 KV
  await saveSession(env, token, { userId: user.id })

  return corsResponse(JSON.stringify({
    success: true,
    user: { id: user.id, username: user.username, avatar: user.avatar },
    token
  }))
}

async function handleLogin(request, env) {
  const { username, password } = await request.json()

  const user = await verifyLocalUser(env, username, password)
  if (!user) {
    return corsResponse(JSON.stringify({ error: '用户名或密码错误' }), 401)
  }

  const token = await signJWT({ userId: user.id, username: user.username }, env.JWT_SECRET)
  await saveSession(env, token, { userId: user.id })

  return corsResponse(JSON.stringify({
    success: true,
    user: { id: user.id, username: user.username, avatar: user.avatar, email: user.email },
    token
  }))
}

async function handleLogout(request, env) {
  const token = getTokenFromRequest(request)
  if (token) {
    await deleteSession(env, token)
  }
  return corsResponse(JSON.stringify({ success: true }))
}

async function handleGetMe(request, env) {
  const user = await authenticate(request, env)
  if (!user) {
    return corsResponse(JSON.stringify({ user: null }))
  }

  return corsResponse(JSON.stringify({
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      email: user.email,
      createdAt: user.createdAt
    }
  }))
}

// ==================== Bangumi OAuth ====================

function handleBangumiAuth(url, env) {
  const state = crypto.randomUUID()
  const bangumiAuthUrl = new URL('https://bgm.tv/oauth/authorize')
  bangumiAuthUrl.searchParams.set('client_id', env.BANGUMI_CLIENT_ID || '')
  bangumiAuthUrl.searchParams.set('response_type', 'code')
  bangumiAuthUrl.searchParams.set('redirect_uri', env.BANGUMI_REDIRECT_URI || '')
  bangumiAuthUrl.searchParams.set('state', state)

  return new Response(null, {
    status: 302,
    headers: {
      'Location': bangumiAuthUrl.toString(),
      'Set-Cookie': `__bgm_state=${state}; HttpOnly; Max-Age=300; SameSite=Lax`
    }
  })
}

async function handleBangumiCallback(request, url, env) {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  // 用 code 换 access_token
  const tokenRes = await fetch('https://bgm.tv/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.BANGUMI_CLIENT_ID || '',
      client_secret: env.BANGUMI_CLIENT_SECRET || '',
      code,
      redirect_uri: env.BANGUMI_REDIRECT_URI || ''
    })
  })

  if (!tokenRes.ok) {
    return new Response('Bangumi 授权失败', { status: 401 })
  }

  const tokenData = await tokenRes.json()
  const bgmAccessToken = tokenData.access_token
  const bgmUserId = tokenData.user_id

  // 获取 Bangumi 用户信息
  const userRes = await fetch('https://api.bgm.tv/v0/me', {
    headers: { 'Authorization': `Bearer ${bgmAccessToken}` }
  })
  const bgmUser = await userRes.json()

  // 查找或创建本地用户
  let user = await findUserByBangumiId(env, bgmUserId)
  if (!user) {
    user = await createBangumiUser(env, {
      username: bgmUser.username || `bgm_${bgmUserId}`,
      bangumiUserId: bgmUserId,
      bangumiAccessToken: bgmAccessToken,
      avatar: bgmUser.avatar?.large || ''
    })
  }

  const token = await signJWT({ userId: user.id, username: user.username }, env.JWT_SECRET)
  await saveSession(env, token, { userId: user.id })

  // 重定向回前端，带上 token
  const frontendUrl = new URL(env.FRONTEND_URL || 'https://youclub.kiramu.workers.dev')
  frontendUrl.pathname = '/pages/anime-schedule.html'
  frontendUrl.searchParams.set('token', token)

  return new Response(null, {
    status: 302,
    headers: { 'Location': frontendUrl.toString() }
  })
}

// ==================== 追番状态 ====================

async function handleSaveAnime(request, env) {
  const user = await authenticate(request, env)
  if (!user) {
    return corsResponse(JSON.stringify({ error: '未登录' }), 401)
  }

  const { animeId, status, score, progress } = await request.json()

  await saveAnimeStatus(env, user.id, {
    animeId,
    status, // 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch'
    score: score || 0,
    progress: progress || 0,
    updatedAt: new Date().toISOString()
  })

  return corsResponse(JSON.stringify({ success: true }))
}

async function handleGetAnime(request, env) {
  const user = await authenticate(request, env)
  if (!user) {
    return corsResponse(JSON.stringify({ error: '未登录' }), 401)
  }

  const animeId = new URL(request.url).searchParams.get('animeId')
  if (animeId) {
    const status = await getAnimeStatus(env, user.id, animeId)
    return corsResponse(JSON.stringify({ status }))
  }

  // 获取所有追番状态
  const allStatus = await getUserAnimeList(env, user.id)
  return corsResponse(JSON.stringify({ animeList: allStatus }))
}

async function handleUpdateProfile(request, env) {
  const user = await authenticate(request, env)
  if (!user) {
    return corsResponse(JSON.stringify({ error: '未登录' }), 401)
  }

  const updates = await request.json()
  const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() }

  await env.AUTH_KV.put(`user:${user.id}`, JSON.stringify(updatedUser))

  // 不返回密码哈希
  delete updatedUser.passwordHash

  return corsResponse(JSON.stringify({
    success: true,
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      email: updatedUser.email
    }
  }))
}

// ==================== 工具函数 ====================

function getTokenFromRequest(request) {
  // 从 Authorization header
  const auth = request.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7)
  }
  // 从 cookie
  const cookie = request.headers.get('Cookie')
  if (cookie) {
    const match = cookie.match(/auth_token=([^;]+)/)
    if (match) return match[1]
  }
  return null
}

async function authenticate(request, env) {
  const token = getTokenFromRequest(request)
  if (!token) return null

  try {
    const payload = await verifyJWT(token, env.JWT_SECRET)
    const session = await getSession(env, token)
    if (!session) return null
    return await findUserById(env, payload.userId)
  } catch {
    return null
  }
}

function corsResponse(body, status = 200) {
  const isJson = typeof body === 'string' && (body.startsWith('{') || body.startsWith('['))
  return new Response(body, {
    status,
    headers: {
      'Content-Type': isJson ? 'application/json' : 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    }
  })
}
