import fs from 'node:fs';
import path from 'node:path';

export const FILE_STORAGE_IDENTITY_KEY = '.ink-spirit-storage-identity';
export const FILE_STORAGE_IDENTITY_MAX_BYTES = 1_024;
const FILE_STORAGE_IDENTITY_FORMAT = 'ink-spirit-storage-identity';
const FILE_STORAGE_IDENTITY_VERSION = 1;
const STORAGE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface FileStorageBinding {
  kind: 'local' | 'minio';
  storageId: string;
}

export class FileStorageIdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileStorageIdentityError';
  }
}

export function createFileStorageBinding(
  kind: FileStorageBinding['kind'],
  storageId: string
): FileStorageBinding {
  if (!STORAGE_ID_PATTERN.test(storageId)) {
    throw new FileStorageIdentityError('Invalid file storage identity');
  }
  return { kind, storageId };
}

export function parseFileStorageBinding(value: unknown): FileStorageBinding {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new FileStorageIdentityError('Invalid file storage binding');
  }

  const binding = value as Partial<FileStorageBinding>;
  if (binding.kind !== 'local' && binding.kind !== 'minio') {
    throw new FileStorageIdentityError('Invalid file storage binding');
  }
  return createFileStorageBinding(binding.kind, binding.storageId || '');
}

export function fileStorageBindingsMatch(
  expected: FileStorageBinding,
  actual: FileStorageBinding | undefined
): boolean {
  return actual?.kind === expected.kind && actual.storageId === expected.storageId;
}

export function serializeFileStorageIdentity(storageId: string): string {
  const binding = createFileStorageBinding('local', storageId);
  return JSON.stringify({
    format: FILE_STORAGE_IDENTITY_FORMAT,
    version: FILE_STORAGE_IDENTITY_VERSION,
    storageId: binding.storageId,
  });
}

export function parseFileStorageIdentity(value: string): string {
  let parsedIdentity: unknown;
  try {
    parsedIdentity = JSON.parse(value);
  } catch {
    throw new FileStorageIdentityError('Invalid file storage identity marker');
  }

  if (!parsedIdentity || typeof parsedIdentity !== 'object' || Array.isArray(parsedIdentity)) {
    throw new FileStorageIdentityError('Invalid file storage identity marker');
  }

  const identity = parsedIdentity as {
    format?: unknown;
    version?: unknown;
    storageId?: unknown;
  };

  if (
    identity.format !== FILE_STORAGE_IDENTITY_FORMAT ||
    identity.version !== FILE_STORAGE_IDENTITY_VERSION ||
    typeof identity.storageId !== 'string'
  ) {
    throw new FileStorageIdentityError('Invalid file storage identity marker');
  }
  return createFileStorageBinding('local', identity.storageId).storageId;
}

function resolveThroughExistingAncestor(targetPath: string): string {
  let existingAncestor = path.resolve(targetPath);
  const missingSegments: string[] = [];

  while (!fs.existsSync(existingAncestor)) {
    const parent = path.dirname(existingAncestor);
    if (parent === existingAncestor) break;
    missingSegments.unshift(path.basename(existingAncestor));
    existingAncestor = parent;
  }

  const realAncestor = fs.realpathSync.native(existingAncestor);
  return path.resolve(realAncestor, ...missingSegments);
}

function pathIsInsideOrEqual(parentPath: string, candidatePath: string): boolean {
  const relativePath = path.relative(parentPath, candidatePath);
  return relativePath === '' || (
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

export function assertFileMetadataOutsideStorage(
  storageDir: string,
  metadataPath: string
): void {
  const lexicalStorageDir = path.resolve(storageDir);
  const lexicalMetadataPath = path.resolve(metadataPath);
  const resolvedStorageDir = resolveThroughExistingAncestor(storageDir);
  const resolvedMetadataPath = resolveThroughExistingAncestor(metadataPath);
  if (
    pathIsInsideOrEqual(lexicalStorageDir, lexicalMetadataPath) ||
    pathIsInsideOrEqual(resolvedStorageDir, resolvedMetadataPath)
  ) {
    throw new FileStorageIdentityError(
      'File metadata must be stored outside every public directory'
    );
  }
}

export function assertFileStorageOutsidePublicRoot(
  storageDir: string,
  publicRoot: string
): void {
  const lexicalStorageDir = path.resolve(storageDir);
  const lexicalPublicRoot = path.resolve(publicRoot);
  const resolvedStorageDir = resolveThroughExistingAncestor(storageDir);
  const resolvedPublicRoot = resolveThroughExistingAncestor(publicRoot);
  if (
    pathIsInsideOrEqual(lexicalPublicRoot, lexicalStorageDir) ||
    pathIsInsideOrEqual(lexicalStorageDir, lexicalPublicRoot) ||
    pathIsInsideOrEqual(resolvedPublicRoot, resolvedStorageDir) ||
    pathIsInsideOrEqual(resolvedStorageDir, resolvedPublicRoot)
  ) {
    throw new FileStorageIdentityError(
      'Protected file storage must not overlap a public static directory'
    );
  }
}
