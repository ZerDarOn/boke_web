# Quick Initialization Guide

## One-Command Setup

After setting up your `.env` file, run:

```bash
cd backend
npm run init
```

This will:
1. ✅ Generate Prisma Client
2. ✅ Create database tables
3. ✅ Seed with sample data

## Default Credentials

- **Username**: `cyber.ronin`
- **Password**: `admin123`

## After Initialization

```bash
npm run dev
```

Server starts at: `http://localhost:3001`

## Quick Test

```bash
curl http://localhost:3001/api/health
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database only |
| `npm run db:reset` | Reset and re-seed database |
| `npm run init` | Full initialization |
| `npx prisma studio` | Open Prisma Studio |

## Troubleshooting

**Database connection error?**
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`

**Migration failed?**
- Run `npm run db:reset`

**Port 3001 already in use?**
- Change PORT in `.env`
- Kill process using port 3001

## Data Overview

| Model | Records |
|--------|----------|
| Users | 1 (admin) |
| Posts | 6 |
| Projects | 5 |
| Skills | 11 |
| Anime | 6 |
| Diaries | 6 |
| Gallery | 6 images, 2 albums |
| Timeline Events | 5 |
| Network Nodes | 5 |
| Activities | 5 |
| Announcements | 3 |
| Site Stats | 1 |

For full documentation, see [DATABASE_INIT.md](DATABASE_INIT.md)
