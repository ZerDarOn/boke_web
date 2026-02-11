import { PaginationParams } from '../types';

export const getPagination = (page?: string, limit?: string): PaginationParams => {
  const parsedPage = Math.max(1, parseInt(page || '1', 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '10', 10)));
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
};

export const createMeta = (
  total: number,
  pagination: PaginationParams
) => ({
  total,
  page: pagination.page,
  limit: pagination.limit,
  hasMore: pagination.skip + pagination.limit < total,
});
