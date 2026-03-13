# INK.SPIRIT Tunnel 隧道模块

快速将本地项目暴露到公网，无需域名，无需备案。

## 📁 文件结构

```
tunnel/
├── config.json        # 配置文件（切换隧道提供商）
├── cloudflare.js      # Cloudflare Tunnel 脚本
├── ngrok.js           # ngrok 脚本（备用）
├── start-tunnel.bat   # Windows 启动脚本
├── start-tunnel.sh    # Linux/Mac 启动脚本
├── tunnel-info.json   # 运行时生成的隧道信息
└── README.md          # 本文档
```

## 🚀 快速开始

### 1. 安装隧道工具

**Cloudflare Tunnel（推荐）**:
```bash
# Windows
winget install Cloudflare.cloudflared

# macOS
brew install cloudflared

# Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

**ngrok（备用）**:
- 下载: https://ngrok.com/download
- 解压后放到 PATH 目录

### 2. 启动本地项目

```bash
# 先启动后端
cd backend
npm run dev

# 再启动前端（新终端）
cd frontend
npm run dev
```

### 3. 启动隧道

```bash
# Windows
start-tunnel.bat

# Linux/Mac
./start-tunnel.sh

# 或直接运行
node cloudflare.js
```

### 4. 获取公网地址

启动后会显示类似：
```
🎉 前端隧道已就绪！
   公网地址: https://xxx-xxx.trycloudflare.com
```

把这个地址发给朋友即可访问！

## ⚙️ 配置说明

编辑 `config.json`:

```json
{
  "provider": "cloudflare",     // 隧道提供商: "cloudflare" 或 "ngrok"
  "frontendPort": 3000,         // 前端端口
  "backendPort": 3002,          // 后端端口
  "tunnelName": "ink-spirit-blog"
}
```

## 🔄 切换隧道提供商

修改 `config.json` 中的 `provider` 字段：

```json
{
  "provider": "ngrok"  // 从 cloudflare 切换到 ngrok
}
```

然后重新启动隧道即可。

## 🔒 CORS 配置

后端需要允许隧道地址访问。编辑 `backend/.env`:

```env
# 添加隧道地址到允许列表
ALLOWED_ORIGINS=http://localhost:3000,https://*.trycloudflare.com
```

## 📊 对比

| 特性 | Cloudflare Tunnel | ngrok |
|------|-------------------|-------|
| 费用 | 免费 | 免费/付费 |
| URL 稳定性 | ✅ 固定 | ❌ 每次变化 |
| 需要注册 | ❌ 不需要 | ❌ 免费版不需要 |
| 连接稳定性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 国内访问 | ⚠️ 可能需要加速 | ⚠️ 较慢 |

## 🛠️ 高级用法

### 固定 URL（Cloudflare）

如果想要固定的 URL，需要登录 Cloudflare 账号：

```bash
# 登录
cloudflared tunnel login

# 创建命名隧道
cloudflared tunnel create ink-spirit-blog

# 配置路由
cloudflared tunnel route dns ink-spirit-blog ink-spirit-blog.你的域名.com

# 运行隧道
cloudflared tunnel run ink-spirit-blog
```

### 同时暴露前后端

如果需要后端也暴露到公网，可以启动两个隧道：

```bash
# 终端 1：前端隧道
cloudflared tunnel --url http://localhost:3000

# 终端 2：后端隧道
cloudflared tunnel --url http://localhost:3002
```

然后修改前端环境变量指向后端隧道地址。

## ❓ 常见问题

### Q: 隧道启动失败？
A: 确保：
1. cloudflared/ngrok 已安装并在 PATH 中
2. 本地项目已启动（端口正确）
3. 防火墙没有阻止连接

### Q: 朋友无法访问？
A: 检查：
1. URL 是否正确复制
2. 后端 CORS 是否配置正确
3. 本地项目是否正常运行

### Q: 访问速度慢？
A: 可能原因：
1. 隧道服务器在海外
2. 本地网络问题
3. 可以尝试切换另一个隧道提供商

## 🔗 相关链接

- [Cloudflare Tunnel 文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [ngrok 官网](https://ngrok.com/)
- [Cloudflare 下载](https://github.com/cloudflare/cloudflared/releases)
