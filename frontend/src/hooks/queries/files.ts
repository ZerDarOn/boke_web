import { useQuery } from '@tanstack/react-query';
import { filesApi } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';

export function useFilesList(path?: string) {
  return useQuery({
    queryKey: queryKeys.files(path ?? ''),
    queryFn: () => unwrapApi(filesApi.getAll(path || undefined)),
    staleTime: 30 * 1000,
  });
}

export function useFileContent(path: string | undefined, password?: string) {
  return useQuery({
    queryKey: [...queryKeys.files(path ?? ''), 'content', password ?? ''],
    queryFn: () => unwrapApi(filesApi.getContent(path!, password)),
    enabled: !!path,
    retry: false,
  });
}
