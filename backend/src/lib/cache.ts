import { config } from '../config/env';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  evictions: number;
}

interface RedisLike {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(...keys: string[]): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<void>;
  ping(): Promise<string>;
  disconnect(): void;
}

const DEFAULT_CACHE_CAPACITY = 1000;

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, keys: 0, evictions: 0 };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private capacity: number;

  constructor(capacity: number = DEFAULT_CACHE_CAPACITY) {
    this.capacity = capacity;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.keys--;
      this.stats.misses++;
      return null;
    }

    // LRU promotion: move to end of Map (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    // Key already exists — update in place, no capacity change
    if (this.cache.has(key)) {
      this.cache.set(key, { value, expiresAt });
      return;
    }

    // Evict oldest (least recently used) entry if at capacity
    if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.stats.keys--;
        this.stats.evictions++;
      }
    }

    this.cache.set(key, { value, expiresAt });
    this.stats.keys++;
  }

  async del(key: string): Promise<void> {
    if (this.cache.delete(key)) {
      this.stats.keys--;
    }
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.keys--;
    });
  }

  async flush(): Promise<void> {
    this.cache.clear();
    this.stats.keys = 0;
  }

  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? `${((this.stats.hits / total) * 100).toFixed(1)}%` : '0%',
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.keys--;
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

let redisClient: RedisLike | null = null;
let memoryCache: MemoryCache | null = null;
let useRedis = false;

export async function initializeCache(): Promise<void> {
  if (config.REDIS_URL) {
    try {
      const Redis = await loadRedis();
      
      if (Redis) {
        redisClient = new Redis(config.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          lazyConnect: true,
        }) as unknown as RedisLike;

        await redisClient.ping().catch(() => {
          console.log('⚠️  Redis connection failed, falling back to memory cache');
          redisClient = null;
        });

        if (redisClient) {
          useRedis = true;
          console.log('✅ Redis cache connected');
          return;
        }
      }
    } catch (error) {
      console.log('⚠️  ioredis not installed, using memory cache');
    }
  }

  memoryCache = new MemoryCache();
  useRedis = false;
  console.log('✅ Memory cache initialized');
}

async function loadRedis(): Promise<any> {
  try {
    const module = await Function('return import("ioredis")')();
    return module.default;
  } catch {
    return null;
  }
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (useRedis && redisClient) {
      try {
        const data = await redisClient.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
      } catch {
        return null;
      }
    }
    
    return memoryCache?.get<T>(key) ?? null;
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (useRedis && redisClient) {
      try {
        await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
        return;
      } catch {
        // Fall through to memory cache
      }
    }
    
    await memoryCache?.set(key, value, ttlSeconds);
  },

  async del(key: string): Promise<void> {
    if (useRedis && redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch {
        // Fall through to memory cache
      }
    }
    
    await memoryCache?.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    if (useRedis && redisClient) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
        return;
      } catch {
        // Fall through to memory cache
      }
    }
    
    await memoryCache?.delPattern(pattern);
  },

  async flush(): Promise<void> {
    if (useRedis && redisClient) {
      try {
        await redisClient.flushdb();
        return;
      } catch {
        // Fall through to memory cache
      }
    }
    
    await memoryCache?.flush();
  },

  getStats(): CacheStats & { hitRate: string; backend: string } {
    if (useRedis && redisClient) {
      return {
        hits: 0,
        misses: 0,
        keys: 0,
        evictions: 0,
        hitRate: 'N/A (Redis)',
        backend: 'redis',
      };
    }
    
    return {
      ...memoryCache!.getStats(),
      backend: 'memory',
    };
  },

  isRedis(): boolean {
    return useRedis;
  },
};

export function generateCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}

export function shutdownCache(): void {
  memoryCache?.destroy();
  redisClient?.disconnect?.();
}

const DEFAULT_TTL: Record<string, number> = {
  posts: 300,
  post: 600,
  projects: 300,
  project: 600,
  dashboard: 60,
  search: 120,
  gallery: 300,
  anime: 300,
  skills: 600,
  timeline: 600,
  settings: 300,
};

export function getTTL(type: keyof typeof DEFAULT_TTL): number {
  return DEFAULT_TTL[type] || 300;
}
