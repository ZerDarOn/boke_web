import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../lib/api/request';
import { unwrapApi } from '../api/fetcher';

export interface CrudApi<T> {
  getAll: (params?: Record<string, unknown>) => Promise<ApiResponse<T[]>>;
  getById?: (id: string) => Promise<ApiResponse<T>>;
  create?: (data: Partial<T>) => Promise<ApiResponse<T>>;
  update?: (id: string, data: Partial<T>) => Promise<ApiResponse<T>>;
  delete?: (id: string) => Promise<ApiResponse<void>>;
}

export function useAdminResourceList<T>(
  rootKey: readonly unknown[],
  apiModule: CrudApi<T>,
  params?: Record<string, unknown>
) {
  return useQuery({
    queryKey: [...rootKey, 'list', params ?? {}],
    queryFn: () => unwrapApi(apiModule.getAll(params)),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminResourceCreate<T>(
  rootKey: readonly unknown[],
  createFn: NonNullable<CrudApi<T>['create']>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<T>) => unwrapApi(createFn(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useAdminResourceUpdate<T>(
  rootKey: readonly unknown[],
  updateFn: NonNullable<CrudApi<T>['update']>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
      unwrapApi(updateFn(id, data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: rootKey }),
  });
}

export function useAdminResourceDelete<T>(
  rootKey: readonly unknown[],
  deleteFn: NonNullable<CrudApi<T>['delete']>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrapApi(deleteFn(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: rootKey }),
  });
}
