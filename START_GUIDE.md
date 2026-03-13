# 🚀 INK.SPIRIT 启动指南

## 快速启动

### Windows 用户（推荐）

双击运行 `start.bat`，选择启动模式即可。

### 命令行启动

```bash
# 开发模式（默认）
npm start

# 预览模式（速度快，适合演示）
npm run start:preview

# 开发模式 + 隧道（公网访问）
npm run start:dev:tunnel

# 预览模式 + 隧道（推荐演示）
npm run start:preview:tunnel

# 仅构建
npm run build

# 仅启动隧道
npm run start:tunnel
```

---

## 三种模式说明

### 1️⃣ 开发模式 (dev)

```bash
npm start
# 或
npm run start:dev
```

**特点：**
- ✅ 热更新，修改代码即时生效
- ✅ 方便调试
- ❌ 首次加载较慢（按需编译）
- ❌ 体积大（未优化）

**适用场景：** 本地开发调试

---

### 2️⃣ 预览模式 (preview)

```bash
npm run start:preview
```

**特点：**
- ✅ 首次加载快（已预编译）
- ✅ 体积小（压缩优化）
- ✅ 适合演示/测试
- ⚠️ 修改代码需要重新构建

**适用场景：** 给他人演示、测试生产版本

---

### 3️⃣ 生产模式

```bash
npm run build
```

构建后的文件位于 `frontend/dist/`，可部署到：
- Vercel
- Netlify
- Cloudflare Pages
- 自建服务器

---

## 隧道访问（公网分享）

隧道可以将本地服务暴露到公网，方便分享给他人访问。

### 使用方式

```bash
# 方式 1：启动服务时同时开启隧道
npm run start:preview:tunnel  # 推荐

# 方式 2：先启动服务，再单独启动隧道
npm run start:preview  # 终端 1
npm run start:tunnel   # 终端 2
```

### 获取公网地址

隧道启动后会显示：

```
🎉 前端隧道已就绪！
   公网地址: https://xxx-xxx-xxx.trycloudflare.com
```

将此地址分享给朋友即可访问。

---

## 访问地址

| 服务 | 本地地址 | 说明 |
|------|----------|------|
| 前端 | http://localhost:3000 | 博客主页 |
| 后端 | http://localhost:3001 | API 服务 |
| 隧道 | https://xxx.trycloudflare.com | 公网地址 |

---

## 常见问题

### Q: 端口被占用怎么办？

启动脚本会自动检测并清理占用端口的进程。

### Q: 预览模式修改代码后不生效？

预览模式使用的是构建后的静态文件，需要重新构建：

```bash
npm run build
npm run start:preview
```

### Q: 隧道地址每次都变？

Cloudflare Tunnel 免费版每次启动会生成新的随机地址。如需固定地址，可以：
1. 登录 Cloudflare 账号
2. 创建命名隧道
3. 绑定自定义域名

### Q: 首次加载还是很慢？

1. 确保使用的是预览模式而非开发模式
2. 检查网络连接
3. 隧道本身会有 ~300-500ms 延迟

---

## 完整启动流程

### 演示给朋友看（推荐）

```bash
# 1. 启动预览模式 + 隧道
npm run start:preview:tunnel

# 2. 等待服务启动完成

# 3. 复制公网地址分享给朋友
```

### 本地开发

```bash
# 启动开发模式
npm start

# 需要公网访问时
npm run start:dev:tunnel
```

### 构建部署

```bash
# 构建前端
npm run build

# dist/ 文件夹就是可部署的静态文件
```

---

## 目录结构

```
ink-spirit-blog/
├── start.js          # 启动脚本
├── start.bat         # Windows 启动菜单
├── package.json      # NPM 脚本配置
├── frontend/         # 前端代码
│   └── dist/         # 构建输出（预览/生产模式）
├── backend/          # 后端代码
└── tunnel/           # 隧道模块
    ├── index.js      # 隧道入口
    ├── cloudflare.js # Cloudflare Tunnel
    └── ngrok.js      # ngrok 备用
```

---

## 性能对比

| 模式 | 首次加载 | 后续加载 | 热更新 |
|------|----------|----------|--------|
| 开发模式 | 3-6秒 | 0.5-1秒 | ✅ |
| 预览模式 | 0.5-1秒 | 0.3-0.5秒 | ❌ |
| 生产部署 | 0.1-0.5秒 | 0.05-0.2秒 | ❌ |
