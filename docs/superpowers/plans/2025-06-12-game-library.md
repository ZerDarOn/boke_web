# 游戏模块 (Game Library) 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 INK.SPIRIT Blog 添加一个完整的游戏库模块，支持多平台游戏管理、Steam 同步、截图展示，以及与文章/项目/日记的关联功能。所有游戏默认隐藏，仅管理员可见。

**Architecture:** 复用现有 Anime 模块的架构模式（Prisma Model → Service → Controller → Route → React Page → Admin CRUD）。Steam 同步通过后端定时任务调用 Steam Web API 实现。截图使用已有的 MinIO/本地文件存储系统。

**Tech Stack:** Prisma + Express + React + TypeScript + Tailwind CSS + Steam Web API

---

## 文件结构

### 后端 (backend/)
```
src/
  services/
    game.service.ts          # 游戏 CRUD + Steam 同步逻辑
  controllers/
    game.controller.ts        # 请求处理
  routes/
    game.ts                   # API 路由
  lib/
    steam-sync.ts             # Steam API 调用 + 定时任务
```

### 前端 (frontend/src/)
```
components/
  MineGames.tsx               # 游戏库主组件（复用 MineAnime 模式）
  GameCard.tsx                # 游戏卡片
  GameFilter.tsx              # 筛选器
  GameScreenshotCarousel.tsx  # 截图轮播
pages/
  Games.tsx                   # /games 页面
  GameDetail.tsx              # /games/:id 详情页
  Admin/
    AdminGames.tsx            # 管理后台 CRUD
lib/api/
  games.ts                    # API 客户端
hooks/queries/
  games.ts                    # React Query hooks
```

### 数据库 (backend/prisma/)
```
schema.prisma                 # 新增 Game model + enums + 关联字段
```

---

## Task 1: 数据库 Schema

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: 在 schema.prisma 末尾添加 Game 模型和 enums**

```prisma
// 游戏平台
enum GamePlatform {
  STEAM
  EPIC
  GOG
  ITCH
  NINTENDO_SWITCH
  PLAYSTATION
  XBOX
  OTHER
}

// 游戏状态
enum GameStatus {
  WANT_TO_PLAY
  PLAYING
  COMPLETED
  DROPPED
  REPLAYING
}

// 游戏
model Game {
  id          String     @id @default(cuid())
  title       String
  cover       String
  bannerImage String?
  screenshots String[]   // 截图 URL 数组

  // 平台信息
  platform    GamePlatform  @default(STEAM)
  platformId  String?       // Steam AppID / Epic 产品 ID
  storeUrl    String?

  // 元数据
  genres      String[]
  developer   String?
  publisher   String?
  releaseDate DateTime?
  description String?

  // 个人状态
  status      GameStatus    @default(WANT_TO_PLAY)
  playtime    Int           @default(0)  // 分钟
  score       Float?
  favorite    Boolean       @default(false)
  notes       String?
  tags        String[]

  // 进度
  achievementsTotal    Int @default(0)
  achievementsUnlocked Int @default(0)

  // 隐私（全部隐藏，仅管理员可见）
  isHidden    Boolean   @default(true)
  hideReason  String?   // "adult", "private", "nsfw"

  // 关联（扩展字段，预留）
  relatedPostIds    String[]  // 关联文章 ID
  relatedProjectIds String[]  // 关联项目 ID
  relatedDiaryIds   String[]  // 关联日记 ID

  // 时间线
  startDate   DateTime?
  finishDate  DateTime?
  lastPlayed  DateTime?

  // Steam 同步
  steamLastSync DateTime?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([status])
  @@index([favorite])
  @@index([platform])
  @@index([isHidden])
  @@map("games")
}
```

- [ ] **Step 2: 生成 Prisma Client**

Run: `cd backend && npx prisma generate`
Expected: Prisma Client 生成成功

- [ ] **Step 3: 同步数据库 schema**

Run: `cd backend && npx prisma db push --skip-generate`
Expected: 数据库表 `games` 创建成功

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add Game model with platform, status, privacy, and relation fields"
```

---

## Task 2: 后端 Service 层

**Files:**
- Create: `backend/src/services/game.service.ts`
- Modify: `backend/src/lib/index.ts` (导出)

- [ ] **Step 1: 创建 game.service.ts**

```typescript
import { PrismaClient, Game, GamePlatform, GameStatus } from '@prisma/client';
import { AppError } from '../errors/AppError';

const prisma = new PrismaClient();

export class GameService {
  // CRUD
  async getAll(options: { status?: GameStatus; platform?: GamePlatform; favorite?: boolean }) {
    const where: any = { isHidden: true }; // 始终过滤隐藏
    if (options.status) where.status = options.status;
    if (options.platform) where.platform = options.platform;
    if (options.favorite !== undefined) where.favorite = options.favorite;

    return prisma.game.findMany({
      where,
      orderBy: [{ favorite: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async getById(id: string) {
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) throw new AppError('Game not found', 404);
    return game;
  }

  async create(data: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) {
    return prisma.game.create({ data });
  }

  async update(id: string, data: Partial<Game>) {
    return prisma.game.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.game.delete({ where: { id } });
  }

  // Steam 同步（占位，Task 7 实现）
  async syncSteamLibrary(steamId: string) {
    // TODO: 调用 Steam Web API
    return { synced: 0, updated: 0 };
  }
}

export const gameService = new GameService();
```

- [ ] **Step 2: 导出 service**

Modify `backend/src/lib/index.ts`:
```typescript
export { gameService } from '../services/game.service';
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/game.service.ts backend/src/lib/index.ts
git commit -m "feat: add game service with CRUD operations"
```

---

## Task 3: 后端 Controller + Route

**Files:**
- Create: `backend/src/controllers/game.controller.ts`
- Create: `backend/src/routes/game.ts`
- Modify: `backend/src/app.ts` (注册路由)

- [ ] **Step 1: 创建 game.controller.ts**

```typescript
import { Request, Response } from 'express';
import { gameService } from '../services/game.service';
import { catchAsync } from '../utils/response';

export const getGames = catchAsync(async (req: Request, res: Response) => {
  const games = await gameService.getAll(req.query as any);
  res.json({ success: true, data: games });
});

export const getGame = catchAsync(async (req: Request, res: Response) => {
  const game = await gameService.getById(req.params.id);
  res.json({ success: true, data: game });
});

export const createGame = catchAsync(async (req: Request, res: Response) => {
  const game = await gameService.create(req.body);
  res.status(201).json({ success: true, data: game });
});

export const updateGame = catchAsync(async (req: Request, res: Response) => {
  const game = await gameService.update(req.params.id, req.body);
  res.json({ success: true, data: game });
});

export const deleteGame = catchAsync(async (req: Request, res: Response) => {
  await gameService.delete(req.params.id);
  res.json({ success: true, message: 'Game deleted' });
});
```

- [ ] **Step 2: 创建 game.ts 路由**

```typescript
import { Router } from 'express';
import { getGames, getGame, createGame, updateGame, deleteGame } from '../controllers/game.controller';

const router = Router();

router.get('/', getGames);
router.get('/:id', getGame);
router.post('/', createGame);
router.put('/:id', updateGame);
router.delete('/:id', deleteGame);

export default router;
```

- [ ] **Step 3: 在 app.ts 注册路由**

Modify `backend/src/app.ts`，在现有路由注册后添加：
```typescript
const gameRoutes = require('./routes/game').default;
// ... 其他路由 ...
app.use('/api/games', gameRoutes);
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/game.controller.ts backend/src/routes/game.ts backend/src/app.ts
git commit -m "feat: add game API routes (GET, POST, PUT, DELETE)"
```

---

## Task 4: 前端 API 客户端 + Hooks

**Files:**
- Create: `frontend/src/lib/api/games.ts`
- Create: `frontend/src/hooks/queries/games.ts`

- [ ] **Step 1: 创建 games.ts API 客户端**

```typescript
import { api } from './client';

export interface Game {
  id: string;
  title: string;
  cover: string;
  bannerImage?: string;
  screenshots: string[];
  platform: string;
  platformId?: string;
  storeUrl?: string;
  genres: string[];
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  description?: string;
  status: string;
  playtime: number;
  score?: number;
  favorite: boolean;
  notes?: string;
  tags: string[];
  achievementsTotal: number;
  achievementsUnlocked: number;
  isHidden: boolean;
  hideReason?: string;
  relatedPostIds: string[];
  relatedProjectIds: string[];
  relatedDiaryIds: string[];
  startDate?: string;
  finishDate?: string;
  lastPlayed?: string;
  steamLastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export const gamesApi = {
  getAll: (params?: { status?: string; platform?: string; favorite?: boolean }) =>
    api.get('/games', { params }).then(r => r.data.data as Game[]),
  getById: (id: string) =>
    api.get(`/games/${id}`).then(r => r.data.data as Game),
  create: (data: Partial<Game>) =>
    api.post('/games', data).then(r => r.data.data as Game),
  update: (id: string, data: Partial<Game>) =>
    api.put(`/games/${id}`, data).then(r => r.data.data as Game),
  delete: (id: string) =>
    api.delete(`/games/${id}`).then(r => r.data),
};
```

- [ ] **Step 2: 创建 React Query hooks**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi, Game } from '../../lib/api/games';

export const gameKeys = {
  all: ['games'] as const,
  list: (filters: Record<string, any>) => [...gameKeys.all, 'list', filters] as const,
  detail: (id: string) => [...gameKeys.all, 'detail', id] as const,
};

export const useGames = (filters?: { status?: string; platform?: string; favorite?: boolean }) =>
  useQuery({ queryKey: gameKeys.list(filters || {}), queryFn: () => gamesApi.getAll(filters) });

export const useGame = (id: string) =>
  useQuery({ queryKey: gameKeys.detail(id), queryFn: () => gamesApi.getById(id), enabled: !!id });

export const useCreateGame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gamesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: gameKeys.all }),
  });
};

export const useUpdateGame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Game> }) => gamesApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: gameKeys.detail(id) });
      qc.invalidateQueries({ queryKey: gameKeys.all });
    },
  });
};

export const useDeleteGame = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gamesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: gameKeys.all }),
  });
};
```

- [ ] **Step 3: 导出 hooks**

Modify `frontend/src/hooks/queries/index.ts`，添加：
```typescript
export * from './games';
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api/games.ts frontend/src/hooks/queries/games.ts frontend/src/hooks/queries/index.ts
git commit -m "feat: add game API client and React Query hooks"
```

---

## Task 5: 前端组件 - GameCard + Filter

**Files:**
- Create: `frontend/src/components/GameCard.tsx`
- Create: `frontend/src/components/GameFilter.tsx`

- [ ] **Step 1: 创建 GameCard.tsx**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, Trophy } from 'lucide-react';
import { Game } from '../lib/api/games';

interface GameCardProps {
  game: Game;
}

const platformColors: Record<string, string> = {
  STEAM: 'bg-blue-500',
  EPIC: 'bg-purple-500',
  GOG: 'bg-pink-500',
  ITCH: 'bg-orange-500',
  NINTENDO_SWITCH: 'bg-red-500',
  PLAYSTATION: 'bg-blue-700',
  XBOX: 'bg-green-500',
  OTHER: 'bg-gray-500',
};

const statusLabels: Record<string, string> = {
  WANT_TO_PLAY: '想玩',
  PLAYING: '进行中',
  COMPLETED: '已完成',
  DROPPED: '已放弃',
  REPLAYING: '重玩中',
};

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const hours = Math.floor(game.playtime / 60);
  const mins = game.playtime % 60;
  const playtimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  const achievementRate = game.achievementsTotal > 0
    ? Math.round((game.achievementsUnlocked / game.achievementsTotal) * 100)
    : 0;

  return (
    <Link
      to={`/games/${game.id}`}
      className="group relative bg-[#1a1b26]/60 border border-white/5 rounded-lg overflow-hidden hover:border-neon/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={game.cover}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b26] via-transparent to-transparent" />

        {/* Platform Badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono text-white ${platformColors[game.platform] || 'bg-gray-500'}`}>
          {game.platform}
        </div>

        {/* Favorite */}
        {game.favorite && (
          <div className="absolute top-2 right-2 text-red-500">
            <Heart size={16} fill="currentColor" />
          </div>
        )}

        {/* Score */}
        {game.score && (
          <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-neon/20 border border-neon/50 flex items-center justify-center text-neon font-bold text-sm backdrop-blur-sm">
            {game.score}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-neon transition-colors">
          {game.title}
        </h3>

        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {playtimeStr}
          </span>
          {game.achievementsTotal > 0 && (
            <span className="flex items-center gap-1">
              <Trophy size={10} />
              {achievementRate}%
            </span>
          )}
        </div>

        {/* Status */}
        <div className="mt-2">
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
            game.status === 'PLAYING' ? 'bg-neon/20 text-neon' :
            game.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' :
            game.status === 'DROPPED' ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {statusLabels[game.status] || game.status}
          </span>
        </div>

        {/* Genres */}
        {game.genres.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {game.genres.slice(0, 3).map(g => (
              <span key={g} className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};
```

- [ ] **Step 2: 创建 GameFilter.tsx**

```tsx
import React from 'react';
import { Filter, Heart } from 'lucide-react';

interface GameFilterProps {
  status: string;
  platform: string;
  favoriteOnly: boolean;
  onStatusChange: (v: string) => void;
  onPlatformChange: (v: string) => void;
  onFavoriteToggle: () => void;
}

const statuses = [
  { value: '', label: '全部' },
  { value: 'WANT_TO_PLAY', label: '想玩' },
  { value: 'PLAYING', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'DROPPED', label: '已放弃' },
  { value: 'REPLAYING', label: '重玩中' },
];

const platforms = [
  { value: '', label: '全部平台' },
  { value: 'STEAM', label: 'Steam' },
  { value: 'EPIC', label: 'Epic' },
  { value: 'GOG', label: 'GOG' },
  { value: 'ITCH', label: 'Itch.io' },
  { value: 'NINTENDO_SWITCH', label: 'Switch' },
  { value: 'PLAYSTATION', label: 'PlayStation' },
  { value: 'XBOX', label: 'Xbox' },
  { value: 'OTHER', label: '其他' },
];

export const GameFilter: React.FC<GameFilterProps> = ({
  status, platform, favoriteOnly, onStatusChange, onPlatformChange, onFavoriteToggle,
}) => (
  <div className="flex flex-wrap items-center gap-3 mb-6">
    <div className="flex items-center gap-2 text-gray-400">
      <Filter size={14} />
      <span className="text-xs font-mono">筛选</span>
    </div>

    {/* Status */}
    <div className="flex gap-1">
      {statuses.map(s => (
        <button
          key={s.value}
          onClick={() => onStatusChange(s.value)}
          className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
            status === s.value
              ? 'bg-neon/20 text-neon border border-neon/30'
              : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>

    {/* Platform */}
    <select
      value={platform}
      onChange={(e) => onPlatformChange(e.target.value)}
      className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-gray-400 font-mono focus:outline-none focus:border-neon/50"
    >
      {platforms.map(p => (
        <option key={p.value} value={p.value}>{p.label}</option>
      ))}
    </select>

    {/* Favorite */}
    <button
      onClick={onFavoriteToggle}
      className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
        favoriteOnly
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
      }`}
    >
      <Heart size={12} fill={favoriteOnly ? 'currentColor' : 'none'} />
      收藏
    </button>
  </div>
);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/GameCard.tsx frontend/src/components/GameFilter.tsx
git commit -m "feat: add GameCard and GameFilter components"
```

---

## Task 6: 前端页面 - Games + GameDetail

**Files:**
- Create: `frontend/src/pages/Games.tsx`
- Create: `frontend/src/pages/GameDetail.tsx`

- [ ] **Step 1: 创建 Games.tsx 页面**

```tsx
import React, { useState } from 'react';
import { GameCard } from '../components/GameCard';
import { GameFilter } from '../components/GameFilter';
import { useGames } from '../hooks/queries/games';
import { LoadingSpinner } from '../components/LoadingSpinner';

const Games: React.FC = () => {
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  const { data: games, isLoading } = useGames({
    status: status || undefined,
    platform: platform || undefined,
    favorite: favoriteOnly || undefined,
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">游戏库</h1>
        <p className="text-sm text-gray-500 font-mono">GAME.LIBRARY // {games?.length || 0} TITLES</p>
      </div>

      <GameFilter
        status={status}
        platform={platform}
        favoriteOnly={favoriteOnly}
        onStatusChange={setStatus}
        onPlatformChange={setPlatform}
        onFavoriteToggle={() => setFavoriteOnly(!favoriteOnly)}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {games?.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {!isLoading && games?.length === 0 && (
        <div className="text-center py-20 text-gray-500 font-mono text-sm">
          暂无游戏数据
        </div>
      )}
    </div>
  );
};

export default Games;
```

- [ ] **Step 2: 创建 GameDetail.tsx 页面**

```tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGame } from '../hooks/queries/games';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArrowLeft, Heart, Clock, Trophy, Calendar, Tag } from 'lucide-react';

const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: game, isLoading } = useGame(id || '');

  if (isLoading) return <LoadingSpinner />;
  if (!game) return <div className="text-center py-20 text-gray-500">游戏不存在</div>;

  const hours = Math.floor(game.playtime / 60);
  const mins = game.playtime % 60;
  const achievementRate = game.achievementsTotal > 0
    ? Math.round((game.achievementsUnlocked / game.achievementsTotal) * 100)
    : 0;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Back */}
      <Link to="/games" className="inline-flex items-center gap-2 text-gray-400 hover:text-neon text-sm font-mono mb-6 transition-colors">
        <ArrowLeft size={16} />
        返回游戏库
      </Link>

      {/* Banner */}
      {game.bannerImage && (
        <div className="relative aspect-[21/9] rounded-lg overflow-hidden mb-6">
          <img src={game.bannerImage} alt={game.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b26] via-transparent to-transparent" />
        </div>
      )}

      <div className="flex gap-6">
        {/* Cover */}
        <div className="flex-shrink-0 w-48">
          <img src={game.cover} alt={game.title} className="w-full rounded-lg shadow-lg" />
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{game.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                {game.developer && <span>{game.developer}</span>}
                {game.publisher && game.publisher !== game.developer && <span>{game.publisher}</span>}
                {game.releaseDate && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(game.releaseDate).getFullYear()}
                  </span>
                )}
              </div>
            </div>
            {game.favorite && <Heart className="text-red-500" fill="currentColor" />}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <div className="text-xl font-bold text-neon">{hours}h{mins}m</div>
              <div className="text-[10px] text-gray-500 font-mono">游戏时长</div>
            </div>
            {game.score && (
              <div className="text-center">
                <div className="text-xl font-bold text-neon">{game.score}</div>
                <div className="text-[10px] text-gray-500 font-mono">评分</div>
              </div>
            )}
            {game.achievementsTotal > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-neon">{achievementRate}%</div>
                <div className="text-[10px] text-gray-500 font-mono">成就</div>
              </div>
            )}
          </div>

          {/* Genres */}
          {game.genres.length > 0 && (
            <div className="flex gap-2 mt-4">
              {game.genres.map(g => (
                <span key={g} className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{g}</span>
              ))}
            </div>
          )}

          {/* Description */}
          {game.description && (
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">{game.description}</p>
          )}

          {/* Notes */}
          {game.notes && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg border-l-2 border-neon">
              <p className="text-sm text-gray-300">{game.notes}</p>
            </div>
          )}

          {/* Screenshots */}
          {game.screenshots.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-white mb-3">截图</h3>
              <div className="grid grid-cols-3 gap-2">
                {game.screenshots.map((url, i) => (
                  <img key={i} src={url} alt={`Screenshot ${i + 1}`} className="rounded-lg hover:scale-105 transition-transform cursor-pointer" />
                ))}
              </div>
            </div>
          )}

          {/* Store Link */}
          {game.storeUrl && (
            <a
              href={game.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 px-4 py-2 bg-neon/20 text-neon border border-neon/30 rounded text-sm font-mono hover:bg-neon/30 transition-colors"
            >
              前往商店页面
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Games.tsx frontend/src/pages/GameDetail.tsx
git commit -m "feat: add Games list page and GameDetail page"
```

---

## Task 7: 路由注册 + 导航栏

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Navigation.tsx`

- [ ] **Step 1: 在 App.tsx 添加游戏路由**

在 `App.tsx` 的 lazy import 和 Routes 中添加：

```tsx
// Lazy import
const Games = lazy(() => import('./pages/Games'));
const GameDetail = lazy(() => import('./pages/GameDetail'));

// Routes (在 Layout 包裹的页面中)
<Route path="games" element={<Games />} />
<Route path="games/:id" element={<GameDetail />} />
```

- [ ] **Step 2: 在 Navigation.tsx 添加游戏入口（仅管理员可见）**

在 `menuItems` 中 "我的" 下拉菜单添加游戏项：

```tsx
{
    label: t.MINE,
    id: 'mine',
    hasDropdown: true,
    dropdownItems: [
        { label: t.POSTS, icon: BookOpen, path: '/posts' },
        { label: lang === 'EN' ? 'Anime' : '追番', icon: Heart, path: '/anime' },
        { label: lang === 'EN' ? 'Diary' : '日记', icon: Book, path: '/diary' },
        { label: lang === 'EN' ? 'Gallery' : '相册', icon: Camera, path: '/gallery' },
        { label: lang === 'EN' ? 'Games' : '游戏', icon: Gamepad2, path: '/games' },
    ]
}
```

注意：需要从 lucide-react 导入 `Gamepad2` 图标。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/Navigation.tsx
git commit -m "feat: add games route and navigation entry"
```

---

## Task 8: 管理后台 - AdminGames

**Files:**
- Create: `frontend/src/pages/Admin/AdminGames.tsx`

- [ ] **Step 1: 创建 AdminGames.tsx**

复用现有 Admin 页面的 CRUD 模式（参考 AdminAnime 或 AdminPosts）：

```tsx
import React, { useState } from 'react';
import { useGames, useCreateGame, useUpdateGame, useDeleteGame } from '../../hooks/queries/games';
import { Game } from '../../lib/api/games';
import { LoadingSpinner } from '../../components/LoadingSpinner';

// 表单字段、表格列、CRUD 操作
// 参考 AdminAnime.tsx 的实现模式
// ...
```

（具体实现参考现有 AdminAnime 组件的结构，包含：表格展示、新增/编辑弹窗、删除确认、筛选功能）

- [ ] **Step 2: 在 App.tsx 注册 Admin 路由**

```tsx
const AdminGames = lazy(() => import('./pages/Admin/AdminGames'));
// ...
<Route path="games" element={<AdminGames />} />
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Admin/AdminGames.tsx frontend/src/App.tsx
git commit -m "feat: add admin games management page"
```

---

## Task 9: Steam 同步（后端）

**Files:**
- Create: `backend/src/lib/steam-sync.ts`
- Modify: `backend/src/services/game.service.ts`
- Modify: `backend/.env.example`

- [ ] **Step 1: 创建 steam-sync.ts**

```typescript
import axios from 'axios';

const STEAM_API_BASE = 'https://api.steampowered.com';

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  img_logo_url: string;
  rtime_last_played: number;
}

export async function fetchSteamLibrary(steamId: string, apiKey: string): Promise<SteamGame[]> {
  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`;
  const { data } = await axios.get(url, {
    params: {
      key: apiKey,
      steamid: steamId,
      include_appinfo: true,
      include_played_free_games: true,
    },
  });

  return data.response.games || [];
}

export function steamGameToPrisma(steamGame: SteamGame) {
  return {
    title: steamGame.name,
    platform: 'STEAM' as const,
    platformId: String(steamGame.appid),
    storeUrl: `https://store.steampowered.com/app/${steamGame.appid}`,
    cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamGame.appid}/library_600x900.jpg`,
    bannerImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamGame.appid}/header.jpg`,
    playtime: steamGame.playtime_forever,
    lastPlayed: steamGame.rtime_last_played ? new Date(steamGame.rtime_last_played * 1000) : null,
    status: 'WANT_TO_PLAY' as const,
    isHidden: true, // 默认隐藏
  };
}
```

- [ ] **Step 2: 在 game.service.ts 添加同步方法**

```typescript
async syncSteamLibrary(steamId: string, apiKey: string) {
  const steamGames = await fetchSteamLibrary(steamId, apiKey);
  let created = 0, updated = 0;

  for (const sg of steamGames) {
    const data = steamGameToPrisma(sg);
    const existing = await prisma.game.findFirst({
      where: { platformId: data.platformId, platform: 'STEAM' },
    });

    if (existing) {
      await prisma.game.update({
        where: { id: existing.id },
        data: {
          playtime: data.playtime,
          lastPlayed: data.lastPlayed,
          steamLastSync: new Date(),
        },
      });
      updated++;
    } else {
      await prisma.game.create({ data: { ...data, steamLastSync: new Date() } });
      created++;
    }
  }

  return { created, updated, total: steamGames.length };
}
```

- [ ] **Step 3: 添加同步 API 路由**

在 `backend/src/routes/game.ts` 添加：
```typescript
import { syncSteam } from '../controllers/game.controller';
// ...
router.post('/sync-steam', syncSteam);
```

- [ ] **Step 4: 添加环境变量**

`backend/.env.example` 添加：
```bash
# Steam API
STEAM_API_KEY=your-steam-api-key
STEAM_USER_ID=your-steam-id
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/steam-sync.ts backend/src/services/game.service.ts backend/src/routes/game.ts backend/.env.example
git commit -m "feat: add Steam library sync with auto-import and incremental updates"
```

---

## Task 10: 定时同步任务

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: 在 index.ts 启动定时任务**

```typescript
import { gameService } from './services/game.service';
import { config } from './config/env';

// 每天凌晨 3 点同步 Steam 库
function scheduleSteamSync() {
  const steamApiKey = process.env.STEAM_API_KEY;
  const steamUserId = process.env.STEAM_USER_ID;
  if (!steamApiKey || !steamUserId) return;

  const runSync = async () => {
    try {
      console.log('🎮 Starting Steam sync...');
      const result = await gameService.syncSteamLibrary(steamUserId, steamApiKey);
      console.log(`✅ Steam sync complete: ${result.created} created, ${result.updated} updated`);
    } catch (err) {
      console.error('❌ Steam sync failed:', err);
    }
  };

  // 立即运行一次，然后每天运行
  runSync();
  setInterval(runSync, 24 * 60 * 60 * 1000);
}

// 在 main() 中服务器启动后调用
scheduleSteamSync();
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat: add daily Steam sync cron job (3 AM)"
```

---

## Task 11: 截图上传支持

**Files:**
- Modify: `backend/src/routes/upload.ts` 或复用现有上传接口
- Modify: `frontend/src/pages/Admin/AdminGames.tsx`

复用现有的 `upload` 路由和 `ImageUpload` 组件，在 AdminGames 表单中支持多图上传。

- [ ] **Step 1: 在 AdminGames 表单中添加截图上传**

使用现有的 `react-dropzone` 和上传 API，上传后返回 URL 数组存入 `screenshots` 字段。

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Admin/AdminGames.tsx
git commit -m "feat: add screenshot upload support in admin games"
```

---

## 验证清单

- [ ] 数据库 `games` 表创建成功
- [ ] API `/api/games` CRUD 正常工作
- [ ] 前端 `/games` 页面能显示游戏列表
- [ ] `/games/:id` 详情页正常展示
- [ ] 导航栏 "我的" 下拉显示 "游戏" 入口
- [ ] 管理后台 `/admin/games` 能增删改查
- [ ] Steam 同步 API 能导入游戏（需配置 API Key）
- [ ] 截图上传功能正常
- [ ] 所有游戏默认 `isHidden: true`，公开页面不可见

---

## 关联功能扩展（预留）

| 关联类型 | 实现方式 | 优先级 |
|---------|---------|--------|
| 文章关联 | Post 模型添加 `relatedGameIds` 字段 | 低 |
| 项目关联 | Project 模型添加 `relatedGameIds` 字段 | 低 |
| 日记关联 | Diary 模型添加 `relatedGameIds` 字段 | 低 |
| 技能关联 | 游戏 genres 映射到 Skill 标签 | 低 |
| 时间线 | 自动创建 TimelineEvent（开始/通关） | 低 |

这些扩展通过给现有模型添加 `String[]` 数组字段实现，不影响当前核心功能。
