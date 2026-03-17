import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

router.get('/stats', cacheMiddleware({ ttl: 60, keyPrefix: 'dashboard' }), DashboardController.getStats);

router.get('/popular', cacheMiddleware({ ttl: 120, keyPrefix: 'dashboard' }), DashboardController.getPopular);

router.get('/content-distribution', cacheMiddleware({ ttl: 120, keyPrefix: 'dashboard' }), DashboardController.getContentDistribution);

export default router;
