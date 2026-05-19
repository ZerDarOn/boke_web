import { useQuery } from '@tanstack/react-query';
import { historyApi, type HistoryItem } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';
import {
  useAdminResourceList,
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.history();

export function useHistoryItems() {
  return useAdminResourceList(rootKey, historyApi);
}

export function useActiveHistoryItems() {
  return useQuery({
    queryKey: [...queryKeys.history(), 'active'],
    queryFn: () => unwrapApi(historyApi.getAll({ active: true })),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateHistoryItem() {
  return useAdminResourceCreate(rootKey, historyApi.create!);
}

export function useUpdateHistoryItem() {
  return useAdminResourceUpdate(rootKey, historyApi.update!);
}

export function useDeleteHistoryItem() {
  return useAdminResourceDelete(rootKey, historyApi.delete!);
}
