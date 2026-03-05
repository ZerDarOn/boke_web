import { Router } from 'express';
import { UniverseService } from '../services/universe.service';
import * as response from '../utils/response';

const router = Router();

// GET /api/universe - 获取完整宇宙图
// query.mode: 'all' | 'skill' | 'person' - 不同模式使用不同坐标系统
router.get('/', async (req, res) => {
  try {
    const mode = (req.query.mode as 'all' | 'skill' | 'person') || 'all';
    const nodes = await UniverseService.getUniverse(mode);
    response.success(res, nodes);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch universe');
  }
});

// GET /api/universe/connections - 获取宇宙图连接关系
router.get('/connections', async (req, res) => {
  try {
    const connections = await UniverseService.getConnections();
    response.success(res, connections);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch connections');
  }
});

// PUT /api/universe/layout - 更新宇宙图布局（全部模式专用坐标）
router.put('/layout', async (req, res) => {
  try {
    const { nodeId, nodeType, x, y } = req.body;
    if (!nodeId || !nodeType || x === undefined || y === undefined) {
      return response.badRequest(res, 'Missing required fields: nodeId, nodeType, x, y');
    }
    const layout = await UniverseService.updateLayout(nodeId, nodeType, x, y);
    response.success(res, layout);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to update layout');
  }
});

export default router;
