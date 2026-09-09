import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import express from 'express';
import { resolveTrustProxySetting } from '../src/config/trust-proxy';

type TrustProxyFunction = (address: string, index: number) => boolean;

function compileTrustProxy(value: string | number): TrustProxyFunction {
  const app = express();
  app.set('trust proxy', value);
  return app.get('trust proxy fn') as TrustProxyFunction;
}

test('trust proxy defaults to loopback without trusting remote or private callers', () => {
  const setting = resolveTrustProxySetting();
  const trust = compileTrustProxy(setting);

  assert.equal(setting, 'loopback');
  assert.equal(trust('127.0.0.1', 0), true);
  assert.equal(trust('::1', 0), true);
  assert.equal(trust('10.20.30.40', 0), false);
  assert.equal(trust('203.0.113.10', 0), false);
});

test('explicit proxy addresses trust only the configured boundaries', () => {
  const trust = compileTrustProxy(resolveTrustProxySetting('127.0.0.1, 172.18.0.2'));

  assert.equal(trust('127.0.0.1', 0), true);
  assert.equal(trust('172.18.0.2', 0), true);
  assert.equal(trust('172.18.0.3', 0), false);
  assert.equal(trust('10.20.30.40', 0), false);
  assert.equal(trust('203.0.113.10', 0), false);
});

test('an explicit narrow CIDR can cover a controlled proxy pool', () => {
  const trust = compileTrustProxy(resolveTrustProxySetting('10.20.30.0/24'));

  assert.equal(trust('10.20.30.10', 0), true);
  assert.equal(trust('10.20.31.10', 0), false);
});

test('blanket and arbitrary public trust proxy configurations are rejected', () => {
  for (const unsafeValue of [
    'true',
    '*',
    'all',
    'private',
    'linklocal',
    'uniquelocal',
    '0.0.0.0/0',
    '10.0.0.0/8',
    '2001:db8::/32',
    '1',
    '10',
    '-1',
  ]) {
    assert.throws(() => resolveTrustProxySetting(unsafeValue), /TRUST_PROXY/);
  }

  assert.equal(resolveTrustProxySetting('0'), 0);
});

test('trust proxy is configured before the general IP rate limiter', () => {
  const appSource = fs.readFileSync(path.join('src', 'app.ts'), 'utf8');
  const trustProxyPosition = appSource.indexOf("app.set('trust proxy', config.TRUST_PROXY)");
  const rateLimiterPosition = appSource.indexOf('app.use(generalRateLimit)');

  assert.ok(trustProxyPosition >= 0);
  assert.ok(rateLimiterPosition >= 0);
  assert.ok(trustProxyPosition < rateLimiterPosition);
});
