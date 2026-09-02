import { Router } from 'express';
import { ProjectService } from '../services/project.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { registerCrudRoutes } from '../lib/crud-router';
import { projectSchema } from '../schemas';

const router = Router();

// GET /api/projects/stats - 项目统计（特有路由，须在 /:id 之前）
router.get('/stats', cacheMiddleware({ ttl: 120, keyPrefix: 'projects' }), async (req, res) => {
  try {
    const stats = await ProjectService.getStats();
    response.success(res, stats);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch project stats');
  }
});

registerCrudRoutes(router, {
  service: ProjectService,
  schema: projectSchema,
  keyPrefix: 'projects',
  ttl: 300,
  detailKeyPrefix: 'project',
  detailTtl: 600,
  list: async (req) => {
    const pagination = getPagination(
      req.query.page as string,
      req.query.limit as string
    );
    const featured = req.query.featured !== undefined ? req.query.featured === 'true' : undefined;
    const { projects, total } = await ProjectService.findMany({
      pagination,
      featured,
      status: req.query.status as string,
    });
    return { data: projects, meta: createMeta(total, pagination) };
  },
  messages: {
    notFound: 'Project not found',
    fetchFailed: 'Failed to fetch projects',
    deleteFailed: 'Failed to delete project',
  },
});

export default router;
