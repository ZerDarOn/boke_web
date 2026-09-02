import { Router } from 'express';
import { DiaryService } from '../services/diary.service';
import { getPagination, createMeta } from '../utils/pagination';
import { registerCrudRoutes } from '../lib/crud-router';
import { diarySchema } from '../schemas';

const router = Router();

registerCrudRoutes(router, {
  service: DiaryService,
  schema: diarySchema,
  keyPrefix: 'diary',
  ttl: 300,
  list: async (req) => {
    const pagination = getPagination(
      req.query.page as string,
      req.query.limit as string
    );
    const { diaries, total } = await DiaryService.findMany({
      pagination,
      type: req.query.type as 'SHORT' | 'LONG',
    });
    return { data: diaries, meta: createMeta(total, pagination) };
  },
  messages: {
    notFound: 'Diary not found',
    fetchFailed: 'Failed to fetch diaries',
    deleteFailed: 'Failed to delete diary',
  },
});

export default router;
