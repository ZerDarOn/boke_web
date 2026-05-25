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
