import { useApiQuery } from './useApi';

export interface DashboardStats {
  totalPosts: number;
  totalProjects: number;
  totalAnime: number;
  totalGallery: number;
  recentActivity: number;
  topPosts: Array<{
    id: string;
    title: string;
    viewCount: number;
  }>;
  popularCategories: Array<{
    category: string;
    count: number;
  }>;
}

export function useDashboardStats() {
  return useApiQuery<DashboardStats>(
    ['dashboard', 'stats'],
    '/api/dashboard/stats',
    {
      staleTime: 2 * 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
    }
  );
}
