import { apiRequest } from './request';

export interface Anime {
  id: string;
  title: string;
  cover: string;
  bannerImage?: string;
  type: 'TV' | 'OVA' | 'Movie' | 'Special' | 'ONA';
  episodes: number;
  aired?: string;
  studios: string[];
  genres: string[];
  synopsis?: string;
  currentEp: number;
  status: 'WATCHING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
  score?: number;
  favorite: boolean;
  notes?: string;
  tags: string[];
  startDate?: string;
  finishDate?: string;
  bilibiliUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const animeApi = {
  // GET /api/anime - 获取动漫列表
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    favorite?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.status) queryParams.append('status', params.status);
    if (params?.favorite !== undefined) queryParams.append('favorite', params.favorite.toString());

    return apiRequest<Anime[]>(`/api/anime?${queryParams}`);
  },

  // GET /api/anime/:id - 获取动漫详情
  getById: async (id: string) => {
    return apiRequest<Anime>(`/api/anime/${id}`);
  },

  // POST /api/anime - 创建动漫
  create: async (data: Partial<Anime>) => {
    return apiRequest<Anime>(`/api/anime`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/anime/:id - 更新动漫
  update: async (id: string, data: Partial<Anime>) => {
    return apiRequest<Anime>(`/api/anime/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/anime/:id - 删除动漫
  delete: async (id: string) => {
    return apiRequest<void>(`/api/anime/${id}`, {
      method: 'DELETE',
    });
  },
};
