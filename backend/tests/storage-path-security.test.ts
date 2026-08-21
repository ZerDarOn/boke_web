import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { StoragePathError, resolveStoragePath } from '../src/lib/storage-path-security';
import { createPostAccessToken, verifyPostAccessToken } from '../src/lib/post-access-token';
import { requireAdmin } from '../src/middleware/auth.middleware';
import os from 'node:os';
import { hasValidCursorSignature } from '../src/lib/cursor-file';

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

test('cursor assets require a real CUR or PNG signature', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-cursor-test-'));
  const curPath = path.join(tempDir, 'valid.cur');
  const pngPath = path.join(tempDir, 'valid.png');
  const fakePath = path.join(tempDir, 'fake.cur');

  try {
    fs.writeFileSync(curPath, Buffer.from([0, 0, 2, 0, 1, 0, 32, 32]));
    fs.writeFileSync(pngPath, Buffer.from('89504e470d0a1a0a', 'hex'));
    fs.writeFileSync(fakePath, Buffer.from('not a cursor'));

    assert.equal(hasValidCursorSignature(curPath), true);
    assert.equal(hasValidCursorSignature(pngPath), true);
    assert.equal(hasValidCursorSignature(fakePath), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('cursor upload route is admin-only and rejects ANI files', () => {
  const routeSource = fs.readFileSync(path.join('src', 'routes', 'upload.ts'), 'utf8');
  const middlewareSource = fs.readFileSync(path.join('src', 'middleware', 'upload.middleware.ts'), 'utf8');

  assert.match(routeSource, /'\/cursor',[\s\S]*authenticate,[\s\S]*requireAdmin,[\s\S]*uploadSingleCursor/);
  assert.match(middlewareSource, /ALLOWED_CURSOR_EXTENSIONS = \['\.cur', '\.png'\]/);
  assert.doesNotMatch(middlewareSource, /ALLOWED_CURSOR_EXTENSIONS[^\n]*\.ani/);
});
