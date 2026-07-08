import { useQuery } from '@tanstack/react-query';
import { diaryApi, type Diary } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';
import {
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.diary.all;

export function useDiaryList(params?: { page?: number; limit?: number; type?: 'SHORT' | 'LONG' }) {
  return useQuery({
    queryKey: queryKeys.diary.list(params),
    queryFn: () => unwrapApi(diaryApi.getAll(params)),
  });
}

export function useShortDiaryList() {
  return useDiaryList({ type: 'SHORT', limit: 200 });
}

export function useLongDiaryNavList() {
  return useQuery({
    queryKey: [...queryKeys.diary.all, 'long-nav'],
    queryFn: async () => {
      const all = await unwrapApi(diaryApi.getAll());
      return all.filter((d) => d.type === 'LONG');
    },
  });
}

export function useDiaryEntry(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.diary.detail(id ?? ''),
    queryFn: () => unwrapApi(diaryApi.getById(id!)),
    enabled: !!id,
  });
}

export function useCreateDiary() {
  return useAdminResourceCreate<Diary>(rootKey, diaryApi.create!);
}

export function useUpdateDiary() {
  return useAdminResourceUpdate<Diary>(rootKey, diaryApi.update!);
}

export function useDeleteDiary() {
  return useAdminResourceDelete<Diary>(rootKey, diaryApi.delete!);
}
