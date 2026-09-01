import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

// GET /api/search?q=keyword - 全局搜索（按 query 串生成缓存键，TTL 短促自愈）
router.get('/', cacheMiddleware({ ttl: 120, keyPrefix: 'search' }), SearchController.search);

export default router;
