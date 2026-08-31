import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthPayload, AuthenticatedRequest } from '../types';

/**
 * 校验解码后的令牌负载：刷新令牌（type: 'refresh'）只能用于 /api/auth/refresh，
 * 不得作为访问令牌通过任何 authenticate 保护端点（否则泄露后 30 天内无法撤销）。
 */
const assertAccessToken = (decoded: AuthPayload): boolean =>
  (decoded as { type?: string }).type !== 'refresh';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;

    if (!assertAccessToken(decoded)) {
      return res.status(401).json({ error: 'Access token required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export { adminMiddleware as requireAdmin, authMiddleware as authenticate };

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
      // 刷新令牌不能作为访问令牌建立身份
      if (assertAccessToken(decoded)) {
        req.user = decoded;
      }
    }

    next();
  } catch {
    // 忽略错误，继续作为未认证用户
    next();
  }
};
