# 微服务架构调整完成

## ✅ 完成内容

### 1. 目录结构调整

新增 `ai-service/` 目录：
```
ai-service/
├── app/
│   ├── api/v1/           # API 路由
│   ├── services/         # AI/分析服务
│   ├── models/           # Pydantic schemas
│   ├── core/            # 配置和数据库
│   └── middleware/       # 中间件
├── tests/               # 测试
├── main.py             # FastAPI 应用
├── requirements.txt     # Python 依赖
├── Dockerfile          # Docker 镜像
├── .env.example       # 环境变量示例
└── README.md          # 文档
```

### 2. AI 服务功能

| 功能 | 端点 | 说明 |
|-------|--------|------|
| 文章摘要 | `POST /api/v1/ai/summarize` | 使用 GPT/Claude 自动摘要 |
| 关键词提取 | `POST /api/v1/ai/extract-keywords` | 从内容提取关键词 |
| 标签生成 | `POST /api/v1/ai/generate-tags` | 自动生成文章标签 |
| 情感分析 | `POST /api/v1/ai/sentiment` | 分析内容情感倾向 |
| 数据分析 | `GET /api/v1/analytics/overview` | 内容统计分析 |
| 趋势话题 | `GET /api/v1/analytics/trending` | 热门话题和标签 |
| 用户分群 | `GET /api/v1/analytics/user-segments` | K-means 聚类分析 |
| 内容推荐 | `POST /api/v1/recommend/posts` | 协同过滤推荐 |
| 相似内容 | `POST /api/v1/recommend/similar` | TF-IDF 相似度 |

### 3. AI 提供商支持

- ✅ **OpenAI GPT-4** - 通用场景最佳
- ✅ **Anthropic Claude** - 长文本分析优秀
- ✅ **本地 LLM (Ollama)** - 私有、离线
- ✅ **自定义扩展** - 轻松添加新提供商

### 4. Node.js 集成

新增文件：
- `backend/src/services/ai.client.ts` - AI 服务 HTTP 客户端
- `backend/src/routes/ai.ts` - AI 代理路由

配置：
- `backend/.env.example` - 新增 `AI_SERVICE_URL`
- `backend/src/config/env.ts` - 新增 AI 服务配置
- `backend/package.json` - 新增 `axios` 依赖

### 5. Docker Compose 配置

完整的多服务编排：
```yaml
services:
  db:              # PostgreSQL 数据库
  redis:           # Redis 缓存（可选）
  backend:         # Node.js 主 API (3001)
  ai-service:      # Python AI 微服务 (8000)
  frontend:        # React 前端 (3000)
```

### 6. 快速启动脚本

- **Windows**: `start-dev.bat`
- **Linux/Mac**: `start-dev.sh`

一键启动所有服务（数据库、AI 服务、后端、前端）

### 7. Node.js 路由扩展

新增路由：
```
/api/ai/health           - AI 服务健康检查
/api/ai/summarize      - 文章摘要
/api/ai/extract-keywords - 关键词提取
/api/ai/generate-tags   - 标签生成
/api/ai/sentiment       - 情感分析
/api/ai/analytics/overview - 数据分析概览
/api/ai/analytics/trending - 趋势话题
/api/ai/recommend/posts - 内容推荐
```

## 🚀 启动步骤

### 方式 1：Docker Compose（推荐）

```bash
# 1. 配置环境变量
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env

# 2. 编辑 .env 文件
# 配置数据库连接、AI API keys 等

# 3. 启动所有服务
docker-compose up -d

# 4. 访问服务
# 前端: http://localhost:3000
# 后端: http://localhost:3001
# AI 服务: http://localhost:8000/docs
# Prisma Studio: http://localhost:5555
```

### 方式 2：手动启动（开发）

```bash
# 终端 1: PostgreSQL + Redis
docker-compose up -d db redis

# 终端 2: Python AI 服务
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 终端 3: Node.js 后端
cd backend
npm install
npm run init  # 初始化数据库
npm run dev

# 终端 4: React 前端
cd frontend
npm install
npm run dev
```

### 方式 3：一键启动脚本

```bash
# Windows
start-dev.bat

# Linux/Mac
chmod +x start-dev.sh
./start-dev.sh
```

## 📊 架构优势

### 对比：Node.js + Python vs 纯 Python

| 方面 | Node.js + Python | 纯 Python |
|-------|------------------|----------|
| 前后端统一 | ✅ TypeScript | ❌ 需要额外 API 层 |
| AI 能力 | ⭐⭐ Python 生态最强 | ⚠️ 可用但生态弱 |
| 开发成本 | ✅ 复用现有代码 | ❌ 需要重写 |
| 学习曲线 | ⚠️ 需要学两种 | ✅ 只需要 Python |
| 部署灵活性 | ⭐⭐ 独立扩容 | ⚠️ 耦合在一起 |
| 性能优化 | ⭐ Node.js 处理高并发 + Python 处理计算 | ⚠️ 需要额外优化 |

## 🔧 环境变量配置

### Backend (.env)

```bash
# 基础配置
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3001

# AI 服务（新增）
AI_SERVICE_URL=http://localhost:8000

# 其他
FRONTEND_URL=http://localhost:3000
```

### AI Service (.env)

```bash
# 数据库
DATABASE_URL=postgresql://...

# AI 提供商（选择一个配置）
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
# 或本地模型
LOCAL_LLM_URL=http://localhost:11434/v1

# 服务配置
PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 📡 API 调用示例

### 前端 → Node.js → Python AI 服务

```typescript
// 前端调用
const response = await fetch('/api/ai/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: articleContent,
    max_length: 200
  })
});

const { summary, key_points } = await response.json();
```

### 内部调用流程

```
前端
  ↓ HTTP POST /api/ai/summarize
Node.js Backend (验证、缓存、限流)
  ↓ HTTP POST http://ai-service:8000/api/v1/ai/summarize
Python AI Service (AI 计算)
  ↓ 查询 PostgreSQL（可选）
PostgreSQL
```

## 🔄 扩展指南

### 添加新的 AI 功能

1. **定义 Pydantic Model**（`app/models/schemas.py`）
2. **实现 Service**（`app/services/`）
3. **添加 API 路由**（`app/api/v1/__init__.py`）
4. **在 Node.js 添加代理**（`backend/src/routes/ai.ts`）

### 切换 AI 提供商

只需修改 `ai-service/app/services/ai_service.py`：
- 添加新的 Provider 类
- 注册到 `AIService.providers` 列表
- 无需更改路由和 API 契约

### 添加数据存储

Python 服务可独立访问 PostgreSQL：
- 用于机器学习特征存储
- 缓存分析结果
- 避免重复计算

## 📚 相关文档

- [README_ARCHITECTURE.md](README_ARCHITECTURE.md) - 架构总览
- [ai-service/README.md](ai-service/README.md) - AI 服务文档
- [backend/README.md](backend/README.md) - Node.js 后端文档
- [backend/DATABASE_INIT.md](backend/DATABASE_INIT.md) - 数据库初始化

## 🎯 下一步建议

1. **安装依赖**
   ```bash
   cd backend && npm install
   cd ai-service && pip install -r requirements.txt
   cd frontend && npm install
   ```

2. **配置环境变量**
   ```bash
   # 创建 .env 文件
   cp backend/.env.example backend/.env
   cp ai-service/.env.example ai-service/.env
   # 编辑添加你的配置
   ```

3. **初始化数据库**
   ```bash
   cd backend
   npm run init
   ```

4. **启动服务**
   ```bash
   # 方式 1：Docker
   docker-compose up -d
   
   # 方式 2：脚本
   ./start-dev.sh  # Linux/Mac
   start-dev.bat   # Windows
   ```

5. **测试 AI 功能**
   ```bash
   # 测试 AI 服务
   curl http://localhost:8000/health
   
   # 测试摘要功能
   curl -X POST http://localhost:8000/api/v1/ai/summarize \
     -H "Content-Type: application/json" \
     -d '{"content":"测试文章内容","max_length":100}'
   ```

---

**架构调整完成！** 🎉

现在你可以：
1. ✅ 继续使用 Node.js 作为主后端
2. ✅ 在 Python AI 服务中添加任何 AI 功能
3. ✅ 两者通过 HTTP 通信，完全解耦
4. ✅ 每个服务可独立部署和扩展
