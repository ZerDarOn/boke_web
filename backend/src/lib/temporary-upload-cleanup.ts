import fs from 'fs';
import path from 'path';

export interface TemporaryUploadCleanupResult {
  removedFiles: number;
  failedEntries: number;
}

/**
 * Removes expired staging files from a caller-supplied temporary root.
 * The caller deliberately provides the root so this routine never discovers
 * or traverses permanent upload directories on its own.
 */
export function cleanupExpiredTemporaryUploads(
  temporaryRoot: string,
  maxAgeMs: number,
  now = Date.now()
): TemporaryUploadCleanupResult {
  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) {
    throw new RangeError('Temporary upload max age must be a non-negative number');
  }

  const result: TemporaryUploadCleanupResult = {
    removedFiles: 0,
    failedEntries: 0,
  };

  if (!fs.existsSync(temporaryRoot)) return result;

  const cleanupDirectory = (directory: string, isRoot = false): void => {
    let entries: string[];
    try {
      entries = fs.readdirSync(directory);
    } catch {
      result.failedEntries += 1;
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(directory, entry);

      try {
        const stats = fs.lstatSync(entryPath);
        if (stats.isDirectory()) {
          cleanupDirectory(entryPath);
          continue;
        }

        if (stats.mtimeMs < now - maxAgeMs) {
          fs.unlinkSync(entryPath);
          result.removedFiles += 1;
        }
      } catch {
        result.failedEntries += 1;
      }
    }

    if (!isRoot) {
      try {
        if (fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
      } catch {
        // Keeping an empty or concurrently modified staging directory is safe.
      }
    }
  };

  cleanupDirectory(temporaryRoot, true);
  return result;
}
