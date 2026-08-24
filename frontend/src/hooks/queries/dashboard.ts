import { useQuery } from '@tanstack/react-query';
import {
  dashboardApi,
  type DashboardStats,
  type AdminDashboardOverview,
  type Post,
  type Project,
} from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';

const dashboardKey = queryKeys.dashboard.stats();

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: () => unwrapApi(dashboardApi.getStats()),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useDashboardPopular() {
  return useQuery({
    queryKey: [...dashboardKey, 'popular'],
    queryFn: () => unwrapApi(dashboardApi.getPopular()),
    staleTime: 2 * 60 * 1000,
  });
}

const DISTRIBUTION_COLORS = [
  'bg-neon',
  'bg-pink-400',
  'bg-amber-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-green-500',
];

export function useDashboardContentDistribution() {
  return useQuery({
    queryKey: [...dashboardKey, 'distribution'],
    queryFn: async () => {
      const data = await unwrapApi(dashboardApi.getContentDistribution());
      return data.map((item, idx) => ({
        ...item,
        color: DISTRIBUTION_COLORS[idx % DISTRIBUTION_COLORS.length],
      }));
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminDashboardOverview() {
  return useQuery({
    queryKey: [...dashboardKey, 'admin-overview'],
    queryFn: () => unwrapApi<AdminDashboardOverview>(dashboardApi.getAdminOverview()),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export type { AdminDashboardOverview, DashboardStats, Post, Project };
