import assert from 'node:assert/strict';
import test from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { errorLogger } from '../src/lib/logger';
import { errorHandler } from '../src/middleware/error.middleware';

test('global error logging redacts file passwords from the request URL and parsed query', () => {
  const originalLogError = errorLogger.error;
  let capturedArguments: Parameters<typeof errorLogger.error> | undefined;

  errorLogger.error = ((...args: Parameters<typeof errorLogger.error>) => {
    capturedArguments = args;
  }) as typeof errorLogger.error;

  const responseState: { statusCode?: number; body?: unknown } = {};
  const response = {
    status(statusCode: number) {
      responseState.statusCode = statusCode;
      return this;
    },
    json(body: unknown) {
      responseState.body = body;
      return this;
    },
  } as unknown as Response;
  const request = {
    path: '/api/files/content',
    originalUrl:
      '/api/files/content?path=vault%2Fsecret.md&%70assword=url-secret&credentials%5Bpassword%5D=bracket-url-secret',
    url: '/api/files/content',
    method: 'GET',
    body: {
      password: 'body-secret',
      oldPassword: 'body-old-password',
      newPassword: 'body-new-password',
      client_secret: 'body-client-secret',
      sessionToken: 'body-session-token',
      profile: { apiKey: 'body-api-key', visible: 'kept' },
    },
    query: {
      path: 'vault/secret.md',
      password: 'query-secret',
      '%70assword': 'encoded-query-secret',
      nested: {
        Password: 'nested-query-secret',
        visible: 'kept',
      },
      'credentials[password]': 'bracket-query-secret',
    },
    headers: {
      'user-agent': 'node-test',
      'content-type': 'application/json',
    },
  } as unknown as Request;

  try {
    errorHandler(
      new Error('injected failure'),
      request,
      response,
      (() => undefined) as NextFunction
    );
  } finally {
    errorLogger.error = originalLogError;
  }

  assert.equal(responseState.statusCode, 500);
  assert.ok(capturedArguments, 'the global error handler should call the error logger');

  const logPayload = capturedArguments.find(
    (argument): argument is Record<string, unknown> =>
      typeof argument === 'object' && argument !== null && 'query' in argument
  );
  assert.ok(logPayload, 'the error logger should receive sanitized request diagnostics');
  assert.equal(
    logPayload.url,
    '/api/files/content?path=vault%2Fsecret.md&%70assword=[REDACTED]&credentials%5Bpassword%5D=[REDACTED]'
  );
  assert.deepEqual(logPayload.query, {
    path: 'vault/secret.md',
    password: '[REDACTED]',
    '%70assword': '[REDACTED]',
    nested: {
      Password: '[REDACTED]',
      visible: 'kept',
    },
    'credentials[password]': '[REDACTED]',
  });
  assert.deepEqual(logPayload.body, {
    password: '[REDACTED]',
    oldPassword: '[REDACTED]',
    newPassword: '[REDACTED]',
    client_secret: '[REDACTED]',
    sessionToken: '[REDACTED]',
    profile: { apiKey: '[REDACTED]', visible: 'kept' },
  });

  const serializedLogPayload = JSON.stringify(logPayload);
  for (const secret of [
    'url-secret',
    'bracket-url-secret',
    'query-secret',
    'encoded-query-secret',
    'nested-query-secret',
    'bracket-query-secret',
    'body-secret',
    'body-old-password',
    'body-new-password',
    'body-client-secret',
    'body-session-token',
    'body-api-key',
  ]) {
    assert.doesNotMatch(serializedLogPayload, new RegExp(secret));
  }
});
