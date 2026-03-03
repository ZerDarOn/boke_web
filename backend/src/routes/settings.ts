import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/settings - 获取所有站点配置（公开）
router.get('/', SettingsController.getAll);

// GET /api/settings/:key - 获取单个配置（公开）
router.get('/:key', SettingsController.getByKey);

// PUT /api/settings - 更新站点配置（需要认证）
router.put('/', authenticate, SettingsController.update);

// PUT /api/settings/bulk - 批量更新配置（需要认证）
router.put('/bulk', authenticate, SettingsController.bulkUpdate);

export default router;
