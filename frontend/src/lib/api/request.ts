import { API_BASE_URL } from '../apiConfig';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

const AUTH_TOKEN_KEY = 'auth_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type ApiRequestOptions = RequestInit & {
  /** 默认 true；登录等接口传 auth: false */
  auth?: boolean;
  /** 默认 true；上传 FormData 时传 json: false */
  json?: boolean;
};

/**
 * 统一 API 请求：自动附加 JWT、合并 headers
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { auth = true, json = true, ...fetchOptions } = options;

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const mergedHeaders: Record<string, string> = {};

    if (json && !(fetchOptions.body instanceof FormData)) {
      mergedHeaders['Content-Type'] = 'application/json';
    }

    if (auth) {
      Object.assign(mergedHeaders, getAuthHeaders());
    }

    if (fetchOptions.headers) {
      const custom = fetchOptions.headers as Record<string, string>;
      Object.entries(custom).forEach(([key, value]) => {
        mergedHeaders[key] = value;
      });
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: mergedHeaders,
    });

    if (response.status === 204) {
      return { success: true };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      // 后端存在两种错误体：路由手写 { error: "msg" } 与全局 errorHandler
      // 的结构化 { success: false, error: { code, message, ... } }，此处统一解包为字符串
      const errPayload = data.message ?? data.error;
      const errorMessage =
        typeof errPayload === 'string'
          ? errPayload
          : errPayload && typeof errPayload === 'object' && 'message' in errPayload
            ? String((errPayload as { message: unknown }).message)
            : `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function apiFetch(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const { auth = true, json = true, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;
  const mergedHeaders: Record<string, string> = {};

  if (json && !(fetchOptions.body instanceof FormData)) {
    mergedHeaders['Content-Type'] = 'application/json';
  }
  if (auth) {
    Object.assign(mergedHeaders, getAuthHeaders());
  }
  if (fetchOptions.headers) {
    Object.assign(mergedHeaders, fetchOptions.headers as Record<string, string>);
  }

  return fetch(url, { ...fetchOptions, headers: mergedHeaders });
}
