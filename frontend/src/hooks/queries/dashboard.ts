import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardStats } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => unwrapApi(dashboardApi.getStats()),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export type { DashboardStats };
