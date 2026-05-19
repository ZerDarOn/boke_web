import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, type SiteConfig } from '../../lib/api';
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
      const result = await settingsApi.getByKey('activities');
      if (!result.success) {
        throw new Error(result.error || 'Failed to load activities');
      }
      const raw = result.data?.value;
      if (!raw) return [];
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? (parsed as AdminActivity[]) : [];
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
