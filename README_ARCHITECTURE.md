# INK.SPIRIT Blog

A modern cyber-wuxia themed personal blog with AI-powered features.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                      │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌───────────────┼───────────────────────────┐
         │  React Frontend │
         │  - Vite          │
         │  - TypeScript      │
         └─────────────┬──────┘
                       │ HTTP
         ┌───────────────┼───────────────────────────┐
         │   Node.js API  │   Python AI Service  │
         │   - Express     │   - FastAPI         │
         │   - Prisma ORM │   - LangChain        │
         │   - Auth        │   - OpenAI/Claude   │
         └─────────────┬──────┘────┬──────────┘
                       │              │
         ┌───────────────┼───────────────────────────┐
         │  PostgreSQL   │     Redis (optional)    │
         └───────────────┴──────────────┬─────────┘
                                     │
                          ┌─────────┐
                          │   Data   │
                          └─────────┘
```

## 📁 Project Structure

```
ink-spirit-blog/
├── backend/                    # Node.js REST API
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Auth, validation, upload
│   │   ├── models/           # Prisma schema
│   │   └── utils/           # Helpers
│   ├── prisma/
│   │   └── schema.prisma    # Database models
│   ├── package.json
│   └── tsconfig.json
│
├── ai-service/                 # Python AI Microservice
│   ├── app/
│   │   ├── api/v1/         # API routes
│   │   ├── services/         # AI/Analytics services
│   │   ├── models/           # Pydantic schemas
│   │   ├── core/            # Config, database
│   │   └── middleware/       # Logging, error handling
│   ├── tests/                 # Test suite
│   ├── main.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Container image
│   └── README.md             # Service documentation
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # Context providers
│   │   └── types.ts         # TypeScript types
│   ├── package.json
│   └── vite.config.ts
│
├── shared/                     # Shared utilities
│   └── types/               # Common type definitions
│
├── docker-compose.yml          # Multi-service orchestration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **Python** 3.11+
- **PostgreSQL** 14+
- **Docker** & **Docker Compose** (optional)

### Using Docker Compose (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd ink-spirit-blog

# Create environment files
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env

# Edit .env files with your configuration
vim backend/.env
vim ai-service/.env

# Start all services
docker-compose up -d

# Access services
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# AI Service: http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

### Manual Start (Development)

#### Backend (Node.js)

```bash
cd backend
npm install
npm run init  # Generate Prisma client, migrate, seed
npm run dev      # Start at http://localhost:3001
```

#### AI Service (Python)

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your AI API keys

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend (React)

```bash
cd frontend
npm install
npm run dev  # Start at http://localhost:3000
```

## 📡 API Endpoints

### Node.js Backend API (Port 3001)

| Endpoint | Method | Description |
|----------|----------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/login` | POST | User login |
| `/api/posts` | GET | List posts |
| `/api/posts/:id` | GET | Get post details |
| `/api/projects` | GET | List projects |
| `/api/anime` | GET | Anime tracking |
| `/api/diary` | GET | Diary entries |
| `/api/gallery` | GET | Photo gallery |
| `/api/timeline` | GET | Timeline events |
| `/api/skills` | GET | Skills data |
| `/api/dashboard` | GET | Dashboard stats |
| `/api/upload/*` | POST | File uploads |

### Python AI Service API (Port 8000)

| Endpoint | Method | Description |
|----------|----------|-------------|
| `/api/v1/ai/summarize` | POST | Summarize content |
| `/api/v1/ai/extract-keywords` | POST | Extract keywords |
| `/api/v1/ai/generate-tags` | POST | Generate tags |
| `/api/v1/ai/sentiment` | POST | Analyze sentiment |
| `/api/v1/analytics/overview` | GET | Analytics overview |
| `/api/v1/analytics/trending` | GET | Trending topics |
| `/api/v1/analytics/user-segments` | GET | User segmentation |
| `/api/v1/recommend/posts` | POST | Recommend posts |
| `/api/v1/recommend/similar` | POST | Find similar |

## 🔑 Environment Variables

### Backend (.env)

```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
PORT=3001
AI_SERVICE_URL="http://ai-service:8000"
```

### AI Service (.env)

```bash
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."        # Optional
ANTHROPIC_API_KEY="sk-..."     # Optional
LOCAL_LLM_URL="http://..."      # Optional
PORT=8000
```

## 🤖 AI Features

### Content Analysis
- **Article Summarization**: Auto-generate summaries using GPT/Claude
- **Keyword Extraction**: Extract important keywords from content
- **Tag Generation**: Suggest relevant tags for posts
- **Sentiment Analysis**: Analyze emotional tone of content

### Analytics & Insights
- **Content Trends**: Track trending topics and categories
- **User Segmentation**: K-means clustering for user behavior
- **Recommendations**: Collaborative filtering based on user history
- **Similar Content**: Find related posts using TF-IDF

### AI Providers
- **OpenAI GPT-4**: Best for general purpose
- **Anthropic Claude**: Best for long-form content
- **Local LLM (Ollama)**: Private, offline option
- **Custom Models**: Easy to add new providers

## 🛠️ Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps db

# View logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Service Communication

```bash
# Verify services can reach each other
docker-compose exec backend curl http://ai-service:8000/health

# Check logs
docker-compose logs backend
docker-compose logs ai-service
```

## 📚 Documentation

- **Backend**: [backend/README.md](backend/README.md)
- **AI Service**: [ai-service/README.md](ai-service/README.md)
- **Database**: [backend/DATABASE_INIT.md](backend/DATABASE_INIT.md)
- **API Spec**: [docs/BACKEND_API_SPEC.md](docs/BACKEND_API_SPEC.md)

## 🔄 Development Workflow

1. **Start Services**: `docker-compose up -d`
2. **Backend Changes**: Auto-reload via nodemon
3. **AI Changes**: Auto-reload via uvicorn
4. **Frontend Changes**: Hot reload via Vite
5. **Run Tests**: `pytest ai-service/`
6. **Database Migrations**: `npm run db:migrate`

## 📊 Database Schema

See [backend/prisma/schema.prisma](backend/prisma/schema.prisma) for complete schema.

Key models:
- User, Post, Comment, Project, Skill, Anime, Diary, GalleryImage, Album
- TimelineEvent, NetworkNode, Activity, Announcement, SiteStats

## 🧪 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React, TypeScript, Vite, Tailwind |
| **Backend** | Node.js, Express, Prisma, PostgreSQL |
| **AI Service** | Python, FastAPI, LangChain, OpenAI/Anthropic |
| **Cache** | Redis (optional) |
| **Container** | Docker, Docker Compose |
| **Testing** | Jest, Pytest |

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
