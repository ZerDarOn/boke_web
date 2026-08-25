import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { MusicCatalogService } from '../services/music-catalog.service';
import { success, error } from '../utils/response';

const router = Router();

router.get('/catalog', authenticate, requireAdmin, async (_req, res) => {
  try { return success(res, await MusicCatalogService.getCatalog()); }
  catch (err) { return error(res, err instanceof Error ? err.message : 'Failed to load music catalog'); }
});

router.post('/catalog/sync', authenticate, requireAdmin, async (_req, res) => {
  try { return success(res, await MusicCatalogService.syncCatalog(), 'Music catalog synchronized'); }
  catch (err) { return error(res, err instanceof Error ? err.message : 'Failed to synchronize music catalog'); }
});

export default router;
