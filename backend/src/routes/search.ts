import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

const router = Router();

// GET /api/search?q=keyword - 全局搜索
router.get('/', SearchController.search);

export default router;
