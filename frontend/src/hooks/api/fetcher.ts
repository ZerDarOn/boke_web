import type { ApiResponse } from '../../lib/api/request';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function ensureApiData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new ApiError(response.error || response.message || 'Request failed');
  }
  if (response.data === undefined) {
    throw new ApiError('No data in response');
  }
  return response.data;
}

export async function unwrapApi<T>(
  promise: Promise<ApiResponse<T>>
): Promise<T> {
  return ensureApiData(await promise);
}
