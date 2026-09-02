import { Router } from 'express';
import { AnnouncementService } from '../services/announcement.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { registerCrudRoutes } from '../lib/crud-router';
import { announcementSchema } from '../schemas';

const router = Router();

// GET /api/announcements/latest - 最新公告（特有路由，须在 /:id 之前）
router.get('/latest', cacheMiddleware({ ttl: 300, keyPrefix: 'announcements' }), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 3;
    const announcements = await AnnouncementService.getLatest(limit);
    response.success(res, announcements);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch latest announcements');
  }
});

registerCrudRoutes(router, {
  service: AnnouncementService,
  schema: announcementSchema,
  keyPrefix: 'announcements',
  ttl: 300,
  list: async (req) => {
    const pagination = getPagination(
      req.query.page as string,
      req.query.limit as string
    );
    const { announcements, total } = await AnnouncementService.findMany({
      pagination,
      type: req.query.type as string,
    });
    return { data: announcements, meta: createMeta(total, pagination) };
  },
  messages: {
    notFound: 'Announcement not found',
    fetchFailed: 'Failed to fetch announcements',
    deleteFailed: 'Failed to delete announcement',
  },
});

export default router;
