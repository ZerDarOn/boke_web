import { Client } from 'minio';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { Readable } from 'node:stream';
import { getMinioClient, isMinioEnabled } from '../config/minio';
import { resolveBackendRoot, resolveBackendRuntimePath } from '../config/backend-env-path';
import {
  FILE_STORAGE_IDENTITY_KEY,
  FILE_STORAGE_IDENTITY_MAX_BYTES,
  FileStorageIdentityError,
  assertFileMetadataOutsideStorage,
  assertFileStorageOutsidePublicRoot,
  createFileStorageBinding,
  fileStorageBindingsMatch,
  parseFileStorageBinding,
  parseFileStorageIdentity,
  serializeFileStorageIdentity,
  type FileStorageBinding,
} from '../lib/file-storage-identity';
import {
  normalizeStoragePath,
  resolveStoragePath,
  StoragePathError,
} from '../lib/storage-path-security';

// 文件元数据接口（外部 API 返回用，不含 passwordHash）
interface FileMetadata {
  name: string;
  type: 'file' | 'directory';
  path?: string;
  size?: number;
  modifiedAt: string;
  protected?: boolean;
  fileType?: string;
  children?: FileMetadata[];
}

// 内部元数据（含 passwordHash，仅用于存储和校验，不通过 API 返回）
interface InternalFileMetadata extends FileMetadata {
  passwordHash?: string;
}

export interface FileServiceOptions {
  localStorageDir?: string;
  metadataPath?: string;
  legacyMetadataPath?: string | null;
  retiredLegacyMetadataPath?: string;
  minioClient?: Client | null;
}

export const FILE_METADATA_FORMAT = 'ink-spirit-file-metadata';
export const FILE_METADATA_VERSION = 2;
export type { FileStorageBinding } from '../lib/file-storage-identity';

type MetadataDocumentFormat = 'missing' | 'legacy' | 'unbound-envelope' | 'envelope';

interface LoadedMetadataDocument {
  metadata: Map<string, InternalFileMetadata>;
  format: MetadataDocumentFormat;
  storageBinding?: FileStorageBinding;
}

export class FileMetadataTrustError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileMetadataTrustError';
  }
}

export const FILE_CONTENT_PREVIEW_MAX_BYTES = 5 * 1024 * 1024;
export const FILE_LIST_MAX_ENTRIES = 1_000;
const MINIO_LIST_TIMEOUT_MS = 10_000;
const BACKEND_ROOT = resolveBackendRoot();

export class FileContentTooLargeError extends Error {
  constructor() {
    super('File content exceeds the public preview limit');
    this.name = 'FileContentTooLargeError';
  }
}

export class FileListTooLargeError extends Error {
  constructor() {
    super('File listing exceeds the public entry limit');
    this.name = 'FileListTooLargeError';
  }
}

// 本地文件存储目录
const LOCAL_STORAGE_DIR = resolveBackendRuntimePath(process.env.FILE_STORAGE_DIR, 'content-files');
const PUBLIC_UPLOAD_DIR = resolveBackendRuntimePath(process.env.UPLOAD_DIR, 'uploads');
const FRONTEND_DIST_DIR = path.resolve(BACKEND_ROOT, '..', 'frontend', 'dist');

// 元数据存储路径
const METADATA_PATH = resolveBackendRuntimePath(
  process.env.FILE_METADATA_PATH,
  path.join('storage-metadata', 'file-metadata.json')
);
const LEGACY_METADATA_PATH = path.join(BACKEND_ROOT, 'file-metadata.json');
const RETIRED_LEGACY_METADATA_PATH = path.join(
  BACKEND_ROOT,
  'file-metadata.legacy-migrated.json'
);

const allowEmptyMetadataInitialization = (): boolean =>
  process.env.FILE_METADATA_ALLOW_EMPTY_INITIALIZATION === 'true';

const allowUnboundMetadataMigration = (): boolean =>
  process.env.FILE_METADATA_ALLOW_UNBOUND_MIGRATION === 'true';

const policyValueContainsWildcard = (value: unknown): boolean => {
  if (value === '*') return true;
  if (Array.isArray(value)) return value.some(policyValueContainsWildcard);
  if (value && typeof value === 'object') {
    return Object.values(value).some(policyValueContainsWildcard);
  }
  return false;
};

export const minioBucketPolicyAllowsAnonymousAccess = (policy: string): boolean => {
  const parsedDocument: unknown = JSON.parse(policy);
  if (!parsedDocument || typeof parsedDocument !== 'object' || Array.isArray(parsedDocument)) {
    throw new Error('MinIO bucket policy must be a JSON object');
  }
  const document = parsedDocument as { Statement?: unknown };
  const statements = Array.isArray(document.Statement)
    ? document.Statement
    : [document.Statement];

  return statements.some((statementValue) => {
    if (!statementValue || typeof statementValue !== 'object' || Array.isArray(statementValue)) {
      return false;
    }
    const statement = statementValue as {
      Effect?: unknown;
      Principal?: unknown;
      NotPrincipal?: unknown;
    };
    if (statement.Effect !== 'Allow') return false;

    // A private bucket must not grant anonymous principals any capability—not
    // only object reads. Anonymous writes/deletes can replace or destroy media,
    // while actions such as SelectObjectContent can also disclose object data.
    // NotPrincipal can include anonymous callers, and a missing Principal is
    // malformed in a bucket policy, so both are rejected conservatively.
    return statement.NotPrincipal !== undefined ||
      statement.Principal === undefined ||
      policyValueContainsWildcard(statement.Principal);
  });
};

// 确保本地存储目录存在
const ensureLocalDir = (storageDir: string) => {
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
};

// 加载元数据。文件缺失是否属于首次安装，由 FileService 再与存储内容交叉验证。
const loadMetadataDocument = (
  metadataPath: string = METADATA_PATH
): LoadedMetadataDocument => {
  if (!fs.existsSync(metadataPath)) {
    return { metadata: new Map(), format: 'missing', storageBinding: undefined };
  }

  try {
    const data = fs.readFileSync(metadataPath, 'utf-8');
    const json: unknown = JSON.parse(data);
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      throw new Error('metadata root must be an object');
    }

    let storedEntries: Record<string, unknown>;
    let format: MetadataDocumentFormat;
    let storageBinding: FileStorageBinding | undefined;
    const storedFormat = (json as Record<string, unknown>).format;
    if (typeof storedFormat === 'string') {
      const envelope = json as {
        format?: unknown;
        version?: unknown;
        entries?: unknown;
        storage?: unknown;
      };
      if (
        envelope.format !== FILE_METADATA_FORMAT ||
        !envelope.entries ||
        typeof envelope.entries !== 'object' ||
        Array.isArray(envelope.entries)
      ) {
        throw new Error('metadata envelope is invalid or unsupported');
      }
      storedEntries = envelope.entries as Record<string, unknown>;
      if (envelope.version === FILE_METADATA_VERSION) {
        storageBinding = parseFileStorageBinding(envelope.storage);
        format = 'envelope';
      } else if (envelope.version === 1) {
        // v1 had no physical storage UUID. It is re-bound only after the
        // selected storage is inspected during initialize().
        format = 'unbound-envelope';
      } else {
        throw new Error('metadata envelope is invalid or unsupported');
      }
    } else {
      storedEntries = json as Record<string, unknown>;
      format = 'legacy';
    }

    const normalizedMetadata = new Map<string, InternalFileMetadata>();

    for (const [storedKey, storedValue] of Object.entries(storedEntries)) {
      if (!storedValue || typeof storedValue !== 'object' || Array.isArray(storedValue)) {
        throw new Error(`metadata entry is invalid: ${storedKey}`);
      }

      const storedMetadata = storedValue as InternalFileMetadata;
      if ('protected' in storedMetadata && typeof storedMetadata.protected !== 'boolean') {
        throw new Error(`metadata protection flag is invalid: ${storedKey}`);
      }
      if ('passwordHash' in storedMetadata && typeof storedMetadata.passwordHash !== 'string') {
        throw new Error(`metadata password hash is invalid: ${storedKey}`);
      }

      // An invalid persisted key means the protection index is corrupt. Do not
      // discard it: the same underlying file might otherwise become public
      // through a canonical alias.
      const canonicalKey = normalizeStoragePath(storedKey);
      const existing = normalizedMetadata.get(canonicalKey);
      const candidate: InternalFileMetadata = {
        ...storedMetadata,
        path: canonicalKey,
        // The presence of a hash field is protection evidence even if the
        // stored value is empty or otherwise unusable. Verification will
        // then fail closed instead of exposing the file.
        protected: storedMetadata.passwordHash !== undefined || storedMetadata.protected === true,
        ...(storedMetadata.protected && !storedMetadata.passwordHash && existing?.passwordHash
          ? { passwordHash: existing.passwordHash }
          : {}),
      };

      // On alias collisions, keep password protection instead of allowing an
      // unprotected alias to downgrade the canonical entry.
      if (!existing || candidate.protected || !existing.protected) {
        normalizedMetadata.set(canonicalKey, candidate);
      }
    }

    return { metadata: normalizedMetadata, format, storageBinding };
  } catch (error) {
    console.error('Failed to load file metadata; refusing to serve files', {
      metadataPath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const loadMetadata = (
  metadataPath: string = METADATA_PATH
): Map<string, InternalFileMetadata> => loadMetadataDocument(metadataPath).metadata;

const syncPersistedFile = (filePath: string): void => {
  // The temporary file is already flushed before rename. On Windows, fsync on
  // the reopened read-only destination returns EPERM, so there is no supported
  // post-rename flush primitive in Node.js to call here.
  if (process.platform === 'win32') return;
  const descriptor = fs.openSync(filePath, 'r');
  try {
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
};

const syncParentDirectory = (filePath: string): void => {
  // Windows does not support opening a directory for fsync. The temporary file
  // is still flushed before the atomic replacement on that platform.
  if (process.platform === 'win32') return;
  const descriptor = fs.openSync(path.dirname(filePath), 'r');
  try {
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
};

// 同目录临时文件 + fsync + rename，既避免半截 JSON，也确保受保护对象写入前索引已持久化。
export const saveMetadata = (
  metadata: Map<string, InternalFileMetadata>,
  metadataPath: string,
  storageBinding: FileStorageBinding
): void => {
  const temporaryPath = path.join(
    path.dirname(metadataPath),
    `.${path.basename(metadataPath)}.${process.pid}.${crypto.randomUUID()}.tmp`
  );

  try {
    const json = {
      format: FILE_METADATA_FORMAT,
      version: FILE_METADATA_VERSION,
      storage: parseFileStorageBinding(storageBinding),
      entries: Object.fromEntries(metadata),
    };
    const descriptor = fs.openSync(temporaryPath, 'wx', 0o600);
    try {
      fs.writeFileSync(descriptor, JSON.stringify(json, null, 2), {
        encoding: 'utf-8',
      });
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    fs.renameSync(temporaryPath, metadataPath);
    syncPersistedFile(metadataPath);
    syncParentDirectory(metadataPath);
  } catch (error) {
    try {
      if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
      }
    } catch {
      // Preserve the original persistence failure.
    }

    console.error('Failed to save file metadata', {
      metadataPath,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

// 哈希密码（bcrypt，带盐慢哈希，防 GPU/彩虹表破解）
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

// 识别旧版无盐 SHA-256 哈希（64 位十六进制），验证成功后自动升级为 bcrypt
const isLegacySha256Hash = (hash: string): boolean => /^[0-9a-f]{64}$/.test(hash);

export class FileService {
  private minioClient: Client | null;
  private bucket: string;
  private metadata: Map<string, InternalFileMetadata>;
  private useMinIO: boolean;
  private storageMode: 'minio' | 'local' = 'local';
  private localStorageDir: string;
  private metadataPath: string;
  private legacyMetadataPath: string | null;
  private retiredLegacyMetadataPath: string;
  private metadataFileMissing: boolean;
  private metadataDocumentFormat: MetadataDocumentFormat;
  private storedStorageBinding?: FileStorageBinding;
  private activeStorageBinding?: FileStorageBinding;
  private metadataStateTrusted = false;
  private initialized = false;
  private shouldRetireLegacyMetadata = false;
  private metadataMutationQueue: Promise<void> = Promise.resolve();

  constructor(options: FileServiceOptions = {}) {
    this.minioClient = options.minioClient === undefined
      ? getMinioClient()
      : options.minioClient;
    this.bucket = process.env.MINIO_BUCKET || 'ink-spirit-blog';
    this.localStorageDir = path.resolve(options.localStorageDir || LOCAL_STORAGE_DIR);
    this.metadataPath = path.resolve(options.metadataPath || METADATA_PATH);
    this.legacyMetadataPath = options.legacyMetadataPath === undefined
      ? (options.metadataPath === undefined && !process.env.FILE_METADATA_PATH
          ? LEGACY_METADATA_PATH
          : null)
      : options.legacyMetadataPath;
    this.retiredLegacyMetadataPath = path.resolve(
      options.retiredLegacyMetadataPath || RETIRED_LEGACY_METADATA_PATH
    );

    try {
      const sensitiveMetadataPaths = [
        this.metadataPath,
        this.retiredLegacyMetadataPath,
        ...(this.legacyMetadataPath ? [this.legacyMetadataPath] : []),
      ];
      for (const sensitivePath of sensitiveMetadataPaths) {
        assertFileMetadataOutsideStorage(this.localStorageDir, sensitivePath);
        assertFileMetadataOutsideStorage(PUBLIC_UPLOAD_DIR, sensitivePath);
        assertFileMetadataOutsideStorage(FRONTEND_DIST_DIR, sensitivePath);
      }
      assertFileStorageOutsidePublicRoot(this.localStorageDir, PUBLIC_UPLOAD_DIR);
      assertFileStorageOutsidePublicRoot(this.localStorageDir, FRONTEND_DIST_DIR);
    } catch (error) {
      if (error instanceof FileStorageIdentityError) {
        throw new FileMetadataTrustError(error.message);
      }
      throw error;
    }

    let metadataDocument = loadMetadataDocument(this.metadataPath);
    if (
      this.legacyMetadataPath &&
      metadataDocument.format === 'missing' &&
      fs.existsSync(this.legacyMetadataPath) &&
      !fs.existsSync(this.retiredLegacyMetadataPath)
    ) {
      metadataDocument = loadMetadataDocument(this.legacyMetadataPath);
      this.shouldRetireLegacyMetadata = true;
    } else if (this.legacyMetadataPath && fs.existsSync(this.legacyMetadataPath)) {
      // Once a v2 index exists (or a retirement record exists), the old path
      // is stale and must never become authoritative again.
      this.shouldRetireLegacyMetadata = true;
    }

    this.metadataDocumentFormat = metadataDocument.format;
    this.storedStorageBinding = metadataDocument.storageBinding;
    this.metadataFileMissing = metadataDocument.format === 'missing' || (
      (metadataDocument.format === 'legacy' || metadataDocument.format === 'unbound-envelope') &&
      metadataDocument.metadata.size === 0
    );
    this.metadata = metadataDocument.metadata;
    this.useMinIO = false;
  }

  private refuseUntrustedMetadata(reason: string): never {
    this.metadataStateTrusted = false;
    console.error('File metadata trust check failed; file access will remain closed', {
      reason,
    });
    throw new FileMetadataTrustError(
      '文件存储中已有内容，但保护元数据缺失；已拒绝启动文件访问以防止内容意外公开'
    );
  }

  private assertMetadataStateIsTrusted(): void {
    if (!this.initialized || !this.metadataStateTrusted) {
      throw new FileMetadataTrustError(
        '文件存储尚未完成可信初始化，已拒绝读取或修改文件清单'
      );
    }
  }

  private activateExistingBinding(binding: FileStorageBinding): void {
    if (!fileStorageBindingsMatch(binding, this.storedStorageBinding)) {
      this.refuseUntrustedMetadata('storage_identity_mismatch');
    }
    this.activeStorageBinding = binding;
    this.metadataStateTrusted = true;
  }

  private commitMetadataState(
    metadata: Map<string, InternalFileMetadata>,
    storageBinding: FileStorageBinding
  ): void {
    saveMetadata(metadata, this.metadataPath, storageBinding);
    this.metadata = metadata;
    this.metadataFileMissing = false;
    this.metadataDocumentFormat = 'envelope';
    this.storedStorageBinding = storageBinding;
    this.activeStorageBinding = storageBinding;
  }

  private persistInitialMetadata(storageBinding: FileStorageBinding): void {
    try {
      fs.mkdirSync(path.dirname(this.metadataPath), { recursive: true });
      this.metadataStateTrusted = true;
      this.commitMetadataState(new Map(this.metadata), storageBinding);
      this.retireLegacyMetadata();
    } catch (error) {
      if (error instanceof FileMetadataTrustError) throw error;
      this.metadataStateTrusted = false;
      this.refuseUntrustedMetadata('metadata_initialization_persistence_failed');
    }
  }

  private retireLegacyMetadata(): void {
    if (
      !this.shouldRetireLegacyMetadata ||
      !this.legacyMetadataPath ||
      !fs.existsSync(this.legacyMetadataPath)
    ) {
      return;
    }

    try {
      const retirementPath = fs.existsSync(this.retiredLegacyMetadataPath)
        ? `${this.retiredLegacyMetadataPath}.${Date.now()}`
        : this.retiredLegacyMetadataPath;
      fs.renameSync(this.legacyMetadataPath, retirementPath);
      syncParentDirectory(retirementPath);
      this.shouldRetireLegacyMetadata = false;
      console.warn('Retired the legacy file metadata index after persistent migration');
    } catch {
      this.refuseUntrustedMetadata('legacy_metadata_retirement_failed');
    }
  }

  private assertLocalStorageMetadataIsTrusted(): void {
    const hasUnboundMetadata = (
      this.metadataDocumentFormat === 'legacy' ||
      this.metadataDocumentFormat === 'unbound-envelope'
    ) && this.metadata.size > 0;
    if (
      (!this.metadataFileMissing && !hasUnboundMetadata) ||
      !fs.existsSync(this.localStorageDir)
    ) {
      return;
    }

    let entries: string[];
    try {
      entries = fs.readdirSync(this.localStorageDir);
    } catch {
      this.refuseUntrustedMetadata('local_storage_inspection_failed');
    }

    const userEntries = entries.filter((entry) => entry !== FILE_STORAGE_IDENTITY_KEY);
    if (userEntries.length > 0) {
      if (hasUnboundMetadata) {
        if (allowUnboundMetadataMigration()) {
          console.warn(
            'FILE_METADATA_ALLOW_UNBOUND_MIGRATION is enabled; binding a non-empty legacy index to existing local storage'
          );
          return;
        }
        this.refuseUntrustedMetadata('local_storage_nonempty_with_unbound_metadata');
      }
      if (allowEmptyMetadataInitialization()) {
        console.warn(
          'FILE_METADATA_ALLOW_EMPTY_INITIALIZATION is enabled; treating non-empty local storage as public'
        );
        return;
      }
      this.refuseUntrustedMetadata('local_storage_nonempty_without_metadata');
    }
  }

  private readLocalStorageId(): string | undefined {
    const identityPath = path.join(this.localStorageDir, FILE_STORAGE_IDENTITY_KEY);
    if (!fs.existsSync(identityPath)) return undefined;

    try {
      const stats = fs.lstatSync(identityPath);
      if (stats.isSymbolicLink() || !stats.isFile() || stats.size > FILE_STORAGE_IDENTITY_MAX_BYTES) {
        this.refuseUntrustedMetadata('local_storage_identity_invalid');
      }
      return parseFileStorageIdentity(fs.readFileSync(identityPath, 'utf8'));
    } catch (error) {
      if (error instanceof FileMetadataTrustError) throw error;
      this.refuseUntrustedMetadata('local_storage_identity_invalid');
    }
  }

  private getOrCreateLocalStorageId(): string {
    const existingStorageId = this.readLocalStorageId();
    if (existingStorageId) return existingStorageId;

    const identityPath = path.join(this.localStorageDir, FILE_STORAGE_IDENTITY_KEY);
    const storageId = crypto.randomUUID();
    try {
      fs.writeFileSync(identityPath, serializeFileStorageIdentity(storageId), {
        encoding: 'utf8',
        flag: 'wx',
      });
      return storageId;
    } catch (error: any) {
      if (error?.code === 'EEXIST') {
        const racedStorageId = this.readLocalStorageId();
        if (racedStorageId) return racedStorageId;
      }
      this.refuseUntrustedMetadata('local_storage_identity_persistence_failed');
    }
  }

  private initializeLocalStorage(): void {
    ensureLocalDir(this.localStorageDir);

    if (this.metadataDocumentFormat === 'envelope') {
      const storageId = this.readLocalStorageId();
      if (!storageId) this.refuseUntrustedMetadata('local_storage_identity_missing');
      this.activateExistingBinding(createFileStorageBinding('local', storageId));
      // A prior process may have persisted v2 and exited before retiring the
      // legacy source. Finish that one-way migration on the next trusted start.
      this.retireLegacyMetadata();
    } else {
      this.assertLocalStorageMetadataIsTrusted();
      const storageId = this.getOrCreateLocalStorageId();
      this.persistInitialMetadata(createFileStorageBinding('local', storageId));
    }

    this.useMinIO = false;
    this.storageMode = 'local';
    this.initialized = true;
  }

  private isMissingMinioObject(error: unknown): boolean {
    const code = (error as { code?: unknown })?.code;
    return code === 'NoSuchKey' || code === 'NoSuchObject' || code === 'NotFound';
  }

  private async assertMinioBucketIsPrivate(): Promise<void> {
    let policy: string;
    try {
      policy = await this.minioClient!.getBucketPolicy(this.bucket);
    } catch (error) {
      const code = (error as { code?: unknown })?.code;
      if (code === 'NoSuchBucketPolicy' || code === 'NoSuchPolicy' || code === 'PolicyNotFound') {
        return;
      }
      throw error;
    }

    if (minioBucketPolicyAllowsAnonymousAccess(policy)) {
      this.refuseUntrustedMetadata('minio_bucket_allows_anonymous_access');
    }
  }

  private async readMinioStorageId(): Promise<string | undefined> {
    let stream: Readable;
    try {
      stream = await this.minioClient!.getObject(this.bucket, FILE_STORAGE_IDENTITY_KEY);
    } catch (error) {
      if (this.isMissingMinioObject(error)) return undefined;
      throw error;
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalBytes = 0;
      let settled = false;
      let timeout: NodeJS.Timeout | undefined;
      const destroyStream = () => stream.destroy();
      const finish = (storageId?: string, error?: unknown) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        if (error) reject(error);
        else resolve(storageId);
      };

      timeout = setTimeout(() => {
        finish(undefined, new Error('MinIO storage identity read timed out'));
        destroyStream();
      }, MINIO_LIST_TIMEOUT_MS);
      timeout.unref?.();
      stream.on('data', (chunk: Buffer | string) => {
        if (settled) return;
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buffer.length;
        if (totalBytes > FILE_STORAGE_IDENTITY_MAX_BYTES) {
          finish(undefined, new FileStorageIdentityError('Storage identity marker is too large'));
          destroyStream();
          return;
        }
        chunks.push(buffer);
      });
      stream.once('end', () => {
        if (settled) return;
        try {
          finish(parseFileStorageIdentity(Buffer.concat(chunks).toString('utf8')));
        } catch (error) {
          finish(undefined, error);
        }
      });
      stream.once('error', (error) => {
        if (this.isMissingMinioObject(error)) finish(undefined);
        else finish(undefined, error);
      });
      stream.once('close', () => {
        if (!settled) finish(undefined, new Error('MinIO storage identity stream closed'));
      });
    });
  }

  private async getOrCreateMinioStorageId(): Promise<string> {
    const existingStorageId = await this.readMinioStorageId();
    if (existingStorageId) return existingStorageId;

    const proposedStorageId = crypto.randomUUID();
    await this.minioClient!.putObject(
      this.bucket,
      FILE_STORAGE_IDENTITY_KEY,
      serializeFileStorageIdentity(proposedStorageId)
    );

    // Read after write so concurrent first starts converge on the final marker.
    const persistedStorageId = await this.readMinioStorageId();
    if (!persistedStorageId) {
      this.refuseUntrustedMetadata('minio_storage_identity_persistence_failed');
    }
    return persistedStorageId;
  }

  private async minioBucketHasObjects(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timeout: NodeJS.Timeout | undefined;
      const stream = this.minioClient!.listObjects(this.bucket, '', true);
      const finish = (hasObjects: boolean, error?: unknown) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve(hasObjects);
        }
      };

      timeout = setTimeout(() => {
        finish(false, new Error('MinIO bucket listing timed out'));
        const destroyableStream = stream as typeof stream & { destroy?: () => void };
        destroyableStream.destroy?.();
      }, MINIO_LIST_TIMEOUT_MS);
      timeout.unref?.();
      stream.once('data', () => {
        finish(true);
        // MinIO v8 ignores a MaxKeys option here. Stop after the first object
        // instead of walking every page of a large bucket during startup.
        const destroyableStream = stream as typeof stream & { destroy?: () => void };
        destroyableStream.destroy?.();
      });
      stream.once('error', (error) => finish(false, error));
      stream.once('end', () => finish(false));
      stream.once('close', () => {
        if (!settled) finish(false, new Error('MinIO bucket listing closed before completion'));
      });
    });
  }

  private async collectMinioObjects(
    prefix: string,
    recursive: boolean,
    maxEntries: number = FILE_LIST_MAX_ENTRIES
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let settled = false;
      let timeout: NodeJS.Timeout | undefined;
      const stream = this.minioClient!.listObjects(this.bucket, prefix, recursive);
      const finish = (error?: unknown) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        if (error) reject(error);
        else resolve(results);
      };
      const destroyStream = () => {
        const destroyableStream = stream as typeof stream & { destroy?: () => void };
        destroyableStream.destroy?.();
      };

      timeout = setTimeout(() => {
        finish(new Error('MinIO object listing timed out'));
        destroyStream();
      }, MINIO_LIST_TIMEOUT_MS);
      timeout.unref?.();
      stream.on('data', (object) => {
        if (settled) return;
        if (object?.name === FILE_STORAGE_IDENTITY_KEY) return;
        results.push(object);
        if (results.length > maxEntries) {
          finish(new FileListTooLargeError());
          destroyStream();
        }
      });
      stream.once('error', (error) => finish(error));
      stream.once('end', () => finish());
      stream.once('close', () => {
        if (!settled) finish(new Error('MinIO object listing closed before completion'));
      });
    });
  }

  // 初始化并验证元数据与实际存储身份；身份不明时拒绝降级。
  async initialize(): Promise<void> {
    if (this.initialized) return;
    const minioConfigured = isMinioEnabled();

    if (!minioConfigured) {
      this.initializeLocalStorage();
      console.log('');
      console.log('📁 文件存储模式: 本地文件系统');
      console.log('   └─ 原因: MinIO 未启用 (USE_MINIO=false)');
      console.log('   └─ 存储路径: ' + this.localStorageDir);
      console.log('');
      return;
    }

    // 尝试连接 MinIO
    console.log('');
    console.log('🔌 尝试连接 MinIO...');
    console.log(`   └─ Endpoint: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT || 9000}`);
    console.log(`   └─ Bucket: ${this.bucket}`);

    try {
      this.metadataStateTrusted = false;
      if (
        this.metadataDocumentFormat === 'envelope' &&
        this.storedStorageBinding?.kind !== 'minio'
      ) {
        this.refuseUntrustedMetadata('storage_kind_mismatch');
      }

      const bucketExists = await this.minioClient!.bucketExists(this.bucket);
      const hasUnboundMetadata = (
        this.metadataDocumentFormat === 'legacy' ||
        this.metadataDocumentFormat === 'unbound-envelope'
      ) && this.metadata.size > 0;

      if (!bucketExists) {
        await this.minioClient!.makeBucket(this.bucket, 'us-east-1');
        console.log(`   └─ 创建 Bucket: ${this.bucket}`);
      } else if (this.metadataFileMissing || hasUnboundMetadata) {
        if (await this.minioBucketHasObjects()) {
          if (hasUnboundMetadata && allowUnboundMetadataMigration()) {
            console.warn(
              'FILE_METADATA_ALLOW_UNBOUND_MIGRATION is enabled; binding a non-empty legacy index to existing MinIO storage'
            );
          } else if (hasUnboundMetadata) {
            this.refuseUntrustedMetadata('minio_bucket_nonempty_with_unbound_metadata');
          } else if (allowEmptyMetadataInitialization()) {
            console.warn(
              'FILE_METADATA_ALLOW_EMPTY_INITIALIZATION is enabled; treating existing MinIO objects as public'
            );
          } else {
            this.refuseUntrustedMetadata('minio_bucket_nonempty_without_metadata');
          }
        }
      }

      await this.assertMinioBucketIsPrivate();

      if (this.metadataDocumentFormat === 'envelope') {
        const storageId = await this.readMinioStorageId();
        if (!storageId) this.refuseUntrustedMetadata('minio_storage_identity_missing');
        this.activateExistingBinding(createFileStorageBinding('minio', storageId));
        this.retireLegacyMetadata();
      } else {
        const storageId = await this.getOrCreateMinioStorageId();
        this.persistInitialMetadata(createFileStorageBinding('minio', storageId));
      }

      this.useMinIO = true;
      this.storageMode = 'minio';
      this.initialized = true;

      console.log('');
      console.log('✅ 文件存储模式: MinIO 对象存储');
      console.log(`   └─ Bucket: ${this.bucket} ✓`);
      console.log('');

    } catch (error: any) {
      if (error instanceof FileMetadataTrustError) {
        this.useMinIO = false;
        this.storageMode = 'local';
        throw error;
      }

      this.useMinIO = false;
      this.storageMode = 'local';
      console.error('MinIO file storage initialization failed; refusing unsafe local fallback', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
        code: typeof error?.code === 'string' ? error.code : undefined,
      });
      this.refuseUntrustedMetadata('minio_storage_could_not_be_verified');
    }
  }

  // 获取当前存储模式
  getStorageMode(): 'minio' | 'local' {
    return this.storageMode;
  }

  // 获取本地文件路径
  private getLocalPath(key: string, allowRoot = false): string {
    return resolveStoragePath(this.localStorageDir, key, { allowRoot });
  }

  private persistMetadata(metadata: Map<string, InternalFileMetadata>): void {
    this.assertMetadataStateIsTrusted();
    if (!this.activeStorageBinding) {
      this.refuseUntrustedMetadata('active_storage_binding_missing');
    }
    this.commitMetadataState(metadata, this.activeStorageBinding);
  }

  /**
   * Serialize storage side effects together with their metadata update. A
   * resolved gate is always released in finally so one failed mutation cannot
   * poison later operations.
   */
  private async runMetadataMutation<T>(mutation: () => Promise<T>): Promise<T> {
    const previousMutation = this.metadataMutationQueue;
    let releaseMutation!: () => void;
    this.metadataMutationQueue = new Promise<void>((resolve) => {
      releaseMutation = resolve;
    });

    await previousMutation;
    try {
      return await mutation();
    } finally {
      releaseMutation();
    }
  }

  getMetadata(key: string): FileMetadata | undefined {
    this.assertMetadataStateIsTrusted();
    const meta = this.metadata.get(normalizeStoragePath(key));
    if (!meta) return undefined;

    const publicMetadata = { ...meta };
    delete publicMetadata.passwordHash;
    return publicMetadata;
  }

  isPasswordProtected(key: string): boolean {
    if (!this.initialized || !this.metadataStateTrusted) return true;
    return this.metadata.get(normalizeStoragePath(key))?.protected === true;
  }

  private async getExistingMetadata(key: string): Promise<InternalFileMetadata | undefined> {
    const existing = this.metadata.get(key);
    if (existing) return existing;

    if (this.useMinIO) {
      try {
        const stat = await this.minioClient!.statObject(this.bucket, key);
        return {
          name: key.split('/').pop() || key,
          type: 'file',
          path: key,
          size: stat.size,
          modifiedAt: stat.lastModified?.toISOString() || new Date().toISOString(),
        };
      } catch {
        return undefined;
      }
    }

    const localPath = this.getLocalPath(key);
    if (!fs.existsSync(localPath)) return undefined;

    const stats = fs.statSync(localPath);
    return {
      name: key.split('/').pop() || key,
      type: stats.isDirectory() ? 'directory' : 'file',
      path: key,
      size: stats.size,
      modifiedAt: stats.mtime.toISOString(),
    };
  }

  // 获取文件列表
  async listFiles(prefix: string = ''): Promise<FileMetadata[]> {
    try {
      this.assertMetadataStateIsTrusted();
      const canonicalPrefix = normalizeStoragePath(prefix, { allowRoot: true });
      const files: FileMetadata[] = [];

      if (this.useMinIO) {
        // 使用 MinIO
        const listPrefix = canonicalPrefix
          ? `${canonicalPrefix.replace(/\/+$/, '')}/`
          : '';
        const objects = await this.collectMinioObjects(listPrefix, false);
        const seenPaths = new Set<string>();

        for (const obj of objects) {
          const objectName = typeof obj.name === 'string'
            ? obj.name
            : typeof obj.prefix === 'string'
              ? obj.prefix
              : '';
          if (!objectName) continue;

          const isPrefix = typeof obj.prefix === 'string' || objectName.endsWith('/');
          const key = normalizeStoragePath(
            isPrefix ? objectName.replace(/\/+$/, '') : objectName
          );
          const name = key.split('/').pop() || '';
          const meta = this.metadata.get(key);

          if (isPrefix && !seenPaths.has(key)) {
            seenPaths.add(key);
            files.push({
              name: name || key.replace(/\/$/, ''),
              type: 'directory',
              path: key,
              modifiedAt: obj.lastModified?.toISOString() || new Date().toISOString(),
              protected: false,
              children: [],
            });
          } else if (!isPrefix) {
            seenPaths.add(key);
            files.push({
              name,
              type: 'file',
              path: key,
              size: obj.size,
              modifiedAt: obj.lastModified?.toISOString() || new Date().toISOString(),
              protected: meta?.protected || false,
              fileType: meta?.fileType,
              children: [],
            });
          }
        }

        // Empty MinIO directories have no object prefix of their own. Merge
        // explicitly created directory metadata so they remain visible after
        // refresh without requiring a public marker object.
        for (const [key, meta] of this.metadata) {
          if (meta.type !== 'directory' || seenPaths.has(key)) continue;
          const separatorIndex = key.lastIndexOf('/');
          const parentPath = separatorIndex >= 0 ? key.slice(0, separatorIndex) : '';
          if (parentPath !== canonicalPrefix) continue;
          seenPaths.add(key);
          files.push({
            name: meta.name || key.slice(separatorIndex + 1),
            type: 'directory',
            path: key,
            modifiedAt: meta.modifiedAt,
            protected: false,
            children: [],
          });
        }
      } else {
        // 使用本地文件系统
        const localPath = this.getLocalPath(canonicalPrefix, true);

        // Listing is intentionally read-only. When MinIO temporarily falls
        // back to local storage, remote protected objects are absent locally;
        // pruning their metadata here would silently make them public when
        // MinIO recovers. Only explicit delete/maintenance flows may mutate
        // the protection index.
        if (!fs.existsSync(localPath)) {
          return [];
        }

        const items = fs.readdirSync(localPath);
        
        for (const name of items) {
          if (!canonicalPrefix && name === FILE_STORAGE_IDENTITY_KEY) continue;
          const fullPath = path.join(localPath, name);
          const stats = fs.lstatSync(fullPath);
          if (stats.isSymbolicLink()) {
            throw new StoragePathError();
          }
          const key = canonicalPrefix ? `${canonicalPrefix}/${name}` : name;
          const meta = this.metadata.get(key);

          files.push({
            name,
            type: stats.isDirectory() ? 'directory' : 'file',
            path: key,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString(),
            protected: meta?.protected || false,
            fileType: meta?.fileType,
            children: [],
          });
        }

        // 排序：目录在前，文件在后
        files.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      }

      return files.filter(f => f.name);
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }

  // 获取文件内容
  async getFileContent(key: string): Promise<string> {
    this.assertMetadataStateIsTrusted();
    const canonicalKey = normalizeStoragePath(key);
    if (this.useMinIO) {
      const stat = await this.minioClient!.statObject(this.bucket, canonicalKey);
      if (stat.size > FILE_CONTENT_PREVIEW_MAX_BYTES) {
        throw new FileContentTooLargeError();
      }
      const stream = await this.minioClient!.getObject(this.bucket, canonicalKey);
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let totalBytes = 0;
        let settled = false;
        stream.on('data', (chunk: Buffer | string) => {
          if (settled) return;
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          totalBytes += buffer.length;
          if (totalBytes > FILE_CONTENT_PREVIEW_MAX_BYTES) {
            settled = true;
            stream.destroy();
            reject(new FileContentTooLargeError());
            return;
          }
          chunks.push(buffer);
        });
        stream.on('end', () => {
          if (settled) return;
          settled = true;
          resolve(Buffer.concat(chunks).toString('utf-8'));
        });
        stream.on('error', (error) => {
          if (settled) return;
          settled = true;
          reject(error);
        });
      });
    } else {
      const localPath = this.getLocalPath(canonicalKey);
      if (fs.statSync(localPath).size > FILE_CONTENT_PREVIEW_MAX_BYTES) {
        throw new FileContentTooLargeError();
      }
      return fs.readFileSync(localPath, 'utf-8');
    }
  }

  // 上传文件
  async uploadFile(
    key: string,
    content: string,
    metadata?: Partial<FileMetadata>,
    password?: string
  ): Promise<void> {
    return this.runMetadataMutation(async () => {
      this.assertMetadataStateIsTrusted();
      const canonicalKey = normalizeStoragePath(key);
      const existing = this.metadata.get(canonicalKey);
      const meta: InternalFileMetadata = {
        ...existing,
        ...metadata,
        name: metadata?.name || existing?.name || canonicalKey.split('/').pop() || '',
        type: 'file',
        path: canonicalKey,
        size: Buffer.byteLength(content),
        modifiedAt: new Date().toISOString(),
        protected: existing?.protected === true || metadata?.protected === true,
      };

      if (password) {
        meta.protected = true;
        meta.passwordHash = await hashPassword(password);
      }

      const nextMetadata = new Map(this.metadata);
      nextMetadata.set(canonicalKey, meta);
      const persistBeforeWrite = meta.protected === true;

      // Protected metadata is committed before the file becomes readable. If
      // persistence fails, no new password-protected file is left public.
      if (persistBeforeWrite) {
        this.persistMetadata(nextMetadata);
      }

      try {
        if (this.useMinIO) {
          await this.minioClient!.putObject(this.bucket, canonicalKey, content);
        } else {
          const localPath = this.getLocalPath(canonicalKey);
          const dir = path.dirname(localPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(localPath, content, 'utf-8');
        }
      } catch (error) {
        console.error('Failed to write file content', {
          storageMode: this.storageMode,
          protected: persistBeforeWrite,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      if (!persistBeforeWrite) {
        this.persistMetadata(nextMetadata);
      }
    });
  }

  // 创建目录（元数据）
  async createDirectory(key: string, metadata?: Partial<FileMetadata>): Promise<void> {
    return this.runMetadataMutation(async () => {
      this.assertMetadataStateIsTrusted();
      const canonicalKey = normalizeStoragePath(key);
      if (!this.useMinIO) {
        const localPath = this.getLocalPath(canonicalKey);
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
        }
      }

      const meta: FileMetadata = {
        ...metadata,
        name: metadata?.name || canonicalKey.split('/').pop() || '',
        type: 'directory',
        path: canonicalKey,
        modifiedAt: new Date().toISOString(),
      };
      const nextMetadata = new Map(this.metadata);
      nextMetadata.set(canonicalKey, meta);
      this.persistMetadata(nextMetadata);
    });
  }

  // 删除文件
  async deleteFile(key: string): Promise<void> {
    return this.runMetadataMutation(async () => {
      this.assertMetadataStateIsTrusted();
      const canonicalKey = normalizeStoragePath(key);
      const descendantPrefix = `${canonicalKey}/`;
      const existingMetadata = this.metadata.get(canonicalKey);
      if (this.useMinIO) {
        // S3-compatible stores allow both `foo` and `foo/bar` to exist. Detect
        // that ambiguous shape before changing the protection index; silently
        // treating `foo` as only a file could orphan protected descendants.
        const matchingObjects = await this.collectMinioObjects(
          canonicalKey,
          true,
          10_000
        );
        const exactObjectExists = matchingObjects.some(
          (object) => object.name === canonicalKey
        );
        const directoryObjects = matchingObjects.filter(
          (object) => typeof object.name === 'string' && object.name.startsWith(descendantPrefix)
        );
        const hasMetadataDescendants = [...this.metadata.keys()].some(
          (metadataKey) => metadataKey.startsWith(descendantPrefix)
        );
        const hasDescendants = directoryObjects.length > 0 || hasMetadataDescendants;
        if (
          (existingMetadata?.type === 'file' && hasDescendants) ||
          (exactObjectExists && (existingMetadata?.type === 'directory' || hasDescendants))
        ) {
          throw new Error(
            'MinIO key collision: refusing an ambiguous file-tree deletion'
          );
        }

        if (
          existingMetadata?.type === 'directory' ||
          hasDescendants
        ) {
          const objectKeys = directoryObjects.flatMap((object) =>
            typeof object.name === 'string' && object.name.startsWith(descendantPrefix)
              ? [object.name]
              : []
          );
          const deletionResults = await Promise.allSettled(
            objectKeys.map((objectKey) =>
              this.minioClient!.removeObject(this.bucket, objectKey)
            )
          );
          const failedDeletes = deletionResults.filter((result) => result.status === 'rejected');
          if (failedDeletes.length > 0) {
            throw new Error('MinIO directory deletion was incomplete');
          }
        } else {
          await this.minioClient!.removeObject(this.bucket, canonicalKey);
        }
      } else {
        const localPath = this.getLocalPath(canonicalKey);
        if (fs.existsSync(localPath)) {
          const stats = fs.statSync(localPath);
          if (stats.isDirectory()) {
            fs.rmSync(localPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(localPath);
          }
        }
      }
      const nextMetadata = new Map(this.metadata);
      for (const metadataKey of nextMetadata.keys()) {
        if (metadataKey === canonicalKey || metadataKey.startsWith(descendantPrefix)) {
          nextMetadata.delete(metadataKey);
        }
      }
      this.persistMetadata(nextMetadata);
    });
  }

  // 设置文件密码
  async setPassword(key: string, password: string): Promise<void> {
    return this.runMetadataMutation(async () => {
      this.assertMetadataStateIsTrusted();
      const canonicalKey = normalizeStoragePath(key);
      const meta = await this.getExistingMetadata(canonicalKey);
      if (!meta) throw new Error('文件不存在');

      const protectedMetadata: InternalFileMetadata = {
        ...meta,
        protected: true,
        passwordHash: await hashPassword(password),
        path: canonicalKey,
      };
      const nextMetadata = new Map(this.metadata);
      nextMetadata.set(canonicalKey, protectedMetadata);
      this.persistMetadata(nextMetadata);
    });
  }

  // 移除文件密码保护
  async removePassword(key: string): Promise<void> {
    return this.runMetadataMutation(async () => {
      this.assertMetadataStateIsTrusted();
      const canonicalKey = normalizeStoragePath(key);
      const meta = this.metadata.get(canonicalKey);
      if (meta) {
        const nextMetadata = new Map(this.metadata);
        nextMetadata.set(canonicalKey, {
          ...meta,
          protected: false,
          passwordHash: undefined,
        });
        this.persistMetadata(nextMetadata);
      }
    });
  }

  // 验证文件密码（兼容旧 SHA-256 哈希，验证成功后自动升级为 bcrypt）
  async verifyPassword(key: string, password: string): Promise<boolean> {
    if (!this.initialized || !this.metadataStateTrusted) return false;
    const canonicalKey = normalizeStoragePath(key);
    const meta = this.metadata.get(canonicalKey);
    if (!meta?.protected) return true;
    if (!meta.passwordHash) return false;

    const storedHash = meta.passwordHash;

    if (isLegacySha256Hash(storedHash)) {
      const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
      if (legacyHash !== storedHash) {
        return false;
      }
      const upgradedHash = await hashPassword(password);

      // Upgrade only if no concurrent password mutation changed the value.
      return this.runMetadataMutation(async () => {
        if (!this.metadataStateTrusted) return false;
        const currentMetadata = this.metadata.get(canonicalKey);
        if (
          currentMetadata?.protected !== true ||
          currentMetadata.passwordHash !== storedHash
        ) {
          return false;
        }

        const nextMetadata = new Map(this.metadata);
        nextMetadata.set(canonicalKey, {
          ...currentMetadata,
          passwordHash: upgradedHash,
        });
        this.persistMetadata(nextMetadata);
        return true;
      });
    }

    const matches = await bcrypt.compare(password, storedHash);
    if (!matches || !this.metadataStateTrusted) return false;
    const currentMetadata = this.metadata.get(canonicalKey);
    return (
      currentMetadata?.protected === true &&
      currentMetadata.passwordHash === storedHash
    );
  }

  // 获取文件二进制内容（用于导出）
  async getFileBuffer(key: string): Promise<Buffer> {
    this.assertMetadataStateIsTrusted();
    const canonicalKey = normalizeStoragePath(key);
    if (this.useMinIO) {
      const stream = await this.minioClient!.getObject(this.bucket, canonicalKey);
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } else {
      const localPath = this.getLocalPath(canonicalKey);
      return fs.readFileSync(localPath);
    }
  }

  // 获取文件流（受保护下载通过后端转发，避免把整个对象聚合进内存）
  async getFileStream(key: string): Promise<Readable> {
    this.assertMetadataStateIsTrusted();
    const canonicalKey = normalizeStoragePath(key);
    if (this.useMinIO) {
      return this.minioClient!.getObject(this.bucket, canonicalKey);
    }
    return fs.createReadStream(this.getLocalPath(canonicalKey));
  }

  // 获取目录下所有文件（递归）
  async getAllFilesInDirectory(dirPath: string): Promise<string[]> {
    this.assertMetadataStateIsTrusted();
    const canonicalDirPath = normalizeStoragePath(dirPath, { allowRoot: true });
    const files: string[] = [];
    
    if (this.useMinIO) {
      const listPrefix = canonicalDirPath
        ? `${canonicalDirPath.replace(/\/+$/, '')}/`
        : '';
      const objects = await this.collectMinioObjects(listPrefix, true, 10_000);
      for (const object of objects) {
        if (object.name && !object.name.endsWith('/')) {
          files.push(object.name);
        }
      }
      return files;
    } else {
      const localPath = this.getLocalPath(canonicalDirPath, true);
      if (!fs.existsSync(localPath)) return files;
      
      const scanDir = (dir: string, basePath: string) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (!basePath && item === FILE_STORAGE_IDENTITY_KEY) continue;
          const fullPath = path.join(dir, item);
          const relativePath = basePath ? `${basePath}/${item}` : item;
          const stats = fs.lstatSync(fullPath);
          if (stats.isSymbolicLink()) {
            throw new StoragePathError();
          }
          if (stats.isDirectory()) {
            scanDir(fullPath, relativePath);
          } else {
            files.push(relativePath);
          }
        }
      };
      
      scanDir(localPath, canonicalDirPath);
      return files;
    }
  }
}

export default new FileService();
