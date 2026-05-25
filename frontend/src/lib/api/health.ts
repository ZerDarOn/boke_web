import { apiRequest } from './request';

export const healthApi = {
  // GET /api/health - 健康检查
  check: async () => {
    return apiRequest<{ status: string; timestamp: string }>(`/api/health`);
  },
};
