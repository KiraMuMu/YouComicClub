# YouComicClub 账号系统部署清单

## 已创建的文件

### Worker 后端
- `worker/auth.js` - 主入口，包含所有 API 端点
- `worker/crypto.js` - JWT 签名/验证 + 密码哈希
- `worker/kv-helpers.js` - KV 存储操作封装
- `worker/wrangler.toml` - Worker 配置
- `worker/DEPLOY.md` - 详细部署指南

### 前端
- `assets/js/auth.js` - 认证模块（登录/注册/登出/追番 API）
- `assets/js/auth-modal.js` - 登录弹窗组件
- `pages/profile.html` - 个人中心页面

### 已更新的页面
- `index.html` - 添加导航栏登录入口
- `pages/anime-schedule.html` - 添加导航栏登录入口

## 部署步骤

### 1. 准备工作
```bash
cd worker

# 登录 Cloudflare（如果还没登录）
npx wrangler login

# 创建 KV 命名空间
npx wrangler kv namespace create "USERS"
npx wrangler kv namespace create "USERS" --preview
npx wrangler kv namespace create "SESSIONS"
npx wrangler kv namespace create "SESSIONS" --preview
npx wrangler kv namespace create "USER_ANIME"
npx wrangler kv namespace create "USER_ANIME" --preview
npx wrangler kv namespace create "USER_PREFS"
npx wrangler kv namespace create "USER_PREFS" --preview
```

把返回的 id 填入 `wrangler.toml` 对应位置。

### 2. 设置密钥
```bash
# JWT 签名密钥（随机生成长字符串）
npx wrangler secret put JWT_SECRET

# Bangumi OAuth 配置（在 https://bgm.tv/dev/app 创建应用）
npx wrangler secret put BANGUMI_CLIENT_ID
npx wrangler secret put BANGUMI_CLIENT_SECRET
npx wrangler secret put BANGUMI_REDIRECT_URI
```

### 3. 更新前端配置
编辑 `assets/js/auth.js`，把 `API_BASE_URL` 改成你的 Worker 地址：
```javascript
const API_BASE_URL = 'https://youcomicclub-auth.your-username.workers.dev'
```

### 4. 部署 Worker
```bash
npx wrangler deploy
```

### 5. 更新其他页面
把 `index.html` 和 `anime-schedule.html` 里的登录入口复制到其他页面（about.html, magazine.html, activities.html）。

## 功能说明

### 支持的登录方式
1. **本地注册/登录** - 用户名 + 密码
2. **Bangumi OAuth** - 用 Bangumi 账号直接登录

### API 端点
| 端点 | 功能 |
|------|------|
| POST /api/auth/register | 注册 |
| POST /api/auth/login | 登录 |
| POST /api/auth/logout | 登出 |
| GET /api/auth/me | 获取当前用户 |
| GET /api/auth/bangumi | 发起 Bangumi OAuth |
| GET /api/auth/bangumi/callback | OAuth 回调 |
| POST /api/user/anime | 保存追番状态 |
| GET /api/user/anime | 获取追番列表 |

### 追番状态类型
- `watching` - 追番中
- `completed` - 已看完
- `on_hold` - 搁置
- `dropped` - 弃番
- `plan_to_watch` - 想看

## 后续扩展

账号系统已经搭好基础，后续可以方便地添加：
- 社刊电子版权限控制
- 用户评论/留言系统
- 用户投稿功能
- 个人偏好设置（主题、字体等）

## 注意事项

1. **安全性**：JWT_SECRET 一定要设置长且随机的字符串
2. **Bangumi OAuth**：回调地址必须是 HTTPS
3. **CORS**：Worker 已配置允许跨域，前端部署在任意域名都能访问
4. **数据备份**：KV 数据建议定期备份（可用 wrangler kv bulk export）
