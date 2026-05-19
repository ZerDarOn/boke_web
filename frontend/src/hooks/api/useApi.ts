import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiRequest, type ApiResponse } from '../../lib/api/request';
import { ensureApiData } from './fetcher';

export type { ApiResponse };

export function useApiQuery<T>(
  queryKey: readonly unknown[],
  endpoint: string,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> & {
    requestInit?: RequestInit;
    auth?: boolean;
  }
) {
  const { requestInit, auth, ...queryOptions } = options ?? {};

  return useQuery<T, Error>({
    queryKey,
    queryFn: async () =>
      ensureApiData(
        await apiRequest<T>(endpoint, { ...requestInit, auth })
      ),
    ...queryOptions,
  });
}

export function useApiMutation<TData, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<TData, Error, TVariables> & {
    invalidateKeys?: readonly (readonly unknown[])[];
  }
) {
  const queryClient = useQueryClient();
  const { invalidateKeys, ...mutationOptions } = options ?? {};

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => ensureApiData(await mutationFn(variables)),
    onSuccess: async (data, variables, context) => {
      if (invalidateKeys?.length) {
        await Promise.all(
          invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
        );
      }
      await mutationOptions.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  return (queryKey: readonly unknown[]) =>
    queryClient.invalidateQueries({ queryKey });
}
