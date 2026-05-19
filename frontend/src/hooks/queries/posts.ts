import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi, type Post, type CreatePostData } from '../../lib/api';
import { queryKeys } from '../api/query-keys';
import { unwrapApi } from '../api/fetcher';

export type PostSummary = Pick<Post, 'id' | 'slug' | 'title' | 'date' | 'category'>;

export function usePostsList(params?: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => unwrapApi(postsApi.getAll(params)),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePostNavList() {
  return useQuery({
    queryKey: queryKeys.posts.nav(),
    queryFn: async (): Promise<PostSummary[]> => {
      const posts = await unwrapApi(postsApi.getAll({ limit: 200 }));
      return posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        date: p.date,
        category: p.category,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id ?? ''),
    queryFn: () => unwrapApi(postsApi.getById(id!)),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePostCategories() {
  return useQuery({
    queryKey: queryKeys.posts.categories(),
    queryFn: () => unwrapApi(postsApi.getCategories()),
    staleTime: 30 * 60 * 1000,
  });
}

export function usePostTags() {
  return useQuery({
    queryKey: queryKeys.posts.tags(),
    queryFn: () => unwrapApi(postsApi.getTags()),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostData) => unwrapApi(postsApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePostData> }) =>
      unwrapApi(postsApi.update(id, data)),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.posts.all });
      qc.invalidateQueries({ queryKey: queryKeys.posts.detail(id) });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrapApi(postsApi.delete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}

export function useVerifyPostPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      unwrapApi(postsApi.verifyPassword(id, password)),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.posts.detail(id) });
    },
  });
}
