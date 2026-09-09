import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type { Client } from 'minio';
import {
  getFileUrl as getMinIOFileUrl,
  getObjectKey,
  getMinioClient,
  isMinioEnabled,
} from '../config/minio';
import { resolveBackendRuntimePath } from '../config/backend-env-path';

const UPLOAD_DIR = resolveBackendRuntimePath(process.env.UPLOAD_DIR, 'uploads');
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'ink-spirit-blog';

export type UploadStorage = 'local' | 'minio';

export interface ProcessedImageUpload {
  originalUrl: string;
  thumbnailUrl?: string;
  filename: string;
  mimetype: string;
  size: number;
  dimensions?: { width: number; height: number };
  storage: UploadStorage;
}

export interface ProcessImageUploadDependencies {
  useMinio?: boolean;
  minioClient?: Pick<Client, 'putObject' | 'removeObject'> | null;
  uploadRoot?: string;
}

export interface UploadStorageDependencies {
  useMinio?: boolean;
  minioClient?: Pick<Client, 'statObject' | 'removeObject'> | null;
  uploadRoot?: string;
}

export type UploadFailureCategory =
  | 'image_processing_failed'
  | 'storage_failed'
  | 'storage_cleanup_failed'
  | 'upload_processing_failed'
  | 'unknown_failure';

export interface BatchImageUploadOperations {
  processUpload: (file: Express.Multer.File, type: string) => Promise<ProcessedImageUpload>;
  rollbackUpload: (filename: string, type: string, storage: UploadStorage) => Promise<boolean>;
  cleanupStagedUpload: (filePath: string) => void | Promise<void>;
}

export interface BatchImageUploadResult {
  ok: boolean;
  uploads: ProcessedImageUpload[];
  attempted: number;
  failedUploads: number;
  rollbackFailures: number;
  stagingCleanupFailures: number;
  failureCategories: UploadFailureCategory[];
  errorMessage?: string;
}

// 确保目录存在（本地存储 fallback）
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const removeStagedUpload = (filePath?: string): void => {
  if (!filePath || !fs.existsSync(filePath)) return;
  try {
    fs.unlinkSync(filePath);
  } catch {
    // The dedicated temporary-upload cleanup will retry stale staging files.
  }
};

// 安全辅助：对 filename 和 type 做 basename 截断，阻止路径穿越
const safeName = (input: string): string => {
  const basename = path.basename(input);
  if (!basename || basename === '.' || basename === '..' || basename.includes('\0')) {
    throw new Error('无效的存储名称');
  }
  return basename;
};

const getLocalFileUrl = (filename: string, type: string): string =>
  `/uploads/${type}/${filename}`;

// 生成文件 URL：本地存储返回相对路径，避免写死 host/port 导致跨设备/跨端口加载不到
// （前端与后端同源时直接命中；dev 分端口时由 vite 代理 /uploads 转发）
export const getFileUrl = (filename: string, type: string = 'general'): string => {
  if (isMinioEnabled()) {
    return getMinIOFileUrl(filename, type);
  }
  return `/uploads/${type}/${filename}`;
};

// 处理图片上传（生成缩略图）
export const processImageUpload = async (
  file: Express.Multer.File,
  options: {
    type?: string;
    generateThumbnail?: boolean;
    thumbnailWidth?: number;
  } = {},
  dependencies: ProcessImageUploadDependencies = {}
): Promise<ProcessedImageUpload> => {
  const {
    type = 'gallery',
    generateThumbnail = true,
    thumbnailWidth = 400,
  } = options;

  // 兼容磁盘存储(diskStorage→file.path)与内存存储(memoryStorage→file.buffer)。
  // 上传中间件用的是 diskStorage，file.buffer 为 undefined，必须从 file.path 读取，
  // 否则 sharp(undefined) 会抛错导致上传返回 500。
  let fileBuffer: Buffer;
  let dimensions: { width: number; height: number } | undefined;
  try {
    fileBuffer = file.buffer ?? fs.readFileSync(file.path);
    const metadata = await sharp(fileBuffer).metadata();
    dimensions = metadata.width && metadata.height
      ? { width: metadata.width, height: metadata.height }
      : undefined;
  } catch (error) {
    removeStagedUpload(file.path);
    throw error;
  }

  const safeType = safeName(type);
  const useMinio = dependencies.useMinio ?? isMinioEnabled();
  const minioClient = dependencies.minioClient === undefined
    ? getMinioClient()
    : dependencies.minioClient;
  const uploadRoot = dependencies.uploadRoot ?? UPLOAD_DIR;
  const filename = `${uuidv4()}${path.extname(file.originalname)}`;
  const baseResult = {
    filename,
    mimetype: file.mimetype,
    size: file.size,
    dimensions,
  };

  if (useMinio) {
    // 使用 MinIO 存储
    const possiblyUploadedObjectKeys: string[] = [];
    try {
      if (!minioClient) {
        throw new Error('MinIO client is not configured');
      }

      const objectKey = getObjectKey(filename, safeType);
      possiblyUploadedObjectKeys.push(objectKey);

      // 上传原图到 MinIO
      await minioClient.putObject(
        MINIO_BUCKET,
        objectKey,
        fileBuffer,
        fileBuffer.length,
        { 'Content-Type': file.mimetype }
      );
      console.log(`✅ Uploaded to MinIO: ${objectKey}`);

      // 生成缩略图
      if (generateThumbnail && dimensions && dimensions.width > thumbnailWidth) {
        const thumbnailBuffer = await sharp(fileBuffer)
          .resize(thumbnailWidth, null, { withoutEnlargement: true })
          .toBuffer();

        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailKey = getObjectKey(thumbnailFilename, safeType);
        possiblyUploadedObjectKeys.push(thumbnailKey);

        await minioClient.putObject(
          MINIO_BUCKET,
          thumbnailKey,
          thumbnailBuffer,
          thumbnailBuffer.length,
          { 'Content-Type': file.mimetype }
        );
        console.log(`✅ Uploaded thumbnail to MinIO: ${thumbnailKey}`);

        const result: ProcessedImageUpload = {
          ...baseResult,
          originalUrl: getMinIOFileUrl(filename, safeType),
          thumbnailUrl: getMinIOFileUrl(thumbnailFilename, safeType),
          storage: 'minio',
        };

        removeStagedUpload(file.path);
        return result;
      }

      removeStagedUpload(file.path);
      return {
        ...baseResult,
        originalUrl: getMinIOFileUrl(filename, safeType),
        storage: 'minio',
      };
    } catch (error) {
      const cleanupResults = minioClient
        ? await Promise.allSettled(
          [...possiblyUploadedObjectKeys]
            .reverse()
            .map((objectKey) => minioClient.removeObject(MINIO_BUCKET, objectKey))
        )
        : [];
      const cleanupFailures = cleanupResults.filter((result) => result.status === 'rejected');

      if (cleanupFailures.length > 0) {
        removeStagedUpload(file.path);
        console.error('❌ MinIO upload failed and compensation was incomplete:', {
          failureCategory: categorizeUploadFailure(error),
          errorName: error instanceof Error ? error.name : 'UnknownError',
          cleanupFailures: cleanupFailures.length,
          objectCount: possiblyUploadedObjectKeys.length,
        });
        throw new Error('对象存储上传失败，且残留文件清理未完成');
      }

      console.error('❌ MinIO upload failed, falling back to local storage:', {
        failureCategory: categorizeUploadFailure(error),
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      // 如果 MinIO 失败，fallback 到本地存储
      return uploadToLocal(
        file,
        fileBuffer,
        filename,
        safeType,
        baseResult,
        generateThumbnail,
        thumbnailWidth,
        dimensions,
        uploadRoot
      );
    }
  } else {
    // 使用本地存储
    return uploadToLocal(
      file,
      fileBuffer,
      filename,
      safeType,
      baseResult,
      generateThumbnail,
      thumbnailWidth,
      dimensions,
      uploadRoot
    );
  }
};

const categorizeUploadFailure = (reason: unknown): UploadFailureCategory => {
  if (!(reason instanceof Error)) return 'unknown_failure';
  const message = reason.message.toLowerCase();
  if (message.includes('清理未完成') || message.includes('compensation')) {
    return 'storage_cleanup_failed';
  }
  if (message.includes('minio') || message.includes('对象存储')) {
    return 'storage_failed';
  }
  if (
    message.includes('image') || message.includes('图片') ||
    message.includes('sharp') || message.includes('input buffer')
  ) {
    return 'image_processing_failed';
  }
  return 'upload_processing_failed';
};

export const coordinateBatchImageUploads = async (
  files: Express.Multer.File[],
  type: string,
  operations: BatchImageUploadOperations
): Promise<BatchImageUploadResult> => {
  const settledUploads = await Promise.allSettled(
    files.map((file) => Promise.resolve().then(() => operations.processUpload(file, type)))
  );
  const uploads = settledUploads.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : []
  );
  const rejectedUploads = settledUploads.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );

  if (rejectedUploads.length === 0) {
    return {
      ok: true,
      uploads,
      attempted: files.length,
      failedUploads: 0,
      rollbackFailures: 0,
      stagingCleanupFailures: 0,
      failureCategories: [],
    };
  }

  const [rollbackResults, stagingCleanupResults] = await Promise.all([
    Promise.allSettled(
      uploads.map((upload) => Promise.resolve().then(() =>
        operations.rollbackUpload(upload.filename, type, upload.storage)
      ))
    ),
    Promise.allSettled(
      files.map((file) => Promise.resolve().then(() =>
        operations.cleanupStagedUpload(file.path)
      ))
    ),
  ]);
  const rollbackFailures = rollbackResults.filter(
    (result) => result.status === 'rejected' || result.value === false
  ).length;
  const stagingCleanupFailures = stagingCleanupResults.filter(
    (result) => result.status === 'rejected'
  ).length;
  const failureCategories = Array.from(new Set(
    rejectedUploads.map((result) => categorizeUploadFailure(result.reason))
  ));

  return {
    ok: false,
    uploads,
    attempted: files.length,
    failedUploads: rejectedUploads.length,
    rollbackFailures,
    stagingCleanupFailures,
    failureCategories,
    errorMessage: rollbackFailures + stagingCleanupFailures > 0
      ? '批量上传失败，部分文件清理失败，请检查服务端日志'
      : '批量上传失败，已尝试清理本次产生的文件',
  };
};

interface LocalImageWriteOptions {
  fileBuffer: Buffer;
  filename: string;
  type: string;
  generateThumbnail: boolean;
  thumbnailWidth: number;
  dimensions?: { width: number; height: number };
  uploadRoot?: string;
}

interface LocalImageWriteResult {
  originalUrl: string;
  thumbnailUrl?: string;
}

const removeNewLocalArtifact = async (
  artifactPath: string,
  existedBefore: boolean
): Promise<void> => {
  if (existedBefore) return;

  try {
    const stats = await fs.promises.lstat(artifactPath);
    if (stats.isFile()) {
      await fs.promises.unlink(artifactPath);
    }
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
};

/**
 * Writes a processed image to local storage and compensates all paths created
 * by this attempt if either the original or thumbnail write fails.
 * `uploadRoot` exists so the filesystem behavior can be fault-injection tested.
 */
export const writeImageToLocalStorage = async ({
  fileBuffer,
  filename,
  type,
  generateThumbnail,
  thumbnailWidth,
  dimensions,
  uploadRoot = UPLOAD_DIR,
}: LocalImageWriteOptions): Promise<LocalImageWriteResult> => {
  const safeFilename = safeName(filename);
  const safeType = safeName(type);
  const uploadPath = path.join(uploadRoot, safeType);
  ensureDir(uploadPath);

  const filePath = path.join(uploadPath, safeFilename);
  const thumbnailFilename = `thumb_${safeFilename}`;
  const thumbnailPath = path.join(uploadPath, thumbnailFilename);
  const originalExistedBefore = fs.existsSync(filePath);
  const thumbnailExistedBefore = fs.existsSync(thumbnailPath);

  if (originalExistedBefore) {
    throw new Error('目标文件已存在，拒绝覆盖');
  }

  try {
    await sharp(fileBuffer).toFile(filePath);

    let thumbnailUrl: string | undefined;
    if (generateThumbnail && dimensions && dimensions.width > thumbnailWidth) {
      await sharp(fileBuffer)
        .resize(thumbnailWidth, null, { withoutEnlargement: true })
        .toFile(thumbnailPath);
      thumbnailUrl = getLocalFileUrl(thumbnailFilename, safeType);
    }

    return {
      originalUrl: getLocalFileUrl(safeFilename, safeType),
      thumbnailUrl,
    };
  } catch (error) {
    const cleanupResults = await Promise.allSettled([
      removeNewLocalArtifact(thumbnailPath, thumbnailExistedBefore),
      removeNewLocalArtifact(filePath, originalExistedBefore),
    ]);
    const cleanupFailures = cleanupResults.filter((result) => result.status === 'rejected');
    if (cleanupFailures.length > 0) {
      console.error('本地图片上传补偿清理失败:', {
        cleanupFailures: cleanupFailures.length,
        filename: safeFilename,
        type: safeType,
      });
    }
    throw error;
  }
};

// 本地存储 fallback 函数
async function uploadToLocal(
  file: Express.Multer.File,
  fileBuffer: Buffer,
  filename: string,
  type: string,
  baseResult: Omit<ProcessedImageUpload, 'originalUrl' | 'thumbnailUrl' | 'storage'>,
  generateThumbnail: boolean,
  thumbnailWidth: number,
  dimensions?: { width: number; height: number },
  uploadRoot: string = UPLOAD_DIR
): Promise<ProcessedImageUpload> {
  try {
    const localResult = await writeImageToLocalStorage({
      fileBuffer,
      filename,
      type,
      generateThumbnail,
      thumbnailWidth,
      dimensions,
      uploadRoot,
    });

    return {
      ...baseResult,
      ...localResult,
      storage: 'local',
    };
  } finally {
    // 本地写入成功或失败都清理 multer 的临时落盘文件。
    removeStagedUpload(file.path);
  }
}

interface LocalUploadPaths {
  filePath: string;
  thumbnailPath: string;
}

const getLocalUploadPaths = (
  uploadRoot: string,
  type: string,
  filename: string
): LocalUploadPaths => ({
  filePath: path.join(uploadRoot, type, filename),
  thumbnailPath: path.join(uploadRoot, type, `thumb_${filename}`),
});

const deleteLocalUpload = async (paths: LocalUploadPaths): Promise<boolean> => {
  const deletionResults = await Promise.allSettled([
    removeNewLocalArtifact(paths.filePath, false),
    removeNewLocalArtifact(paths.thumbnailPath, false),
  ]);
  return deletionResults.every((result) => result.status === 'fulfilled')
    && !fs.existsSync(paths.filePath)
    && !fs.existsSync(paths.thumbnailPath);
};

const isMinioNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: string; statusCode?: number };
  return candidate.statusCode === 404
    || candidate.code === 'NoSuchKey'
    || candidate.code === 'NoSuchObject'
    || candidate.code === 'NotFound';
};

const minioObjectExists = async (
  minioClient: Pick<Client, 'statObject'>,
  objectKey: string
): Promise<boolean> => {
  try {
    await minioClient.statObject(MINIO_BUCKET, objectKey);
    return true;
  } catch (error) {
    if (isMinioNotFoundError(error)) return false;
    throw error;
  }
};

const deleteMinioUpload = async (
  minioClient: Pick<Client, 'removeObject'>,
  filename: string,
  type: string
): Promise<boolean> => {
  const objectKey = getObjectKey(filename, type);
  const thumbnailKey = getObjectKey(`thumb_${filename}`, type);
  const deletionResults = await Promise.allSettled([
    minioClient.removeObject(MINIO_BUCKET, objectKey),
    minioClient.removeObject(MINIO_BUCKET, thumbnailKey),
  ]);
  const deletionFailures = deletionResults.filter((result) => result.status === 'rejected');
  if (deletionFailures.length > 0) {
    console.error('从 MinIO 删除文件时部分失败:', {
      filename,
      type,
      failures: deletionFailures.length,
    });
    return false;
  }
  console.log(`✅ Deleted from MinIO: ${objectKey}`);
  return true;
};

// 删除文件。未显式指定 storage 时，本地实物优先；只有本地不存在才探测 MinIO。
export const deleteFile = async (
  filename: string,
  type: string = 'gallery',
  storage?: UploadStorage,
  dependencies: UploadStorageDependencies = {}
): Promise<boolean> => {
  try {
    const safeFilename = safeName(filename);
    const safeType = safeName(type);
    const uploadRoot = dependencies.uploadRoot ?? UPLOAD_DIR;
    const useMinio = dependencies.useMinio ?? isMinioEnabled();
    const minioClient = dependencies.minioClient === undefined
      ? getMinioClient()
      : dependencies.minioClient;
    const localPaths = getLocalUploadPaths(uploadRoot, safeType, safeFilename);

    if (storage === 'local') return deleteLocalUpload(localPaths);
    if (storage === 'minio') {
      if (!minioClient) return false;
      return deleteMinioUpload(minioClient, safeFilename, safeType);
    }

    if (fs.existsSync(localPaths.filePath) || fs.existsSync(localPaths.thumbnailPath)) {
      return deleteLocalUpload(localPaths);
    }
    if (!useMinio || !minioClient) return false;

    const objectKey = getObjectKey(safeFilename, safeType);
    const thumbnailKey = getObjectKey(`thumb_${safeFilename}`, safeType);
    const [originalExists, thumbnailExists] = await Promise.all([
      minioObjectExists(minioClient, objectKey),
      minioObjectExists(minioClient, thumbnailKey),
    ]);
    if (!originalExists && !thumbnailExists) return false;
    return deleteMinioUpload(minioClient, safeFilename, safeType);
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
};

// 获取文件信息。返回实际命中的存储后端，避免 MinIO 降级文件被误定位。
export const getFileInfo = async (
  filename: string,
  type: string = 'gallery',
  dependencies: UploadStorageDependencies = {}
): Promise<{
  exists: boolean;
  url: string;
  thumbnailUrl?: string;
  storage: UploadStorage | null;
}> => {
  const safeFilename = safeName(filename);
  const safeType = safeName(type);
  const uploadRoot = dependencies.uploadRoot ?? UPLOAD_DIR;
  const useMinio = dependencies.useMinio ?? isMinioEnabled();
  const minioClient = dependencies.minioClient === undefined
    ? getMinioClient()
    : dependencies.minioClient;
  const localPaths = getLocalUploadPaths(uploadRoot, safeType, safeFilename);

  if (fs.existsSync(localPaths.filePath)) {
    return {
      exists: true,
      url: getLocalFileUrl(safeFilename, safeType),
      thumbnailUrl: fs.existsSync(localPaths.thumbnailPath)
        ? getLocalFileUrl(`thumb_${safeFilename}`, safeType)
        : undefined,
      storage: 'local',
    };
  }

  if (useMinio) {
    if (!minioClient) throw new Error('对象存储暂时不可用');
    const objectKey = getObjectKey(safeFilename, safeType);
    const originalExists = await minioObjectExists(minioClient, objectKey);
    if (originalExists) {
      const thumbnailFilename = `thumb_${safeFilename}`;
      const thumbnailKey = getObjectKey(thumbnailFilename, safeType);
      const thumbnailExists = await minioObjectExists(minioClient, thumbnailKey);
      return {
        exists: true,
        url: getMinIOFileUrl(safeFilename, safeType),
        thumbnailUrl: thumbnailExists
          ? getMinIOFileUrl(thumbnailFilename, safeType)
          : undefined,
        storage: 'minio',
      };
    }
  }

  return {
    exists: false,
    url: useMinio
      ? getMinIOFileUrl(safeFilename, safeType)
      : getLocalFileUrl(safeFilename, safeType),
    storage: null,
  };
};

// 批量删除文件
export const deleteFiles = async (
  filenames: string[],
  type: string = 'gallery'
): Promise<{ success: string[]; failed: string[] }> => {
  const success: string[] = [];
  const failed: string[] = [];

  for (const filename of filenames) {
    const deleted = await deleteFile(filename, type);
    if (deleted) {
      success.push(filename);
    } else {
      failed.push(filename);
    }
  }

  return { success, failed };
};
