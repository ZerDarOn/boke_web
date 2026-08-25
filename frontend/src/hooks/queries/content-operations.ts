import { useQuery } from '@tanstack/react-query';
import { contentOperationsApi, type ContentOperationsOverview } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';

export function useContentOperations() {
  return useQuery({
    queryKey: queryKeys.dashboard.contentOperations(),
    queryFn: () => unwrapApi<ContentOperationsOverview>(contentOperationsApi.getOverview()),
    staleTime: 30_000,
  });
}
