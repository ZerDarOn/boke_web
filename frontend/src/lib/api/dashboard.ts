import { apiRequest } from './request';
import type { Post } from './posts';
import type { Project } from './projects';

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
    anime: number;
    games: number;
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

export interface AdminDashboardOverview {
  stats: DashboardStats;
  pending: Array<{ key: string; label: string; count: number; path: string }>;
  services: Array<{ key: string; label: string; status: 'healthy' | 'degraded' | 'unhealthy' | 'configured' | 'local'; detail: string }>;
  runtime: { uptime: number; memoryUsedBytes: number; memoryTotalBytes: number };
  behavior: {
    days: number;
    eventCount: number;
    eventTypes: Array<{ eventType: 'page_view' | 'content_click' | 'site_search'; count: number }>;
    topPaths: Array<{ path: string; count: number }>;
  };
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

  trackVisit: async (visitorId: string) => {
    return apiRequest<void>('/api/dashboard/track', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ visitorId }),
    });
  },

  trackBehaviorEvent: async (
    visitorId: string,
    eventType: 'page_view' | 'content_click' | 'site_search',
    path: string,
    targetPath?: string,
  ) => apiRequest<void>('/api/dashboard/events', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ visitorId, eventType, path, ...(targetPath ? { targetPath } : {}) }),
  }),

  getAdminOverview: async () => {
    return apiRequest<AdminDashboardOverview>('/api/dashboard/admin-overview');
  },
 };
