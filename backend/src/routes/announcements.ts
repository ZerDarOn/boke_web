import { Router } from 'express';
import { AnnouncementService } from '../services/announcement.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';

const router = Router();

// GET /api/announcements - 公告列表
router.get('/', async (req, res) => {
  try {
    const pagination = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const { announcements, total } = await AnnouncementService.findMany({
      pagination,
      type: req.query.type as string,
    });

    response.success(res, announcements, undefined, createMeta(total, pagination));
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch announcements');
  }
});

// GET /api/announcements/latest - 最新公告
router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 3;
    const announcements = await AnnouncementService.getLatest(limit);
    response.success(res, announcements);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch latest announcements');
  }
});

// GET /api/announcements/:id - 公告详情
router.get('/:id', async (req, res) => {
  try {
    const announcement = await AnnouncementService.findById(req.params.id);
    if (!announcement) {
      return response.notFound(res, 'Announcement not found');
    }
    response.success(res, announcement);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch announcement');
  }
});

// POST /api/announcements - 创建公告
router.post('/', async (req, res) => {
  try {
    const announcement = await AnnouncementService.create(req.body);
    response.created(res, announcement);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// PUT /api/announcements/:id - 更新公告
router.put('/:id', async (req, res) => {
  try {
    const announcement = await AnnouncementService.update(req.params.id, req.body);
    response.success(res, announcement);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// DELETE /api/announcements/:id - 删除公告
router.delete('/:id', async (req, res) => {
  try {
    await AnnouncementService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete announcement');
  }
});

export default router;
