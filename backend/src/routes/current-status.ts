import { Router } from 'express';
import { CurrentStatusService } from '../services/current-status.service';
import * as response from '../utils/response';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.middleware';
import { currentStatusSchema } from '../schemas';

const router = Router();

// GET /api/current-status - 获取所有状态
router.get('/', cacheMiddleware({ ttl: 300, keyPrefix: 'current-status' }), async (req, res) => {
  try {
    const statuses = await CurrentStatusService.findAll();
    response.success(res, statuses);
  } catch (error: any) {
    console.error('CurrentStatus getAll error:', error);
    response.error(res, error.message || 'Failed to fetch current statuses');
  }
});

// GET /api/current-status/active - 获取当前激活的状态
router.get('/active', cacheMiddleware({ ttl: 300, keyPrefix: 'current-status' }), async (req, res) => {
  try {
    const status = await CurrentStatusService.findActive();
    if (!status) {
      // 返回默认数据，保证前端正常显示
      return response.success(res, {
        id: 'default',
        title: 'BUILDING THE FUTURE',
        currentFocus: 'Learning Next.js & Rust',
        location: 'Neo-City, Sector 7',
        vibe: '💻 Coding / ☕ Coffee',
        emoji: '💻',
        isActive: true,
      });
    }
    response.success(res, status);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch active status');
  }
});

// GET /api/current-status/:id - 获取单个状态
router.get('/:id', cacheMiddleware({ ttl: 300, keyPrefix: 'current-status' }), async (req, res) => {
  try {
    const status = await CurrentStatusService.findById(req.params.id);
    if (!status) {
      return response.notFound(res, 'Status not found');
    }
    response.success(res, status);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch status');
  }
});

// POST /api/current-status - 创建状态
router.post('/', authenticate, requireAdmin, invalidateCache('current-status:*'), validateBody(currentStatusSchema), async (req, res) => {
  try {
    const status = await CurrentStatusService.create(req.body);
    response.created(res, status);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// PUT /api/current-status/:id - 更新状态
router.put('/:id', authenticate, requireAdmin, invalidateCache('current-status:*'), validateBody(currentStatusSchema.partial()), async (req, res) => {
  try {
    const status = await CurrentStatusService.update(req.params.id, req.body);
    response.success(res, status);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// DELETE /api/current-status/:id - 删除状态
router.delete('/:id', authenticate, requireAdmin, invalidateCache('current-status:*'), async (req, res) => {
  try {
    await CurrentStatusService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete status');
  }
});

// POST /api/current-status/:id/activate - 激活指定状态
router.post('/:id/activate', authenticate, requireAdmin, invalidateCache('current-status:*'), async (req, res) => {
  try {
    const status = await CurrentStatusService.setActive(req.params.id);
    response.success(res, status);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to activate status');
  }
});

export default router;
