import { useApiQuery, useApiMutation } from './useApi';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  tech: string[];
  status: string;
  link?: string;
  imageUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  startDate?: string;
  endDate?: string;
  readme?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useProjects(page: number = 1, limit: number = 10, status?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
  });
  return useApiQuery<Project[]>(
    ['projects', page, limit, status],
    `/api/projects?${params.toString()}`,
    {
      staleTime: 10 * 60 * 1000,
    }
  );
}

export function useProject(slug: string) {
  return useApiQuery<Project>(
    ['projects', slug],
    `/api/projects/${slug}`,
    {
      enabled: !!slug,
      staleTime: 15 * 60 * 1000,
    }
  );
}

export function useFeaturedProjects() {
  return useApiQuery<Project[]>(
    ['projects', 'featured'],
    '/api/projects/featured',
    {
      staleTime: 30 * 60 * 1000,
    }
  );
}
