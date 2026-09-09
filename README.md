# INK.SPIRIT Blog

> 赛博武侠风格的个人博客系统 (Cyber-Wuxia Personal Blog)

## 新环境快速部署

```bash
# 1. 克隆项目
git clone <repo-url>
cd ink-spirit-blog

# 2. 安装依赖
npm run install:all

# 3. 配置环境变量
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# 编辑 backend/.env，填入数据库连接字符串

# 4. 初始化数据库
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ..

# 5. 启动开发服务器
npm run dev
```

## 构建与本地预览

```bash
npm run build            # 依次构建后端 TypeScript 与前端生产资源
npm run start            # 智能选择可用端口并启动开发环境
npm run start:preview    # 预览前端生产资源并连接本地后端
```

后端无论从 `src` 运行还是从 `dist` 运行，都读取 `backend/.env`。AI 服务的镜像构建上下文会排除 `.env`、本地知识库、缓存、测试及日志；部署时请通过容器环境变量或密钥管理服务注入配置。

反向代理默认仅信任本机回环地址，适合与后端运行在同一台机器上的 cloudflared。代理位于 Docker/其他主机时，请在 `TRUST_PROXY` 中填写代理的精确 IP（多个用逗号分隔）或窄网段（IPv4 `/24` 以上、IPv6 `/64` 以上），`0` 表示禁用代理信任。不要使用代理跳数、`private`、`true` 或 `*`，并避免让客户端绕过代理直连后端端口。

文件浏览器会把密码保护索引绑定到存储内的随机身份标记；存储目录/MinIO bucket、身份标记和 `FILE_METADATA_PATH` 必须成组备份与迁移。当前索引是本地 JSON，只支持单个后端进程（不要启用 PM2 cluster 或多个副本）。旧版 `backend/file-metadata.json` 的一次性升级、私有 bucket 权限和故障恢复见 [MinIO 集成文档](docs/MINIO_INTEGRATION.md#文件浏览器的权限索引)。

## 项目结构

```
ink-spirit-blog/
├── frontend/           # React + TypeScript 前端
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── contexts/      # React Context
│   │   ├── App.tsx        # 应用入口
│   │   └── types.ts       # TypeScript 类型定义
│   ├── .env.example       # 环境变量模板
│   └── package.json
│
├── backend/            # Node.js + Express 后端
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── controllers/   # 控制器逻辑
│   │   ├── services/      # 业务逻辑
│   │   └── middleware/    # 中间件
│   ├── prisma/            # 数据库 Schema + Migrations
│   │   ├── schema.prisma     # 数据模型
│   │   ├── migrations/       # 迁移文件
│   │   └── seed.ts           # 种子数据
│   ├── .env.example       # 环境变量模板
│   └── package.json
│
├── ai-service/         # AI 服务（可选）
│   └── .env.example
│
├── shared/             # 前后端共享类型
├── docs/               # 文档
└── package.json        # 根项目配置
```

## 环境配置

### 后端 (backend/.env)

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/ink_spirit_db"
PORT=3001
NODE_ENV=development
JWT_SECRET="your-secret-key"
INIT_DB="true"
```

### 前端 (frontend/.env)

本地开发时无需配置，Vite 自动代理到后端。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | PostgreSQL + Prisma ORM |
| AI服务 | Python FastAPI (可选) |

## 常用命令

```bash
npm run dev              # 开发模式
npm run preview          # 预览构建结果
npm run build            # 生产构建（前端 + 后端）
npm run install:all      # 安装所有依赖

# 数据库相关 (在 backend 目录下)
npx prisma studio        # 打开数据库可视化工具
npx prisma migrate dev   # 创建新迁移
npx prisma db seed       # 填充种子数据
```

## 开发状态

- [x] 前端页面开发
- [x] 路由配置
- [x] 后端 API 实现
- [x] 数据库设计
- [x] 前后端联调
- [x] 移动端适配

## 作者

**CYBER.RONIN**

---

*INK.SPIRIT © 2024*
