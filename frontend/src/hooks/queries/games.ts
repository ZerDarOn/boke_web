import { useQuery } from '@tanstack/react-query';
import { gamesApi, type Game } from '../../lib/api/games';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';
import {
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.games.all;

export function useGameList(params?: { status?: string; platform?: string; favorite?: boolean; includeHidden?: boolean; limit?: number; page?: number }) {
  return useQuery({
    queryKey: queryKeys.games.list(params),
    queryFn: () => unwrapApi(gamesApi.getAll(params)),
  });
}

export function useGameItem(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.games.detail(id ?? ''),
    queryFn: () => unwrapApi(gamesApi.getById(id!)),
    enabled: !!id,
  });
}

export function useCreateGame() {
  return useAdminResourceCreate<Game>(rootKey, gamesApi.create!);
}

export function useUpdateGame() {
  return useAdminResourceUpdate<Game>(rootKey, gamesApi.update!);
}

export function useDeleteGame() {
  return useAdminResourceDelete<Game>(rootKey, gamesApi.delete!);
}
