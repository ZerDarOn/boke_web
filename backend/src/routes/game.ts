import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { gameSchema, gameScoreSchema, gameProgressSchema, gameAchievementsSchema } from '../schemas';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.middleware';

const router = Router();

// GET /api/games - 游戏列表
router.get('/', cacheMiddleware({ ttl: 300, keyPrefix: 'games' }), GameController.getAll);

// POST /api/games/sync-steam - 同步 Steam 游戏库（必须在 /:id 之前）
router.post('/sync-steam', authenticate, requireAdmin, invalidateCache('games:*'), GameController.syncSteam);

// GET /api/games/:id - 游戏详情
router.get('/:id', cacheMiddleware({ ttl: 600, keyPrefix: 'game' }), GameController.getById);

// POST /api/games - 创建游戏
router.post('/', authenticate, requireAdmin, validateBody(gameSchema), invalidateCache('games:*'), GameController.create);

// PUT /api/games/:id - 更新游戏
router.put('/:id', authenticate, requireAdmin, validateBody(gameSchema.partial()), invalidateCache('games:*'), invalidateCache('game:*'), GameController.update);

// DELETE /api/games/:id - 删除游戏
router.delete('/:id', authenticate, requireAdmin, invalidateCache('games:*'), invalidateCache('game:*'), GameController.delete);

// POST /api/games/:id/favorite - 切换收藏
router.post('/:id/favorite', authenticate, requireAdmin, invalidateCache('games:*'), invalidateCache('game:*'), GameController.toggleFavorite);

// POST /api/games/:id/score - 评分
router.post('/:id/score', authenticate, requireAdmin, validateBody(gameScoreSchema), invalidateCache('game:*'), GameController.updateScore);

// PUT /api/games/:id/progress - 更新游戏时长
router.put('/:id/progress', authenticate, requireAdmin, validateBody(gameProgressSchema), invalidateCache('game:*'), GameController.updateProgress);

// PUT /api/games/:id/achievements - 更新成就进度
router.put('/:id/achievements', authenticate, requireAdmin, validateBody(gameAchievementsSchema), invalidateCache('game:*'), GameController.updateAchievements);

export default router;
