/**
 * API Error Types and Handler
 */

export interface ApiError {
  code: number;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  path?: string;
  method?: string;
}

export interface ErrorResponse {
  success: false;
  error: ApiError;
}

export class ApiRequestError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = '网络连接失败') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = '请求超时') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Parse API error response
 */
export function parseApiError(response: ErrorResponse): ApiRequestError {
  return new ApiRequestError(
    response.error.statusCode,
    response.error.code,
    response.error.message,
    response.error.details
  );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof ApiRequestError) {
    switch (error.errorCode) {
      case 2000: return '请先登录';
      case 2001: return '用户名或密码错误';
      case 2002: return '登录已过期，请重新登录';
      case 2003: return '登录状态无效';
      case 2004: return '权限不足';
      case 3000: return '数据验证失败，请检查输入';
      case 3004: return '该邮箱已被注册';
      case 4000: return '请求的资源不存在';
      case 5000: return '文件过大，请选择较小的文件';
      case 5001: return '不支持的文件类型';
      case 7001: return '请求过于频繁，请稍后再试';
      default: return error.message;
    }
  }

  if (error instanceof NetworkError) {
    return '网络连接失败，请检查网络设置';
  }

  if (error instanceof TimeoutError) {
    return '请求超时，请稍后重试';
  }

  if (error instanceof ValidationError) {
    return error.message;
  }

  return '发生未知错误，请稍后重试';
}

/**
 * Determine if error is recoverable
 */
export function isRecoverableError(error: Error): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof TimeoutError) return true;
  if (error instanceof ApiRequestError) {
    return [5000, 5001, 5002, 6000, 7000, 7002].includes(error.errorCode);
  }
  return false;
}

/**
 * Determine if error is auth-related
 */
export function isAuthError(error: Error): boolean {
  if (error instanceof ApiRequestError) {
    return [2000, 2001, 2002, 2003].includes(error.errorCode);
  }
  return false;
}

/**
 * Log error to console and potentially to server
 */
export function logApiError(error: Error, context?: any) {
  const errorData = {
    name: error.name,
    message: error.message,
    timestamp: new Date().toISOString(),
    ...(context && { context }),
  };

  console.error('API Error:', errorData);

  // Store in localStorage for debugging
  try {
    const errorLogs = JSON.parse(localStorage.getItem('apiErrorLogs') || '[]');
    errorLogs.push(errorData);
    localStorage.setItem('apiErrorLogs', JSON.stringify(errorLogs.slice(-20)));
  } catch (err) {
    console.error('Failed to log error to localStorage:', err);
  }
}
