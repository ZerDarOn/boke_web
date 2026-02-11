import { Router } from 'express';
import { ProjectService } from '../services/project.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';

const router = Router();

// GET /api/projects - 项目列表
router.get('/', async (req, res) => {
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

// GET /api/projects/stats - 项目统计
router.get('/stats', async (req, res) => {
  try {
    const stats = await ProjectService.getStats();
    response.success(res, stats);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch project stats');
  }
});

// GET /api/projects/:id - 项目详情
router.get('/:id', async (req, res) => {
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

// POST /api/projects - 创建项目
router.post('/', async (req, res) => {
  try {
    const project = await ProjectService.create(req.body);
    response.created(res, project);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// PUT /api/projects/:id - 更新项目
router.put('/:id', async (req, res) => {
  try {
    const project = await ProjectService.update(req.params.id, req.body);
    response.success(res, project);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// DELETE /api/projects/:id - 删除项目
router.delete('/:id', async (req, res) => {
  try {
    await ProjectService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete project');
  }
});

export default router;
