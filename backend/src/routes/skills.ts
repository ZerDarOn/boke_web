import { Router } from 'express';
import { SkillService } from '../services/skill.service';
import * as response from '../utils/response';
import { validateBody } from '../middleware/validate.middleware';
import { skillSchema } from '../schemas';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.middleware';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 600, keyPrefix: 'skills' }), async (req, res) => {
  try {
    const skills = await SkillService.findAll();
    response.success(res, skills);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch skills');
  }
});

router.get('/nodes', cacheMiddleware({ ttl: 600, keyPrefix: 'skills' }), async (req, res) => {
  try {
    const nodes = await SkillService.findNodes();
    response.success(res, nodes);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch skill nodes');
  }
});

router.get('/stats', cacheMiddleware({ ttl: 120, keyPrefix: 'skills' }), async (req, res) => {
  try {
    const stats = await SkillService.getStats();
    response.success(res, stats);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch skill stats');
  }
});

router.get('/:id', cacheMiddleware({ ttl: 600, keyPrefix: 'skill' }), async (req, res) => {
  try {
    const skill = await SkillService.findById(req.params.id);
    if (!skill) {
      return response.notFound(res, 'Skill not found');
    }
    response.success(res, skill);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch skill');
  }
});

router.post('/', validateBody(skillSchema), invalidateCache('skills:*'), async (req, res) => {
  try {
    const skill = await SkillService.create(req.body);
    response.created(res, skill);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

router.put('/:id', validateBody(skillSchema.partial()), invalidateCache('skills:*'), async (req, res) => {
  try {
    const skill = await SkillService.update(req.params.id, req.body);
    response.success(res, skill);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

router.delete('/:id', invalidateCache('skills:*'), async (req, res) => {
  try {
    await SkillService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete skill');
  }
});

export default router;
