import { apiRequest } from './request';

export interface CurrentStatus {
  id: string;
  title: string;
  currentFocus: string;
  location: string;
  vibe: string;
  emoji: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const currentStatusApi = {
  // GET /api/current-status - 获取所有状态
  getAll: async () => {
    return apiRequest<CurrentStatus[]>(`/api/current-status`);
  },

  // GET /api/current-status/active - 获取当前激活的状态
  getActive: async () => {
    return apiRequest<CurrentStatus>(`/api/current-status/active`);
  },

  // GET /api/current-status/:id - 获取单个状态
  getById: async (id: string) => {
    return apiRequest<CurrentStatus>(`/api/current-status/${id}`);
  },

  // POST /api/current-status - 创建状态
  create: async (data: Partial<CurrentStatus>) => {
    return apiRequest<CurrentStatus>(`/api/current-status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/current-status/:id - 更新状态
  update: async (id: string, data: Partial<CurrentStatus>) => {
    return apiRequest<CurrentStatus>(`/api/current-status/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/current-status/:id - 删除状态
  delete: async (id: string) => {
    return apiRequest<void>(`/api/current-status/${id}`, {
      method: 'DELETE',
    });
  },

  // POST /api/current-status/:id/activate - 激活状态
  activate: async (id: string) => {
    return apiRequest<CurrentStatus>(`/api/current-status/${id}/activate`, {
      method: 'POST',
    });
  },
};
