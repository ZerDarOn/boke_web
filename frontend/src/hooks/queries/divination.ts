import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';
import { divinationApi, type DivinationType } from '@/lib/api';

// 获取占卜历史
export function useDivinationRecords(
  params?: { type?: DivinationType; page?: number },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.divination.list(params),
    queryFn: () => divinationApi.getAll(params),
    enabled: options?.enabled ?? true,
  });
}

// 获取单条占卜
export function useDivinationRecord(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.divination.detail(id) : ['divination', 'detail', 'idle'],
    queryFn: () => divinationApi.getById(id!),
    enabled: !!id,
  });
}

// 创建占卜记录
export function useCreateDivination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: divinationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.divination.all });
    },
  });
}

// 更新 AI 解读
export function useUpdateDivinationReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, aiReading }: { id: string; aiReading: string }) =>
      divinationApi.updateReading(id, aiReading),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.divination.all });
    },
  });
}

// 删除占卜记录
export function useDeleteDivination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: divinationApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.divination.all });
    },
  });
}
