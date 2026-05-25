import { apiRequest } from './request';

export interface NetworkNode {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar?: string;
  x: number;
  y: number;
  type: 'core' | 'major' | 'minor';
  connections: string[];
  // 按钮配置
  buttonEnabled?: boolean;
  buttonLabel?: string;
  buttonLink?: string;
  createdAt: string;
  updatedAt: string;
}

export const networkApi = {
  // GET /api/network/nodes - 获取关系网络
  getAll: async () => {
    return apiRequest<NetworkNode[]>(`/api/network/nodes`);
  },

  // GET /api/network/nodes/:id - 获取节点详情
  getById: async (id: string) => {
    return apiRequest<NetworkNode>(`/api/network/nodes/${id}`);
  },

  // POST /api/network/nodes - 创建节点
  create: async (data: Partial<NetworkNode>) => {
    return apiRequest<NetworkNode>(`/api/network/nodes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/network/nodes/:id - 更新节点
  update: async (id: string, data: Partial<NetworkNode>) => {
    return apiRequest<NetworkNode>(`/api/network/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/network/nodes/:id - 删除节点
  delete: async (id: string) => {
    return apiRequest<void>(`/api/network/nodes/${id}`, {
      method: 'DELETE',
    });
  },
};
