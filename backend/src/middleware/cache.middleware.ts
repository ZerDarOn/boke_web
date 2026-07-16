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
const inFlightCacheRequests = new Map<string, Promise<unknown>>();
const inFlightResponses = new Map<string, Promise<void>>();

function createDeferredResponse() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>(completion => {
    resolve = completion;
  });

  return { promise, resolve };
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`);
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

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
          stableSerialize(req.query),
          (req as any).user?.id
        );

    try {
      const cached = await cache.get<any>(cacheKey);
      
      if (cached !== null) {
        res.set('x-cache-status', 'HIT');
        res.json(cached);
        return;
      }

      const inFlightResponse = inFlightResponses.get(cacheKey);
      if (inFlightResponse) {
        await inFlightResponse;
        const cachedResponse = await cache.get<any>(cacheKey);
        if (cachedResponse !== null) {
          res.set('x-cache-status', 'HIT');
          res.json(cachedResponse);
          return;
        }
      }

      res.set('x-cache-status', 'MISS');
      const deferredResponse = createDeferredResponse();
      inFlightResponses.set(cacheKey, deferredResponse.promise);

      const originalJson: JsonResponseBody = res.json.bind(res);
      
      (res as any).json = (data: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, ttl)
            .catch(() => undefined)
            .finally(() => {
              inFlightResponses.delete(cacheKey);
              deferredResponse.resolve();
            });
        } else {
          inFlightResponses.delete(cacheKey);
          deferredResponse.resolve();
        }
        return originalJson(data);
      };

      res.once('close', () => {
        inFlightResponses.delete(cacheKey);
        deferredResponse.resolve();
      });

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

  const existingRequest = inFlightCacheRequests.get(key) as Promise<T> | undefined;
  if (existingRequest) return existingRequest;

  const request = (async () => {
    const cachedAfterWait = await cache.get<T>(key);
    if (cachedAfterWait !== null) return cachedAfterWait;

    const data = await fetcher();
    await cache.set(key, data, ttl);
    return data;
  })();

  inFlightCacheRequests.set(key, request);
  try {
    return await request;
  } finally {
    inFlightCacheRequests.delete(key);
  }
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
