import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';
import type { LayoutSearchResults } from './search-types';

export type { LayoutSearchResults } from './search-types';

export function useLayoutSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: queryKeys.search(trimmed),
    queryFn: async (): Promise<LayoutSearchResults> => {
      const data = await unwrapApi(searchApi.search(trimmed));
      return {
        posts: data.posts ?? [],
        projects: data.projects ?? [],
        diaries: data.diaries ?? data.diary ?? [],
        announcements: data.announcements ?? [],
        anime: data.anime ?? [],
        gallery: data.gallery ?? [],
      };
    },
    enabled: trimmed.length > 0,
    staleTime: 60 * 1000,
  });
}
