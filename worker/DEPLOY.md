# YouComicClub 账号系统部署指南

## 1. 创建 KV 命名空间

```bash
cd worker

# 创建用户数据存储
wrangler kv namespace create "USERS"
wrangler kv namespace create "USERS" --preview

# 创建会话存储
wrangler kv namespace create "SESSIONS"
wrangler kv namespace create "SESSIONS" --preview

# 创建追番数据存储
wrangler kv namespace create "USER_ANIME"
wrangler kv namespace create "USER_ANIME" --preview

# 创建用户偏好存储
wrangler kv namespace create "USER_PREFS"
wrangler kv namespace create "USER_PREFS" --preview
```

创建后，把返回的 id 填入 `wrangler.toml` 对应位置。

## 2. 设置环境变量

```bash
# JWT 签名密钥（随机生成一个长字符串）
wrangler secret put JWT_SECRET

# Bangumi OAuth 配置（在 https://bgm.tv/dev/app 创建应用）
wrangler secret put BANGUMI_CLIENT_ID
wrangler secret put BANGUMI_CLIENT_SECRET
wrangler secret put BANGUMI_REDIRECT_URI
```

`BANGUMI_REDIRECT_URI` 格式：`https://your-worker.workers.dev/api/auth/bangumi/callback`

## 3. 部署 Worker

```bash
wrangler deploy
```

## 4. 配置前端

把 Worker URL 填入 `assets/js/auth.js` 中的 `API_BASE_URL`：

```javascript
const API_BASE_URL = 'https://your-worker.workers.dev'
```

## Bangumi OAuth 应用配置

1. 访问 https://bgm.tv/dev/app
2. 创建新应用
3. 填写信息：
   - 应用名称：悠行动漫社
   - 回调地址：`https://your-worker.workers.dev/api/auth/bangumi/callback`
4. 保存 `Client ID` 和 `Client Secret`

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 注册本地账号 |
| `/api/auth/login` | POST | 本地账号登录 |
| `/api/auth/logout` | POST | 登出 |
| `/api/auth/me` | GET | 获取当前用户信息 |
| `/api/auth/bangumi` | GET | 发起 Bangumi OAuth |
| `/api/auth/bangumi/callback` | GET | Bangumi OAuth 回调 |
| `/api/user/anime` | GET/POST | 获取/保存追番状态 |
| `/api/user/profile` | PATCH | 更新用户信息 |
