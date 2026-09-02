import { Router } from 'express';
import { NetworkService } from '../services/network.service';
import * as response from '../utils/response';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { registerCrudRoutes } from '../lib/crud-router';
import { networkNodeSchema } from '../schemas';

const router = Router();

// GET /api/network/connections - 节点连接关系（特有路由）
router.get('/connections', cacheMiddleware({ ttl: 300, keyPrefix: 'network' }), async (req, res) => {
  try {
    const connections = await NetworkService.getConnections();
    response.success(res, connections);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch connections');
  }
});

// ===== 节点 CRUD（挂在 /nodes 前缀下）=====
registerCrudRoutes(router, {
  service: NetworkService,
  schema: networkNodeSchema,
  basePath: '/nodes',
  keyPrefix: 'network',
  ttl: 300,
  list: async () => ({ data: await NetworkService.findNodes() }),
  messages: {
    notFound: 'Node not found',
    fetchFailed: 'Failed to fetch network nodes',
    deleteFailed: 'Failed to delete node',
  },
});

export default router;
