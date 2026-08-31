import { useQuery } from '@tanstack/react-query';
import { animeApi, type Anime } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';
import {
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.anime.all;

export function useAnimeList(params?: { page?: number; limit?: number; status?: string; favorite?: boolean }) {
  return useQuery({
    queryKey: queryKeys.anime.list(params),
    queryFn: () => unwrapApi(animeApi.getAll(params)),
  });
}

export function useAnimeItem(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.anime.detail(id ?? ''),
    queryFn: () => unwrapApi(animeApi.getById(id!)),
    enabled: !!id,
  });
}

export function useCreateAnime() {
  return useAdminResourceCreate<Anime>(rootKey, animeApi.create!);
}

export function useUpdateAnime() {
  return useAdminResourceUpdate<Anime>(rootKey, animeApi.update!);
}

export function useDeleteAnime() {
  return useAdminResourceDelete<Anime>(rootKey, animeApi.delete!);
}
