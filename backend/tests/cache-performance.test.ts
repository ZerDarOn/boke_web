import assert from 'node:assert/strict';
import test from 'node:test';
import { cache, generateCacheKey, initializeCache, shutdownCache } from '../src/lib/cache';
import { cacheMiddleware, withCache } from '../src/middleware/cache.middleware';

test.before(async () => {
  await initializeCache();
});

test.after(() => {
  shutdownCache();
});

test('coalesces concurrent cache misses into one data fetch', async () => {
  let fetchCount = 0;
  const fetcher = async () => {
    fetchCount += 1;
    await new Promise(resolve => setTimeout(resolve, 10));
    return { source: 'database' };
  };

  const results = await Promise.all(
    Array.from({ length: 8 }, () => withCache('tests:single-flight', fetcher, 60))
  );

  assert.equal(fetchCount, 1);
  assert.deepEqual(results, Array.from({ length: 8 }, () => ({ source: 'database' })));
});

test('preserves zero-valued cache key parts and serves populated entries', async () => {
  const key = generateCacheKey('page', 0, 'items');
  assert.equal(key, 'page:0:items');

  await cache.set(key, 'cached', 60);
  assert.equal(await withCache(key, async () => 'unexpected', 60), 'cached');
});

test('coalesces concurrent cache middleware misses into one handler execution', async () => {
  const middleware = cacheMiddleware({ keyPrefix: 'tests', ttl: 60 });
  let handlerCount = 0;

  const createResponse = () => {
    const listeners: Record<string, (() => void)[]> = {};
    const response = {
      statusCode: 200,
      cacheStatus: '',
      body: undefined as unknown,
      set: (name: string, value: string) => {
        if (name === 'x-cache-status') response.cacheStatus = value;
        return response;
      },
      json: (body: unknown) => {
        response.body = body;
        return response;
      },
      once: (event: string, listener: () => void) => {
        listeners[event] = [...(listeners[event] ?? []), listener];
        return response;
      },
    };
    return response;
  };

  const request = { method: 'GET', path: '/feed', query: { page: '1' }, headers: {} };
  const firstResponse = createResponse();
  const secondResponse = createResponse();

  const first = middleware(request as never, firstResponse as never, () => {
    handlerCount += 1;
    setTimeout(() => firstResponse.json({ source: 'database' }), 10);
  });
  const second = middleware(request as never, secondResponse as never, () => {
    handlerCount += 1;
    secondResponse.json({ source: 'database' });
  });

  await Promise.all([first, second]);
  assert.equal(handlerCount, 1);
  assert.equal(secondResponse.cacheStatus, 'HIT');
  assert.deepEqual(secondResponse.body, { source: 'database' });
});
