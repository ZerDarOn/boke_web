import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { Readable } from 'node:stream';
import * as http from 'node:http';
import type { Client } from 'minio';
import express from 'express';
import { StoragePathError, normalizeStoragePath, resolveStoragePath } from '../src/lib/storage-path-security';
import {
  FILE_STORAGE_IDENTITY_KEY,
  assertFileMetadataOutsideStorage,
  assertFileStorageOutsidePublicRoot,
  createFileStorageBinding,
  parseFileStorageIdentity,
  serializeFileStorageIdentity,
} from '../src/lib/file-storage-identity';
import { assertZipEntryIsNotSymlink } from '../src/lib/zip-entry-security';
import { createPostAccessToken, verifyPostAccessToken } from '../src/lib/post-access-token';
import { requireAdmin } from '../src/middleware/auth.middleware';
import os from 'node:os';
import { hasValidCursorSignature } from '../src/lib/cursor-file';
import { cleanupExpiredTemporaryUploads } from '../src/lib/temporary-upload-cleanup';
import {
  buildGameLookupWhere,
  canIncludeHiddenGames,
} from '../src/lib/game-access-policy';
import { authorizeStoredFileAccess } from '../src/lib/file-access-policy';
import {
  FILE_ACCESS_PASSWORD_HEADER,
  redactFileAccessPasswordFromUrl,
  resolveFileAccessPassword,
} from '../src/lib/file-access-password';
import fileService, {
  FILE_CONTENT_PREVIEW_MAX_BYTES,
  FILE_LIST_MAX_ENTRIES,
  FILE_METADATA_FORMAT,
  FILE_METADATA_VERSION,
  FileContentTooLargeError,
  FileListTooLargeError,
  FileMetadataTrustError,
  FileService,
  loadMetadata,
  minioBucketPolicyAllowsAnonymousAccess,
  saveMetadata,
} from '../src/services/file.service';
import fileRoutes from '../src/routes/files';
import { createMinioFileProxyHandler } from '../src/routes/minio';
import {
  createMinioRequestTransport,
  getFileUrl as getMinioFileUrl,
  resolveMinioEnabled,
  resolveMinioRequestTimeout,
} from '../src/config/minio';
import sharp from 'sharp';
import {
  coordinateBatchImageUploads,
  deleteFile as deleteUploadedImage,
  getFileInfo,
  processImageUpload,
  type ProcessedImageUpload,
  writeImageToLocalStorage,
} from '../src/services/upload.service';

const storageRoot = path.resolve('content-files');
const TEST_STORAGE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_STORAGE_ID = '22222222-2222-4222-8222-222222222222';

interface PersistedMetadataDocument {
  format: string;
  version: number;
  storage: {
    kind: 'local' | 'minio';
    storageId: string;
  };
  entries: Record<string, Record<string, unknown>>;
}

const readPersistedMetadataDocument = (metadataPath: string): PersistedMetadataDocument => {
  const document = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as PersistedMetadataDocument;
  assert.equal(document.format, FILE_METADATA_FORMAT);
  assert.equal(document.version, FILE_METADATA_VERSION);
  assert.ok(document.storage);
  assert.ok(document.entries);
  return document;
};

const writeTrustedMetadata = (
  metadataPath: string,
  kind: 'local' | 'minio',
  storageId: string = TEST_STORAGE_ID
): void => {
  saveMetadata(new Map(), metadataPath, createFileStorageBinding(kind, storageId));
};

const writeLocalStorageIdentity = (
  localStorageDir: string,
  storageId: string = TEST_STORAGE_ID
): void => {
  fs.mkdirSync(localStorageDir, { recursive: true });
  fs.writeFileSync(
    path.join(localStorageDir, FILE_STORAGE_IDENTITY_KEY),
    serializeFileStorageIdentity(storageId),
    'utf8'
  );
};

interface TestMinioStorageState {
  storageId?: string;
}

const createIdentityAwareMinioClient = (
  overrides: Record<string, any>,
  storageState: TestMinioStorageState = { storageId: TEST_STORAGE_ID }
): Client => {
  const getObjectOverride = overrides.getObject;
  const putObjectOverride = overrides.putObject;
  const getBucketPolicyOverride = overrides.getBucketPolicy;

  return {
    ...overrides,
    getBucketPolicy: async (bucket: string) => {
      if (getBucketPolicyOverride) return getBucketPolicyOverride(bucket);
      throw Object.assign(new Error('bucket policy is not configured'), {
        code: 'NoSuchBucketPolicy',
      });
    },
    getObject: async (bucket: string, objectKey: string) => {
      if (objectKey === FILE_STORAGE_IDENTITY_KEY) {
        if (!storageState.storageId) {
          throw Object.assign(new Error('missing storage identity'), { code: 'NoSuchKey' });
        }
        return Readable.from([serializeFileStorageIdentity(storageState.storageId)]);
      }
      if (getObjectOverride) return getObjectOverride(bucket, objectKey);
      throw Object.assign(new Error('missing object'), { code: 'NoSuchKey' });
    },
    putObject: async (bucket: string, objectKey: string, content: string | Buffer) => {
      if (objectKey === FILE_STORAGE_IDENTITY_KEY) {
        storageState.storageId = parseFileStorageIdentity(content.toString());
        return { etag: 'storage-identity-etag', versionId: null };
      }
      if (putObjectOverride) return putObjectOverride(bucket, objectKey, content);
      return { etag: 'test-etag', versionId: null };
    },
  } as unknown as Client;
};

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

test('rejects ZIP symlink entries independently of host symlink privileges', () => {
  assert.throws(
    () => assertZipEntryIsNotSymlink({
      externalFileAttributes: (0xa000 << 16) >>> 0,
    }),
    StoragePathError
  );
  assert.doesNotThrow(() => assertZipEntryIsNotSymlink({
    externalFileAttributes: (0x8000 << 16) >>> 0,
  }));
});

test('rejects symlink storage components', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-storage-symlink-'));
  const localStorageDir = path.join(root, 'content-files');
  const outsidePath = path.join(root, '..', `ink-outside-${process.pid}.txt`);
  const linkPath = path.join(localStorageDir, 'leak.txt');

  try {
    fs.mkdirSync(localStorageDir);
    fs.writeFileSync(outsidePath, 'outside secret', 'utf8');
    try {
      fs.symlinkSync(outsidePath, linkPath, 'file');
    } catch (error: any) {
      if (error?.code === 'EPERM' || error?.code === 'EACCES') {
        t.skip('symbolic link creation is not permitted on this platform');
        return;
      }
      throw error;
    }

    assert.throws(() => resolveStoragePath(localStorageDir, 'leak.txt'), StoragePathError);
    const metadataPath = path.join(root, 'file-metadata.json');
    writeTrustedMetadata(metadataPath, 'local');
    writeLocalStorageIdentity(localStorageDir);
    const service = new FileService({
      localStorageDir,
      metadataPath,
      minioClient: null,
    });
    await service.initialize();
    await assert.rejects(service.getFileContent('leak.txt'), StoragePathError);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outsidePath, { force: true });
  }
});

test('normalizes equivalent file paths to one metadata key', () => {
  assert.equal(normalizeStoragePath('./vault//secret.md'), 'vault/secret.md');
  assert.equal(normalizeStoragePath('vault\\secret.md'), 'vault/secret.md');
  assert.throws(() => normalizeStoragePath(FILE_STORAGE_IDENTITY_KEY), StoragePathError);
});

test('reserves the storage identity marker independent of filename casing', () => {
  assert.throws(() => normalizeStoragePath(FILE_STORAGE_IDENTITY_KEY), StoragePathError);
  assert.throws(
    () => normalizeStoragePath(FILE_STORAGE_IDENTITY_KEY.toUpperCase()),
    StoragePathError
  );
});

test('file metadata distinguishes a new install from corrupt persisted protection state', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-file-metadata-load-'));
  const metadataPath = path.join(root, 'file-metadata.json');

  try {
    assert.equal(loadMetadata(metadataPath).size, 0);

    fs.writeFileSync(metadataPath, '{not valid json', 'utf8');
    assert.throws(() => loadMetadata(metadataPath), SyntaxError);
    assert.throws(
      () => new FileService({
        localStorageDir: path.join(root, 'content-files'),
        metadataPath,
        minioClient: null,
      }),
      SyntaxError
    );

    fs.writeFileSync(metadataPath, JSON.stringify({
      'vault/secret.md': {
        name: 'secret.md',
        type: 'file',
        modifiedAt: '2026-09-04T00:00:00.000Z',
        protected: false,
        passwordHash: '$2a$10$stored-password-hash',
      },
    }), 'utf8');
    assert.equal(loadMetadata(metadataPath).get('vault/secret.md')?.protected, true);

    fs.writeFileSync(metadataPath, JSON.stringify({
      'vault/empty-hash.md': {
        name: 'empty-hash.md',
        type: 'file',
        modifiedAt: '2026-09-04T00:00:00.000Z',
        protected: false,
        passwordHash: '',
      },
    }), 'utf8');
    assert.equal(loadMetadata(metadataPath).get('vault/empty-hash.md')?.protected, true);

    fs.writeFileSync(metadataPath, JSON.stringify({
      '../vault/secret.md': {
        name: 'secret.md',
        type: 'file',
        modifiedAt: '2026-09-04T00:00:00.000Z',
        protected: true,
        passwordHash: '$2a$10$stored-password-hash',
      },
    }), 'utf8');
    assert.throws(() => loadMetadata(metadataPath), StoragePathError);

    fs.writeFileSync(metadataPath, JSON.stringify({
      format: {
        name: 'format',
        type: 'file',
        modifiedAt: '2026-09-04T00:00:00.000Z',
        protected: false,
      },
    }), 'utf8');
    assert.equal(loadMetadata(metadataPath).get('format')?.name, 'format');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('an empty unbound v1 index cannot claim a nonempty local storage', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-unbound-v1-local-'));
  const localStorageDir = path.join(root, 'content-files');
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const v1Document = JSON.stringify({
    format: FILE_METADATA_FORMAT,
    version: 1,
    entries: {},
  }, null, 2);

  try {
    delete process.env.MINIO_ENDPOINT;
    fs.mkdirSync(localStorageDir);
    fs.writeFileSync(path.join(localStorageDir, 'existing.md'), 'existing content', 'utf8');
    fs.writeFileSync(metadataPath, v1Document, 'utf8');

    const service = new FileService({ localStorageDir, metadataPath, minioClient: null });
    await assert.rejects(service.initialize(), FileMetadataTrustError);

    assert.equal(service.isPasswordProtected('existing.md'), true);
    assert.equal(
      fs.existsSync(path.join(localStorageDir, FILE_STORAGE_IDENTITY_KEY)),
      false
    );
    assert.equal(fs.readFileSync(metadataPath, 'utf8'), v1Document);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('legacy records named format, version, and entries migrate as flat metadata', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-legacy-reserved-names-'));
  const localStorageDir = path.join(root, 'content-files');
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const previousUnboundMigration = process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION;
  const reservedNames = ['format', 'version', 'entries'];
  const legacyDocument = Object.fromEntries(reservedNames.map((name) => [name, {
    name,
    type: 'file',
    modifiedAt: '2026-09-04T00:00:00.000Z',
    protected: false,
  }]));
  const serializedLegacyDocument = JSON.stringify(legacyDocument, null, 2);

  try {
    delete process.env.MINIO_ENDPOINT;
    fs.mkdirSync(localStorageDir);
    for (const name of reservedNames) {
      fs.writeFileSync(path.join(localStorageDir, name), `${name} content`, 'utf8');
    }
    fs.writeFileSync(metadataPath, serializedLegacyDocument, 'utf8');

    assert.deepEqual([...loadMetadata(metadataPath).keys()].sort(), reservedNames.slice().sort());
    const service = new FileService({ localStorageDir, metadataPath, minioClient: null });

    // Construction is read-only: migration and marker creation happen only
    // after the selected storage has been inspected by initialize().
    assert.equal(fs.readFileSync(metadataPath, 'utf8'), serializedLegacyDocument);
    assert.equal(fs.existsSync(path.join(localStorageDir, FILE_STORAGE_IDENTITY_KEY)), false);

    process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION = 'true';
    await service.initialize();

    for (const name of reservedNames) {
      assert.equal(service.getMetadata(name)?.name, name);
    }
    const migratedDocument = readPersistedMetadataDocument(metadataPath);
    assert.equal(migratedDocument.storage.kind, 'local');
    assert.deepEqual(Object.keys(migratedDocument.entries).sort(), reservedNames.slice().sort());
    assert.equal(
      parseFileStorageIdentity(fs.readFileSync(
        path.join(localStorageDir, FILE_STORAGE_IDENTITY_KEY),
        'utf8'
      )),
      migratedDocument.storage.storageId
    );
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    if (previousUnboundMigration === undefined) {
      delete process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION;
    } else {
      process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION = previousUnboundMigration;
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('missing metadata is accepted only when local storage is actually empty', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-local-metadata-trust-'));
  const emptyStorageDir = path.join(root, 'empty-content-files');
  const populatedStorageDir = path.join(root, 'populated-content-files');
  const previousEndpoint = process.env.MINIO_ENDPOINT;

  try {
    delete process.env.MINIO_ENDPOINT;

    const emptyService = new FileService({
      localStorageDir: emptyStorageDir,
      metadataPath: path.join(root, 'empty-file-metadata.json'),
      minioClient: null,
    });
    assert.equal(fs.existsSync(emptyStorageDir), false);
    assert.equal(fs.existsSync(path.join(root, 'empty-file-metadata.json')), false);
    assert.equal(emptyService.isPasswordProtected('notes/new.md'), true);
    await emptyService.initialize();
    assert.equal(emptyService.isPasswordProtected('notes/new.md'), false);
    await emptyService.uploadFile('notes/new.md', 'new install content');
    const reloadedService = new FileService({
      localStorageDir: emptyStorageDir,
      metadataPath: path.join(root, 'empty-file-metadata.json'),
      minioClient: null,
    });
    await reloadedService.initialize();
    assert.equal(reloadedService.isPasswordProtected('notes/new.md'), false);

    fs.mkdirSync(populatedStorageDir);
    fs.writeFileSync(path.join(populatedStorageDir, 'existing.md'), 'existing content');
    const populatedService = new FileService({
        localStorageDir: populatedStorageDir,
        metadataPath: path.join(root, 'missing-file-metadata.json'),
        minioClient: null,
    });
    await assert.rejects(populatedService.initialize(), FileMetadataTrustError);
  } finally {
    if (previousEndpoint === undefined) {
      delete process.env.MINIO_ENDPOINT;
    } else {
      process.env.MINIO_ENDPOINT = previousEndpoint;
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('file metadata and protected storage cannot overlap any public static tree', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-metadata-separation-'));
  const localStorageDir = path.join(root, 'content-files');
  const publicUploadsDir = path.resolve('uploads');
  const frontendDistDir = path.resolve('..', 'frontend', 'dist');

  try {
    fs.mkdirSync(localStorageDir);
    assert.throws(
      () => new FileService({
        localStorageDir,
        metadataPath: path.join(localStorageDir, 'file-metadata.json'),
        minioClient: null,
      }),
      FileMetadataTrustError
    );
    assert.throws(
      () => new FileService({
        localStorageDir,
        metadataPath: path.join(publicUploadsDir, 'file-metadata.json'),
        minioClient: null,
      }),
      FileMetadataTrustError
    );
    assert.throws(
      () => new FileService({
        localStorageDir,
        metadataPath: path.join(frontendDistDir, 'file-metadata.json'),
        minioClient: null,
      }),
      FileMetadataTrustError
    );
    assert.throws(
      () => new FileService({
        localStorageDir: path.join(publicUploadsDir, 'protected-files'),
        metadataPath: path.join(root, 'private-metadata.json'),
        minioClient: null,
      }),
      FileMetadataTrustError
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('public-tree links cannot hide metadata or protected storage outside their lexical boundary', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-metadata-link-boundary-'));
  const publicRoot = path.join(root, 'public');
  const privateRoot = path.join(root, 'private');
  const linkedPrivate = path.join(publicRoot, 'linked-private');

  try {
    fs.mkdirSync(publicRoot);
    fs.mkdirSync(privateRoot);
    try {
      fs.symlinkSync(privateRoot, linkedPrivate, process.platform === 'win32' ? 'junction' : 'dir');
    } catch (error: any) {
      if (error?.code === 'EPERM' || error?.code === 'EACCES') {
        t.skip('directory link creation is not permitted on this platform');
        return;
      }
      throw error;
    }

    assert.throws(() => assertFileMetadataOutsideStorage(
      publicRoot,
      path.join(linkedPrivate, 'metadata.json')
    ));
    assert.throws(() => assertFileStorageOutsidePublicRoot(linkedPrivate, publicRoot));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('local storage identity marker is hidden from listings and user access', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-local-storage-identity-'));
  const localStorageDir = path.join(root, 'content-files');
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;

  try {
    delete process.env.MINIO_ENDPOINT;
    writeLocalStorageIdentity(localStorageDir);
    writeTrustedMetadata(metadataPath, 'local');
    fs.writeFileSync(path.join(localStorageDir, 'visible.md'), 'visible', 'utf8');
    const service = new FileService({ localStorageDir, metadataPath, minioClient: null });
    await service.initialize();

    assert.deepEqual((await service.listFiles()).map(file => file.name), ['visible.md']);
    await assert.rejects(service.getFileContent(FILE_STORAGE_IDENTITY_KEY), StoragePathError);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('legacy metadata is retired and cannot be replayed after the new index is lost', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-legacy-metadata-retirement-'));
  const localStorageDir = path.join(root, 'content-files');
  const metadataPath = path.join(root, 'storage-metadata', 'file-metadata.json');
  const legacyMetadataPath = path.join(root, 'file-metadata.json');
  const retiredLegacyMetadataPath = path.join(root, 'file-metadata.legacy-migrated.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const previousUnboundMigration = process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION;

  try {
    delete process.env.MINIO_ENDPOINT;
    fs.mkdirSync(localStorageDir);
    fs.writeFileSync(path.join(localStorageDir, 'first.md'), 'first', 'utf8');
    fs.writeFileSync(legacyMetadataPath, JSON.stringify({
      'first.md': {
        name: 'first.md',
        type: 'file',
        modifiedAt: '2026-09-04T00:00:00.000Z',
        protected: false,
      },
    }), 'utf8');

    delete process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION;
    const blockedMigration = new FileService({
      localStorageDir,
      metadataPath,
      legacyMetadataPath,
      retiredLegacyMetadataPath,
      minioClient: null,
    });
    await assert.rejects(blockedMigration.initialize(), FileMetadataTrustError);
    assert.equal(fs.existsSync(legacyMetadataPath), true);

    process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION = 'true';
    const migratedService = new FileService({
      localStorageDir,
      metadataPath,
      legacyMetadataPath,
      retiredLegacyMetadataPath,
      minioClient: null,
    });
    await migratedService.initialize();
    assert.equal(fs.existsSync(legacyMetadataPath), false);
    assert.equal(fs.existsSync(retiredLegacyMetadataPath), true);

    await migratedService.uploadFile(
      'vault/new-secret.md',
      'classified',
      { protected: true },
      'correct horse battery staple'
    );
    fs.rmSync(metadataPath);

    const replayAttempt = new FileService({
      localStorageDir,
      metadataPath,
      legacyMetadataPath,
      retiredLegacyMetadataPath,
      minioClient: null,
    });
    await assert.rejects(replayAttempt.initialize(), FileMetadataTrustError);
    assert.equal(replayAttempt.isPasswordProtected('vault/new-secret.md'), true);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    if (previousUnboundMigration === undefined) {
      delete process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION;
    } else {
      process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION = previousUnboundMigration;
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a trusted local restart finishes legacy retirement after v2 was already persisted', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-legacy-retirement-resume-'));
  const localStorageDir = path.join(root, 'content-files');
  const metadataPath = path.join(root, 'storage-metadata', 'file-metadata.json');
  const legacyMetadataPath = path.join(root, 'file-metadata.json');
  const retiredLegacyMetadataPath = path.join(root, 'file-metadata.legacy-migrated.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;

  try {
    delete process.env.MINIO_ENDPOINT;
    writeLocalStorageIdentity(localStorageDir);
    fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
    writeTrustedMetadata(metadataPath, 'local');
    fs.writeFileSync(legacyMetadataPath, '{}', 'utf8');

    const service = new FileService({
      localStorageDir,
      metadataPath,
      legacyMetadataPath,
      retiredLegacyMetadataPath,
      minioClient: null,
    });
    await service.initialize();

    assert.equal(fs.existsSync(metadataPath), true);
    assert.equal(fs.existsSync(legacyMetadataPath), false);
    assert.equal(fs.existsSync(retiredLegacyMetadataPath), true);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('local fallback listing never prunes protection metadata for absent MinIO objects', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-local-fallback-metadata-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;

  try {
    delete process.env.MINIO_ENDPOINT;
    fs.writeFileSync(metadataPath, JSON.stringify({
      'vault/remote-secret.md': {
        name: 'remote-secret.md',
        type: 'file',
        path: 'vault/remote-secret.md',
        modifiedAt: '2026-09-04T00:00:00.000Z',
        protected: true,
        passwordHash: '$2a$10$stored-password-hash',
      },
    }), 'utf8');
    const service = new FileService({
      localStorageDir: path.join(root, 'empty-local-fallback'),
      metadataPath,
      minioClient: null,
    });
    await service.initialize();

    assert.deepEqual(await service.listFiles(), []);
    assert.equal(service.isPasswordProtected('vault/remote-secret.md'), true);
    assert.equal(
      readPersistedMetadataDocument(metadataPath).entries['vault/remote-secret.md'].protected,
      true
    );
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('missing metadata keeps nonempty MinIO storage closed but permits an empty bucket', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-metadata-trust-'));
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const previousUnboundMigration = process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION;
  const storageState: TestMinioStorageState = {};
  const createMinioClient = (
    objectNames: string[],
    state: TestMinioStorageState = storageState
  ): Client => createIdentityAwareMinioClient({
    bucketExists: async () => true,
    listObjects: () => Readable.from(objectNames.map(name => ({ name }))),
  }, state);

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    delete process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION;

    const untrustedService = new FileService({
      localStorageDir: path.join(root, 'untrusted-local'),
      metadataPath: path.join(root, 'missing-untrusted-metadata.json'),
      minioClient: createMinioClient(['vault/secret.md']),
    });
    await assert.rejects(untrustedService.initialize(), FileMetadataTrustError);
    assert.equal(untrustedService.getStorageMode(), 'local');
    assert.equal(untrustedService.isPasswordProtected('vault/secret.md'), true);
    assert.equal(await untrustedService.verifyPassword('vault/secret.md', 'guess'), false);

    const legacyEmptyPath = path.join(root, 'legacy-empty-metadata.json');
    fs.writeFileSync(legacyEmptyPath, '{}', 'utf8');
    const legacyEmptyService = new FileService({
      localStorageDir: path.join(root, 'legacy-empty-local'),
      metadataPath: legacyEmptyPath,
      minioClient: createMinioClient(['vault/secret.md'], {}),
    });
    await assert.rejects(legacyEmptyService.initialize(), FileMetadataTrustError);

    const legacyNonemptyPath = path.join(root, 'legacy-nonempty-metadata.json');
    fs.writeFileSync(legacyNonemptyPath, JSON.stringify({
      'vault/known-secret.md': {
        name: 'known-secret.md',
        type: 'file',
        modifiedAt: '2026-09-04T00:00:00.000Z',
        protected: true,
        passwordHash: '$2a$10$stored-password-hash',
      },
    }), 'utf8');
    const legacyNonemptyService = new FileService({
      localStorageDir: path.join(root, 'legacy-nonempty-local'),
      metadataPath: legacyNonemptyPath,
      minioClient: createMinioClient(['vault/known-secret.md', 'public/extra.md'], {}),
    });
    await assert.rejects(legacyNonemptyService.initialize(), FileMetadataTrustError);

    const emptyMetadataPath = path.join(root, 'missing-empty-metadata.json');
    const emptyService = new FileService({
      localStorageDir: path.join(root, 'empty-local'),
      metadataPath: emptyMetadataPath,
      minioClient: createMinioClient([]),
    });
    await emptyService.initialize();
    assert.equal(emptyService.getStorageMode(), 'minio');
    assert.equal(emptyService.isPasswordProtected('notes/new.md'), false);
    const emptyMarker = readPersistedMetadataDocument(emptyMetadataPath);
    assert.equal(emptyMarker.storage.kind, 'minio');
    assert.deepEqual(emptyMarker.entries, {});

    // Public gallery uploads share the bucket but do not add file-service
    // metadata. The persisted empty marker keeps the next startup trusted.
    const restartedService = new FileService({
      localStorageDir: path.join(root, 'restarted-local'),
      metadataPath: emptyMetadataPath,
      minioClient: createMinioClient(['gallery/public-image.png']),
    });
    await restartedService.initialize();
    assert.equal(restartedService.getStorageMode(), 'minio');
    assert.equal(restartedService.isPasswordProtected('gallery/public-image.png'), false);

    const failedMarkerService = new FileService({
      localStorageDir: path.join(root, 'failed-marker-local'),
      metadataPath: path.join(root, 'missing-parent', 'file-metadata.json'),
      minioClient: createMinioClient([], {}),
    });
    fs.mkdirSync(path.join(root, 'missing-parent', 'file-metadata.json'), { recursive: true });
    await assert.rejects(failedMarkerService.initialize(), FileMetadataTrustError);
    assert.equal(failedMarkerService.isPasswordProtected('gallery/public-image.png'), true);
    await assert.rejects(failedMarkerService.listFiles(), FileMetadataTrustError);
  } finally {
    if (previousEndpoint === undefined) {
      delete process.env.MINIO_ENDPOINT;
    } else {
      process.env.MINIO_ENDPOINT = previousEndpoint;
    }
    if (previousUnboundMigration === undefined) {
      delete process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION;
    } else {
      process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION = previousUnboundMigration;
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('metadata binding rejects storage switches and MinIO outages without local fallback', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-storage-binding-mismatch-'));
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const previousBucket = process.env.MINIO_BUCKET;

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    process.env.MINIO_BUCKET = 'ink-spirit-blog';

    const localMetadataPath = path.join(root, 'local-metadata.json');
    const localStorageDir = path.join(root, 'local-content');
    writeLocalStorageIdentity(localStorageDir);
    writeTrustedMetadata(localMetadataPath, 'local');
    let bucketChecks = 0;
    const switchedService = new FileService({
      localStorageDir,
      metadataPath: localMetadataPath,
      minioClient: createIdentityAwareMinioClient({
        bucketExists: async () => {
          bucketChecks += 1;
          return true;
        },
      }),
    });
    await assert.rejects(switchedService.initialize(), FileMetadataTrustError);
    assert.equal(bucketChecks, 0);

    const minioMetadataPath = path.join(root, 'minio-metadata.json');
    writeTrustedMetadata(minioMetadataPath, 'minio');
    const wrongBucketService = new FileService({
      localStorageDir: path.join(root, 'wrong-bucket-local'),
      metadataPath: minioMetadataPath,
      minioClient: createIdentityAwareMinioClient({
        bucketExists: async () => true,
      }, { storageId: OTHER_STORAGE_ID }),
    });
    await assert.rejects(wrongBucketService.initialize(), FileMetadataTrustError);

    const fallbackStorageDir = path.join(root, 'fallback-local');
    writeLocalStorageIdentity(fallbackStorageDir, OTHER_STORAGE_ID);
    fs.writeFileSync(path.join(fallbackStorageDir, 'secret.md'), 'must stay closed', 'utf8');
    const outageService = new FileService({
      localStorageDir: fallbackStorageDir,
      metadataPath: minioMetadataPath,
      minioClient: createIdentityAwareMinioClient({
        bucketExists: async () => {
          throw Object.assign(new Error('injected outage'), { code: 'ECONNREFUSED' });
        },
      }),
    });
    await assert.rejects(outageService.initialize(), FileMetadataTrustError);
    await assert.rejects(outageService.getFileContent('secret.md'), FileMetadataTrustError);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    if (previousBucket === undefined) delete process.env.MINIO_BUCKET;
    else process.env.MINIO_BUCKET = previousBucket;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MinIO initialization rejects every anonymous Allow policy', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-private-policy-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const publicPolicy = JSON.stringify({
    Statement: [{
      Effect: 'Allow',
      Principal: '*',
      Action: ['s3:GetObject'],
      Resource: ['arn:aws:s3:::ink-spirit-blog/*'],
    }],
  });

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    writeTrustedMetadata(metadataPath, 'minio');
    assert.equal(minioBucketPolicyAllowsAnonymousAccess(publicPolicy), true);
    assert.equal(minioBucketPolicyAllowsAnonymousAccess(JSON.stringify({
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: 'arn:aws:iam::123456789012:user/backend' },
        Action: 's3:GetObject',
      }],
    })), false);
    for (const action of [
      's3:Get*',
      's3:GetObjec?',
      's3:GetObjectVersion',
      's3:PutObject',
      's3:DeleteObject',
      's3:SelectObjectContent',
      's3:ListBucket',
    ]) {
      assert.equal(minioBucketPolicyAllowsAnonymousAccess(JSON.stringify({
        Statement: [{ Effect: 'Allow', Principal: '*', Action: action }],
      })), true);
    }
    assert.equal(minioBucketPolicyAllowsAnonymousAccess(JSON.stringify({
      Statement: [{ Effect: 'Allow', Principal: '*', NotAction: 's3:PutObject' }],
    })), true);
    assert.equal(minioBucketPolicyAllowsAnonymousAccess(JSON.stringify({
      Statement: [{ Effect: 'Allow', Principal: '*', NotAction: 's3:GetObject' }],
    })), true);
    assert.equal(minioBucketPolicyAllowsAnonymousAccess(JSON.stringify({
      Statement: [{ Effect: 'Allow', Principal: '*', NotAction: 's3:GetObject*' }],
    })), true);
    assert.equal(minioBucketPolicyAllowsAnonymousAccess(JSON.stringify({
      Statement: [{
        Effect: 'Allow',
        NotPrincipal: { AWS: 'arn:aws:iam::123456789012:user/backend' },
        Action: 's3:GetObject',
      }],
    })), true);
    assert.equal(minioBucketPolicyAllowsAnonymousAccess(JSON.stringify({
      Statement: [{ Effect: 'Allow', Principal: '*' }],
    })), true);

    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath,
      minioClient: createIdentityAwareMinioClient({
        bucketExists: async () => true,
        getBucketPolicy: async () => publicPolicy,
      }),
    });
    await assert.rejects(service.initialize(), FileMetadataTrustError);
    assert.equal(service.isPasswordProtected('vault/secret.md'), true);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MinIO transport enforces a bounded socket deadline', () => {
  assert.equal(resolveMinioEnabled(undefined, undefined), false);
  assert.equal(resolveMinioEnabled(undefined, 'minio.internal'), true);
  assert.equal(resolveMinioEnabled('true', 'minio.internal'), true);
  assert.equal(resolveMinioEnabled('true', undefined), true);
  assert.equal(resolveMinioEnabled('false', 'minio.internal'), false);
  assert.throws(() => resolveMinioEnabled('yes', 'minio.internal'));

  assert.equal(resolveMinioRequestTimeout(undefined), 15_000);
  assert.equal(resolveMinioRequestTimeout('2500'), 2_500);
  assert.throws(() => resolveMinioRequestTimeout('0'));
  assert.throws(() => resolveMinioRequestTimeout('not-a-number'));

  let configuredTimeout = 0;
  let timeoutHandler: (() => void) | undefined;
  let destroyedError: Error & { code?: string } | undefined;
  const fakeRequest = {
    once() {
      return this;
    },
    setTimeout(timeoutMs: number, handler: () => void) {
      configuredTimeout = timeoutMs;
      timeoutHandler = handler;
      return this;
    },
    destroy(error: Error & { code?: string }) {
      destroyedError = error;
      return this;
    },
  };
  const transport = createMinioRequestTransport({
    request: (() => fakeRequest) as any,
  }, 2_500);

  (transport.request as any)({ method: 'GET' });
  assert.equal(configuredTimeout, 2_500);
  timeoutHandler?.();
  assert.equal(destroyedError?.code, 'ETIMEDOUT');
});

test('MinIO transport deadline also covers a DNS lookup that never completes', async () => {
  const transport = createMinioRequestTransport(http, 50);
  let request: http.ClientRequest | undefined;
  let watchdog: NodeJS.Timeout | undefined;

  try {
    const errorCode = await new Promise<string | undefined>((resolve) => {
      request = transport.request({
        host: 'minio.invalid',
        port: 80,
        method: 'GET',
        lookup: (() => {
          // Deliberately never invoke the callback to model a stalled resolver.
        }) as any,
      });
      request.once('error', (error: NodeJS.ErrnoException) => resolve(error.code));
      request.end();
      watchdog = setTimeout(() => {
        request?.destroy(Object.assign(new Error('test watchdog expired'), {
          code: 'TEST_WATCHDOG',
        }));
      }, 1_000);
    });

    assert.equal(errorCode, 'ETIMEDOUT');
  } finally {
    if (watchdog) clearTimeout(watchdog);
    request?.destroy();
  }
});

test('MinIO metadata mutations preserve protection records across concurrent uploads', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-file-metadata-concurrency-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  let markPublicPutStarted!: () => void;
  let releasePublicPut!: () => void;
  const publicPutStarted = new Promise<void>((resolve) => { markPublicPutStarted = resolve; });
  const publicPutGate = new Promise<void>((resolve) => { releasePublicPut = resolve; });

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    writeTrustedMetadata(metadataPath, 'minio');
    const minioClient = createIdentityAwareMinioClient({
      bucketExists: async () => true,
      putObject: async (_bucket: string, objectKey: string) => {
        if (objectKey === 'notes/public.md') {
          markPublicPutStarted();
          await publicPutGate;
        }
        return { etag: 'test-etag', versionId: null };
      },
      removeObject: async () => undefined,
    });
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath,
      minioClient,
    });
    await service.initialize();

    const publicUpload = service.uploadFile('notes/public.md', 'public');
    await publicPutStarted;
    const protectedUpload = service.uploadFile(
      'vault/secret.md',
      'classified',
      { protected: true }
    );
    await new Promise<void>((resolve) => setImmediate(resolve));
    releasePublicPut();
    await Promise.all([publicUpload, protectedUpload]);

    const persistedMetadata = readPersistedMetadataDocument(metadataPath).entries;
    assert.deepEqual(Object.keys(persistedMetadata).sort(), [
      'notes/public.md',
      'vault/secret.md',
    ]);
    assert.equal(persistedMetadata['vault/secret.md'].protected, true);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a concurrent delete runs after an in-flight protected MinIO upload', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-file-upload-delete-race-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const remoteObjects = new Set<string>();
  let markPutStarted!: () => void;
  let releasePut!: () => void;
  const putStarted = new Promise<void>((resolve) => { markPutStarted = resolve; });
  const putGate = new Promise<void>((resolve) => { releasePut = resolve; });

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    writeTrustedMetadata(metadataPath, 'minio');
    const minioClient = createIdentityAwareMinioClient({
      bucketExists: async () => true,
      listObjects: (_bucket: string, prefix: string) => Readable.from(
        [...remoteObjects]
          .filter((objectKey) => objectKey.startsWith(prefix))
          .map((name) => ({ name, size: 1 })),
        { objectMode: true }
      ),
      putObject: async (_bucket: string, objectKey: string) => {
        markPutStarted();
        await putGate;
        remoteObjects.add(objectKey);
        return { etag: 'test-etag', versionId: null };
      },
      removeObject: async (_bucket: string, objectKey: string) => {
        remoteObjects.delete(objectKey);
      },
    });
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath,
      minioClient,
    });
    await service.initialize();

    const upload = service.uploadFile(
      'vault/race.md',
      'classified',
      { protected: true }
    );
    await putStarted;
    const deletion = service.deleteFile('vault/race.md');
    await new Promise<void>((resolve) => setImmediate(resolve));
    releasePut();
    await Promise.all([upload, deletion]);

    assert.equal(remoteObjects.has('vault/race.md'), false);
    assert.equal(service.getMetadata('vault/race.md'), undefined);
    assert.equal(readPersistedMetadataDocument(metadataPath).entries['vault/race.md'], undefined);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a failed metadata mutation releases the queue for the next upload', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-file-mutation-recovery-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const remoteObjects = new Set<string>();

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    writeTrustedMetadata(metadataPath, 'minio');
    const minioClient = createIdentityAwareMinioClient({
      bucketExists: async () => true,
      putObject: async (_bucket: string, objectKey: string) => {
        if (objectKey === 'notes/fails.md') throw new Error('injected put failure');
        remoteObjects.add(objectKey);
        return { etag: 'test-etag', versionId: null };
      },
    });
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath,
      minioClient,
    });
    await service.initialize();

    const [failed, succeeded] = await Promise.allSettled([
      service.uploadFile('notes/fails.md', 'first'),
      service.uploadFile('notes/succeeds.md', 'second'),
    ]);
    assert.equal(failed.status, 'rejected');
    assert.equal(succeeded.status, 'fulfilled');
    assert.equal(remoteObjects.has('notes/succeeds.md'), true);
    assert.equal(service.getMetadata('notes/succeeds.md')?.path, 'notes/succeeds.md');
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MinIO trust probing stops at the first object even if the listing never ends', {
  timeout: 1_000,
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-first-object-probe-'));
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const objectStream = new Readable({ objectMode: true, read() {} });

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    const minioClient = {
      bucketExists: async () => true,
      listObjects: () => objectStream,
    } as unknown as Client;
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath: path.join(root, 'missing-metadata.json'),
      minioClient,
    });

    const initialization = service.initialize();
    objectStream.push({ name: 'gallery/existing.png' });
    await assert.rejects(initialization, FileMetadataTrustError);
    assert.equal(objectStream.destroyed, true);
  } finally {
    objectStream.destroy();
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MinIO trust probing fails closed when the listing closes without a result', {
  timeout: 1_000,
}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-close-only-probe-'));
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const objectStream = new Readable({ objectMode: true, read() {} });

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    const minioClient = {
      bucketExists: async () => true,
      listObjects: () => objectStream,
    } as unknown as Client;
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath: path.join(root, 'missing-metadata.json'),
      minioClient,
    });

    const initialization = service.initialize();
    setImmediate(() => objectStream.destroy());
    await assert.rejects(initialization, FileMetadataTrustError);
    assert.equal(service.isPasswordProtected('vault/unknown.md'), true);
  } finally {
    objectStream.destroy();
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MinIO directory listing honors CommonPrefixes and exact subdirectory boundaries', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-common-prefixes-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const listCalls: Array<[string, boolean]> = [];

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    writeTrustedMetadata(metadataPath, 'minio');
    const minioClient = createIdentityAwareMinioClient({
      bucketExists: async () => true,
      listObjects: (_bucket: string, prefix: string, recursive: boolean) => {
        listCalls.push([prefix, recursive]);
        if (prefix === '') {
          return Readable.from([
            { name: FILE_STORAGE_IDENTITY_KEY, size: 128 },
            { prefix: 'foo/' },
            { name: 'root.md', size: 4 },
          ], { objectMode: true });
        }
        if (prefix === 'foo/') {
          return Readable.from([
            { prefix: 'foo/nested/' },
            { name: 'foo/entry.md', size: 5 },
          ], { objectMode: true });
        }
        return Readable.from([], { objectMode: true });
      },
    });
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath,
      minioClient,
    });
    await service.initialize();

    const rootFiles = await service.listFiles();
    const nestedFiles = await service.listFiles('foo');

    assert.deepEqual(rootFiles.map(({ name, type, path: filePath }) => ({
      name,
      type,
      path: filePath,
    })), [
      { name: 'foo', type: 'directory', path: 'foo' },
      { name: 'root.md', type: 'file', path: 'root.md' },
    ]);
    assert.deepEqual(nestedFiles.map(({ name, type, path: filePath }) => ({
      name,
      type,
      path: filePath,
    })), [
      { name: 'nested', type: 'directory', path: 'foo/nested' },
      { name: 'entry.md', type: 'file', path: 'foo/entry.md' },
    ]);
    assert.deepEqual(listCalls, [
      ['', false],
      ['foo/', false],
    ]);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MinIO listing stops and rejects directories beyond the public entry limit', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-list-limit-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  let listingStream: Readable | undefined;

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    writeTrustedMetadata(metadataPath, 'minio');
    const minioClient = createIdentityAwareMinioClient({
      bucketExists: async () => true,
      listObjects: () => {
        listingStream = Readable.from(
          Array.from({ length: FILE_LIST_MAX_ENTRIES + 1 }, (_, index) => ({
            name: `many/${index}.md`,
            size: 1,
          })),
          { objectMode: true }
        );
        return listingStream;
      },
    });
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath,
      minioClient,
    });
    await service.initialize();

    await assert.rejects(service.listFiles('many'), FileListTooLargeError);
    assert.equal(listingStream?.destroyed, true);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MinIO empty directories remain visible and recursive deletion stays prefix-scoped', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-directory-lifecycle-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const remoteObjects = new Set<string>();

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    writeTrustedMetadata(metadataPath, 'minio');
    const minioClient = createIdentityAwareMinioClient({
      bucketExists: async () => true,
      listObjects: (_bucket: string, prefix: string) => Readable.from(
        [...remoteObjects]
          .filter((objectKey) => objectKey.startsWith(prefix))
          .map((name) => ({ name, size: 1 })),
        { objectMode: true }
      ),
      putObject: async (_bucket: string, objectKey: string) => {
        remoteObjects.add(objectKey);
        return { etag: 'test-etag', versionId: null };
      },
      removeObject: async (_bucket: string, objectKey: string) => {
        remoteObjects.delete(objectKey);
      },
    });
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath,
      minioClient,
    });
    await service.initialize();

    await service.createDirectory('foo', { name: 'foo' });
    assert.deepEqual((await service.listFiles()).map(({ name, type, path: itemPath }) => ({
      name,
      type,
      path: itemPath,
    })), [{ name: 'foo', type: 'directory', path: 'foo' }]);

    await service.uploadFile('foo/first.md', 'first');
    await service.uploadFile('foo/nested/second.md', 'second');
    remoteObjects.add('foobar/keep.md');
    await service.deleteFile('foo');

    assert.deepEqual([...remoteObjects], ['foobar/keep.md']);
    assert.equal(service.getMetadata('foo'), undefined);
    assert.equal(service.getMetadata('foo/first.md'), undefined);
    assert.equal(service.getMetadata('foo/nested/second.md'), undefined);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MinIO file and descendant collisions fail closed without dropping protection metadata', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-key-collision-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const remoteObjects = new Set<string>();

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    writeTrustedMetadata(metadataPath, 'minio');
    const minioClient = createIdentityAwareMinioClient({
      bucketExists: async () => true,
      listObjects: (_bucket: string, prefix: string) => Readable.from(
        [...remoteObjects]
          .filter((objectKey) => objectKey.startsWith(prefix))
          .map((name) => ({ name, size: 1 })),
        { objectMode: true }
      ),
      putObject: async (_bucket: string, objectKey: string) => {
        remoteObjects.add(objectKey);
        return { etag: 'test-etag', versionId: null };
      },
      removeObject: async (_bucket: string, objectKey: string) => {
        remoteObjects.delete(objectKey);
      },
    });
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath,
      minioClient,
    });
    await service.initialize();

    await service.uploadFile('foo', 'root object');
    await service.uploadFile('foo/bar', 'protected child', undefined, 'secret-password');
    await assert.rejects(
      service.deleteFile('foo'),
      /refusing an ambiguous file-tree deletion/
    );

    assert.deepEqual([...remoteObjects].sort(), ['foo', 'foo/bar']);
    assert.equal(service.getMetadata('foo')?.type, 'file');
    assert.equal(service.isPasswordProtected('foo/bar'), true);
    assert.equal(service.getMetadata('foo/bar')?.protected, true);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MinIO directory metadata cannot discard protection for an exact colliding object', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-directory-collision-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  const remoteObjects = new Set<string>();

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    writeTrustedMetadata(metadataPath, 'minio');
    const minioClient = createIdentityAwareMinioClient({
      bucketExists: async () => true,
      listObjects: (_bucket: string, prefix: string) => Readable.from(
        [...remoteObjects]
          .filter((objectKey) => objectKey.startsWith(prefix))
          .map((name) => ({ name, size: 1 })),
        { objectMode: true }
      ),
      removeObject: async (_bucket: string, objectKey: string) => {
        remoteObjects.delete(objectKey);
      },
    });
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath,
      minioClient,
    });
    await service.initialize();

    await service.createDirectory('foo', { name: 'foo', protected: true });
    remoteObjects.add('foo');
    remoteObjects.add('foo/bar');
    await service.uploadFile('foo/bar', 'protected child', undefined, 'secret-password');

    await assert.rejects(
      service.deleteFile('foo'),
      /refusing an ambiguous file-tree deletion/
    );
    assert.deepEqual([...remoteObjects].sort(), ['foo', 'foo/bar']);
    assert.equal(service.isPasswordProtected('foo'), true);
    assert.equal(service.isPasswordProtected('foo/bar'), true);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('public MinIO content preview rejects oversized objects before opening the stream', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-content-limit-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const previousEndpoint = process.env.MINIO_ENDPOINT;
  let objectReads = 0;

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    writeTrustedMetadata(metadataPath, 'minio');
    const minioClient = createIdentityAwareMinioClient({
      bucketExists: async () => true,
      statObject: async () => ({ size: FILE_CONTENT_PREVIEW_MAX_BYTES + 1 }),
      getObject: async () => {
        objectReads += 1;
        return Readable.from([Buffer.from('must not be read')]);
      },
    });
    const service = new FileService({
      localStorageDir: path.join(root, 'local'),
      metadataPath,
      minioClient,
    });
    await service.initialize();

    await assert.rejects(
      service.getFileContent('public/oversized.md'),
      FileContentTooLargeError
    );
    assert.equal(objectReads, 0);
  } finally {
    if (previousEndpoint === undefined) delete process.env.MINIO_ENDPOINT;
    else process.env.MINIO_ENDPOINT = previousEndpoint;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('file metadata saves atomically, replaces an existing file, and cleans failed temp files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-file-metadata-save-'));
  const metadataPath = path.join(root, 'file-metadata.json');
  const metadata = loadMetadata(path.join(root, 'new-install-metadata.json'));
  metadata.set('notes/entry.md', {
    name: 'entry.md',
    type: 'file',
    modifiedAt: '2026-09-04T00:00:00.000Z',
    protected: false,
  });

  try {
    const storageBinding = createFileStorageBinding('local', TEST_STORAGE_ID);
    saveMetadata(metadata, metadataPath, storageBinding);
    metadata.set('notes/second.md', {
      name: 'second.md',
      type: 'file',
      modifiedAt: '2026-09-04T00:01:00.000Z',
      protected: false,
    });
    saveMetadata(metadata, metadataPath, storageBinding);

    const persistedMetadata = readPersistedMetadataDocument(metadataPath);
    assert.deepEqual(Object.keys(persistedMetadata.entries).sort(), [
      'notes/entry.md',
      'notes/second.md',
    ]);
    assert.deepEqual(fs.readdirSync(root), ['file-metadata.json']);

    fs.rmSync(metadataPath);
    fs.mkdirSync(metadataPath);
    assert.throws(() => saveMetadata(metadata, metadataPath, storageBinding));
    assert.deepEqual(fs.readdirSync(root), ['file-metadata.json']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('password-protected creation never writes content when metadata persistence fails', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-protected-file-create-'));
  const localStorageDir = path.join(root, 'content-files');
  const metadataPath = path.join(root, 'file-metadata.json');

  try {
    const service = new FileService({ localStorageDir, metadataPath, minioClient: null });
    await service.initialize();
    fs.rmSync(metadataPath);
    fs.mkdirSync(metadataPath);

    await assert.rejects(
      service.uploadFile(
        'vault/secret.md',
        'classified',
        { name: 'secret.md' },
        'correct horse battery staple'
      )
    );

    assert.equal(fs.existsSync(path.join(localStorageDir, 'vault', 'secret.md')), false);
    assert.equal(service.isPasswordProtected('vault/secret.md'), false);
    assert.deepEqual(fs.readdirSync(root).sort(), ['content-files', 'file-metadata.json']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('temporary upload cleanup never scans permanent upload siblings', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-upload-cleanup-'));
  const temporaryRoot = path.join(root, 'temp', 'uploads');
  const permanentRoot = path.join(root, 'uploads', 'gallery');
  const oldTemporaryFile = path.join(temporaryRoot, 'stale-upload.png');
  const recentTemporaryFile = path.join(temporaryRoot, 'active-upload.png');
  const permanentFile = path.join(permanentRoot, 'published-image.png');
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000;

  try {
    fs.mkdirSync(temporaryRoot, { recursive: true });
    fs.mkdirSync(permanentRoot, { recursive: true });
    fs.writeFileSync(oldTemporaryFile, 'stale');
    fs.writeFileSync(recentTemporaryFile, 'active');
    fs.writeFileSync(permanentFile, 'published');
    const oldTimestamp = new Date(now - maxAge - 1_000);
    fs.utimesSync(oldTemporaryFile, oldTimestamp, oldTimestamp);
    fs.utimesSync(permanentFile, oldTimestamp, oldTimestamp);

    const result = cleanupExpiredTemporaryUploads(temporaryRoot, maxAge, now);

    assert.equal(result.removedFiles, 1);
    assert.equal(result.failedEntries, 0);
    assert.equal(fs.existsSync(oldTemporaryFile), false);
    assert.equal(fs.existsSync(recentTemporaryFile), true);
    assert.equal(fs.existsSync(permanentFile), true);

    const middlewareSource = fs.readFileSync(
      path.join('src', 'middleware', 'upload.middleware.ts'),
      'utf8'
    );
    assert.match(middlewareSource, /TEMPORARY_UPLOAD_DIR = path\.join\(resolveBackendRoot\(\), 'temp', 'uploads'\)/);
    assert.match(middlewareSource, /cleanupExpiredTemporaryUploads\(TEMPORARY_UPLOAD_DIR, maxAge\)/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('batch image upload coordinates mixed-storage rollback and reports cleanup failures', async () => {
  const files = ['local.png', 'minio.png', 'failed.png'].map((originalname) => ({
    originalname,
    path: `staging/${originalname}`,
  } as Express.Multer.File));
  const completedUploads: Record<string, ProcessedImageUpload> = {
    'local.png': {
      originalUrl: '/uploads/gallery/local-id.png', filename: 'local-id.png',
      mimetype: 'image/png', size: 10, storage: 'local',
    },
    'minio.png': {
      originalUrl: '/api/minio/gallery/minio-id.png', filename: 'minio-id.png',
      mimetype: 'image/png', size: 20, storage: 'minio',
    },
  };
  const rollbackCalls: Array<[string, string, string]> = [];
  const cleanedStagingPaths: string[] = [];

  const result = await coordinateBatchImageUploads(files, 'gallery', {
    processUpload: async (file) => {
      if (file.originalname === 'failed.png') {
        throw new Error('injected image processing failure');
      }
      return completedUploads[file.originalname]!;
    },
    rollbackUpload: async (filename, type, storage) => {
      rollbackCalls.push([filename, type, storage]);
      return storage !== 'minio';
    },
    cleanupStagedUpload: (filePath) => { cleanedStagingPaths.push(filePath); },
  });

  assert.equal(result.ok, false);
  assert.equal(result.failedUploads, 1);
  assert.equal(result.rollbackFailures, 1);
  assert.equal(result.stagingCleanupFailures, 0);
  assert.deepEqual(result.failureCategories, ['image_processing_failed']);
  assert.equal(result.errorMessage, '批量上传失败，部分文件清理失败，请检查服务端日志');
  assert.deepEqual(rollbackCalls, [
    ['local-id.png', 'gallery', 'local'],
    ['minio-id.png', 'gallery', 'minio'],
  ]);
  assert.deepEqual(cleanedStagingPaths, files.map((file) => file.path));

  const routeSource = fs.readFileSync(path.join('src', 'routes', 'upload.ts'), 'utf8');
  assert.match(routeSource, /uploadService\.coordinateBatchImageUploads/);
  assert.match(routeSource, /cleanupStagedUpload: deleteUploadedFileOrThrow/);
});

test('local image upload removes the original when thumbnail generation fails', async () => {
  const uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-image-compensation-'));
  const type = 'gallery';
  const filename = 'fault-injection.png';
  const typeDir = path.join(uploadRoot, type);
  const originalPath = path.join(typeDir, filename);
  const thumbnailPath = path.join(typeDir, `thumb_${filename}`);

  try {
    fs.mkdirSync(typeDir, { recursive: true });
    // A directory at the output path makes sharp fail only after the original has been written.
    fs.mkdirSync(thumbnailPath);
    const fileBuffer = await sharp({
      create: {
        width: 16,
        height: 16,
        channels: 4,
        background: { r: 20, g: 40, b: 60, alpha: 1 },
      },
    }).png().toBuffer();

    await assert.rejects(
      writeImageToLocalStorage({
        fileBuffer,
        filename,
        type,
        generateThumbnail: true,
        thumbnailWidth: 8,
        dimensions: { width: 16, height: 16 },
        uploadRoot,
      })
    );

    assert.equal(fs.existsSync(originalPath), false);
    assert.equal(fs.statSync(thumbnailPath).isDirectory(), true);
  } finally {
    fs.rmSync(uploadRoot, { recursive: true, force: true });
  }
});

test('local image upload rejects dot path segments without escaping its storage root', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-image-path-boundary-'));
  const outsidePath = path.join(path.dirname(root), 'escape.png');

  try {
    const fileBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: { r: 1, g: 2, b: 3, alpha: 1 },
      },
    }).png().toBuffer();

    await assert.rejects(
      writeImageToLocalStorage({
        fileBuffer,
        filename: 'escape.png',
        type: '..',
        generateThumbnail: false,
        thumbnailWidth: 1,
        uploadRoot: root,
      }),
      /无效的存储名称/
    );
    assert.equal(fs.existsSync(outsidePath), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('image upload removes its staged file when metadata parsing fails', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-image-metadata-failure-'));
  const stagedPath = path.join(root, 'invalid-image.bin');
  fs.writeFileSync(stagedPath, 'not an image', 'utf8');
  const file = {
    fieldname: 'image', originalname: 'invalid.png', encoding: '7bit',
    mimetype: 'image/png', size: fs.statSync(stagedPath).size,
    destination: root, filename: 'invalid-image.bin', path: stagedPath,
  } as Express.Multer.File;

  try {
    await assert.rejects(processImageUpload(
      file,
      { type: 'gallery', generateThumbnail: true },
      { useMinio: false, uploadRoot: path.join(root, 'uploads') }
    ));
    assert.equal(fs.existsSync(stagedPath), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('file info and ordinary deletion discover a local fallback before probing MinIO', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-local-fallback-discovery-'));
  const type = 'gallery';
  const filename = 'fallback.png';
  const typeDir = path.join(root, type);
  const originalPath = path.join(typeDir, filename);
  const thumbnailPath = path.join(typeDir, `thumb_${filename}`);
  const minioCalls: string[] = [];

  try {
    fs.mkdirSync(typeDir, { recursive: true });
    fs.writeFileSync(originalPath, 'original', 'utf8');
    fs.writeFileSync(thumbnailPath, 'thumbnail', 'utf8');
    const minioClient = {
      statObject: async (_bucket: string, objectKey: string) => {
        minioCalls.push(`stat:${objectKey}`);
        throw new Error('MinIO should not be probed for a confirmed local fallback');
      },
      removeObject: async (_bucket: string, objectKey: string) => {
        minioCalls.push(`remove:${objectKey}`);
      },
    } as unknown as Pick<Client, 'statObject' | 'removeObject'>;
    const dependencies = { useMinio: true, minioClient, uploadRoot: root };

    assert.deepEqual(await getFileInfo(filename, type, dependencies), {
      exists: true,
      url: `/uploads/${type}/${filename}`,
      thumbnailUrl: `/uploads/${type}/thumb_${filename}`,
      storage: 'local',
    });
    assert.equal(await deleteUploadedImage(filename, type, undefined, dependencies), true);
    assert.equal(fs.existsSync(originalPath), false);
    assert.equal(fs.existsSync(thumbnailPath), false);
    assert.deepEqual(minioCalls, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MinIO image deletion reports a thumbnail cleanup failure instead of returning success', async () => {
  const calls: string[] = [];
  const minioClient = {
    removeObject: async (_bucket: string, objectKey: string) => {
      calls.push(objectKey);
      if (objectKey.includes('/thumb_')) {
        throw new Error('injected thumbnail deletion failure');
      }
    },
  } as unknown as Pick<Client, 'removeObject'>;

  const deleted = await deleteUploadedImage(
    'example.png',
    'gallery',
    'minio',
    { useMinio: true, minioClient }
  );

  assert.equal(deleted, false);
  assert.deepEqual(calls.sort(), ['gallery/example.png', 'gallery/thumb_example.png']);
  const minioRouteSource = fs.readFileSync(path.join('src', 'routes', 'minio.ts'), 'utf8');
  assert.match(minioRouteSource, /deleteUploadedFile\(filename, type, 'minio'\)/);
  assert.doesNotMatch(minioRouteSource, /缩略图可能不存在，忽略/);
});

test('partial MinIO upload is compensated before falling back to local storage', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-minio-upload-fallback-'));
  const uploadRoot = path.join(root, 'uploads');
  const stagedPath = path.join(root, 'staged.png');
  const calls: string[] = [];
  const remoteObjects = new Set<string>();

  try {
    const fileBuffer = await sharp({
      create: {
        width: 16,
        height: 16,
        channels: 4,
        background: { r: 80, g: 60, b: 40, alpha: 1 },
      },
    }).png().toBuffer();
    fs.writeFileSync(stagedPath, fileBuffer);

    const minioClient = {
      putObject: async (_bucket: string, objectKey: string) => {
        calls.push(`put:${objectKey}`);
        // 模拟服务端已落对象、客户端随后收到失败的模糊结果。
        remoteObjects.add(objectKey);
        if (objectKey.includes('/thumb_')) {
          throw new Error('injected thumbnail upload failure');
        }
        return { etag: 'test-etag', versionId: null };
      },
      removeObject: async (_bucket: string, objectKey: string) => {
        calls.push(`remove:${objectKey}`);
        remoteObjects.delete(objectKey);
      },
    } as unknown as Pick<Client, 'putObject' | 'removeObject'>;
    const file = {
      fieldname: 'images',
      originalname: 'fallback.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: fileBuffer.length,
      destination: root,
      filename: 'staged.png',
      path: stagedPath,
      buffer: fileBuffer,
    } as Express.Multer.File;

    const result = await processImageUpload(
      file,
      { type: 'gallery', generateThumbnail: true, thumbnailWidth: 8 },
      { useMinio: true, minioClient, uploadRoot }
    );

    assert.equal(result.storage, 'local');
    assert.equal(result.originalUrl, `/uploads/gallery/${result.filename}`);
    assert.equal(result.thumbnailUrl, `/uploads/gallery/thumb_${result.filename}`);
    assert.deepEqual(calls, [
      `put:gallery/${result.filename}`,
      `put:gallery/thumb_${result.filename}`,
      `remove:gallery/thumb_${result.filename}`,
      `remove:gallery/${result.filename}`,
    ]);
    assert.equal(remoteObjects.size, 0);
    assert.equal(fs.existsSync(path.join(uploadRoot, 'gallery', result.filename)), true);
    assert.equal(fs.existsSync(stagedPath), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('hidden games are only included for authenticated administrators', () => {
  assert.equal(canIncludeHiddenGames(true, undefined), false);
  assert.equal(canIncludeHiddenGames(true, { role: 'USER' }), false);
  assert.equal(canIncludeHiddenGames(false, { role: 'ADMIN' }), false);
  assert.equal(canIncludeHiddenGames(true, { role: 'ADMIN' }), true);
  assert.deepEqual(buildGameLookupWhere('game-1', false), {
    id: 'game-1',
    isHidden: false,
  });
  assert.deepEqual(buildGameLookupWhere('game-1', true), { id: 'game-1' });
});

test('protected file access canonicalizes aliases before checking metadata and passwords', async () => {
  const checkedKeys: string[] = [];
  const protectedKey = 'vault/secret.md';
  const access = await authorizeStoredFileAccess({
    storageKey: './vault//secret.md',
    password: 'correct horse battery staple',
    userRole: 'USER',
    isProtected: (key) => {
      checkedKeys.push(key);
      return key === protectedKey;
    },
    verifyPassword: async (key, password) => {
      checkedKeys.push(key);
      return key === protectedKey && password === 'correct horse battery staple';
    },
  });

  assert.deepEqual(access, { allowed: true, storageKey: protectedKey });
  assert.deepEqual(checkedKeys, [protectedKey, protectedKey]);

  const missingPassword = await authorizeStoredFileAccess({
    storageKey: protectedKey,
    userRole: 'USER',
    isProtected: () => true,
    verifyPassword: async () => false,
  });
  assert.deepEqual(missingPassword, {
    allowed: false,
    storageKey: protectedKey,
    reason: 'password_required',
  });

  const adminAccess = await authorizeStoredFileAccess({
    storageKey: protectedKey,
    userRole: 'ADMIN',
    isProtected: () => true,
    verifyPassword: async () => false,
  });
  assert.deepEqual(adminAccess, { allowed: true, storageKey: protectedKey });
});

test('MinIO downloads stay same-origin, stream content, and hide internal missing paths', async () => {
  const originalGetStorageMode = fileService.getStorageMode;
  const originalIsPasswordProtected = fileService.isPasswordProtected;
  const originalGetMetadata = fileService.getMetadata;
  const originalGetFileStream = fileService.getFileStream;
  const originalGetFileContent = fileService.getFileContent;

  fileService.getStorageMode = () => 'minio';
  fileService.isPasswordProtected = () => false;
  fileService.getMetadata = () => undefined;
  fileService.getFileStream = async () => Readable.from([
    Buffer.from('chunk-a'),
    Buffer.from('-chunk-b'),
  ]);

  const app = express();
  app.use('/api/files', fileRoutes);
  const server = app.listen(0, '127.0.0.1');

  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const streamedResponse = await fetch(
      `${baseUrl}/api/files/download?path=${encodeURIComponent('public/demo.bin')}`,
      { headers: { 'X-File-Password': 'stale-header-value' }, redirect: 'manual' }
    );
    assert.equal(streamedResponse.status, 200);
    assert.equal(streamedResponse.headers.get('location'), null);
    assert.equal(
      streamedResponse.headers.get('cache-control'),
      'public, max-age=0, must-revalidate'
    );
    assert.equal(await streamedResponse.text(), 'chunk-a-chunk-b');

    const internalPath = 'D:\\private\\content-files\\missing.bin';
    fileService.getFileStream = async () => {
      throw Object.assign(new Error(`ENOENT: no such file, open '${internalPath}'`), {
        code: 'ENOENT',
      });
    };
    const missingResponse = await fetch(
      `${baseUrl}/api/files/download?path=${encodeURIComponent('public/missing.bin')}`
    );
    const missingBody = await missingResponse.text();
    assert.equal(missingResponse.status, 404);
    assert.deepEqual(JSON.parse(missingBody), { error: '文件不存在' });
    assert.doesNotMatch(missingBody, /private|content-files|ENOENT/i);

    fileService.getFileContent = async () => {
      throw new FileContentTooLargeError();
    };
    const oversizedResponse = await fetch(
      `${baseUrl}/api/files/content?path=${encodeURIComponent('public/oversized.md')}`
    );
    assert.equal(oversizedResponse.status, 413);
    assert.equal(oversizedResponse.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await oversizedResponse.json(), {
      error: '文件内容过大，请下载后查看',
    });
  } finally {
    fileService.getStorageMode = originalGetStorageMode;
    fileService.isPasswordProtected = originalIsPasswordProtected;
    fileService.getMetadata = originalGetMetadata;
    fileService.getFileStream = originalGetFileStream;
    fileService.getFileContent = originalGetFileContent;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('MinIO public URLs always use the same-origin authorization proxy', () => {
  assert.equal(
    getMinioFileUrl('cover image.png', 'project covers'),
    '/api/minio/project%20covers/cover%20image.png'
  );

  const minioRouteSource = fs.readFileSync(path.join('src', 'routes', 'minio.ts'), 'utf8');
  const fileServiceSource = fs.readFileSync(path.join('src', 'services', 'file.service.ts'), 'utf8');
  assert.match(minioRouteSource, /public, max-age=0, must-revalidate/);
  assert.doesNotMatch(minioRouteSource, /max-age=31536000/);
  assert.doesNotMatch(fileServiceSource, /presignedGetObject/);
});

test('MinIO proxy renders early stream errors and contains late failures', async () => {
  let emittedChunk = false;
  const lateFailingStream = new Readable({
    read() {
      if (emittedChunk) return;
      emittedChunk = true;
      this.push(Buffer.from('partial-image'));
      setImmediate(() => {
        this.destroy(Object.assign(new Error('injected late MinIO stream failure'), {
          code: 'EIO',
        }));
      });
    },
  });
  const minioClient = {
    statObject: async () => ({
      size: 64,
      etag: 'test-etag',
      metaData: { 'content-type': 'image/png' },
    }),
    getObject: async (_bucket: string, objectKey: string) => {
      if (objectKey.endsWith('early-error.png')) {
        return new Readable({
          read() {
            setImmediate(() => {
              this.destroy(Object.assign(new Error('injected missing object stream'), {
                code: 'NoSuchKey',
              }));
            });
          },
        });
      }
      return lateFailingStream;
    },
  } as unknown as Pick<Client, 'statObject' | 'getObject'>;

  const app = express();
  app.get('/api/minio/:type/:filename', createMinioFileProxyHandler({
    isEnabled: () => true,
    getClient: () => minioClient,
    isPasswordProtected: () => false,
    verifyPassword: async () => false,
  }));
  app.get('/health-after-stream-error', (_req, res) => res.status(200).send('alive'));
  const server = app.listen(0, '127.0.0.1');

  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const earlyErrorResponse = await fetch(
      `${baseUrl}/api/minio/gallery/early-error.png`
    );
    assert.equal(earlyErrorResponse.status, 404);
    assert.equal(earlyErrorResponse.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await earlyErrorResponse.json(), { error: '文件不存在' });

    await assert.rejects(async () => {
      const response = await fetch(`${baseUrl}/api/minio/gallery/late-error.png`);
      await response.arrayBuffer();
    });
    const healthResponse = await fetch(`${baseUrl}/health-after-stream-error`);
    assert.equal(healthResponse.status, 200);
    assert.equal(await healthResponse.text(), 'alive');
  } finally {
    lateFailingStream.destroy();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('file access passwords use only the dedicated header and accidental URL credentials are redacted', () => {
  assert.equal(FILE_ACCESS_PASSWORD_HEADER, 'x-file-password');
  assert.equal(resolveFileAccessPassword('header-secret'), 'header-secret');
  assert.equal(resolveFileAccessPassword(undefined), undefined);
  assert.equal(resolveFileAccessPassword(''), undefined);

  const redactedUrl = redactFileAccessPasswordFromUrl(
    '/api/files/content?path=vault%2Fsecret.md&password=hunter2&mode=preview'
  );
  assert.equal(
    redactedUrl,
    '/api/files/content?path=vault%2Fsecret.md&password=[REDACTED]&mode=preview'
  );
  assert.doesNotMatch(redactedUrl, /hunter2/);
  assert.equal(
    redactFileAccessPasswordFromUrl('/api/files/content?%70assword=encoded-secret'),
    '/api/files/content?%70assword=[REDACTED]'
  );

  const frontendFileApi = fs.readFileSync(
    path.join('..', 'frontend', 'src', 'lib', 'api', 'files.ts'),
    'utf8'
  );
  assert.match(frontendFileApi, /FILE_ACCESS_PASSWORD_HEADER = 'X-File-Password'/);
  assert.match(frontendFileApi, /headers\[FILE_ACCESS_PASSWORD_HEADER\]\s*=\s*password/);
  assert.doesNotMatch(frontendFileApi, /queryParams\.append\(['"]password['"]/);

  const appSource = fs.readFileSync(path.join('src', 'app.ts'), 'utf8');
  assert.match(appSource, /morgan\.token\('safe-url'/);
  assert.match(appSource, /redactFileAccessPasswordFromUrl/);

  const fileRoute = fs.readFileSync(path.join('src', 'routes', 'files.ts'), 'utf8');
  const minioRoute = fs.readFileSync(path.join('src', 'routes', 'minio.ts'), 'utf8');
  assert.doesNotMatch(fileRoute, /req\.query\.password/);
  assert.doesNotMatch(minioRoute, /req\.query\.password/);
  assert.match(fileRoute, /getFileStream\(authorizedKey\)/);
  assert.match(fileRoute, /pipeReadableToResponse\(fileStream, res\)/);
});

test('public game and MinIO routes parse optional identity before serving cached content', () => {
  const gameRoute = fs.readFileSync(path.join('src', 'routes', 'game.ts'), 'utf8');
  const gameController = fs.readFileSync(path.join('src', 'controllers', 'game.controller.ts'), 'utf8');
  const gameService = fs.readFileSync(path.join('src', 'services', 'game.service.ts'), 'utf8');
  const fileRoute = fs.readFileSync(path.join('src', 'routes', 'files.ts'), 'utf8');
  const minioRoute = fs.readFileSync(path.join('src', 'routes', 'minio.ts'), 'utf8');

  assert.match(gameRoute, /router\.get\('\/', optionalAuth, cacheMiddleware/);
  assert.match(gameRoute, /router\.get\('\/:id', optionalAuth, cacheMiddleware/);
  assert.match(gameRoute, /condition: \(req\) => req\.user\?\.role !== 'ADMIN'/);
  assert.match(gameController, /canIncludeHiddenGames\(includeHiddenRequested, req\.user\)/);
  assert.match(gameService, /buildGameLookupWhere\(id, includeHidden\)/);
  assert.match(fileRoute, /authorizeStoredFileAccess/);
  assert.equal(
    (fileRoute.match(/applyFileCachePolicy\(res, authorizedKey\)/g) || []).length,
    2
  );
  assert.match(minioRoute, /router\.get\('\/:type\/:filename', optionalAuth/);
  assert.match(minioRoute, /authorizeStoredFileAccess/);
  assert.match(minioRoute, /protectedFile \? 'private, no-store'/);
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
