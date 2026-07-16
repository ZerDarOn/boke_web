import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { StoragePathError, resolveStoragePath } from '../src/lib/storage-path-security';
import { createPostAccessToken, verifyPostAccessToken } from '../src/lib/post-access-token';
import { requireAdmin } from '../src/middleware/auth.middleware';

const storageRoot = path.resolve('content-files');

test('resolves a normal relative storage key inside the storage root', () => {
  const resolved = resolveStoragePath(storageRoot, 'notes/entry.md');

  assert.equal(resolved, path.join(storageRoot, 'notes', 'entry.md'));
});

test('allows the storage root only when explicitly requested', () => {
  assert.equal(resolveStoragePath(storageRoot, '', { allowRoot: true }), storageRoot);
});

test('rejects traversal and absolute paths', () => {
  for (const unsafePath of ['../.env', '../../.env', '/etc/passwd', 'C:\\Windows\\win.ini', 'notes/../.env']) {
    assert.throws(
      () => resolveStoragePath(storageRoot, unsafePath),
      StoragePathError
    );
  }
});

test('post access tokens are scoped to one post', () => {
  const token = createPostAccessToken('post-a');

  assert.equal(verifyPostAccessToken(token, 'post-a'), true);
  assert.equal(verifyPostAccessToken(token, 'post-b'), false);
});

test('admin middleware rejects a regular user', () => {
  let statusCode = 0;
  let nextCalled = false;
  const response = {
    status: (code: number) => {
      statusCode = code;
      return response;
    },
    json: () => response,
  };

  requireAdmin(
    { user: { userId: 'user-1', role: 'USER' } } as never,
    response as never,
    () => { nextCalled = true; }
  );

  assert.equal(statusCode, 403);
  assert.equal(nextCalled, false);
});

test('sensitive routes require the administrator guard', () => {
  const protectedRouteFiles = [
    'content.ts',
    'export.ts',
    'settings.ts',
    'upload.ts',
    'minio.ts',
    'error.ts',
  ];

  for (const routeFile of protectedRouteFiles) {
    const source = fs.readFileSync(path.join('src', 'routes', routeFile), 'utf8');
    assert.match(source, /requireAdmin/);
    assert.match(source, /authenticate,\s*requireAdmin/);
  }
});
