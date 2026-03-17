import { Request, Response, NextFunction } from 'express';
import { cache, generateCacheKey, getTTL } from '../lib/cache';

const CACHEABLE_METHODS = ['GET'];
const SKIP_CACHE_HEADER = 'x-skip-cache';

interface CacheMiddlewareOptions {
  ttl?: number;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

type JsonResponseBody = (...args: any[]) => any;

export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = 300,
    keyPrefix = 'api',
    keyGenerator,
    condition,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!CACHEABLE_METHODS.includes(req.method)) {
      return next();
    }

    if (req.headers[SKIP_CACHE_HEADER]) {
      return next();
    }

    if (condition && !condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : generateCacheKey(
          keyPrefix,
          req.path,
          JSON.stringify(req.query),
          (req as any).user?.id
        );

    try {
      const cached = await cache.get<any>(cacheKey);
      
      if (cached) {
        res.set('x-cache-status', 'HIT');
        res.json(cached);
        return;
      }

      res.set('x-cache-status', 'MISS');

      const originalJson: JsonResponseBody = res.json.bind(res);
      
      (res as any).json = (data: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, ttl).catch(() => {});
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      next();
    }
  };
}

export function invalidateCache(pattern: string) {
  return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson: JsonResponseBody = res.json.bind(res);
    
    (res as any).json = (data: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.delPattern(pattern).catch(() => {});
      }
      return originalJson(data);
    };

    next();
  };
}

export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  return withCacheFn(key, fetcher, ttl);
}

async function withCacheFn<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = await cache.get<T>(key);
  
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  await cache.set(key, data, ttl);
  
  return data;
}

export const cacheTTL = {
  posts: getTTL('posts'),
  post: getTTL('post'),
  projects: getTTL('projects'),
  project: getTTL('project'),
  dashboard: getTTL('dashboard'),
  search: getTTL('search'),
  gallery: getTTL('gallery'),
  anime: getTTL('anime'),
  skills: getTTL('skills'),
  timeline: getTTL('timeline'),
  settings: getTTL('settings'),
};
