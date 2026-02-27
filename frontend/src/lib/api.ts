/**
 * API Client for Backend Integration
 * Provides typed API calls to backend
 */

// API Base URL - 使用环境变量，默认 localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * API Response Wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Generic API Request Handler
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ==================== Blog Posts ====================

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
    return apiRequest<string[]>(`/api/posts/categories`);
  },

  // GET /api/posts/tags - 获取标签列表
  getTags: async () => {
    return apiRequest<string[]>(`/api/posts/tags`);
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
  createdAt: string;
  updatedAt: string;
}

export const networkApi = {
  // GET /api/network - 获取关系网络
  getAll: async () => {
    return apiRequest<NetworkNode[]>(`/api/network`);
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
  commentDistribution: { label: string; count: number; color: string }[];
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
};

// ==================== Search ====================

export interface SearchResult {
  posts?: Post[];
  projects?: Project[];
  anime?: Anime[];
  diary?: Diary[];
  totalResults: number;
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

// Export all APIs
export const api = {
  posts: postsApi,
  projects: projectsApi,
  anime: animeApi,
  diary: diaryApi,
  gallery: galleryApi,
  skills: skillsApi,
  timeline: timelineApi,
  network: networkApi,
  dashboard: dashboardApi,
  announcements: announcementsApi,
  search: searchApi,
  health: healthApi,
};
