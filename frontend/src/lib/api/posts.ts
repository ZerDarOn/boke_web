import { apiRequest } from './request';

export type AccessLevel = 'PUBLIC' | 'PRIVATE' | 'PASSWORD';

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  date: string;
  category: string;
  tags: string[];
  readingTime: string;
  viewCount: number;
  likeCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  accessLevel?: AccessLevel;
  password?: string;
  needPassword?: boolean;  // 前端使用，表示需要密码
  createdAt: string;
  updatedAt: string;
}

export interface PostAccessResponse {
  success: boolean;
  accessToken: string;
}

const postAccessStorageKey = (postIdentifier: string) => `post_access:${postIdentifier}`;

export function getPostAccessToken(postIdentifier: string): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(postAccessStorageKey(postIdentifier));
}

export function setPostAccessToken(postIdentifier: string, accessToken: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(postAccessStorageKey(postIdentifier), accessToken);
}

export interface CreatePostData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  date: string;
  category: string;
  tags: string[];
  readingTime: string;
  accessLevel?: AccessLevel;
  password?: string;
}

export const postsApi = {
  // GET /api/posts - 获取文章列表
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.tag) queryParams.append('tag', params.tag);
    if (params?.search) queryParams.append('search', params.search);

    return apiRequest<Post[]>(`/api/posts?${queryParams}`);
  },

  // GET /api/posts/categories - 获取分类列表
  getCategories: async () => {
    return apiRequest<{ name: string; count: number }[]>(`/api/posts/categories`);
  },

  // GET /api/posts/tags - 获取标签列表
  getTags: async () => {
    return apiRequest<{ name: string; count: number }[]>(`/api/posts/tags`);
  },

  // GET /api/posts/:id - 获取文章详情
  getById: async (id: string) => {
    const accessToken = getPostAccessToken(id);
    return apiRequest<Post>(`/api/posts/${id}`, {
      headers: accessToken ? { 'x-post-access-token': accessToken } : undefined,
    });
  },

  // GET /api/posts/:id/related - 获取相关文章
  getRelated: async (id: string) => {
    return apiRequest<Post[]>(`/api/posts/${id}/related`);
  },

  // POST /api/posts/:id/view - 增加阅读量
  incrementView: async (id: string) => {
    return apiRequest<{ viewCount: number }>(`/api/posts/${id}/view`, {
      method: 'POST',
    });
  },

  // POST /api/posts/:id/like - 点赞
  like: async (id: string) => {
    return apiRequest<{ likeCount: number }>(`/api/posts/${id}/like`, {
      method: 'POST',
    });
  },

  // POST /api/posts/:id/verify - 验证文章密码
  verifyPassword: async (id: string, password: string) => {
    return apiRequest<PostAccessResponse>(`/api/posts/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  // POST /api/posts - 创建文章
  create: async (data: CreatePostData) => {
    return apiRequest<Post>(`/api/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/posts/:id - 更新文章
  update: async (id: string, data: Partial<CreatePostData>) => {
    return apiRequest<Post>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/posts/:id - 删除文章
  delete: async (id: string) => {
    return apiRequest<void>(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  },
};
