import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

// GET /api/dashboard/stats - 仪表盘统计
router.get('/stats', DashboardController.getStats);

// GET /api/dashboard/popular - 热门内容
router.get('/popular', DashboardController.getPopular);

// GET /api/dashboard/content-distribution - 内容分布
router.get('/content-distribution', DashboardController.getContentDistribution);

export default router;
