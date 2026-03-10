/**
 * Enhanced API Client with Error Handling
 */

import { apiRequest as baseApiRequest } from './api';
import {
  ApiRequestError,
  NetworkError,
  TimeoutError,
  ValidationError,
  parseApiError,
  getUserFriendlyErrorMessage,
  logApiError,
  isRecoverableError,
  isAuthError,
} from './api-error';

const REQUEST_TIMEOUT = 30000; // 30 seconds

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

/**
 * Enhanced API Request Handler with Error Interception
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { timeout?: number }
): Promise<ApiResponse<T>> {
  const { timeout = REQUEST_TIMEOUT, ...fetchOptions } = options || {};

  try {
    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await baseApiRequest<T>(endpoint, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response is an error
    if (!response.success && response.error) {
      throw new Error(response.error);
    }

    return response;
  } catch (error) {
    return handleApiError(error, endpoint, options);
  }
}

/**
 * Handle API errors with proper error types
 */
function handleApiError(
  error: unknown,
  endpoint: string,
  options?: RequestInit
): ApiResponse<never> {
  // Handle timeout
  if (error instanceof Error && error.name === 'AbortError') {
    logApiError(new TimeoutError(), { endpoint });
    return {
      success: false,
      error: getUserFriendlyErrorMessage(new TimeoutError()),
    };
  }

  // Handle network errors
  if (error instanceof Error && error.name === 'TypeError') {
    const networkError = new NetworkError();
    logApiError(networkError, { endpoint });
    return {
      success: false,
      error: getUserFriendlyErrorMessage(networkError),
    };
  }

  // Handle API response errors
  if (error instanceof Error) {
    // Try to parse error as API error
    try {
      const errorData = JSON.parse(error.message);
      if (errorData.error && errorData.error.code) {
        const apiError = parseApiError(errorData);
        logApiError(apiError, { endpoint });

        // Clear auth token on auth errors
        if (isAuthError(apiError)) {
          localStorage.removeItem('auth_token');
          // Optionally redirect to login
          // window.location.href = '/admin/login';
        }

        return {
          success: false,
          error: getUserFriendlyErrorMessage(apiError),
        };
      }
    } catch {
      // Not a structured error, use message directly
    }

    logApiError(error as Error, { endpoint });
    return {
      success: false,
      error: getUserFriendlyErrorMessage(error as Error),
    };
  }

  // Unknown error
  logApiError(new Error('Unknown error'), { endpoint });
  return {
    success: false,
    error: '发生未知错误，请稍后重试',
  };
}

/**
 * API Client with convenient methods
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit & { timeout?: number }) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit & { timeout?: number }) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit & { timeout?: number }) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit & { timeout?: number }) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit & { timeout?: number }) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Export error utilities
 */
export {
  ApiRequestError,
  NetworkError,
  TimeoutError,
  ValidationError,
  parseApiError,
  getUserFriendlyErrorMessage,
  logApiError,
  isRecoverableError,
  isAuthError,
};
