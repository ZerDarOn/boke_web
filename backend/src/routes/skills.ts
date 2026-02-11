import { Router } from 'express';
import { SkillService } from '../services/skill.service';
import * as response from '../utils/response';

const router = Router();

// GET /api/skills - 技能列表（分组）
router.get('/', async (req, res) => {
  try {
    const skills = await SkillService.findAll();
    response.success(res, skills);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch skills');
  }
});

// GET /api/skills/nodes - 技能节点（图谱用）
router.get('/nodes', async (req, res) => {
  try {
    const nodes = await SkillService.findNodes();
    response.success(res, nodes);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch skill nodes');
  }
});

// GET /api/skills/stats - 技能统计
router.get('/stats', async (req, res) => {
  try {
    const stats = await SkillService.getStats();
    response.success(res, stats);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch skill stats');
  }
});

// GET /api/skills/:id - 技能详情
router.get('/:id', async (req, res) => {
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

// POST /api/skills - 创建技能
router.post('/', async (req, res) => {
  try {
    const skill = await SkillService.create(req.body);
    response.created(res, skill);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// PUT /api/skills/:id - 更新技能
router.put('/:id', async (req, res) => {
  try {
    const skill = await SkillService.update(req.params.id, req.body);
    response.success(res, skill);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// DELETE /api/skills/:id - 删除技能
router.delete('/:id', async (req, res) => {
  try {
    await SkillService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete skill');
  }
});

export default router;
