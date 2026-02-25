# Database Auto-Initialization Summary

## ✅ What's New

The backend now supports **automatic database initialization** on first startup!

## 🎯 Key Features

### 1. Smart Initialization
- Checks if database is already initialized
- Only initializes on first startup
- No repeated initialization

### 2. Environment Control
```bash
# .env
INIT_DB="true"   # Enable auto-initialization
INIT_DB="false"  # Disable (production)
```

### 3. Safe for Production
- Production mode requires explicit `INIT_DB=true`
- Default: `false` for production
- Prevents accidental data loss

## 📦 New Files

- `src/lib/database.ts` - Database initialization logic
- `init-db.ts` - Standalone initialization script

## 🔄 Updated Files

- `src/config/env.ts` - Added `INIT_DB` config
- `src/index.ts` - Auto-initialization on startup
- `package.json` - New npm scripts
- `.env.example` - Added `INIT_DB` setting

## 📜 New npm Scripts

```bash
npm run db:init         # Manual initialization
npm run db:health      # Check database health
npm run db:force-reset # Force reset (WARNING: deletes data!)
```

## 🚀 Usage

### Auto-Initialize (Recommended)
```bash
# 1. Set up .env
cp .env.example .env

# 2. Start backend (auto-initializes)
npm run dev
```

### Manual Initialize
```bash
npm run db:init
```

## 🔍 How It Works

```
Backend Start
    ↓
Check INIT_DB setting
    ↓
Check if database initialized (user count > 0)
    ↓
┌─────────────┬─────────────┐
│ Not Init    │ Already     │
├─────────────┼─────────────┤
│ Run         │ Skip        │
│ Migrations  │            │
│ + Seed      │            │
└─────────────┴─────────────┘
    ↓
Start Server
```

## ⚠️ Safety Checks

- Production mode: Requires explicit `INIT_DB=true`
- Existing data: Skips initialization
- Failure handling: Logs error, doesn't crash server

## 📝 Notes

- Database is checked via user count
- First startup with empty DB = full init
- Subsequent starts = skip init
- Manual reset: `npm run db:force-reset`
