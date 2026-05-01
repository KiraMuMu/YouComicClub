/**
 * KV 存储操作辅助函数
 * 使用单个 AUTH_KV 命名空间，通过 key 前缀区分数据
 */

// ==================== 用户操作 ====================

export async function createLocalUser(env, { username, password, email }) {
  const id = crypto.randomUUID()
  const { hashPassword } = await import('./crypto.js')
  const passwordHash = await hashPassword(password)

  const user = {
    id,
    username,
    email: email || null,
    passwordHash,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'local' // 'local' | 'bangumi'
  }

  // 存储用户数据（使用 AUTH_KV）
  await env.AUTH_KV.put(`user:${id}`, JSON.stringify(user))
  // 建立用户名索引
  await env.AUTH_KV.put(`username:${username}`, id)

  return user
}

export async function createBangumiUser(env, { username, bangumiUserId, bangumiAccessToken, avatar }) {
  const id = crypto.randomUUID()

  const user = {
    id,
    username,
    email: null,
    passwordHash: null,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'bangumi',
    bangumiUserId,
    bangumiAccessToken
  }

  await env.AUTH_KV.put(`user:${id}`, JSON.stringify(user))
  await env.AUTH_KV.put(`username:${username}`, id)
  await env.AUTH_KV.put(`bangumi_user:${bangumiUserId}`, id)

  return user
}

export async function findLocalUserByUsername(env, username) {
  const userId = await env.AUTH_KV.get(`username:${username}`)
  if (!userId) return null
  return await findUserById(env, userId)
}

export async function findUserById(env, id) {
  const data = await env.AUTH_KV.get(`user:${id}`)
  if (!data) return null
  const user = JSON.parse(data)
  // 不返回密码哈希
  delete user.passwordHash
  return user
}

export async function findUserByBangumiId(env, bangumiUserId) {
  const userId = await env.AUTH_KV.get(`bangumi_user:${bangumiUserId}`)
  if (!userId) return null
  return await findUserById(env, userId)
}

export async function verifyLocalUser(env, username, password) {
  const userId = await env.AUTH_KV.get(`username:${username}`)
  if (!userId) return null

  const data = await env.AUTH_KV.get(`user:${userId}`)
  if (!data) return null

  const user = JSON.parse(data)
  const { verifyPassword } = await import('./crypto.js')
  const valid = await verifyPassword(password, user.passwordHash)

  if (!valid) return null

  // 不返回密码哈希
  delete user.passwordHash
  return user
}

// ==================== 会话操作 ====================

export async function saveSession(env, token, session) {
  // 会话存储 7 天
  await env.AUTH_KV.put(`session:${token}`, JSON.stringify(session), {
    expirationTtl: 60 * 60 * 24 * 7
  })
}

export async function getSession(env, token) {
  const data = await env.AUTH_KV.get(`session:${token}`)
  return data ? JSON.parse(data) : null
}

export async function deleteSession(env, token) {
  await env.AUTH_KV.delete(`session:${token}`)
}

// ==================== 追番状态 ====================

export async function saveAnimeStatus(env, userId, status) {
  const key = `anime:${userId}:${status.animeId}`
  await env.AUTH_KV.put(key, JSON.stringify(status))
}

export async function getAnimeStatus(env, userId, animeId) {
  const key = `anime:${userId}:${animeId}`
  const data = await env.AUTH_KV.get(key)
  return data ? JSON.parse(data) : null
}

export async function deleteAnimeStatus(env, userId, animeId) {
  const key = `anime:${userId}:${animeId}`
  await env.AUTH_KV.delete(key)
}

export async function getUserAnimeList(env, userId) {
  const prefix = `anime:${userId}:`
  const { keys } = await env.AUTH_KV.list({ prefix })
  const list = []
  for (const key of keys) {
    const data = await env.AUTH_KV.get(key.name)
    if (data) list.push(JSON.parse(data))
  }
  return list
}

// ==================== 用户偏好 ====================

export async function saveUserPreference(env, userId, key, value) {
  await env.AUTH_KV.put(`pref:${userId}:${key}`, JSON.stringify(value))
}

export async function getUserPreference(env, userId, key) {
  const data = await env.AUTH_KV.get(`pref:${userId}:${key}`)
  return data ? JSON.parse(data) : null
}
