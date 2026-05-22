/**
 * API Client for Backend Integration
 * Provides typed API calls to backend
 */

import { API_BASE_URL } from './apiConfig';
import type { PhotoComment } from '../types';
import {
  apiRequest,
  apiFetch,
  getAuthHeaders,
  getAuthToken,
  setAuthToken,
  type ApiResponse,
} from './api/request';

export type { ApiResponse };
export { apiRequest, apiFetch, getAuthHeaders, getAuthToken, setAuthToken };

// ==================== Auth ====================

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authApi = {
  login: async (username: string, password: string) => {
    return apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      auth: false,
    });
  },

  me: async () => {
    if (!getAuthToken()) {
      return { success: false, error: 'No token found' };
    }
    return apiRequest<User>('/api/auth/me');
  },

  logout: async () => {
    return apiRequest<void>('/api/auth/logout', { method: 'POST' });
  },
};

// ==================== Blog Posts ====================

export type AccessLevel = 'PUBLIC' | 'PRIVATE' | 'PASSWORD';

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  date: string;
  category: string;
  tags: string[];
  readingTime: string;
  viewCount: number;
  likeCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  accessLevel?: AccessLevel;
  password?: string;
  needPassword?: boolean;  // 前端使用，表示需要密码
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  date: string;
  category: string;
  tags: string[];
  readingTime: string;
  accessLevel?: AccessLevel;
  password?: string;
}

export const postsApi = {
  // GET /api/posts - 获取文章列表
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.tag) queryParams.append('tag', params.tag);
    if (params?.search) queryParams.append('search', params.search);

    return apiRequest<Post[]>(`/api/posts?${queryParams}`);
  },

  // GET /api/posts/categories - 获取分类列表
  getCategories: async () => {
    return apiRequest<{ name: string; count: number }[]>(`/api/posts/categories`);
  },

  // GET /api/posts/tags - 获取标签列表
  getTags: async () => {
    return apiRequest<{ name: string; count: number }[]>(`/api/posts/tags`);
  },

  // GET /api/posts/:id - 获取文章详情
  getById: async (id: string) => {
    return apiRequest<Post>(`/api/posts/${id}`);
  },

  // GET /api/posts/:id/related - 获取相关文章
  getRelated: async (id: string) => {
    return apiRequest<Post[]>(`/api/posts/${id}/related`);
  },

  // POST /api/posts/:id/view - 增加阅读量
  incrementView: async (id: string) => {
    return apiRequest<{ viewCount: number }>(`/api/posts/${id}/view`, {
      method: 'POST',
    });
  },

  // POST /api/posts/:id/like - 点赞
  like: async (id: string) => {
    return apiRequest<{ likeCount: number }>(`/api/posts/${id}/like`, {
      method: 'POST',
    });
  },

  // POST /api/posts/:id/verify - 验证文章密码
  verifyPassword: async (id: string, password: string) => {
    return apiRequest<{ success: boolean }>(`/api/posts/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  // POST /api/posts - 创建文章
  create: async (data: CreatePostData) => {
    return apiRequest<Post>(`/api/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/posts/:id - 更新文章
  update: async (id: string, data: Partial<CreatePostData>) => {
    return apiRequest<Post>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/posts/:id - 删除文章
  delete: async (id: string) => {
    return apiRequest<void>(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== Projects ====================

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  tech: string[];
  status: 'ACTIVE' | 'ARCHIVED' | 'DEPLOYED';
  link?: string;
  imageUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  startDate?: string;
  endDate?: string;
  readme?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export const projectsApi = {
  // GET /api/projects - 获取项目列表
  getAll: async (params?: {
    page?: number;
    limit?: number;
    featured?: boolean;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.featured) queryParams.append('featured', params.featured.toString());
    if (params?.status) queryParams.append('status', params.status);

    return apiRequest<Project[]>(`/api/projects?${queryParams}`);
  },

  // GET /api/projects/:id - 获取项目详情
  getById: async (id: string) => {
    return apiRequest<Project>(`/api/projects/${id}`);
  },

  // POST /api/projects - 创建项目
  create: async (data: Partial<Project>) => {
    return apiRequest<Project>(`/api/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/projects/:id - 更新项目
  update: async (id: string, data: Partial<Project>) => {
    return apiRequest<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/projects/:id - 删除项目
  delete: async (id: string) => {
    return apiRequest<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== Anime ====================

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
    status?: string;
    favorite?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.favorite) queryParams.append('favorite', params.favorite.toString());

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

// ==================== Diary ====================

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

// ==================== Gallery ====================

export interface GalleryImage {
  id: string;
  title: string;
  src: string;
  date: string;
  location?: string;
  aspect: 'portrait' | 'landscape' | 'square';
  description?: string;
  camera?: string;
  settings?: string;
  tags: string[];
  albumId?: string;
  album?: {
    id: string;
    title: string;
    cover: string;
    createdAt: string;
    lastUpdated: string;
    location?: string;
    thoughts?: string;
    photoCount: number;
  };
  comments?: PhotoComment[];
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  title: string;
  cover: string;
  createdAt: string;
  lastUpdated: string;
  location?: string;
  thoughts?: string;
  photoCount: number;
  photos?: GalleryImage[];
}

export const galleryApi = {
  // GET /api/gallery - 获取相册列表
  getAll: async (params?: {
    page?: number;
    limit?: number;
    albumId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.albumId) queryParams.append('albumId', params.albumId);

    return apiRequest<GalleryImage[]>(`/api/gallery?${queryParams}`);
  },

  // GET /api/gallery/:id - 获取图片详情
  getById: async (id: string) => {
    return apiRequest<GalleryImage>(`/api/gallery/${id}`);
  },

  // POST /api/gallery - 创建图片
  create: async (data: Partial<GalleryImage>) => {
    return apiRequest<GalleryImage>(`/api/gallery`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/gallery/:id - 更新图片
  update: async (id: string, data: Partial<GalleryImage>) => {
    return apiRequest<GalleryImage>(`/api/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/gallery/:id - 删除图片
  delete: async (id: string) => {
    return apiRequest<void>(`/api/gallery/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== Skills ====================

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

// ==================== Timeline ====================

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

// ==================== Current Status ====================

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

// ==================== History Items ====================

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

// ==================== Network ====================

export interface NetworkNode {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar?: string;
  x: number;
  y: number;
  type: 'core' | 'major' | 'minor';
  connections: string[];
  // 按钮配置
  buttonEnabled?: boolean;
  buttonLabel?: string;
  buttonLink?: string;
  createdAt: string;
  updatedAt: string;
}

export const networkApi = {
  // GET /api/network/nodes - 获取关系网络
  getAll: async () => {
    return apiRequest<NetworkNode[]>(`/api/network/nodes`);
  },

  // GET /api/network/nodes/:id - 获取节点详情
  getById: async (id: string) => {
    return apiRequest<NetworkNode>(`/api/network/nodes/${id}`);
  },

  // POST /api/network/nodes - 创建节点
  create: async (data: Partial<NetworkNode>) => {
    return apiRequest<NetworkNode>(`/api/network/nodes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/network/nodes/:id - 更新节点
  update: async (id: string, data: Partial<NetworkNode>) => {
    return apiRequest<NetworkNode>(`/api/network/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/network/nodes/:id - 删除节点
  delete: async (id: string) => {
    return apiRequest<void>(`/api/network/nodes/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== Universe (宇宙图) ====================

export interface UniverseNode {
  id: string;
  name: string;
  type: 'self' | 'skill' | 'person';
  x: number;
  y: number;
  nodeType?: 'core' | 'major' | 'minor';
  connections: string[];
  // 技能特有
  category?: string;
  level?: number;
  rank?: string;
  image?: string;
  // 人脉特有
  role?: string;
  description?: string;
  avatar?: string;
  // 按钮配置
  buttonEnabled?: boolean;
  buttonLabel?: string;
  buttonLink?: string;
}

export const universeApi = {
  // GET /api/universe - 获取完整宇宙图
  // mode: 'all' = 宇宙图专用坐标, 'skill' = 技能表坐标, 'person' = 人脉表坐标
  getAll: async (mode?: 'all' | 'skill' | 'person') => {
    const queryParam = mode ? `?mode=${mode}` : '';
    return apiRequest<UniverseNode[]>(`/api/universe${queryParam}`);
  },

  // GET /api/universe/connections - 获取连接关系
  getConnections: async () => {
    return apiRequest<{ source: string; target: string }[]>(`/api/universe/connections`);
  },

  // PUT /api/universe/layout - 更新宇宙图布局（全部模式专用坐标）
  updateLayout: async (nodeId: string, nodeType: 'skill' | 'person', x: number, y: number) => {
    return apiRequest<{ nodeId: string; x: number; y: number }>(`/api/universe/layout`, {
      method: 'PUT',
      body: JSON.stringify({ nodeId, nodeType, x, y }),
    });
  },
};

// ==================== Dashboard ====================

export interface DashboardStats {
  uptime: string;
  totalRequests: number;
  uniqueVisitors: number;
  contentStats: {
    totalContent: number;
    totalLikes: number;
    totalFavorites: number;
    totalComments: number;
    articles: number;
    photos: number;
    diaries: number;
  };
  commentDistribution: { 
    label: string; 
    count: number; 
    percentage: number; 
    color: string 
  }[];
  trafficTrend?: Array<{
    date: string; 
    pageViews: number; 
    uniqueVisitors: number 
  }>;
}

export interface ContentDistribution {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

 export const dashboardApi = {
   // GET /api/dashboard/stats - 获取仪表盘统计
   getStats: async () => {
    return apiRequest<DashboardStats>(`/api/dashboard/stats`);
  },

  // GET /api/dashboard/popular - 获取热门内容
  getPopular: async () => {
    return apiRequest<{ posts: Post[]; projects: Project[] }>(`/api/dashboard/popular`);
  },

  // GET /api/dashboard/content-distribution - 获取内容分布
  getContentDistribution: async () => {
    return apiRequest<{ label: string; count: number; percentage: number }[]>(`/api/dashboard/content-distribution`);
  },
 };

// ==================== Announcements ====================

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

// ==================== Search ====================

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

// ==================== Health Check ====================

export const healthApi = {
  // GET /api/health - 健康检查
  check: async () => {
    return apiRequest<{ status: string; timestamp: string }>(`/api/health`);
  },
};

// ==================== Files ====================

export interface FileItem {
  name: string;
  path: string;
  type: 'directory' | 'file';
  fileType?: string;
  size?: number;
  modifiedAt: string;
  protected?: boolean;
}

export interface FileContent {
  path: string;
  name: string;
  content: string;
  size: number;
  modifiedAt: string;
  extension: string;
}

export interface UploadedFile {
  fieldname: string;
  originalName: string;
  filename: string;
  size: number;
  mimetype: string;
  path: string;
}

export const filesApi = {
  // GET /api/files - 获取文件列表
  getAll: async (path?: string) => {
    const queryParams = new URLSearchParams();
    if (path) queryParams.append('path', path);

    return apiRequest<FileItem[]>(`/api/files?${queryParams}`);
  },

  // GET /api/files/content - 获取文件内容
  getContent: async (path: string, password?: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('path', path);
    if (password) queryParams.append('password', password);

    return apiRequest<FileContent>(`/api/files/content?${queryParams}`);
  },

  // GET /api/files/download - 下载文件
  download: async (path: string, password?: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('path', path);
    if (password) queryParams.append('password', password);

    const url = `${API_BASE_URL}/api/files/download?${queryParams}`;
    const token = getAuthToken();

    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      return { success: false, error: 'Download failed' };
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = path.split('/').pop() || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true };
  },

  // POST /api/files - 创建文件/目录（需要认证）
  create: async (path: string, type: 'file' | 'directory' = 'file', content?: string, password?: string) => {
    return apiRequest<{ path: string; type: string; size?: number }>(`/api/files`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, type, content, password }),
    });
  },

  // PUT /api/files/content - 更新文件内容（需要认证）
  updateContent: async (path: string, content: string, password?: string) => {
    return apiRequest<{ path: string; size: number; modifiedAt: string }>(`/api/files/content`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, content, password }),
    });
  },

  // POST /api/files/password - 设置文件密码（需要认证）
  setPassword: async (path: string, password: string) => {
    return apiRequest<void>(`/api/files/password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path, password }),
    });
  },

  // DELETE /api/files/password - 移除文件密码保护（需要认证）
  removePassword: async (path: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('path', path);

    return apiRequest<void>(`/api/files/password?${queryParams}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // DELETE /api/files - 删除文件/目录（需要认证）
  delete: async (path: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('path', path);

    return apiRequest<void>(`/api/files?${queryParams}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  // POST /api/files/upload - 上传文件（需要认证）
  upload: async (path: string, files: Array<{ name: string; content: string; type: string }>) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const queryParams = new URLSearchParams();
    if (path) queryParams.append('path', path);

    const response = await fetch(`${API_BASE_URL}/api/files/upload?${queryParams}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ files }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return data as ApiResponse<any[]>;
  },

  // POST /api/files/export - 批量导出文件（需要认证）
  exportFiles: async (paths: string[]) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/files/export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ paths }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      };
    }

    // 下载ZIP文件
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  },

  // POST /api/files/import - 批量导入文件（需要认证）
  importFiles: async (file: File, targetPath: string = '') => {
    const token = getAuthToken();

    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams();
    if (targetPath) queryParams.append('targetPath', targetPath);

    const response = await fetch(`${API_BASE_URL}/api/files/import?${queryParams}`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      };
    }

    return data as ApiResponse<{ fileCount: number; message: string }>;
  },
};

// ==================== Users (Placeholder - backend not implemented) ====================

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
}

export const usersApi = {
  // GET /api/users - 获取用户列表 (placeholder)
  getAll: async () => {
    return { success: false as const, error: 'Users API not implemented' };
  },

  // GET /api/users/:id - 获取用户详情 (placeholder)
  getById: async (id: string) => {
    return { success: false as const, error: 'Users API not implemented' };
  },

  // POST /api/users - 创建用户 (placeholder)
  create: async (data: Partial<AdminUser>) => {
    return { success: false as const, error: 'Users API not implemented' };
  },

  // PUT /api/users/:id - 更新用户 (placeholder)
  update: async (id: string, data: Partial<AdminUser>) => {
    return { success: false as const, error: 'Users API not implemented' };
  },

  // DELETE /api/users/:id - 删除用户 (placeholder)
  delete: async (id: string) => {
    return { success: false as const, error: 'Users API not implemented' };
  },
};

// ==================== Site Settings ====================

export interface SiteConfig {
  blogName: string;
  blogSubtitle: string;
  authorName: string;
  authorTitle: string;
  authorAvatar: string;
  authorBio: string;
  email: string;
  github: string;
  twitter: string;
  bilibili: string;
  wechat: string;
  primaryColor: string;
  secondaryColor: string;
  defaultTheme: 'light' | 'dark';
  pageCopy: {
    diaryTitle: string;
    diarySubtitle: string;
    diaryQuote: string;
    diaryStartLabel: string;
    thoughtsTitle: string;
    thoughtsLabel: string;
    thoughtsBgText: string;
    footerQuote: string;
    announcementTitle: string;
    announcementContent: string;
    announcementLink: string;
    announcementLinkText: string;
    aboutContactTitle: string;
    aboutContactCopyTip: string;
  };
  heroBackgrounds: any[];
}

export const settingsApi = {
  // GET /api/settings - 获取所有站点配置
  getAll: async () => {
    return apiRequest<SiteConfig>(`/api/settings`);
  },

  // GET /api/settings/:key - 获取单个配置
  getByKey: async (key: string) => {
    return apiRequest<{ key: string; value: any }>(`/api/settings/${key}`);
  },

  // PUT /api/settings - 更新单个配置（需要认证）
  update: async (key: string, value: any) => {
    return apiRequest<any>(`/api/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ key, value }),
    });
  },

  // PUT /api/settings/bulk - 批量更新配置（需要认证）
  bulkUpdate: async (settings: Record<string, any>) => {
    return apiRequest<{ message: string; count: number }>(`/api/settings/bulk`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings }),
    });
  },

  // 保存完整站点配置（前端使用，需要认证）
  saveSiteConfig: async (config: Partial<SiteConfig>) => {
    // Remove undefined values and ensure clean JSON
    const cleanConfig = JSON.parse(JSON.stringify(config));
    
    return apiRequest<any>(`/api/settings/bulk`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings: cleanConfig }),
    });
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  posts: postsApi,
  projects: projectsApi,
  anime: animeApi,
  diary: diaryApi,
  gallery: galleryApi,
  skills: skillsApi,
  timeline: timelineApi,
  currentStatus: currentStatusApi,
  history: historyApi,
  network: networkApi,
  universe: universeApi,
  dashboard: dashboardApi,
  announcements: announcementsApi,
  search: searchApi,
  health: healthApi,
  users: usersApi,
  settings: settingsApi,
  files: filesApi,
};

export { getApiBaseUrl } from './apiConfig';
