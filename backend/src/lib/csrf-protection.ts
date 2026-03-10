import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

/**
 * CSRF Token 生成和管理
 */

interface CSRFToken {
  value: string;
  createdAt: number;
}

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
const TOKEN_EXPIRY = 60 * 60 * 1000;  // 1 小时过期

/**
 * 生成 CSRF Token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * 验证 CSRF Token
 */
export function verifyCSRFToken(token: string): boolean {
  if (!token || token.length !== 64) {
    return false;
  }
  // 在实际应用中，可以将 token 与用户会话关联存储
  // 这里简化为基本验证
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * CSRF Token 中间件
 * 为会话生成并验证 CSRF Token
 */
export class CSRProtection {
  private tokens: Map<string, CSRFToken> = new Map();

  /**
   * 生成 CSRF Token
   */
  generateToken(sessionId: string): string {
    const token = generateCSRFToken();
    this.tokens.set(sessionId, {
      value: token,
      createdAt: Date.now(),
    });
    return token;
  }

  /**
   * 验证 CSRF Token
   */
  validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);

    if (!stored) {
      return false;
    }

    // 检查 Token 是否过期
    const now = Date.now();
    if (now - stored.createdAt > TOKEN_EXPIRY) {
      this.tokens.delete(sessionId);
      return false;
    }

    // 验证 Token 值
    return stored.value === token && verifyCSRFToken(token);
  }

  /**
   * 清除 Token
   */
  clearToken(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  /**
   * 清理过期 Token
   */
  cleanup(): void {
    const now = Date.now();
    const expiration = now - TOKEN_EXPIRY;

    for (const [sessionId, token] of this.tokens.entries()) {
      if (token.createdAt < expiration) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

/**
 * 创建全局 CSRF 保护实例
 */
export const csrfProtection = new CSRProtection();

/**
 * 定期清理过期 Token
 */
setInterval(() => {
  csrfProtection.cleanup();
}, 60 * 60 * 1000);  // 每小时清理一次

/**
 * CSRF 验证中间件（用于需要 CSRF 保护的路由）
 */
export function requireCSRFToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 对于 GET 请求，不需要 CSRF 保护（只读操作）
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // 获取请求中的 CSRF Token
  const requestToken = req.body?.csrfToken || req.headers['x-csrf-token'];

  // 从 session 中获取 sessionId
  // 注意：这里简化处理，实际应用中应该从 session 或 JWT 中获取
  const sessionId = req.user?.id || req.headers['x-session-id'] || 'anonymous';

  if (!requestToken) {
    res.status(403).json({
      success: false,
      error: 'CSRF Token 缺失',
      code: 2005,
    });
    return;
  }

  // 验证 Token
  if (!csrfProtection.validateToken(sessionId, requestToken)) {
    res.status(403).json({
      success: false,
      error: 'CSRF Token 无效或已过期',
      code: 2005,
    });
    return;
  }

  next();
}

/**
 * CSRF Token 生成中间件
 * 为每个请求生成新的 CSRF Token
 */
export function generateCSRFTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 从 session 中获取 sessionId
  const sessionId = req.user?.id || req.headers['x-session-id'] || 'anonymous';

  // 生成新的 CSRF Token
  const token = csrfProtection.generateToken(sessionId);

  // 将 Token 添加到响应头
  res.setHeader('X-CSRF-Token', token);

  // 将 Token 添加到响应体（如果有的话）
  res.locals.csrfToken = token;

  next();
}

/**
 * 简化的 CSRF 保护（仅用于敏感操作）
 * 对于博客系统，可以只对需要认证的 POST/PUT/DELETE 请求应用
 */
export function requireCSRFForSensitiveOperations(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 只对写操作进行 CSRF 验证
  const writeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (!writeMethods.includes(req.method)) {
    return next();
  }

  requireCSRFToken(req, res, next);
}

/**
 * SameSite Cookie 配置建议
 * 用于生产环境的 Cookie 配置
 */
export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 天
    path: '/',
  };
}

/**
 * 导出工具函数和中间件
 */
export {
  generateCSRFToken,
  verifyCSRFToken,
  requireCSRFToken,
  requireCSRFForSensitiveOperations,
  generateCSRFTokenMiddleware,
  getCookieOptions,
};
