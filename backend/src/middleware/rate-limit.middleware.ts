import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// 速率限制配置
export interface RateLimitConfig {
  windowMs: number;        // 时间窗口（毫秒）
  max: number;             // 最大请求数
  message?: string;         // 限制消息
  skipSuccessfulRequests?: boolean;  // 跳过成功的请求
  skipFailedRequests?: boolean;     // 跳过失败的请求
}

// 通用速率限制
export const generalRateLimit = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000,  // 开发环境1分钟，生产环境15分钟
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,  // 开发环境1000个请求，生产环境100个
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
    code: 7001,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 严格API速率限制
export const strictApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 200,                   // 每个IP最多200个请求
  message: {
    success: false,
    error: 'API 请求过于频繁，请15分钟后再试',
    code: 7001,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录速率限制（防止暴力破解）
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 5,                     // 每个IP最多5次登录尝试
  message: {
    success: false,
    error: '登录尝试次数过多，请15分钟后再试',
    code: 7001,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // 成功的登录不计入限制
});

// 注册速率限制
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 小时
  max: 3,                     // 每个IP最多3次注册尝试
  message: {
    success: false,
    error: '注册尝试次数过多，请1小时后再试',
    code: 7001,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// 文件上传速率限制
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 小时
  max: 20,                    // 每个IP最多20次上传
  message: {
    success: false,
    error: '文件上传次数过多，请1小时后再试',
    code: 7001,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 表单提交速率限制
export const formRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 分钟
  max: 10,                  // 每个IP最多10次表单提交
  message: {
    success: false,
    error: '表单提交过于频繁，请稍后再试',
    code: 7001,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 创建自定义速率限制器
export function createRateLimit(config: RateLimitConfig) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      error: config.message || '请求过于频繁，请稍后再试',
      code: 7001,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    skipFailedRequests: config.skipFailedRequests,
  });
}

// 用户特定速率限制（基于用户ID）
export class UserRateLimiter {
  private userLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60 * 1000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // 定期清理过期数据
    setInterval(() => this.cleanup(), this.windowMs);
  }

  check(userId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const userLimit = this.userLimits.get(userId);

    if (!userLimit || userLimit.resetTime < now) {
      // 首次请求或已过期，重置计数
      this.userLimits.set(userId, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { allowed: true, remaining: this.maxRequests - 1, resetTime: now + this.windowMs };
    }

    if (userLimit.count >= this.maxRequests) {
      // 超过限制
      return { allowed: false, remaining: 0, resetTime: userLimit.resetTime };
    }

    // 增加计数
    userLimit.count += 1;
    return {
      allowed: true,
      remaining: this.maxRequests - userLimit.count,
      resetTime: userLimit.resetTime,
    };
  }

  reset(userId: string): void {
    this.userLimits.delete(userId);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [userId, limit] of this.userLimits.entries()) {
      if (limit.resetTime < now) {
        this.userLimits.delete(userId);
      }
    }
  }
}

// 预定义的用户速率限制器
export const userActionLimiter = new UserRateLimiter(60 * 1000, 10);  // 每分钟10次
export const userCommentLimiter = new UserRateLimiter(60 * 60 * 1000, 5);  // 每小时5条评论
