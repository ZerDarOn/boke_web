import { Router } from 'express';
import { TimelineService } from '../services/timeline.service';
import * as response from '../utils/response';

const router = Router();

// GET /api/timeline - 时间线事件
router.get('/', async (req, res) => {
  try {
    const events = await TimelineService.findAll({
      type: req.query.type as string,
      year: req.query.year as string,
    });
    response.success(res, events);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch timeline events');
  }
});

// GET /api/timeline/years - 年份列表
router.get('/years', async (req, res) => {
  try {
    const years = await TimelineService.getYears();
    response.success(res, years);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch years');
  }
});

// GET /api/timeline/current - 当前状态
router.get('/current', async (req, res) => {
  try {
    const status = await TimelineService.getCurrentStatus();
    response.success(res, status);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch current status');
  }
});

// GET /api/timeline/:id - 事件详情
router.get('/:id', async (req, res) => {
  try {
    const event = await TimelineService.findById(req.params.id);
    if (!event) {
      return response.notFound(res, 'Event not found');
    }
    response.success(res, event);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch event');
  }
});

// POST /api/timeline - 创建事件
router.post('/', async (req, res) => {
  try {
    const event = await TimelineService.create(req.body);
    response.created(res, event);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// PUT /api/timeline/:id - 更新事件
router.put('/:id', async (req, res) => {
  try {
    const event = await TimelineService.update(req.params.id, req.body);
    response.success(res, event);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// DELETE /api/timeline/:id - 删除事件
router.delete('/:id', async (req, res) => {
  try {
    await TimelineService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete event');
  }
});

export default router;
