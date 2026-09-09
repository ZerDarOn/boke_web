import { queryOptions, useQuery } from '@tanstack/react-query';
import { filesApi } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';

const FILE_CONTENT_STALE_TIME_MS = 30 * 1000;

export function fileContentQueryOptions(path: string, password?: string) {
  const credentialed = Boolean(password);

  return queryOptions({
    // Never place a plaintext password in TanStack Query keys/devtools.
    queryKey: [...queryKeys.files(path), 'content', credentialed ? 'protected' : 'public'] as const,
    queryFn: () => unwrapApi(filesApi.getContent(path, password)),
    staleTime: credentialed ? 0 : FILE_CONTENT_STALE_TIME_MS,
    gcTime: credentialed ? FILE_CONTENT_STALE_TIME_MS : undefined,
    retry: false,
  });
}

export function useFilesList(path?: string) {
  return useQuery({
    queryKey: queryKeys.files(path ?? ''),
    queryFn: () => unwrapApi(filesApi.getAll(path || undefined)),
    staleTime: 30 * 1000,
  });
}

export function useFileContent(path: string | undefined, password?: string) {
  return useQuery({
    ...fileContentQueryOptions(path ?? '', password),
    enabled: !!path,
  });
}
