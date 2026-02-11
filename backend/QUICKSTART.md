# INK.SPIRIT Backend 快速启动

## 1. 安装依赖

```bash
cd backend
npm install
```

## 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接
```

## 3. 设置数据库

### 选项 A: PostgreSQL (推荐)

```bash
# 创建数据库
createdb ink_spirit_db

# 配置 .env
DATABASE_URL="postgresql://username:password@localhost:5432/ink_spirit_db"
```

### 选项 B: MySQL

```bash
# 修改 prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### 选项 C: SQLite (开发测试)

```bash
# 修改 prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

## 4. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 运行迁移
npx prisma migrate dev --name init

# 填充初始数据
npm run db:seed
```

## 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动

## 6. 测试 API

```bash
# 健康检查
curl http://localhost:3001/api/health

# 获取文章列表
curl http://localhost:3001/api/posts

# 获取仪表盘统计
curl http://localhost:3001/api/dashboard/stats
```

## 项目结构

```
src/
├── config/          # 配置文件
├── controllers/     # 控制器 (处理 HTTP 请求)
├── middleware/      # 中间件
├── lib/            # 库初始化 (Prisma)
├── models/         # 数据模型 (可选)
├── routes/         # API 路由
├── services/       # 业务逻辑
├── types/          # TypeScript 类型
└── utils/          # 工具函数
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (热重载) |
| `npm run build` | 编译 TypeScript |
| `npm run start` | 运行生产服务器 |
| `npm run db:migrate` | 运行数据库迁移 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:seed` | 填充种子数据 |

## API 端点

| 端点 | 说明 |
|------|------|
| GET /api/health | 健康检查 |
| GET /api/posts | 文章列表 |
| GET /api/posts/:id | 文章详情 |
| GET /api/projects | 项目列表 |
| GET /api/anime | 动漫列表 |
| GET /api/diary | 日记列表 |
| GET /api/gallery | 相册列表 |
| GET /api/dashboard/stats | 仪表盘统计 |
| GET /api/search?q=keyword | 全局搜索 |
| GET /rss.xml | RSS Feed |

完整 API 文档: [BACKEND_API_SPEC.md](../docs/BACKEND_API_SPEC.md)
