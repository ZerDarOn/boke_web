import { apiRequest } from './request';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'IMPORTANT';
  attachments?: any;
  createdAt: string;
  updatedAt: string;
}

export const announcementsApi = {
  // GET /api/announcements - 获取公告列表
  getAll: async () => {
    return apiRequest<Announcement[]>(`/api/announcements`);
  },

  // GET /api/announcements/:id - 获取公告详情
  getById: async (id: string) => {
    return apiRequest<Announcement>(`/api/announcements/${id}`);
  },

  // POST /api/announcements - 创建公告
  create: async (data: Partial<Announcement>) => {
    return apiRequest<Announcement>(`/api/announcements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/announcements/:id - 更新公告
  update: async (id: string, data: Partial<Announcement>) => {
    return apiRequest<Announcement>(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/announcements/:id - 删除公告
  delete: async (id: string) => {
    return apiRequest<void>(`/api/announcements/${id}`, {
      method: 'DELETE',
    });
  },
};
