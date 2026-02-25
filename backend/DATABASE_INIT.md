# INK.SPIRIT Blog - Database Initialization Guide

## 📋 Overview

This guide helps you initialize the database for the INK.SPIRIT Blog backend with all the sample data needed for the frontend.

## 🚀 Quick Start (Auto-Initialization)

### ⚡ Fastest Way - Auto-Initialize on Startup

The backend now supports **automatic database initialization** on first startup!

1. **Set up `.env` file:**
   ```bash
   cp .env.example .env
   # Edit DATABASE_URL with your PostgreSQL connection string
   ```

2. **Start the backend:**
   ```bash
   npm run dev
   ```

   The backend will:
   - 🔍 Check if database is initialized
   - 🔄 Run migrations if needed
   - 🌱 Seed with sample data if empty
   - ✅ Start the server

   > **Note**: Database is only initialized on first startup. Subsequent starts will skip initialization.

3. **Control auto-initialization:**
   ```bash
   # .env file
   INIT_DB="true"   # Enable auto-initialization (default for development)
   INIT_DB="false"  # Disable (recommended for production)
   ```

---

## 🛠️ Manual Database Management

### Initialize Database Manually
```bash
npm run db:init
```

### Check Database Health
```bash
npm run db:health
```

### Reset Database (WARNING: Deletes All Data!)
```bash
npm run db:force-reset
```

### Traditional Full Reset
```bash
npm run db:reset
```

---

## 🔧 Prerequisites

Before starting, ensure you have:

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database installed and running
3. **npm** dependencies installed

## 🚀 Quick Start (Traditional)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/ink_spirit_db"

# Server
PORT=3001
NODE_ENV=development

# JWT (for admin auth)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# CORS
FRONTEND_URL="http://localhost:3000"
API_URL="http://localhost:3001"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="uploads"
CONTENT_DIR="content"
```

### 3. Initialize Database

Run the following command to set up everything:

```bash
npm run init
```

This command will:
- Generate Prisma Client
- Run database migrations
- Seed the database with sample data

## 📊 Database Schema

### Core Models

| Model | Description | Records |
|-------|-------------|---------|
| **User** | User accounts with roles (USER, ADMIN, EDITOR) | 1 |
| **Post** | Blog posts with Markdown content, tags, categories | 6 |
| **Comment** | Post comments with nested replies | 0 |
| **Announcement** | System announcements (INFO, WARNING, SUCCESS, IMPORTANT) | 3 |
| **Project** | Portfolio projects with tech stack, status | 5 |
| **Skill** | Skills grouped by category with levels and ranks | 11 |
| **TimelineEvent** | Timeline events (MILESTONE, JOB, LIFE) | 5 |
| **Anime** | Anime tracking with progress, score, notes | 6 |
| **Diary** | Short and long-form diary entries | 6 |
| **GalleryImage** | Photo gallery with EXIF data, comments | 6 |
| **Album** | Photo collections | 2 |
| **NetworkNode** | Relationship network visualization nodes | 5 |
| **Activity** | Recent project activities | 5 |
| **SiteStats** | Website analytics and statistics | 1 |

### Model Details

#### Post
- **Fields**: id, title, slug, content, excerpt, date, category, tags, readingTime
- **Stats**: viewCount, likeCount
- **Status**: isPublished, isFeatured
- **Relations**: comments, author (User)

#### Project
- **Fields**: id, name, slug, description, type, tech stack, status
- **Links**: link, imageUrl, githubUrl, demoUrl
- **Time**: startDate, endDate
- **Content**: readme (Markdown)
- **Flag**: featured

#### Skill
- **Fields**: id, name, category, level (0-100), rank (Master, Expert, Adept, Novice)
- **Visualization**: nodeX, nodeY, nodeType, connections
- **Stats**: projectCount
- **Categories**: FRONTEND.CORE, BACKEND.OPS, DESIGN.ARTS

#### Anime
- **Fields**: id, title, cover, bannerImage, type (TV, OVA, Movie, Special, ONA)
- **Info**: episodes, aired, studios, genres, synopsis
- **Personal**: currentEp, status (WATCHING, COMPLETED, ON_HOLD, DROPPED)
- **Rating**: score (0-10), favorite, notes, tags
- **Links**: bilibiliUrl
- **Time**: startDate, finishDate

#### GalleryImage
- **Fields**: id, title, src, date, location, aspect
- **EXIF**: camera, settings
- **Content**: description, tags
- **Relation**: album (Album), comments (PhotoComment[])

#### Diary
- **Type**: SHORT (便签) or LONG (长文日记)
- **Short Fields**: content, stamp
- **Long Fields**: title, subtitle, longContent, location, mood, weather, coverImage
- **Common**: date, tags, readingTime

## 🔐 Default Admin Account

After initialization, you can log in with:

- **Username**: `cyber.ronin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change the default password in production!

## 📝 Sample Data Overview

### Posts (6 articles)
1. 重构现实：赛博空间的虚无与存在 (PHILOSOPHY)
2. 水墨组件库开发实录 (ENGINEERING)
3. 数字游民的修仙指南 (LIFESTYLE)
4. React Server Components 深度解析 (TECH)
5. 2023 年度总结：破碎与重组 (LIFE)
6. Rust 所有权机制图解 (TECH)

### Projects (5 projects)
1. **INK.ENGINE** - Blog theme (ACTIVE, Featured)
2. **ZEN.TIMER** - Productivity app (DEPLOYED, Featured)
3. **VOID.CLI** - Dev tool (ARCHIVED)
4. **NEON.DB** - Database (ACTIVE)
5. **PIXEL.ARTS** - Pixel art editor (DEPLOYED)

### Skills (11 skills)
- **FRONTEND.CORE**: React/Next.js, TypeScript, Tailwind, WebGL/Three.js
- **BACKEND.OPS**: Node.js, Rust, PostgreSQL, Docker/K8s
- **DESIGN.ARTS**: Figma, UI/UX, Motion Design

### Anime (6 anime)
1. Ghost in the Shell: SAC_2045 (WATCHING, 9.5★, Favorite)
2. Cyberpunk: Edgerunners (COMPLETED, 9.0★, Favorite)
3. Serial Experiments Lain (COMPLETED, 10.0★)
4. Ergo Proxy (ON_HOLD)
5. Psycho-Pass (WATCHING)
6. Steins;Gate (COMPLETED, 9.8★, Favorite)

### Timeline Events (5 events)
- 2024.05.20: INK.SPIRIT Launch (MILESTONE)
- 2024.01.15: Joined Tech Giant (JOB)
- 2023.11.08: Rust Journey Begins (MILESTONE)
- 2023.06.21: Graduation (LIFE)
- 2022.09.01: Open Source Contributor (MILESTONE)

### Gallery (2 albums, 6 images)
- **东京赛博之旅**: 4 photos (NEON RAIN, SERVER ROOM, QUIET ALLEY, TERMINAL)
- **自然代码**: 2 photos (NATURE CODE, ABSTRACT)

### Network Nodes (5 nodes)
1. **Cyber.Ronin** (Core) - The Architect
2. **Master.Void** (Major) - Mentor
3. **Neon.Fox** (Major) - Collaborator
4. **Data.Ghost** (Major) - Backend
5. **Open Source** (Minor) - Community

## 🔄 Reset Database

To reset and re-seed the database:

```bash
npm run db:reset
```

This will:
1. Delete all tables (CASCADE)
2. Re-run migrations
3. Re-seed with sample data

## 📁 Directory Structure

After initialization, the following directories will be created:

```
backend/
├── content/           # Markdown files for About page
├── uploads/           # Uploaded files (images, etc.)
│   └── general/      # General uploads
│   └── gallery/      # Gallery uploads
│   └── anime/        # Anime cover uploads
│   └── project/      # Project image uploads
└── prisma/
    ├── schema.prisma    # Database schema
    ├── seed.ts          # Seed data
    └── migrations/     # Migration files
```

## 🔍 Verifying Data

Check that data was seeded correctly:

```bash
# Check database connection
npx prisma studio

# Run a quick test
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.post.count().then(c => console.log('Posts:', c))"
```

## 🚀 Start Development Server

After initialization:

```bash
npm run dev
```

The server will start at `http://localhost:3001`

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/health | Health check |
| GET /api/posts | Blog posts |
| GET /api/projects | Portfolio projects |
| GET /api/skills | Skills data |
| GET /api/anime | Anime tracking |
| GET /api/diary | Diary entries |
| GET /api/gallery | Photo gallery |
| GET /api/timeline | Timeline events |
| GET /api/network | Relationship network |
| GET /api/dashboard | Dashboard stats |
| GET /api/search | Global search |
| POST /api/auth/login | User login |
| POST /api/upload/image/:type | File upload |

For complete API documentation, see [BACKEND_API_SPEC.md](../docs/BACKEND_API_SPEC.md)

## 🛠️ Troubleshooting

### Database Connection Error

```
Error: Can't reach database server
```

**Solution**: Ensure PostgreSQL is running and the DATABASE_URL in `.env` is correct.

### Migration Failed

```
Error: P3006
```

**Solution**: The database exists but is empty. Run `npm run db:reset`.

### Seed Failed

```
Error: Unique constraint failed
```

**Solution**: Database already has data. Run `npm run db:reset` to clean and re-seed.

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Express.js Documentation](https://expressjs.com/)

---

**Next Steps**:
1. Start the backend: `npm run dev`
2. Start the frontend: `cd ../frontend && npm run dev`
3. Open http://localhost:3000 to see the full application

Happy coding! 🚀
