import { useQuery } from '@tanstack/react-query';
import { currentStatusApi } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';
import {
  useAdminResourceList,
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.currentStatus();

export function useCurrentStatusList() {
  return useAdminResourceList(rootKey, currentStatusApi);
}

export function useActiveCurrentStatus() {
  return useQuery({
    queryKey: [...queryKeys.currentStatus(), 'active'],
    queryFn: () => unwrapApi(currentStatusApi.getActive()),
    retry: false,
  });
}

export function useCreateCurrentStatus() {
  return useAdminResourceCreate(rootKey, currentStatusApi.create!);
}

export function useUpdateCurrentStatus() {
  return useAdminResourceUpdate(rootKey, currentStatusApi.update!);
}

export function useDeleteCurrentStatus() {
  return useAdminResourceDelete(rootKey, currentStatusApi.delete!);
}
