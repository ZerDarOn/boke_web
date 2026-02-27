import { Response } from 'express';
import { ApiResponse, ApiError } from '../types';

export const success = <T>(
  res: Response,
  data: T,
  message?: string,
  meta?: ApiResponse<T>['meta'],
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };
  res.status(statusCode).json(response);
};

export const error = (
  res: Response,
  message: string,
  statusCode = 500,
  details?: ApiError['details']
): void => {
  const response: ApiError = {
    error: message,
    ...(details && { details }),
  };
  res.status(statusCode).json(response);
};

export const created = <T>(res: Response, data: T, message = 'Created successfully'): void => {
  success(res, data, message, undefined, 201);
};

export const noContent = (res: Response): void => {
  res.status(204).send();
};

export const badRequest = (res: Response, message: string, details?: ApiError['details']): void => {
  error(res, message, 400, details);
};

export const unauthorized = (res: Response, message = 'Unauthorized'): void => {
  error(res, message, 401);
};

export const forbidden = (res: Response, message = 'Forbidden'): void => {
  error(res, message, 403);
};

export const notFound = (res: Response, message = 'Not found'): void => {
  error(res, message, 404);
};

export const conflict = (res: Response, message: string): void => {
  error(res, message, 409);
};
