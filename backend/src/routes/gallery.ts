import { Router } from 'express';
import { GalleryService } from '../services/gallery.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware';
import { formRateLimit } from '../middleware/rate-limit.middleware';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.middleware';
import { registerCrudRoutes } from '../lib/crud-router';
import { albumSchema, photoCommentSchema, galleryImageSchema } from '../schemas';
import { log, logError } from '../lib/logger';

const router = Router();

// ===== 相册子资源与评论（域特有，须在照片五件套的 GET /:id 之前注册）=====

// GET /api/gallery/albums - 相册列表
router.get('/albums', cacheMiddleware({ ttl: 300, keyPrefix: 'gallery' }), async (req, res) => {
  try {
    const albums = await GalleryService.findAlbums();
    response.success(res, albums);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch albums');
  }
});

// GET /api/gallery/albums/:id - 相册详情
router.get('/albums/:id', cacheMiddleware({ ttl: 300, keyPrefix: 'gallery' }), async (req, res) => {
  try {
    const album = await GalleryService.findAlbumById(req.params.id);
    if (!album) {
      return response.notFound(res, 'Album not found');
    }
    response.success(res, album);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch album');
  }
});

// POST /api/gallery/albums - 创建相册
router.post('/albums', authenticate, requireAdmin, invalidateCache('gallery:*'), validateBody(albumSchema), async (req, res) => {
  try {
    const album = await GalleryService.createAlbum(req.body);
    response.created(res, album);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

router.put('/albums/:id', authenticate, requireAdmin, invalidateCache('gallery:*'), validateBody(albumSchema.partial()), async (req, res) => {
  try {
    const album = await GalleryService.updateAlbum(req.params.id, req.body);
    response.success(res, album);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

router.delete('/albums/:id', authenticate, requireAdmin, invalidateCache('gallery:*'), async (req, res) => {
  try {
    await GalleryService.deleteAlbum(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete album');
  }
});

// POST /api/gallery/:id/comments - 添加评论（需提供邮箱，限流防滥用）
router.post('/:id/comments', formRateLimit, optionalAuth, invalidateCache('gallery:*'), validateBody(photoCommentSchema), async (req, res) => {
  try {
    const comment = await GalleryService.addComment(req.params.id, req.body);
    log('info', 'GalleryComment', 'Photo comment created', {
      commentId: comment.id,
      photoId: req.params.id,
    });
    response.created(res, comment);
  } catch (error: any) {
    logError('GalleryComment', error instanceof Error ? error : 'Failed to create photo comment', {
      photoId: req.params.id,
    });
    response.badRequest(res, error.message);
  }
});

// ===== 照片五件套 =====
registerCrudRoutes(router, {
  service: GalleryService,
  schema: galleryImageSchema,
  keyPrefix: 'gallery',
  ttl: 300,
  list: async (req) => {
    const pagination = getPagination(
      req.query.page as string,
      req.query.limit as string
    );
    const { images, total } = await GalleryService.findMany({
      pagination,
      albumId: req.query.albumId as string,
    });
    return { data: images, meta: createMeta(total, pagination) };
  },
  messages: {
    notFound: 'Image not found',
    fetchFailed: 'Failed to fetch gallery',
    deleteFailed: 'Failed to delete image',
  },
});

export default router;
