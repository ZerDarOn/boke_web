import { apiRequest } from './request';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  tech: string[];
  status: 'ACTIVE' | 'ARCHIVED' | 'DEPLOYED';
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

export const projectsApi = {
  // GET /api/projects - 获取项目列表
  getAll: async (params?: {
    page?: number;
    limit?: number;
    featured?: boolean;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.featured) queryParams.append('featured', params.featured.toString());
    if (params?.status) queryParams.append('status', params.status);

    return apiRequest<Project[]>(`/api/projects?${queryParams}`);
  },

  // GET /api/projects/:id - 获取项目详情
  getById: async (id: string) => {
    return apiRequest<Project>(`/api/projects/${id}`);
  },

  // POST /api/projects - 创建项目
  create: async (data: Partial<Project>) => {
    return apiRequest<Project>(`/api/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/projects/:id - 更新项目
  update: async (id: string, data: Partial<Project>) => {
    return apiRequest<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/projects/:id - 删除项目
  delete: async (id: string) => {
    return apiRequest<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },
};
