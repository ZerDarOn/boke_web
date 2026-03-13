/**
 * API 配置
 * 统一管理 API URL，支持本地开发和隧道访问
 */

/**
 * 获取 API 基础 URL
 * - 使用 Vite 代理时返回空字符串（推荐）
 * - 隧道访问和本地开发都通过 Vite 代理访问后端
 */
export const getApiBaseUrl = (): string => {
  // 优先使用环境变量（仅生产环境需要）
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 本地开发、隧道访问：使用相对路径，由 Vite proxy 处理
  // 这样只需要一个隧道就能同时访问前端和后端
  // vite.config.ts 中配置了 /api 代理到 http://localhost:3001
  return '';
};

// 导出常量，避免重复计算
export const API_BASE_URL = getApiBaseUrl();
