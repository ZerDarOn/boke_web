/**
 * API 客户端统一入口（按域拆分实现，见 lib/api/*.ts）
 */
export type { ApiResponse } from './api/request';
export {
  apiRequest,
  apiFetch,
  getAuthHeaders,
  getAuthToken,
  setAuthToken,
} from './api/request';

export * from './api/auth';
export * from './api/posts';
export * from './api/projects';
export * from './api/anime';
export * from './api/diary';
export * from './api/gallery';
export * from './api/skills';
export * from './api/timeline';
export * from './api/current-status';
export * from './api/history';
export * from './api/network';
export * from './api/universe';
export * from './api/dashboard';
export * from './api/announcements';
export * from './api/search';
export * from './api/health';
export * from './api/files';
export * from './api/users';
export * from './api/settings';
export * from './api/ai';
export * from './api/divination';
export * from './api/music';
export * from './api/content-operations';

export { api } from './api/client';
export { getApiBaseUrl } from './apiConfig';
