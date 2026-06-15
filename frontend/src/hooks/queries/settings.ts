import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, type SiteConfig } from '../../lib/api';
import { timelineApi } from '../../lib/api/timeline';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';

export function useSiteSettings() {
  return useQuery({
    queryKey: queryKeys.settings.site(),
    queryFn: () => unwrapApi(settingsApi.getAll()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSettingsByKey<T = unknown>(key: string) {
  return useQuery({
    queryKey: queryKeys.settings.key(key),
    queryFn: async () => {
      const result = await settingsApi.getByKey(key);
      if (!result.success) {
        throw new Error(result.error || 'Failed to load setting');
      }
      return result.data?.value as T;
    },
    enabled: !!key,
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      unwrapApi(settingsApi.update(key, value)),
    onSuccess: (_, { key }) => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.key(key) });
      qc.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });
}

export function useSaveSiteConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Partial<SiteConfig>) =>
      unwrapApi(settingsApi.saveSiteConfig(config)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });
}

export interface AdminActivity {
  id: string;
  project: string;
  title: string;
  tags: string[];
  status: 'DONE' | 'IN_PROGRESS' | 'PLANNED';
  date: string;
}

export function useAdminActivitiesConfig() {
  return useQuery({
    queryKey: queryKeys.settings.key('activities'),
    queryFn: async (): Promise<AdminActivity[]> => {
      // 1. 尝试从 settings 获取
      const result = await settingsApi.getByKey('activities');
      if (result.success && result.data?.value) {
        const raw = result.data.value;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as AdminActivity[];
        }
      }
      
      // 2. Fallback: 从 timeline 获取
      try {
        const timelineResult = await timelineApi.getAll();
        if (timelineResult.success && timelineResult.data && timelineResult.data.length > 0) {
          return timelineResult.data.map((item) => ({
            id: item.id,
            project: 'Timeline',
            title: item.title,
            tags: [],
            status: 'DONE' as const,
            date: item.date || new Date(item.createdAt).toISOString().split('T')[0],
          }));
        }
      } catch {
        // 忽略 timeline 错误
      }
      
      // 3. Fallback: 本地默认数据
      return [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveAdminActivities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activities: AdminActivity[]) =>
      unwrapApi(settingsApi.update('activities', activities)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.key('activities') });
      qc.invalidateQueries({ queryKey: queryKeys.activities() });
    },
  });
}
