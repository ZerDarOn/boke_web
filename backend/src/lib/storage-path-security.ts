import path from 'path';

export class StoragePathError extends Error {
  constructor() {
    super('Invalid storage path');
    this.name = 'StoragePathError';
  }
}

interface ResolveStoragePathOptions {
  allowRoot?: boolean;
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

  return resolvedPath;
}

export function normalizeStoragePath(storageKey: string, options: ResolveStoragePathOptions = {}): string {
  return normalizeStorageKey(storageKey, options.allowRoot === true);
}
