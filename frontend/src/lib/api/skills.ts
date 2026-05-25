import { apiRequest } from './request';

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
  rank: string;
  projectCount: number;
  nodeX?: number;
  nodeY?: number;
  nodeType?: 'core' | 'major' | 'minor';
  connections: string[];
  // 图片
  image?: string;
  // 按钮配置
  buttonEnabled?: boolean;
  buttonLabel?: string;
  buttonLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillGroup {
  category: string;
  skills: Skill[];
}

export const skillsApi = {
  // GET /api/skills - 获取技能列表（分组）
  getGroups: async () => {
    return apiRequest<{ category: string; items: Skill[] }[]>(`/api/skills`);
  },

  // GET /api/skills - 获取所有技能
  getAll: async () => {
    return apiRequest<Skill[]>(`/api/skills/nodes`);
  },

  // GET /api/skills/:id - 获取技能详情
  getById: async (id: string) => {
    return apiRequest<Skill>(`/api/skills/${id}`);
  },

  // POST /api/skills - 创建技能
  create: async (data: Partial<Skill>) => {
    return apiRequest<Skill>(`/api/skills`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/skills/:id - 更新技能
  update: async (id: string, data: Partial<Skill>) => {
    return apiRequest<Skill>(`/api/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/skills/:id - 删除技能
  delete: async (id: string) => {
    return apiRequest<void>(`/api/skills/${id}`, {
      method: 'DELETE',
    });
  },
};
