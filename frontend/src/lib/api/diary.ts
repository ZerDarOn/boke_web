import { apiRequest } from './request';

export interface Diary {
  id: string;
  type: 'SHORT' | 'LONG';
  content?: string;
  stamp?: string;
  title?: string;
  subtitle?: string;
  longContent?: string;
  location?: string;
  mood?: string;
  weather?: string;
  coverImage?: string;
  date: string;
  tags: string[];
  readingTime?: string;
  createdAt: string;
  updatedAt: string;
}

export const diaryApi = {
  // GET /api/diary - 获取日记列表
  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: 'SHORT' | 'LONG';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);

    return apiRequest<Diary[]>(`/api/diary?${queryParams}`);
  },

  // GET /api/diary/:id - 获取日记详情
  getById: async (id: string) => {
    return apiRequest<Diary>(`/api/diary/${id}`);
  },

  // POST /api/diary - 创建日记
  create: async (data: Partial<Diary>) => {
    return apiRequest<Diary>(`/api/diary`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/diary/:id - 更新日记
  update: async (id: string, data: Partial<Diary>) => {
    return apiRequest<Diary>(`/api/diary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/diary/:id - 删除日记
  delete: async (id: string) => {
    return apiRequest<void>(`/api/diary/${id}`, {
      method: 'DELETE',
    });
  },
};
