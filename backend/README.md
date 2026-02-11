# INK.SPIRIT Backend

> Node.js + Express + TypeScript API Server

## 目录结构

```
backend/
├── src/
│   ├── routes/         # API 路由定义
│   ├── controllers/    # 控制器逻辑（待实现）
│   ├── models/         # 数据模型（待实现）
│   ├── services/       # 业务逻辑（待实现）
│   ├── middleware/     # 中间件（待实现）
│   ├── utils/          # 工具函数（待实现）
│   ├── config/         # 配置文件
│   │   └── env.ts      # 环境变量
│   ├── app.ts          # Express 应用配置
│   └── index.ts        # 入口文件
├── prisma/             # Prisma 数据库配置
├── tests/              # 测试文件
├── .env.example        # 环境变量示例
├── package.json
└── tsconfig.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

### 3. 配置数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 运行迁移
npx prisma migrate dev

# 填充初始数据（可选）
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3001 启动

## API 端点

### 已定义的路由

| 路径 | 说明 |
|------|------|
| GET /api/health | 健康检查 |
| GET /api/posts | 文章列表 |
| GET /api/posts/:id | 文章详情 |
| GET /api/projects | 项目列表 |
| GET /api/anime | 动漫列表 |
| GET /api/diary | 日记列表 |
| GET /api/gallery | 相册列表 |
| GET /api/dashboard/stats | 仪表盘统计 |
| GET /api/search | 全局搜索 |
| GET /rss.xml | RSS Feed |

更多详见: [BACKEND_API_SPEC.md](../docs/BACKEND_API_SPEC.md)

## 开发计划

1. **数据库设计** - 创建 Prisma Schema
2. **API 实现** - 填充控制器和模型
3. **认证系统** - JWT 管理后台登录
4. **文件上传** - 图片上传功能
5. **性能优化** - 缓存、分页

## 技术栈

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (推荐) / MySQL / SQLite
