import { Router } from 'express';
import { HistoryItemService } from '../services/history-item.service';
import * as response from '../utils/response';
import { validateBody } from '../middleware/validate.middleware';
import { historyItemSchema } from '../schemas';

const router = Router();

// GET /api/history - 获取所有历史项目
router.get('/', async (req, res) => {
  try {
    const isActive = req.query.active === 'true' ? true : 
                     req.query.active === 'false' ? false : undefined;
    const items = await HistoryItemService.findAll({ isActive });
    response.success(res, items);
  } catch (error: any) {
    console.error('HistoryItem getAll error:', error);
    response.error(res, error.message || 'Failed to fetch history items');
  }
});

// GET /api/history/:id - 获取单个历史项目
router.get('/:id', async (req, res) => {
  try {
    const item = await HistoryItemService.findById(req.params.id);
    if (!item) {
      return response.notFound(res, 'History item not found');
    }
    response.success(res, item);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch history item');
  }
});

// POST /api/history - 创建历史项目
router.post('/', validateBody(historyItemSchema), async (req, res) => {
  try {
    // 如果没有指定 order，自动设置为最大值+1
    if (req.body.order === undefined) {
      const maxOrder = await HistoryItemService.getMaxOrder();
      req.body.order = maxOrder + 1;
    }
    const item = await HistoryItemService.create(req.body);
    response.created(res, item);
  } catch (error: any) {
    response.badRequest(res, error.message || 'Failed to create history item');
  }
});

// PUT /api/history/:id - 更新历史项目
router.put('/:id', validateBody(historyItemSchema.partial()), async (req, res) => {
  try {
    const item = await HistoryItemService.update(req.params.id, req.body);
    response.success(res, item);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// DELETE /api/history/:id - 删除历史项目
router.delete('/:id', async (req, res) => {
  try {
    await HistoryItemService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete history item');
  }
});

// PUT /api/history/:id/reorder - 重新排序
router.put('/:id/reorder', async (req, res) => {
  try {
    const { order } = req.body;
    if (typeof order !== 'number') {
      return response.badRequest(res, 'Order must be a number');
    }
    const item = await HistoryItemService.reorder(req.params.id, order);
    response.success(res, item);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to reorder history item');
  }
});

export default router;
