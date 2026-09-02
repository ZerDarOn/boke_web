import { Router } from 'express';
import { SkillService } from '../services/skill.service';
import * as response from '../utils/response';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { registerCrudRoutes } from '../lib/crud-router';
import { skillSchema } from '../schemas';

const router = Router();

// GET /api/skills/nodes - 技能节点（特有路由，须在 /:id 之前）
router.get('/nodes', cacheMiddleware({ ttl: 600, keyPrefix: 'skills' }), async (req, res) => {
  try {
    const nodes = await SkillService.findNodes();
    response.success(res, nodes);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch skill nodes');
  }
});

// GET /api/skills/stats - 技能统计（特有路由，须在 /:id 之前）
router.get('/stats', cacheMiddleware({ ttl: 120, keyPrefix: 'skills' }), async (req, res) => {
  try {
    const stats = await SkillService.getStats();
    response.success(res, stats);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch skill stats');
  }
});

registerCrudRoutes(router, {
  service: SkillService,
  schema: skillSchema,
  keyPrefix: 'skills',
  ttl: 600,
  list: async () => ({ data: await SkillService.findAll() }),
  messages: {
    notFound: 'Skill not found',
    fetchFailed: 'Failed to fetch skills',
    deleteFailed: 'Failed to delete skill',
  },
});

export default router;
