import { apiRequest } from './request';

export interface TimelineEvent {
  id: string;
  year: string;
  date: string;
  title: string;
  description: string;
  type: 'MILESTONE' | 'JOB' | 'LIFE';
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export const timelineApi = {
  // GET /api/timeline - 获取时间线事件
  getAll: async (params?: {
    year?: string;
    type?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.year) queryParams.append('year', params.year);
    if (params?.type) queryParams.append('type', params.type);

    return apiRequest<TimelineEvent[]>(`/api/timeline?${queryParams}`);
  },

  // GET /api/timeline/:id - 获取事件详情
  getById: async (id: string) => {
    return apiRequest<TimelineEvent>(`/api/timeline/${id}`);
  },

  // POST /api/timeline - 创建事件
  create: async (data: Partial<TimelineEvent>) => {
    return apiRequest<TimelineEvent>(`/api/timeline`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/timeline/:id - 更新事件
  update: async (id: string, data: Partial<TimelineEvent>) => {
    return apiRequest<TimelineEvent>(`/api/timeline/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/timeline/:id - 删除事件
  delete: async (id: string) => {
    return apiRequest<void>(`/api/timeline/${id}`, {
      method: 'DELETE',
    });
  },
};
