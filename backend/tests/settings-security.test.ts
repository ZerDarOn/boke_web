import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { isSensitiveKey } from '../src/services/settings.service';
import { authenticate } from '../src/middleware/auth.middleware';

const backendRoot = path.resolve('.');

test('settings sensitive keys are recognized for public filtering', () => {
  assert.equal(isSensitiveKey('aiConfig'), true);
  assert.equal(isSensitiveKey('openaiApiKey'), true);
  assert.equal(isSensitiveKey('smtp_password'), true);
  assert.equal(isSensitiveKey('deploySecret'), true);
  assert.equal(isSensitiveKey('authToken'), true);

  // 普通站点配置不受影响
  assert.equal(isSensitiveKey('blogName'), false);
  assert.equal(isSensitiveKey('pageCopy'), false);
  assert.equal(isSensitiveKey('heroBackgrounds'), false);
  assert.equal(isSensitiveKey('music_track_curations'), false);
});

test('settings service filters sensitive keys on public reads', () => {
  const source = fs.readFileSync(
    path.join(backendRoot, 'src', 'services', 'settings.service.ts'),
    'utf-8'
  );

  // 公开 getAll 必须按 isSensitiveKey 跳过敏感键
  assert.match(source, /if \(!includeSensitive && isSensitiveKey\(config\.key\)\) continue;/);
  // 公开 getByKey 对敏感键直接返回 null
  assert.match(source, /isSensitiveKey\(key\)\) \{\s*\n\s*return null;/);
});

test('public settings routes must parse identity via optionalAuth', () => {
  const source = fs.readFileSync(
    path.join(backendRoot, 'src', 'routes', 'settings.ts'),
    'utf-8'
  );

  // 管理员需通过 optionalAuth 识别后才能读取敏感键
  assert.match(source, /router\.get\('\/', optionalAuth, SettingsController\.getAll\);/);
  assert.match(source, /router\.get\('\/:key', optionalAuth, SettingsController\.getByKey\);/);
});

function signToken(payload: Record<string, unknown>, expiresIn: string): string {
  // 与 config/env.ts 的开发环境 fallback 保持一致
  const secret = process.env.JWT_SECRET || 'default-secret-change-me';
  return jwt.sign(payload, secret, { expiresIn });
}

function runAuthenticate(token: string): { statusCode: number; nextCalled: boolean } {
  let statusCode = 0;
  let nextCalled = false;
  const response = {
    status: (code: number) => {
      statusCode = code;
      return response;
    },
    json: () => response,
  };

  authenticate(
    { headers: { authorization: `Bearer ${token}` } } as never,
    response as never,
    () => { nextCalled = true; }
  );

  return { statusCode, nextCalled };
}

test('refresh tokens must not pass as access tokens', () => {
  const refresh = signToken({ userId: 'user-1', role: 'ADMIN', type: 'refresh' }, '30d');

  const result = runAuthenticate(refresh);
  assert.equal(result.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test('access tokens without a type claim still authenticate', () => {
  const access = signToken({ userId: 'user-1', role: 'ADMIN' }, '7d');

  const result = runAuthenticate(access);
  assert.equal(result.statusCode, 0);
  assert.equal(result.nextCalled, true);
});

test('file passwords use bcrypt with legacy sha256 auto-upgrade', () => {
  const source = fs.readFileSync(
    path.join(backendRoot, 'src', 'services', 'file.service.ts'),
    'utf-8'
  );

  // 新密码必须走 bcrypt 加盐哈希
  assert.match(source, /bcrypt\.hash\(password, 10\)/);
  assert.match(source, /meta\.passwordHash = await hashPassword\(password\);/);
  // 旧 SHA-256 哈希仅用于兼容校验，验证通过后立即升级
  assert.match(source, /isLegacySha256Hash\(storedHash\)/);
  assert.match(source, /bcrypt\.compare\(password, storedHash\)/);
});
