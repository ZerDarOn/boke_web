import { apiRequest } from './request';

export interface HistoryItem {
  id: string;
  date: string;
  title: string;
  role: string;
  description: string;
  duration: string;
  location: string;
  tags: string[];
  color: string;
  icon: 'FileText' | 'Briefcase' | 'Code' | 'Star' | 'Trophy' | 'Globe' | 'Zap' | 'Heart';
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const historyApi = {
  // GET /api/history - 获取所有历史项目
  getAll: async (params?: { active?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());

    return apiRequest<HistoryItem[]>(`/api/history?${queryParams}`);
  },

  // GET /api/history/:id - 获取单个历史项目
  getById: async (id: string) => {
    return apiRequest<HistoryItem>(`/api/history/${id}`);
  },

  // POST /api/history - 创建历史项目
  create: async (data: Partial<HistoryItem>) => {
    return apiRequest<HistoryItem>(`/api/history`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/history/:id - 更新历史项目
  update: async (id: string, data: Partial<HistoryItem>) => {
    return apiRequest<HistoryItem>(`/api/history/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/history/:id - 删除历史项目
  delete: async (id: string) => {
    return apiRequest<void>(`/api/history/${id}`, {
      method: 'DELETE',
    });
  },

  // PUT /api/history/:id/reorder - 重新排序
  reorder: async (id: string, order: number) => {
    return apiRequest<HistoryItem>(`/api/history/${id}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ order }),
    });
  },
};
