import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';

export interface Activity {
  id: string;
  project: string;
  title: string;
  tags: string[];
  status: 'DONE' | 'IN_PROGRESS' | 'PLANNED';
  date: string;
}

function parseActivities(value: unknown): Activity[] {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item): item is Activity =>
      !!item &&
      typeof item.id === 'string' &&
      (typeof item.project === 'string' || typeof item.title === 'string')
  );
}

export function useActivities(limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.activities(), limit],
    queryFn: async (): Promise<Activity[]> => {
      const result = await api.settings.getByKey('activities');
      if (result.success && result.data?.value) {
        const list = parseActivities(result.data.value);
        if (list.length > 0) {
          return limit ? list.slice(0, limit) : list;
        }
      }

      const timeline = await unwrapApi(api.timeline.getAll());
      const sliced = timeline.slice(0, limit || 5);
      if (sliced.length > 0) {
        return sliced.map((item) => ({
          id: item.id,
          project: 'Timeline',
          title: item.title,
          tags: [] as string[],
          status: 'DONE' as const,
          date: item.date || new Date(item.createdAt).toISOString(),
        }));
      }

      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
