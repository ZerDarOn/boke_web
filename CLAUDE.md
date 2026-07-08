# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

INK.SPIRIT is a cyber-wuxia themed personal blog system. Full-stack monorepo with:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (port 5173)
- **Backend**: Node.js + Express + TypeScript + Prisma ORM (port 3001)
- **Database**: PostgreSQL (via Prisma)
- **Optional services**: Python FastAPI AI service, MinIO object storage, Redis cache

## Common Commands

All commands run from the repo root unless noted.

```bash
# Development (starts frontend + backend concurrently)
npm run dev

# Development with smart port manager (auto-detects port conflicts, supports tunneling)
npm run start           # same as: node start.js dev

# Install all dependencies (root + frontend + backend)
npm run install:all

# Type check frontend only (no test runner exists for frontend)
cd frontend && npm run typecheck

# Run backend tests (Jest + ts-jest; tests live in backend/tests/)
cd backend && npm test

# Run a single backend test file, or filter by name
cd backend && npm test -- tests/services.test.ts
cd backend && npm test -- -t "partial test name"

# Create an admin user (needed before logging into /admin)
cd backend && npm run create:admin

# Production build
npm run build
```

### Database (run from `backend/`)
```bash
npx prisma studio          # Visual DB browser
npx prisma migrate dev     # Create a new migration
npx prisma db seed         # Seed with demo data
npm run db:reset           # Force reset + reseed
npm run db:fix             # Sync schema without full reset (tsx scripts/sync-db.ts)
npm run db:sync-schema     # Generate client + push schema (no data wipe)
npm run db:health          # Check DB connection health
```

## Environment Setup

Copy and configure env files before first run:
```bash
cp backend/.env.example backend/.env
```

Minimum `backend/.env`:
```
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/ink_spirit"
PORT=3001
JWT_SECRET=<secret>
```

Additional optional env vars (see `backend/.env.example` for all):
- `FRONTEND_URL` / `ALLOWED_ORIGINS` — CORS origins; supports comma-separated list and wildcards
- `ALLOWED_ORIGINS` accepts comma-separated URLs including wildcard patterns (e.g. tunnel domains)
- `STEAM_API_KEY` / `STEAM_USER_ID` — for game library sync via `/api/games/sync`
- `AI_SERVICE_URL` — Python FastAPI service for AI features (default: `http://localhost:8000`)
- `INIT_DB=true` / `RESET_DB=false` — control auto-DB initialization on startup

Docker Compose (infrastructure only — DB, Redis, MinIO):
```bash
cp .env.example .env
docker compose up -d db redis minio
```

## Architecture

### Backend (`backend/src/`)

- **`index.ts`** — Entry point. Validates env, auto-initializes DB via `lib/database-init.ts`, starts Express.
- **`app.ts`** — Express app. Registers all routes. Middleware order: helmet → CORS → rate-limit → body-parse → morgan → sanitizer → routes → error handlers.
- **`config/env.ts`** — Central env config. `FRONTEND_URLS` list supports wildcard patterns for CORS. `validateProductionEnv()` enforces required vars in production.
- **`lib/prisma.ts`** — Singleton Prisma client.
- **`lib/cache.ts`** — In-memory cache layer (no Redis dependency at runtime).
- **`lib/sanitizer.ts`** — XSS sanitization middleware applied globally.
- **`routes/`** — One file per domain. All routes registered in `app.ts` under `/api/<domain>`.
- **`middleware/auth.middleware.ts`** — JWT guard. Exports `authenticate` (verifies Bearer token, sets `req.user`), `requireAdmin` (requires `role === 'ADMIN'`), and `optionalAuth` (sets `req.user` if a token is present, never rejects).

Full route list: `posts`, `projects`, `announcements`, `anime`, `diary`, `gallery`, `skills`, `timeline`, `network`, `universe`, `dashboard`, `search`, `upload`, `minio`, `auth`, `files`, `rss`, `ai`, `settings`, `maintenance`, `current-status`, `history`, `content`, `export`, `error`, `games` (file is `routes/game.ts`, mounted at `/api/games`).

#### Security: per-route auth is mandatory (do not rely on a global guard)

There is **no** blanket auth middleware on write routes. Every mutating/admin handler must explicitly chain `authenticate, requireAdmin` itself, e.g.:

```ts
router.post('/', authenticate, requireAdmin, handler)
```

A past regression dropped these guards and exposed write endpoints publicly. When adding a new route or a new write handler, you **must** add `authenticate, requireAdmin` by hand — there is no safety net that will catch a forgotten guard. Public read endpoints intentionally omit auth (or use `optionalAuth` for access-level filtering).

### Frontend (`frontend/src/`)

- **`App.tsx`** — Root with provider stack (QueryClientProvider → LangProvider → AuthProvider → ToastProvider → BrowserRouter) and lazy-loaded routes.
- **`contexts/`** — `AuthContext` (JWT via localStorage), `LangContext` (i18n), `QueryContext` (TanStack Query), `ToastContext`.

#### Data-Fetching Pattern (two layers)

1. **`lib/api/*.ts`** — Raw API call functions (one file per domain). `lib/api/client.ts` handles base URL and auth headers; `lib/api/request.ts` wraps fetch. **Always import API functions from `lib/api.ts`** (the aggregated re-export), not from individual files.

2. **`hooks/queries/*.ts`** — TanStack Query hooks per domain (e.g. `usePosts`, `usePostById`). These call `lib/api/*.ts` and handle cache state. `hooks/api/query-keys.ts` defines typed cache keys used for invalidation.

- **`hooks/`** (top-level) — Non-query hooks: `useScrollProgress`, `useThemeClass`, `useDashboard`, `useActivities`, `useSiteConfig`.
- **`pages/Admin/`** — All admin pages. Protected by `AdminLayout` which checks `AuthContext`.

### Route Structure

Public pages are wrapped in `<Layout>`. Admin pages are wrapped in `<AdminLayout>` at `/admin/*`. Admin login is at `/admin/login`.

### Vite Proxy

In dev, `/api` requests are proxied to `http://localhost:3001` (or the port in `.port-config.json`). This file is auto-generated by `portManager.js` / `start.js` when using `npm run start`.

### Single-port production deployment

When `frontend/dist` exists, `app.ts` serves it as static files and falls back to `index.html` for any non-`/api`, non-`/uploads`, non-`/rss` GET (so deep links like `/admin/...` resolve client-side). This means a production build can run on the backend port alone — no separate frontend server required.

### Data Models

Key Prisma models in `backend/prisma/schema.prisma`:
- `Post`, `Comment` — blog posts with access levels (PUBLIC/PRIVATE/PASSWORD)
- `Project`, `Skill`, `TimelineEvent` — portfolio data
- `Diary` (SHORT/LONG types), `GalleryImage`, `Album`, `Anime`, `Game` — personal content
- `NetworkNode` — relationship visualization graph
- `User` (ADMIN/EDITOR/USER roles) — auth
- `SiteConfig` — key-value site settings
- `Activity`, `CurrentStatus`, `HistoryItem` — dashboard widgets
- `UniverseLayout` — canvas coordinates for the "universe" visualization

### Content Import/Export

Admin UI at `/admin/import` and `/admin/export` handles bulk Markdown import/export. Backend routes in `routes/content.ts` and `routes/export.ts`.
