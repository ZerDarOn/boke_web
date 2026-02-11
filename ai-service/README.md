# INK.SPIRIT Blog - AI Service

Python FastAPI microservice for AI-powered features.

## Features

- 🔍 **Content Analysis** - Summarize articles, extract keywords
- 🤖 **Tag Generation** - Auto-suggest tags for posts
- 📊 **Data Analytics** - User behavior analysis, content trends
- 💬 **LLM Integration** - OpenAI / Claude / Local models support
- 🎯 **Smart Recommendations** - Content recommendations based on user history

## Tech Stack

- **Framework**: FastAPI
- **ORM**: SQLAlchemy (async)
- **AI/ML**:
  - LangChain
  - OpenAI API
  - Transformers (Hugging Face)
  - Scikit-learn
  - Pandas / NumPy
- **Database**: PostgreSQL (shared with Node.js backend)

## Installation

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

## Configuration

Create `.env` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ink_spirit_db"

# AI Services
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY=""
# Optional: Local LLM
LOCAL_LLM_URL="http://localhost:11434/v1"

# Server
HOST=0.0.0.0
PORT=8000
```

## Running

```bash
# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

## API Endpoints

### Content Analysis

| Endpoint | Method | Description |
|----------|----------|-------------|
| `/api/summarize` | POST | Summarize article content |
| `/api/extract-keywords` | POST | Extract keywords from text |
| `/api/generate-tags` | POST | Suggest tags for posts |
| `/api/sentiment` | POST | Analyze sentiment |

### Recommendations

| Endpoint | Method | Description |
|----------|----------|-------------|
| `/api/recommend/posts` | GET | Get recommended posts for user |
| `/api/recommend/similar` | POST | Find similar content |

### Analytics

| Endpoint | Method | Description |
|----------|----------|-------------|
| `/api/analytics/user` | GET | User behavior analytics |
| `/api/analytics/content` | GET | Content performance trends |
| `/api/analytics/trends` | GET | Trending topics |

## Development

```bash
# Type checking
mypy .

# Linting
ruff check .

# Testing
pytest
```

## Architecture

```
┌─────────────────────────────────────┐
│      Python AI Service             │
│  ┌───────────────────────────┐   │
│  │  FastAPI (Uvicorn)    │   │
│  └────────────┬────────────┘   │
│               │                │
│    ┌──────────┼──────────┐  │
│    │          │          │  │
│  LangChain  SQLAlchemy   Redis  │
│    │          │          │  │
│    └────┬─────┘          │  │
│         │                 │  │
│    ┌────▼────────┐       │  │
│    │ OpenAI/LM  │       │  │
│    └─────────────┘       │  │
└────────────────┬────────────┘
              │
              ▼
        ┌─────────────┐
        │ PostgreSQL  │
        │ (shared)   │
        └─────────────┘
```

## Integration with Node.js Backend

```typescript
// backend/src/services/ai.service.ts
export const aiService = {
  async summarize(content: string) {
    const response = await fetch('http://ai-service:8000/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.json();
  },
  
  async generateTags(title: string, content: string) {
    const response = await fetch('http://ai-service:8000/api/generate-tags', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
    return response.json();
  },
};
```

## Docker Deployment

See `docker-compose.yml` in project root for multi-service setup.

## License

MIT
