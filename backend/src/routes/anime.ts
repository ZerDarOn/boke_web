import { Router } from 'express';
import { AnimeService } from '../services/anime.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  animeSchema,
  animeProgressSchema,
  animeScoreSchema,
} from '../schemas';

const router = Router();

// GET /api/anime - 动漫列表
router.get('/', async (req, res) => {
  try {
    const pagination = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const { anime, total } = await AnimeService.findMany({
      pagination,
      status: req.query.status as string,
      // 仅在显式传入 favorite 参数时才按收藏过滤；缺省时不过滤（否则会误当成 favorite:false）
      favorite: req.query.favorite !== undefined ? req.query.favorite === 'true' : undefined,
    });

    response.success(res, anime, undefined, createMeta(total, pagination));
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch anime');
  }
});

// GET /api/anime/:id - 动漫详情
router.get('/:id', async (req, res) => {
  try {
    const anime = await AnimeService.findById(req.params.id);
    if (!anime) {
      return response.notFound(res, 'Anime not found');
    }
    response.success(res, anime);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch anime');
  }
});

// POST /api/anime - 创建动漫
router.post('/', authenticate, requireAdmin, validateBody(animeSchema), async (req, res) => {
  try {
    const anime = await AnimeService.create(req.body);
    response.created(res, anime);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// PUT /api/anime/:id - 更新动漫
router.put('/:id', authenticate, requireAdmin, validateBody(animeSchema.partial()), async (req, res) => {
  try {
    const anime = await AnimeService.update(req.params.id, req.body);
    response.success(res, anime);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// PUT /api/anime/:id/progress - 更新观看进度
router.put('/:id/progress', authenticate, requireAdmin, validateBody(animeProgressSchema), async (req, res) => {
  try {
    const { episodes } = req.body;
    const anime = await AnimeService.updateProgress(req.params.id, episodes);
    if (!anime) {
      return response.notFound(res, 'Anime not found');
    }
    response.success(res, anime);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// POST /api/anime/:id/score - 评分
router.post('/:id/score', authenticate, requireAdmin, validateBody(animeScoreSchema), async (req, res) => {
  try {
    const { score } = req.body;
    const anime = await AnimeService.updateScore(req.params.id, score);
    if (!anime) {
      return response.notFound(res, 'Anime not found');
    }
    response.success(res, anime);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// POST /api/anime/:id/favorite - 切换收藏
router.post('/:id/favorite', authenticate, requireAdmin, async (req, res) => {
  try {
    const anime = await AnimeService.toggleFavorite(req.params.id);
    if (!anime) {
      return response.notFound(res, 'Anime not found');
    }
    response.success(res, anime);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// DELETE /api/anime/:id - 删除动漫
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await AnimeService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete anime');
  }
});

export default router;
