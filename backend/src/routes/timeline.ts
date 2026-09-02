import { Router } from 'express';
import { TimelineService } from '../services/timeline.service';
import * as response from '../utils/response';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { registerCrudRoutes } from '../lib/crud-router';
import { timelineEventSchema } from '../schemas';

const router = Router();

// GET /api/timeline/years - 年份列表（特有路由，须在 /:id 之前）
router.get('/years', cacheMiddleware({ ttl: 600, keyPrefix: 'timeline' }), async (req, res) => {
  try {
    const years = await TimelineService.getYears();
    response.success(res, years);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch years');
  }
});

// GET /api/timeline/current - 当前状态（特有路由，须在 /:id 之前）
router.get('/current', cacheMiddleware({ ttl: 600, keyPrefix: 'timeline' }), async (req, res) => {
  try {
    const status = await TimelineService.getCurrentStatus();
    response.success(res, status);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch current status');
  }
});

registerCrudRoutes(router, {
  service: TimelineService,
  schema: timelineEventSchema,
  keyPrefix: 'timeline',
  ttl: 600,
  list: async (req) => {
    const events = await TimelineService.findAll({
      type: req.query.type as string,
      year: req.query.year as string,
    });
    return { data: events };
  },
  messages: {
    notFound: 'Event not found',
    fetchFailed: 'Failed to fetch timeline events',
    deleteFailed: 'Failed to delete event',
  },
});

export default router;
