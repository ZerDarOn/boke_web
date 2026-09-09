import { StoragePathError } from './storage-path-security';

const UNIX_FILE_TYPE_MASK = 0xf000;
const UNIX_SYMBOLIC_LINK_TYPE = 0xa000;

interface ZipEntryAttributes {
  externalFileAttributes: number;
}

/** Reject symlink entries before extract-zip creates directories or files. */
export function assertZipEntryIsNotSymlink(entry: ZipEntryAttributes): void {
  const unixMode = (entry.externalFileAttributes >>> 16) & 0xffff;
  if ((unixMode & UNIX_FILE_TYPE_MASK) === UNIX_SYMBOLIC_LINK_TYPE) {
    throw new StoragePathError();
  }
}
