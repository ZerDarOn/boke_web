import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// GET /api/settings - 获取所有站点配置（公开；optionalAuth 用于管理员读取敏感键）
router.get('/', optionalAuth, SettingsController.getAll);

// GET /api/settings/:key - 获取单个配置（公开；敏感键仅管理员可见）
router.get('/:key', optionalAuth, SettingsController.getByKey);

// PUT /api/settings - 更新站点配置（需要认证）
router.put('/', authenticate, requireAdmin, SettingsController.update);

// PUT /api/settings/bulk - 批量更新配置（需要认证）
router.put('/bulk', authenticate, requireAdmin, SettingsController.bulkUpdate);

export default router;
