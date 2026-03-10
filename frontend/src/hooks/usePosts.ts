import { useApiQuery, useApiMutation, invalidateQueries } from './useApi';

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  date: string;
  category: string;
  tags: string[];
  readingTime?: string;
  viewCount: number;
  likeCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export function usePosts(page: number = 1, limit: number = 10, category?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(category && { category }),
  });
  return useApiQuery<Post[]>(
    ['posts', page, limit, category],
    `/api/posts?${params.toString()}`,
    {
      staleTime: 5 * 60 * 1000,
    }
  );
}

export function usePost(id: string) {
  return useApiQuery<Post>(
    ['posts', id],
    `/api/posts/${id}`,
    {
      enabled: !!id,
      staleTime: 10 * 60 * 1000,
    }
  );
}

export function useCreatePost() {
  return useApiMutation<Post, Partial<Post>>('/api/posts', 'POST');
}

export function useUpdatePost() {
  return useApiMutation<Post, { id: string; data: Partial<Post> }>(
    (vars) => `/api/posts/${vars.id}`,
    'PUT'
  );
}

export function useDeletePost() {
  return useApiMutation<void, string>(
    (id) => `/api/posts/${id}`,
    'DELETE'
  );
}
