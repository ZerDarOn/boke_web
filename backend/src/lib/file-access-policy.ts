import type { AuthPayload } from '../types';
import { normalizeStoragePath } from './storage-path-security';

interface StoredFileAccessInput {
  storageKey: string;
  password?: string;
  userRole?: AuthPayload['role'];
  isProtected: (canonicalKey: string) => boolean;
  verifyPassword: (canonicalKey: string, password: string) => Promise<boolean>;
}

export type StoredFileAccessResult =
  | { allowed: true; storageKey: string }
  | {
      allowed: false;
      storageKey: string;
      reason: 'password_required' | 'invalid_password';
    };

/**
 * Resolves all equivalent path spellings to one key before any metadata or
 * password lookup, preventing aliases from bypassing file protection.
 */
export async function authorizeStoredFileAccess({
  storageKey,
  password,
  userRole,
  isProtected,
  verifyPassword,
}: StoredFileAccessInput): Promise<StoredFileAccessResult> {
  const canonicalKey = normalizeStoragePath(storageKey);
  const protectedFile = isProtected(canonicalKey);

  if (!protectedFile || userRole === 'ADMIN') {
    return { allowed: true, storageKey: canonicalKey };
  }

  if (!password) {
    return {
      allowed: false,
      storageKey: canonicalKey,
      reason: 'password_required',
    };
  }

  if (!(await verifyPassword(canonicalKey, password))) {
    return {
      allowed: false,
      storageKey: canonicalKey,
      reason: 'invalid_password',
    };
  }

  return { allowed: true, storageKey: canonicalKey };
}
