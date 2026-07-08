import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { universeApi, type UniverseNode } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';

export function useUniverseData(mode?: 'all' | 'skill' | 'person') {
  return useQuery({
    queryKey: [...queryKeys.universe.all, 'nodes', mode ?? 'all'],
    queryFn: () => unwrapApi(universeApi.getAll(mode)),
  });
}

export function useUniverseConnections() {
  return useQuery({
    queryKey: [...queryKeys.universe.all, 'connections'],
    queryFn: () => unwrapApi(universeApi.getConnections()),
  });
}

export function useSaveUniverseLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nodes: UniverseNode[]) => {
      for (const node of nodes) {
        if (node.type === 'self') continue;
        await unwrapApi(
          universeApi.updateLayout(
            node.id,
            node.type as 'skill' | 'person',
            node.x,
            node.y
          )
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.universe.all });
    },
  });
}
