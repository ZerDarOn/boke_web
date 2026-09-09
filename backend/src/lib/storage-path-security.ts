import fs from 'fs';
import path from 'path';
import { FILE_STORAGE_IDENTITY_KEY } from './file-storage-identity';

export class StoragePathError extends Error {
  constructor() {
    super('Invalid storage path');
    this.name = 'StoragePathError';
  }
}

interface ResolveStoragePathOptions {
  allowRoot?: boolean;
}

function assertNoSymbolicLinkComponents(rootPath: string, resolvedPath: string): void {
  const relativePath = path.relative(rootPath, resolvedPath);
  const components = relativePath ? relativePath.split(path.sep).filter(Boolean) : [];
  let currentPath = rootPath;

  for (let index = -1; index < components.length; index += 1) {
    if (index >= 0) currentPath = path.join(currentPath, components[index]);
    if (!fs.existsSync(currentPath)) break;
    if (fs.lstatSync(currentPath).isSymbolicLink()) {
      throw new StoragePathError();
    }
  }
}

function normalizeStorageKey(storageKey: string, allowRoot: boolean): string {
  if (typeof storageKey !== 'string' || storageKey.includes('\0')) {
    throw new StoragePathError();
  }

  const slashNormalizedKey = storageKey.replace(/\\/g, '/');
  if (
    path.posix.isAbsolute(slashNormalizedKey) ||
    path.win32.isAbsolute(storageKey) ||
    slashNormalizedKey.split('/').includes('..')
  ) {
    throw new StoragePathError();
  }

  const normalizedKey = path.posix.normalize(slashNormalizedKey).replace(/^\/+/, '');
  if (normalizedKey === '.' || normalizedKey === '') {
    if (allowRoot) return '';
    throw new StoragePathError();
  }

  if (normalizedKey.toLocaleLowerCase('en-US') === FILE_STORAGE_IDENTITY_KEY) {
    throw new StoragePathError();
  }

  return normalizedKey;
}

export function resolveStoragePath(
  storageRoot: string,
  storageKey: string,
  options: ResolveStoragePathOptions = {}
): string {
  const rootPath = path.resolve(storageRoot);
  const normalizedKey = normalizeStorageKey(storageKey, options.allowRoot === true);
  const resolvedPath = path.resolve(rootPath, normalizedKey);

  if (resolvedPath !== rootPath && !resolvedPath.startsWith(`${rootPath}${path.sep}`)) {
    throw new StoragePathError();
  }

  // ZIP imports and local filesystem changes can introduce symlinks after the
  // lexical check. Refuse every existing symlink component so reads/writes
  // cannot escape through an otherwise in-root path.
  assertNoSymbolicLinkComponents(rootPath, resolvedPath);

  return resolvedPath;
}

export function normalizeStoragePath(storageKey: string, options: ResolveStoragePathOptions = {}): string {
  return normalizeStorageKey(storageKey, options.allowRoot === true);
}
