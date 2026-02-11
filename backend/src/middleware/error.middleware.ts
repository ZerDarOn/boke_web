import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { config } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Prisma 错误处理
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // 唯一约束冲突
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Resource already exists',
        field: err.meta?.target,
      });
    }

    // 记录未找到
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Resource not found',
      });
    }

    // 外键约束
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: 'Foreign key constraint failed',
      });
    }
  }

  // Zod 验证错误
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: (err as any).errors,
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
    });
  }

  // 默认错误响应
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
};
