import { Router } from 'express';
import { ProjectService } from '../services/project.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';
import { validateBody } from '../middleware/validate.middleware';
import { projectSchema } from '../schemas';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.middleware';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 300, keyPrefix: 'projects' }), async (req, res) => {
  try {
    const pagination = getPagination(
      req.query.page as string,
      req.query.limit as string
    );

    const { projects, total } = await ProjectService.findMany({
      pagination,
      featured: req.query.featured === 'true',
      status: req.query.status as string,
    });

    response.success(res, projects, undefined, createMeta(total, pagination));
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch projects');
  }
});

router.get('/stats', cacheMiddleware({ ttl: 120, keyPrefix: 'projects' }), async (req, res) => {
  try {
    const stats = await ProjectService.getStats();
    response.success(res, stats);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch project stats');
  }
});

router.get('/:id', cacheMiddleware({ ttl: 600, keyPrefix: 'project' }), async (req, res) => {
  try {
    const project = await ProjectService.findById(req.params.id);
    if (!project) {
      return response.notFound(res, 'Project not found');
    }
    response.success(res, project);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch project');
  }
});

router.post('/', validateBody(projectSchema), invalidateCache('projects:*'), async (req, res) => {
  try {
    const project = await ProjectService.create(req.body);
    response.created(res, project);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

router.put('/:id', validateBody(projectSchema.partial()), invalidateCache('projects:*'), invalidateCache('project:*'), async (req, res) => {
  try {
    const project = await ProjectService.update(req.params.id, req.body);
    response.success(res, project);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

router.delete('/:id', invalidateCache('projects:*'), invalidateCache('project:*'), async (req, res) => {
  try {
    await ProjectService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete project');
  }
});

export default router;
