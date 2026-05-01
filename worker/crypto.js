/**
 * JWT + 密码加密工具
 * 纯 Web Crypto API 实现，Cloudflare Workers 原生支持
 */

// ==================== JWT ====================

export async function signJWT(payload, secret, expiresIn = '30d') {
  const encoder = new TextEncoder()
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const now = Math.floor(Date.now() / 1000)
  const exp = now + parseExpiration(expiresIn)

  const header = { alg: 'HS256', typ: 'JWT' }
  const body = { ...payload, iat: now, exp }

  const encodedHeader = b64url(JSON.stringify(header))
  const encodedBody = b64url(JSON.stringify(body))
  const toSign = `${encodedHeader}.${encodedBody}`

  const signature = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(toSign)
  )

  return `${toSign}.${b64url(signature)}`
}

export async function verifyJWT(token, secret) {
  try {
    const encoder = new TextEncoder()
    const secretKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const [encodedHeader, encodedBody, encodedSig] = token.split('.')
    const header = JSON.parse(atob(encodedHeader))
    const body = JSON.parse(atob(encodedBody))

    if (header.alg !== 'HS256') throw new Error('Invalid algorithm')

    const now = Math.floor(Date.now() / 1000)
    if (body.exp && body.exp < now) throw new Error('Token expired')

    const toVerify = `${encodedHeader}.${encodedBody}`
    const sig = b64urlDecode(encodedSig)

    const valid = await crypto.subtle.verify(
      'HMAC',
      secretKey,
      sig,
      encoder.encode(toVerify)
    )

    if (!valid) throw new Error('Invalid signature')
    return body
  } catch (e) {
    return null
  }
}

function parseExpiration(str) {
  const match = str.match(/^(\d+)([smhd])$/)
  if (!match) return 60 * 60 * 24 * 30 // 默认30天
  const [, num, unit] = match
  const n = parseInt(num)
  switch (unit) {
    case 's': return n
    case 'm': return n * 60
    case 'h': return n * 60 * 60
    case 'd': return n * 60 * 60 * 24
    default: return 60 * 60 * 24 * 30
  }
}

function b64url(data) {
  const json = typeof data === 'string' ? data : new Uint8Array(data)
  let str
  if (typeof data === 'string') {
    str = btoa(String.fromCharCode(...new TextEncoder().encode(data)))
  } else {
    str = btoa(String.fromCharCode(...new Uint8Array(data)))
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

// ==================== 密码哈希 ====================

export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(password, salt)
  const hash = await crypto.subtle.exportKey('raw', key)
  
  const combined = new Uint8Array(salt.length + hash.byteLength)
  combined.set(salt)
  combined.set(new Uint8Array(hash), salt.length)
  
  return b64url(combined)
}

export async function verifyPassword(password, stored) {
  try {
    // 使用与 b64urlDecode 相同的逻辑
    const base64 = stored.replace(/-/g, '+').replace(/_/g, '/')
    const binaryString = atob(base64)
    const combined = Uint8Array.from(binaryString, c => c.charCodeAt(0))
    
    const salt = combined.slice(0, 16)
    const storedHash = combined.slice(16)
    
    const key = await deriveKey(password, salt)
    const hash = new Uint8Array(await crypto.subtle.exportKey('raw', key))
    
    if (hash.length !== storedHash.length) return false
    return crypto.subtle.timingSafeEqual(hash, storedHash)
  } catch {
    return false
  }
}

async function deriveKey(password, salt) {
  const encoder = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}
