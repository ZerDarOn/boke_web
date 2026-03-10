import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function useApiQuery<T>(
  queryKey: readonly unknown[],
  endpoint: string,
  options?: Omit<UseQueryOptions<ApiResponse<T>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: () => apiRequest<T>(endpoint),
    ...options,
  });
}

export function useApiMutation<TData, TVariables = unknown>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST',
  options?: UseMutationOptions<ApiResponse<TData>, Error, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) =>
      apiRequest<TData>(endpoint, {
        method,
        body: JSON.stringify(variables),
      }),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

export function invalidateQueries(queryKey: unknown[]) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey });
}
