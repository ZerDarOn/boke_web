import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { cacheMiddleware } from '../middleware/cache.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate, validateBody } from '../middleware/validate.middleware';
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
const contentOperationsTargetSchema = z.object({
  params: z.object({
    type: z.enum(['post', 'game', 'anime', 'gallery']),
    id: z.string().min(1).max(191),
  }),
});
const contentOperationsApplySchema = z.object({
  excerpt: z.string().trim().min(1).max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).min(1).max(5).optional(),
}).refine((value) => value.excerpt || value.tags?.length, { message: 'At least one suggestion must be selected' });
const trackingRateLimit = createRateLimit({ windowMs: 60_000, max: 120, message: '访问统计提交过于频繁，请稍后再试' });
router.post('/track', trackingRateLimit, validateBody(visitSchema), DashboardController.trackVisit);
router.post('/events', trackingRateLimit, validateBody(eventSchema), DashboardController.trackEvent);
// admin-overview 触发 post/game/anime/gallery 四表扫描，挂 60s 短缓存削峰
router.get('/admin-overview', authenticate, requireAdmin, cacheMiddleware({ ttl: 60, keyPrefix: 'dashboard' }), DashboardController.getAdminOverview);
router.get('/content-operations', authenticate, requireAdmin, DashboardController.getContentOperations);
router.post('/content-operations/:type/:id/suggestions', authenticate, requireAdmin, validate(contentOperationsTargetSchema), DashboardController.getContentSuggestions);
router.post('/content-operations/:type/:id/apply', authenticate, requireAdmin, validate(contentOperationsTargetSchema), validateBody(contentOperationsApplySchema), DashboardController.applyContentSuggestions);

export default router;
