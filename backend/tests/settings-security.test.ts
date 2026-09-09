import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import {
  CLIENT_ERROR_REPORT_MAX_BYTES,
  sanitizeClientErrorReport,
} from '../src/lib/client-error-report';
import { isSensitiveKey } from '../src/services/settings.service';
import {
  createAuthTokens,
  parseAuthTokenPayload,
  validateLiveAuthIdentity,
} from '../src/lib/auth-token';

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

test('refresh tokens must not pass as access tokens', () => {
  const refresh = signToken({
    userId: 'user-1',
    role: 'ADMIN',
    tokenVersion: 0,
    type: 'refresh',
  }, '30d');

  assert.deepEqual(
    parseAuthTokenPayload(jwt.verify(refresh, process.env.JWT_SECRET || 'default-secret-change-me'), 'access'),
    { valid: false, reason: 'invalid_token_type' }
  );
});

test('legacy access tokens without type and version claims are rejected', () => {
  const legacyAccess = signToken({ userId: 'user-1', role: 'ADMIN' }, '7d');

  assert.deepEqual(
    parseAuthTokenPayload(
      jwt.verify(legacyAccess, process.env.JWT_SECRET || 'default-secret-change-me'),
      'access'
    ),
    { valid: false, reason: 'invalid_token_type' }
  );
});

test('auth token claims require an explicit type and token version', () => {
  const validPayload = {
    userId: 'user-1',
    role: 'ADMIN' as const,
    tokenVersion: 3,
    type: 'access' as const,
  };

  assert.deepEqual(parseAuthTokenPayload(validPayload, 'access'), {
    valid: true,
    payload: validPayload,
  });
  assert.deepEqual(
    parseAuthTokenPayload({ ...validPayload, type: 'refresh' }, 'access'),
    { valid: false, reason: 'invalid_token_type' }
  );
  assert.deepEqual(
    parseAuthTokenPayload({ userId: 'user-1', role: 'ADMIN', type: 'access' }, 'access'),
    { valid: false, reason: 'invalid_claims' }
  );
});

test('issued access and refresh tokens carry the current session version', () => {
  const tokens = createAuthTokens({ id: 'user-1', role: 'ADMIN', tokenVersion: 7 });
  const secret = process.env.JWT_SECRET || 'default-secret-change-me';

  assert.equal(
    parseAuthTokenPayload(jwt.verify(tokens.token, secret), 'access').valid,
    true
  );
  assert.deepEqual(
    parseAuthTokenPayload(jwt.verify(tokens.refreshToken, secret), 'refresh'),
    {
      valid: true,
      payload: {
        userId: 'user-1',
        role: 'ADMIN',
        tokenVersion: 7,
        type: 'refresh',
      },
    }
  );
});

test('live user state invalidates stale, disabled, deleted, and role-changed tokens', () => {
  const payload = {
    userId: 'user-1',
    role: 'ADMIN' as const,
    tokenVersion: 3,
    type: 'access' as const,
  };

  assert.deepEqual(validateLiveAuthIdentity(payload, null), {
    valid: false,
    reason: 'user_not_found',
  });
  assert.deepEqual(validateLiveAuthIdentity(payload, {
    id: 'user-1', role: 'ADMIN', tokenVersion: 3, isActive: false,
  }), { valid: false, reason: 'inactive_user' });
  assert.deepEqual(validateLiveAuthIdentity(payload, {
    id: 'user-1', role: 'ADMIN', tokenVersion: 4, isActive: true,
  }), { valid: false, reason: 'token_revoked' });
  assert.deepEqual(validateLiveAuthIdentity(payload, {
    id: 'user-1', role: 'USER', tokenVersion: 3, isActive: true,
  }), { valid: false, reason: 'role_changed' });
  assert.deepEqual(validateLiveAuthIdentity(payload, {
    id: 'user-1', role: 'ADMIN', tokenVersion: 3, isActive: true,
  }), { valid: true, identity: payload });
});

test('auth routes and schema preserve revocable-session contracts', () => {
  const schema = fs.readFileSync(path.join(backendRoot, 'prisma', 'schema.prisma'), 'utf8');
  const authRoutes = fs.readFileSync(path.join(backendRoot, 'src', 'routes', 'auth.ts'), 'utf8');
  const authMiddleware = fs.readFileSync(
    path.join(backendRoot, 'src', 'middleware', 'auth.middleware.ts'),
    'utf8'
  );
  const migration = fs.readFileSync(
    path.join(backendRoot, 'prisma', 'migrations', '20260904090000_add_user_token_version', 'migration.sql'),
    'utf8'
  );

  assert.match(schema, /tokenVersion\s+Int\s+@default\(0\)/);
  assert.match(migration, /ADD COLUMN\s+"tokenVersion" INTEGER NOT NULL DEFAULT 0/);
  assert.match(authRoutes, /createAuthTokens\(user\)/);
  assert.match(authRoutes, /createAccessToken\(user\)/);
  assert.equal((authRoutes.match(/tokenVersion:\s*\{ increment: 1 \}/g) || []).length, 2);
  assert.match(authMiddleware, /prisma\.user\.findUnique/);
  assert.match(authMiddleware, /tokenVersion: true/);
  assert.match(authMiddleware, /validateLiveAuthIdentity/);
  assert.match(authMiddleware, /req\.user = identity\.identity/);
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
  // Corrupt protected metadata must fail closed instead of granting access.
  assert.match(source, /if \(!meta\?\.protected\) return true;\s*if \(!meta\.passwordHash\) return false;/);
});

test('client error reports retain only bounded, redacted diagnostic fields', () => {
  const result = sanitizeClientErrorReport({
    name: 'TypeError',
    message: 'Request failed for alice@example.com with token=top-secret',
    stack: 'TypeError: Bearer abc.def.ghi at render (https://example.test/?api_key=secret)',
    componentStack: 'at SecretPanel (password=hunter2)',
    timestamp: '2026-09-04T08:30:00.000Z',
    url: 'https://example.test/posts/demo?access_token=private#debug',
    userAgent: 'Browser fingerprint must not be retained',
  });

  assert.equal(result.valid, true);
  if (!result.valid) return;

  assert.deepEqual(Object.keys(result.report).sort(), [
    'clientTimestamp',
    'componentStack',
    'errorName',
    'message',
    'path',
    'stack',
  ]);
  assert.equal(result.report.path, '/posts/demo');
  assert.doesNotMatch(JSON.stringify(result.report), /alice@example\.com|top-secret|abc\.def\.ghi|hunter2|private|fingerprint/);
  assert.match(JSON.stringify(result.report), /\[REDACTED\]/);
});

test('client error reports reject unknown, invalid, and oversized input', () => {
  assert.deepEqual(sanitizeClientErrorReport(null), {
    valid: false,
    reason: 'invalid_payload',
  });
  assert.deepEqual(sanitizeClientErrorReport({ message: 'failure', authorization: 'Bearer secret' }), {
    valid: false,
    reason: 'unexpected_field',
  });
  assert.deepEqual(sanitizeClientErrorReport({ message: '' }), {
    valid: false,
    reason: 'message_required',
  });
  assert.deepEqual(sanitizeClientErrorReport({
    message: 'failure',
    name: 'x'.repeat(129),
  }), {
    valid: false,
    reason: 'invalid_field',
  });
  assert.deepEqual(sanitizeClientErrorReport({
    message: 'x'.repeat(CLIENT_ERROR_REPORT_MAX_BYTES),
  }), {
    valid: false,
    reason: 'payload_too_large',
  });
});

test('public client error logging is parsed early and never writes the raw body synchronously', () => {
  const appSource = fs.readFileSync(path.join(backendRoot, 'src', 'app.ts'), 'utf8');
  const controllerSource = fs.readFileSync(
    path.join(backendRoot, 'src', 'controllers', 'error.controller.ts'),
    'utf8'
  );
  const routeSource = fs.readFileSync(path.join(backendRoot, 'src', 'routes', 'error.ts'), 'utf8');
  const narrowParserPosition = appSource.indexOf("app.use('/api/error/log'");
  const globalParserPosition = appSource.indexOf("app.use(express.json({ limit: '10mb' }))");

  assert.ok(narrowParserPosition >= 0);
  assert.ok(narrowParserPosition < globalParserPosition);
  assert.match(appSource, /express\.json\(\{ limit: CLIENT_ERROR_REPORT_MAX_BYTES \}\)/);
  assert.match(controllerSource, /sanitizeClientErrorReport\(req\.body\)/);
  assert.match(controllerSource, /log\('error', 'Error', 'Client error report', result\.report\)/);
  assert.doesNotMatch(controllerSource, /errorTrackerLog\.error\('Client error:'|const errorData = req\.body/);
  assert.doesNotMatch(routeSource, /formRateLimit/);
});

test('error logs rotate at a fixed size instead of growing without bound', () => {
  const loggerSource = fs.readFileSync(path.join(backendRoot, 'src', 'lib', 'logger.ts'), 'utf8');

  assert.match(loggerSource, /const LOG_MAX_BYTES = 5 \* 1024 \* 1024/);
  assert.match(loggerSource, /fs\.statSync\(logFile\)\.size \+ Buffer\.byteLength\(logLine\) <= LOG_MAX_BYTES/);
  assert.match(loggerSource, /const backupFile = `\$\{logFile\}\.1`/);
  assert.match(loggerSource, /writeLog\(filename, entry, level === 'error'\)/);
});
