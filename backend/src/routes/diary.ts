import { Router } from 'express';
import { DiaryService } from '../services/diary.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';

const router = Router();

// GET /api/diary - 日记列表
router.get('/', async (req, res) => {
  try {
    const pagination = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const { diaries, total } = await DiaryService.findMany({
      pagination,
      type: req.query.type as 'SHORT' | 'LONG',
    });

    response.success(res, diaries, undefined, createMeta(total, pagination));
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch diaries');
  }
});

// GET /api/diary/:id - 日记详情
router.get('/:id', async (req, res) => {
  try {
    const diary = await DiaryService.findById(req.params.id);
    if (!diary) {
      return response.notFound(res, 'Diary not found');
    }
    response.success(res, diary);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch diary');
  }
});

// POST /api/diary - 创建日记
router.post('/', async (req, res) => {
  try {
    const diary = await DiaryService.create(req.body);
    response.created(res, diary);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// PUT /api/diary/:id - 更新日记
router.put('/:id', async (req, res) => {
  try {
    const diary = await DiaryService.update(req.params.id, req.body);
    response.success(res, diary);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// DELETE /api/diary/:id - 删除日记
router.delete('/:id', async (req, res) => {
  try {
    await DiaryService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete diary');
  }
});

export default router;
