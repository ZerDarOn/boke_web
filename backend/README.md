# INK.SPIRIT Backend API

赛博武侠个人博客后端 API 服务。

## 功能特性

### 核心功能
- ✅ 文章管理（CRUD、分类、标签）
- ✅ 项目展示（GitHub 集成、README 渲染）
- ✅ 公告系统
- ✅ 动漫追踪（观看进度、评分、收藏）
- ✅ 日记系统
- ✅ 相册管理
- ✅ 技能图谱
- ✅ 时间线
- ✅ 社交网络可视化
- ✅ 仪表盘统计

### 新增功能
- ✅ **用户认证** - JWT 登录/注册/刷新 Token
- ✅ **文件上传** - 图片上传、缩略图生成
- ✅ **RSS 订阅** - 动态生成 RSS Feed
- ✅ **文件系统** - About 页面文件管理
- ✅ **热门标签** - 智能标签热度排序

## 技术栈

- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (jsonwebtoken)
- **Upload**: Multer + Sharp
- **Security**: Helmet + CORS + bcryptjs

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 设置数据库连接等

# 3. 初始化数据库
npm run db:migrate
npm run db:generate

# 4. 填充种子数据
npm run db:seed

# 5. 启动开发服务器
npm run dev

# API 服务运行在 http://localhost:3001
```

## API 端点概览

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新 Token
- `GET /api/auth/me` - 获取当前用户
- `PUT /api/auth/me` - 更新用户信息
- `PUT /api/auth/password` - 修改密码

### 文件上传
- `POST /api/upload/image/:type` - 单图片上传
- `POST /api/upload/images/:type` - 批量图片上传
- `DELETE /api/upload/:type/:filename` - 删除文件

### RSS
- `GET /rss.xml` - RSS Feed

### 文件系统（About 页面）
- `GET /api/files?path=` - 文件列表
- `GET /api/files/content?path=` - 文件内容
- `GET /api/files/download?path=` - 下载文件

### 其他 API
详见 [API 规范文档](../docs/BACKEND_API_SPEC.md)

## 目录结构

```
backend/
├── prisma/           # 数据库模型和迁移
├── src/
│   ├── config/       # 配置
│   ├── controllers/  # 控制器
│   ├── middleware/   # 中间件（认证、上传、错误处理）
│   ├── routes/       # 路由
│   ├── services/     # 业务逻辑
│   ├── types/        # TypeScript 类型
│   └── utils/        # 工具函数
└── uploads/          # 上传文件存储
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| DATABASE_URL | PostgreSQL 连接字符串 | - |
| JWT_SECRET | JWT 签名密钥 | - |
| FRONTEND_URL | 前端地址 | http://localhost:5173 |
| API_URL | API 地址 | http://localhost:3001 |
| TRUST_PROXY | 可信代理边界：`loopback`、精确 IP/窄 CIDR，或 `0` 禁用 | loopback |
| MAX_FILE_SIZE | 最大文件大小 | 10485760 (10MB) |
| UPLOAD_DIR | 上传目录 | uploads |
| CONTENT_DIR | 内容文件目录 | content |
| FILE_STORAGE_DIR | 文件浏览器的本地存储目录 | content-files |
| FILE_METADATA_PATH | 文件浏览器的密码保护索引（必须位于存储目录外） | storage-metadata/file-metadata.json |
| FILE_METADATA_ALLOW_EMPTY_INITIALIZATION | 灾难恢复开关；仅确认所有已有文件都应公开时临时启用一次 | false |
| FILE_METADATA_ALLOW_UNBOUND_MIGRATION | 旧索引绑定开关；仅核对旧索引确属当前非空存储时临时启用一次 | false |
| USE_MINIO | MinIO 总开关，只接受 `true` / `false` | false |
| MINIO_ENDPOINT | MinIO 地址；`USE_MINIO=true` 时必填 | - |
| MINIO_REQUEST_TIMEOUT_MS | MinIO 建连及已连接 socket 空闲超时，范围 1000–120000 ms | 15000 |

`TRUST_PROXY` 会影响按访客 IP 执行的限流。默认值只信任本机代理，可直接覆盖同机 cloudflared；Docker/远程代理请填写精确 IP（多个用逗号分隔）或受控的窄 CIDR（IPv4 `/24` 以上、IPv6 `/64` 以上），`0` 表示禁用。不要使用代理跳数、`private`、`true` 或 `*`，并确保客户端不能绕过代理直连后端端口。

文件浏览器的存储身份标记、内容目录/MinIO bucket 与密码保护索引必须一起持久化和备份。当前 JSON 索引只支持单个后端进程或副本；多进程并发写入可能覆盖保护记录，因此不要使用 cluster 模式。MinIO 服务账号还需要读取 bucket policy，启动时会拒绝任何匿名 `Allow` 策略。

## 开发命令

```bash
npm run dev          # 开发模式（热重载）
npm run build        # 构建
npm run start        # 生产模式
npm run db:migrate   # 数据库迁移
npm run db:generate  # 生成 Prisma Client
npm run db:seed      # 填充种子数据
```

## 部署

```bash
# 构建
npm run build

# 生产环境运行
NODE_ENV=production npm start
```

## 许可证

MIT
