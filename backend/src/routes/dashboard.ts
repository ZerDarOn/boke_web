import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createRateLimit } from '../middleware/rate-limit.middleware';
import { z } from 'zod';

const router = Router();

router.get('/stats', cacheMiddleware({ ttl: 60, keyPrefix: 'dashboard' }), DashboardController.getStats);

router.get('/popular', cacheMiddleware({ ttl: 120, keyPrefix: 'dashboard' }), DashboardController.getPopular);

router.get('/content-distribution', cacheMiddleware({ ttl: 120, keyPrefix: 'dashboard' }), DashboardController.getContentDistribution);

const visitSchema = z.object({ visitorId: z.string().uuid() });
const eventSchema = z.object({
  visitorId: z.string().uuid(),
  eventType: z.enum(['page_view', 'content_click', 'site_search']),
  path: z.string().startsWith('/').max(240),
  targetPath: z.string().startsWith('/').max(240).optional(),
});
const trackingRateLimit = createRateLimit({ windowMs: 60_000, max: 120, message: '访问统计提交过于频繁，请稍后再试' });
router.post('/track', trackingRateLimit, validateBody(visitSchema), DashboardController.trackVisit);
router.post('/events', trackingRateLimit, validateBody(eventSchema), DashboardController.trackEvent);
router.get('/admin-overview', authenticate, requireAdmin, DashboardController.getAdminOverview);
router.get('/content-operations', authenticate, requireAdmin, DashboardController.getContentOperations);

export default router;
