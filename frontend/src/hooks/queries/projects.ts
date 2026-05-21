import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, type Project } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';
import {
  useAdminResourceCreate,
  useAdminResourceUpdate,
  useAdminResourceDelete,
} from './admin-resource';

const rootKey = queryKeys.projects.all;

export function useProjectsList(params?: {
  page?: number;
  limit?: number;
  status?: string;
  featured?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: () => unwrapApi(projectsApi.getAll(params)),
    staleTime: 10 * 60 * 1000,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id ?? ''),
    queryFn: () => unwrapApi(projectsApi.getById(id!)),
    enabled: !!id,
  });
}

export function useFeaturedProjects() {
  return useQuery({
    queryKey: [...queryKeys.projects.all, 'featured'],
    queryFn: () => unwrapApi(projectsApi.getAll({ featured: true })),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCreateProject() {
  return useAdminResourceCreate<Project>(rootKey, projectsApi.create!);
}

export function useUpdateProject() {
  return useAdminResourceUpdate<Project>(rootKey, projectsApi.update!);
}

export function useDeleteProject() {
  return useAdminResourceDelete<Project>(rootKey, projectsApi.delete!);
}
