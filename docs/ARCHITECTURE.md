# INK.SPIRIT Blog 架构文档

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
    ┌────────────────┐ ┌───────────────┐ ┌────────────────┐
    │ React Frontend │ │  Node.js API  │ │ Python AI Svc  │
    │  - Vite        │ │  - Express    │ │  - FastAPI     │
    │  - TypeScript  │ │  - Prisma ORM │ │  - LangChain   │
    │  - Tailwind    │ │  - Auth JWT   │ │  - OpenAI/Claude│
    └───────┬────────┘ └───────┬───────┘ └───────┬────────┘
            │                  │                 │
            └──────────────────┼─────────────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
    ┌────────────────┐ ┌───────────────┐ ┌────────────────┐
    │   PostgreSQL   │ │    Redis      │ │     MinIO      │
    │    Database    │ │   (Cache)     │ │   (Storage)    │
    └────────────────┘ └───────────────┘ └────────────────┘
```

## 项目结构

```
ink-spirit-blog/
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/       # React 组件
│   │   ├── pages/            # 页面组件
│   │   ├── contexts/         # Context providers
│   │   ├── lib/              # 工具库
│   │   └── types.ts          # TypeScript 类型
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                    # Node.js REST API
│   ├── src/
│   │   ├── controllers/      # 请求处理器
│   │   ├── services/         # 业务逻辑
│   │   ├── routes/           # API 端点
│   │   ├── middleware/       # 认证、验证、上传
│   │   └── utils/            # 辅助函数
│   ├── prisma/
│   │   └── schema.prisma     # 数据库模型
│   └── package.json
│
├── ai-service/                 # Python AI 微服务
│   ├── app/
│   │   ├── api/v1/           # API 路由
│   │   ├── services/         # AI/分析服务
│   │   ├── models/           # Pydantic schemas
│   │   └── core/             # 配置和数据库
│   ├── main.py               # FastAPI 应用
│   ├── requirements.txt      # Python 依赖
│   └── Dockerfile
│
├── docs/                       # 文档
├── shared/                     # 共享类型
├── tunnel/                     # 公网隧道
├── docker-compose.yml          # 多服务编排
└── package.json                # 根项目配置
```

## 微服务架构

### 服务列表

| 服务 | 端口 | 技术栈 | 职责 |
|------|------|--------|------|
| frontend | 3000 | React + Vite | 用户界面 |
| backend | 3001 | Node.js + Express | 主 API 服务 |
| ai-service | 8000 | Python + FastAPI | AI 功能 |
| db | 5432 | PostgreSQL 16 | 数据存储 |
| redis | 6379 | Redis 7 | 缓存/队列 |
| minio | 9000/9001 | MinIO | 对象存储 |

### AI 服务功能

| 功能 | 端点 | 说明 |
|------|------|------|
| 文章摘要 | `POST /api/v1/ai/summarize` | GPT/Claude 自动摘要 |
| 关键词提取 | `POST /api/v1/ai/extract-keywords` | 内容关键词提取 |
| 标签生成 | `POST /api/v1/ai/generate-tags` | 自动生成文章标签 |
| 情感分析 | `POST /api/v1/ai/sentiment` | 内容情感倾向分析 |
| 数据分析 | `GET /api/v1/analytics/overview` | 内容统计分析 |
| 趋势话题 | `GET /api/v1/analytics/trending` | 热门话题和标签 |
| 内容推荐 | `POST /api/v1/recommend/posts` | 协同过滤推荐 |

### AI 提供商支持

- **OpenAI GPT-4** - 通用场景最佳
- **Anthropic Claude** - 长文本分析优秀
- **本地 LLM (Ollama)** - 私有、离线部署

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS |
| 后端 | Node.js + Express + TypeScript + Prisma ORM |
| 数据库 | PostgreSQL 16 |
| 缓存 | Redis 7 (可选) |
| 存储 | MinIO (可选) |
| AI服务 | Python FastAPI + LangChain |
| 认证 | JWT + bcryptjs |

## 部署架构

### Docker Compose 部署

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 2. 启动所有服务
docker-compose up -d

# 3. 查看服务状态
docker-compose ps
```

### 服务依赖关系

```
frontend → backend → db
         → ai-service → redis
         → minio
```

## 环境变量

详见 [.env.example](../.env.example)

### 必需变量

- `POSTGRES_PASSWORD` - 数据库密码
- `JWT_SECRET` - JWT 签名密钥
- `MINIO_ROOT_PASSWORD` - MinIO 密码

### 可选变量

- `OPENAI_API_KEY` - OpenAI API 密钥
- `ANTHROPIC_API_KEY` - Claude API 密钥
- `REDIS_URL` - Redis 连接
