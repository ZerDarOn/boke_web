import { apiRequest } from './request';
import type { MediaHighlight } from '../mediaHighlights';

export interface Game {
  id: string;
  title: string;
  cover: string;
  bannerImage?: string;
  screenshots: string[];
  highlights?: MediaHighlight[];
  platform: string;
  platformId?: string;
  storeUrl?: string;
  genres: string[];
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  description?: string;
  status: string;
  playtime: number;
  score?: number;
  favorite: boolean;
  notes?: string;
  tags: string[];
  achievementsTotal: number;
  achievementsUnlocked: number;
  isHidden: boolean;
  hideReason?: string;
  relatedPostIds: string[];
  relatedProjectIds: string[];
  relatedDiaryIds: string[];
  startDate?: string;
  finishDate?: string;
  lastPlayed?: string;
  steamLastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export const gamesApi = {
  // GET /api/games - 获取游戏列表
  getAll: async (params?: {
    status?: string;
    platform?: string;
    favorite?: boolean;
    includeHidden?: boolean;
    limit?: number;
    page?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.platform) queryParams.append('platform', params.platform);
    if (params?.favorite) queryParams.append('favorite', params.favorite.toString());
    if (params?.includeHidden) queryParams.append('includeHidden', 'true');
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.page) queryParams.append('page', String(params.page));

    return apiRequest<Game[]>(`/api/games?${queryParams}`);
  },

  // GET /api/games/:id - 获取游戏详情
  getById: async (id: string) => {
    return apiRequest<Game>(`/api/games/${id}`);
  },

  // POST /api/games - 创建游戏
  create: async (data: Partial<Game>) => {
    return apiRequest<Game>(`/api/games`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/games/:id - 更新游戏
  update: async (id: string, data: Partial<Game>) => {
    return apiRequest<Game>(`/api/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/games/:id - 删除游戏
  delete: async (id: string) => {
    return apiRequest<void>(`/api/games/${id}`, {
      method: 'DELETE',
    });
  },

  // POST /api/games/sync-steam - 同步 Steam 游戏库（需管理员）
  syncSteam: async () => {
    return apiRequest<{ created: number; updated: number; total: number }>(
      `/api/games/sync-steam`,
      { method: 'POST' }
    );
  },
};
