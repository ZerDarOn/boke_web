import { Router } from 'express';
import { GalleryService } from '../services/gallery.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware';
import { formRateLimit } from '../middleware/rate-limit.middleware';
import { galleryImageSchema, albumSchema, photoCommentSchema } from '../schemas';
import { log, logError } from '../lib/logger';

const router = Router();

// GET /api/gallery - 照片列表
router.get('/', async (req, res) => {
  try {
    const pagination = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const { images, total } = await GalleryService.findMany({
      pagination,
      albumId: req.query.albumId as string,
    });

    response.success(res, images, undefined, createMeta(total, pagination));
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch gallery');
  }
});

// GET /api/gallery/albums - 相册列表
router.get('/albums', async (req, res) => {
  try {
    const albums = await GalleryService.findAlbums();
    response.success(res, albums);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch albums');
  }
});

// GET /api/gallery/albums/:id - 相册详情
router.get('/albums/:id', async (req, res) => {
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

// GET /api/gallery/:id - 照片详情
router.get('/:id', async (req, res) => {
  try {
    const image = await GalleryService.findById(req.params.id);
    if (!image) {
      return response.notFound(res, 'Image not found');
    }
    response.success(res, image);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch image');
  }
});

// POST /api/gallery - 上传照片
router.post('/', authenticate, requireAdmin, validateBody(galleryImageSchema), async (req, res) => {
  try {
    const image = await GalleryService.create(req.body);
    response.created(res, image);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// POST /api/gallery/albums - 创建相册
router.post('/albums', authenticate, requireAdmin, validateBody(albumSchema), async (req, res) => {
  try {
    const album = await GalleryService.createAlbum(req.body);
    response.created(res, album);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// POST /api/gallery/:id/comments - 添加评论（需提供邮箱，限流防滥用）
router.post('/:id/comments', formRateLimit, optionalAuth, validateBody(photoCommentSchema), async (req, res) => {
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

router.put('/albums/:id', authenticate, requireAdmin, validateBody(albumSchema.partial()), async (req, res) => {
  try {
    const album = await GalleryService.updateAlbum(req.params.id, req.body);
    response.success(res, album);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

router.delete('/albums/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await GalleryService.deleteAlbum(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete album');
  }
});

// PUT /api/gallery/:id - 更新照片
router.put('/:id', authenticate, requireAdmin, validateBody(galleryImageSchema.partial()), async (req, res) => {
  try {
    const image = await GalleryService.update(req.params.id, req.body);
    response.success(res, image);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// DELETE /api/gallery/:id - 删除照片
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await GalleryService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete image');
  }
});

export default router;
