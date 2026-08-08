import { apiRequest } from './request';

export type DivinationType = 'TAROT' | 'ICHING' | 'ASTROLOGY';

export interface DivinationRecord {
  id: string;
  type: DivinationType;
  question: string | null;
  result: any;
  aiReading: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const divinationApi = {
  // 获取占卜历史
  getAll: async (params?: { type?: DivinationType; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return apiRequest<DivinationRecord[]>(`/api/divination?${queryParams}`);
  },

  // 获取单条记录
  getById: async (id: string) => {
    return apiRequest<DivinationRecord>(`/api/divination/${id}`);
  },

  // 创建占卜记录
  create: async (data: {
    type: DivinationType;
    question?: string;
    result: any;
    isPublic?: boolean;
  }) => {
    return apiRequest<DivinationRecord>('/api/divination', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新 AI 解读
  updateReading: async (id: string, aiReading: string) => {
    return apiRequest(`/api/divination/${id}/reading`, {
      method: 'PUT',
      body: JSON.stringify({ aiReading }),
    });
  },

  // 删除占卜记录
  delete: async (id: string) => {
    return apiRequest(`/api/divination/${id}`, {
      method: 'DELETE',
    });
  },
};
