import { apiRequest } from './request';
import type { Post } from './posts';
import type { Project } from './projects';
import type { Announcement } from './announcements';
import type { Diary } from './diary';
import type { Anime } from './anime';
import type { GalleryImage } from './gallery';

export interface SearchResult {
  posts?: Post[];
  projects?: Project[];
  announcements?: Announcement[];
  diaries?: Diary[];
  /** @deprecated 旧字段，与 diaries 二选一 */
  diary?: Diary[];
  anime?: Anime[];
  gallery?: GalleryImage[];
  totalResults?: number;
}

export const searchApi = {
  // GET /api/search - 全局搜索
  search: async (query: string, type?: 'all' | 'posts' | 'projects' | 'anime' | 'diary') => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (type && type !== 'all') {
      queryParams.append('type', type);
    }

    return apiRequest<SearchResult>(`/api/search?${queryParams}`);
  },
};
