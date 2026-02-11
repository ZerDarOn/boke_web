import { Router } from 'express';
import { NetworkService } from '../services/network.service';
import * as response from '../utils/response';
import { validateBody } from '../middleware/validate.middleware';
import { networkNodeSchema } from '../schemas';

const router = Router();

// GET /api/network/nodes - 关系节点
router.get('/nodes', async (req, res) => {
  try {
    const nodes = await NetworkService.findNodes();
    response.success(res, nodes);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch network nodes');
  }
});

// GET /api/network/connections - 节点连接关系
router.get('/connections', async (req, res) => {
  try {
    const connections = await NetworkService.getConnections();
    response.success(res, connections);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch connections');
  }
});

// GET /api/network/nodes/:id - 节点详情
router.get('/nodes/:id', async (req, res) => {
  try {
    const node = await NetworkService.findById(req.params.id);
    if (!node) {
      return response.notFound(res, 'Node not found');
    }
    response.success(res, node);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to fetch node');
  }
});

// POST /api/network/nodes - 创建节点
router.post('/nodes', validateBody(networkNodeSchema), async (req, res) => {
  try {
    const node = await NetworkService.create(req.body);
    response.created(res, node);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// PUT /api/network/nodes/:id - 更新节点
router.put('/nodes/:id', validateBody(networkNodeSchema.partial()), async (req, res) => {
  try {
    const node = await NetworkService.update(req.params.id, req.body);
    response.success(res, node);
  } catch (error: any) {
    response.badRequest(res, error.message);
  }
});

// DELETE /api/network/nodes/:id - 删除节点
router.delete('/nodes/:id', async (req, res) => {
  try {
    await NetworkService.delete(req.params.id);
    response.noContent(res);
  } catch (error: any) {
    response.error(res, error.message || 'Failed to delete node');
  }
});

export default router;
