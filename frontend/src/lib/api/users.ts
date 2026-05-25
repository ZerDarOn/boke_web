import { apiRequest } from './request';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
}

export const usersApi = {
  // GET /api/users - 获取用户列表 (placeholder)
  getAll: async () => {
    return { success: false as const, error: 'Users API not implemented' };
  },

  // GET /api/users/:id - 获取用户详情 (placeholder)
  getById: async (id: string) => {
    return { success: false as const, error: 'Users API not implemented' };
  },

  // POST /api/users - 创建用户 (placeholder)
  create: async (data: Partial<AdminUser>) => {
    return { success: false as const, error: 'Users API not implemented' };
  },

  // PUT /api/users/:id - 更新用户 (placeholder)
  update: async (id: string, data: Partial<AdminUser>) => {
    return { success: false as const, error: 'Users API not implemented' };
  },

  // DELETE /api/users/:id - 删除用户 (placeholder)
  delete: async (id: string) => {
    return { success: false as const, error: 'Users API not implemented' };
  },
};
