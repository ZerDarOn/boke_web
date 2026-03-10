import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { config } from '../config/env';
import { AppError, NotFoundError, ValidationError } from '../errors/AppError';
import { ErrorCode, ErrorMessage, HttpStatusCode } from '../errors/codes';
import { errorLogger } from '../lib/logger';

interface ErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
    statusCode: number;
    details?: any;
    stack?: string;
    timestamp: string;
    path?: string;
    method?: string;
  };
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 记录错误日志
  const errorData = {
    message: err.message,
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? '***' : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  errorLogger.error('Error occurred:', errorData);

  // 处理自定义错误
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        ...(err.details && { details: err.details }),
        ...(config.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    };
    return res.status(err.statusCode).json(response);
  }

  // Prisma 错误处理
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, req, res);
  }

  // Prisma 初始化错误
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      success: false,
      error: {
        code: 6001,
        message: 'Database connection failed',
        statusCode: 503,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        ...(config.NODE_ENV === 'development' && { details: err.message, stack: err.stack }),
      },
    });
  }

  // Prisma 验证错误
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 3000,
        message: 'Data validation failed',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        ...(config.NODE_ENV === 'development' && { details: err.message, stack: err.stack }),
      },
    });
  }

  // Zod 验证错误
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 3000,
        message: 'Validation failed',
        statusCode: 400,
        details: validationErrors,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 2003,
        message: 'Invalid token',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 2002,
        message: 'Token expired',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  // 语法错误 (JSON 解析错误等)
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 1001,
        message: 'Invalid JSON',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        ...(config.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  }

  // 默认错误响应
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 1000,
      message: config.NODE_ENV === 'development' 
        ? err.message || 'Internal Server Error' 
        : 'Internal Server Error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  res.status(500).json(response);
};

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError, req: Request, res: Response) {
  // 唯一约束冲突
  if (err.code === 'P2002') {
    const target = err.meta?.target as string[];
    const field = Array.isArray(target) ? target.join(', ') : target;
    return res.status(409).json({
      success: false,
      error: {
        code: 3004,
        message: `Resource with this ${field} already exists`,
        statusCode: 409,
        details: { field },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  // 记录未找到
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        code: 4000,
        message: 'Resource not found',
        statusCode: 404,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  // 外键约束
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      error: {
        code: 4000,
        message: 'Foreign key constraint failed',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  // 其他 Prisma 错误
  return res.status(500).json({
    success: false,
    error: {
      code: 6000,
      message: 'Database error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  });
}

export const notFoundHandler = (req: Request, res: Response) => {
  errorLogger.warn('Route not found:', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    'user-agent': req.headers['user-agent'],
  });

  res.status(404).json({
    success: false,
    error: {
      code: 1003,
      message: 'Route not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
