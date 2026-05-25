import { apiRequest } from './request';

export interface UniverseNode {
  id: string;
  name: string;
  type: 'self' | 'skill' | 'person';
  x: number;
  y: number;
  nodeType?: 'core' | 'major' | 'minor';
  connections: string[];
  // 技能特有
  category?: string;
  level?: number;
  rank?: string;
  image?: string;
  // 人脉特有
  role?: string;
  description?: string;
  avatar?: string;
  // 按钮配置
  buttonEnabled?: boolean;
  buttonLabel?: string;
  buttonLink?: string;
}

export const universeApi = {
  // GET /api/universe - 获取完整宇宙图
  // mode: 'all' = 宇宙图专用坐标, 'skill' = 技能表坐标, 'person' = 人脉表坐标
  getAll: async (mode?: 'all' | 'skill' | 'person') => {
    const queryParam = mode ? `?mode=${mode}` : '';
    return apiRequest<UniverseNode[]>(`/api/universe${queryParam}`);
  },

  // GET /api/universe/connections - 获取连接关系
  getConnections: async () => {
    return apiRequest<{ source: string; target: string }[]>(`/api/universe/connections`);
  },

  // PUT /api/universe/layout - 更新宇宙图布局（全部模式专用坐标）
  updateLayout: async (nodeId: string, nodeType: 'skill' | 'person', x: number, y: number) => {
    return apiRequest<{ nodeId: string; x: number; y: number }>(`/api/universe/layout`, {
      method: 'PUT',
      body: JSON.stringify({ nodeId, nodeType, x, y }),
    });
  },
};
