import { Router, Request, Response } from 'express';
import { DivinationService } from '../services/divination.service';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { formRateLimit } from '../middleware/rate-limit.middleware';
import * as response from '../utils/response';
import { getPagination, createMeta } from '../utils/pagination';
import { z } from 'zod';

const router = Router();

// 创建占卜记录
const createDivinationSchema = z.object({
  type: z.enum(['TAROT', 'ICHING', 'ASTROLOGY']),
  question: z.string().max(500).optional(),
  result: z.record(z.any()),
  isPublic: z.boolean().optional(),
});

// 更新 AI 解读
const updateReadingSchema = z.object({
  aiReading: z.string().min(1).max(10000),
});

// GET /api/divination - 获取当前用户的占卜历史
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const pagination = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const { records, total } = await DivinationService.findMany(userId, {
      type: req.query.type as string,
      page: pagination.page,
      limit: pagination.limit,
    });

    response.success(res, records, undefined, createMeta(total, pagination));
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch divination records');
  }
});

// GET /api/divination/:id - 获取单条占卜详情
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const record = await DivinationService.findById(req.params.id, userId);

    if (!record) {
      return response.notFound(res, 'Divination record not found');
    }

    response.success(res, record);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch divination record');
  }
});

// POST /api/divination - 创建占卜记录
router.post('/', formRateLimit, authenticate, validateBody(createDivinationSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const record = await DivinationService.create(userId, req.body);
    response.created(res, record);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// PUT /api/divination/:id/reading - 更新 AI 解读
router.put('/:id/reading', authenticate, validateBody(updateReadingSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await DivinationService.updateAiReading(req.params.id, userId, req.body.aiReading);
    response.success(res, undefined, 'AI reading updated');
  } catch (error: any) {
    response.error(res, error.message || 'Failed to update AI reading');
  }
});

// DELETE /api/divination/:id - 删除占卜记录
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const deleted = await DivinationService.delete(req.params.id, userId);

    if (!deleted) {
      return response.notFound(res, 'Divination record not found');
    }

    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete divination record');
  }
});

export default router;
