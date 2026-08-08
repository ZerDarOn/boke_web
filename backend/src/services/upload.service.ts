import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { getFileUrl as getMinIOFileUrl, getObjectKey, getMinioClient, initializeMinIO } from '../config/minio';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const USE_MINIO = process.env.USE_MINIO === 'true';

// 初始化 MinIO（如果启用）
if (USE_MINIO) {
  initializeMinIO().then(success => {
    if (success) {
      console.log('✅ MinIO storage initialized');
    }
  });
}

// 确保目录存在（本地存储 fallback）
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 生成文件 URL：本地存储返回相对路径，避免写死 host/port 导致跨设备/跨端口加载不到
// （前端与后端同源时直接命中；dev 分端口时由 vite 代理 /uploads 转发）
export const getFileUrl = (filename: string, type: string = 'general'): string => {
  if (USE_MINIO) {
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
  } = {}
): Promise<{
  originalUrl: string;
  thumbnailUrl?: string;
  filename: string;
  mimetype: string;
  size: number;
  dimensions?: { width: number; height: number };
}> => {
  const {
    type = 'gallery',
    generateThumbnail = true,
    thumbnailWidth = 400,
  } = options;

  // 兼容磁盘存储(diskStorage→file.path)与内存存储(memoryStorage→file.buffer)。
  // 上传中间件用的是 diskStorage，file.buffer 为 undefined，必须从 file.path 读取，
  // 否则 sharp(undefined) 会抛错导致上传返回 500。
  const fileBuffer: Buffer = file.buffer ?? fs.readFileSync(file.path);

  // 获取图片尺寸
  const metadata = await sharp(fileBuffer).metadata();
  const dimensions = metadata.width && metadata.height
    ? { width: metadata.width, height: metadata.height }
    : undefined;

  const filename = `${uuidv4()}${path.extname(file.originalname)}`;

  const result: any = {
    originalUrl: getFileUrl(filename, type),
    filename,
    mimetype: file.mimetype,
    size: file.size,
    dimensions,
  };

  if (USE_MINIO) {
    // 使用 MinIO 存储
    try {
      const minioClient = getMinioClient();
      const objectKey = getObjectKey(filename, type);

      // 上传原图到 MinIO
      await minioClient.putObject(
        process.env.MINIO_BUCKET || 'ink-spirit-blog',
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
        const thumbnailKey = getObjectKey(thumbnailFilename, type);

        await minioClient.putObject(
          process.env.MINIO_BUCKET || 'ink-spirit-blog',
          thumbnailKey,
          thumbnailBuffer,
          thumbnailBuffer.length,
          { 'Content-Type': file.mimetype }
        );
        console.log(`✅ Uploaded thumbnail to MinIO: ${thumbnailKey}`);

        result.thumbnailUrl = getFileUrl(thumbnailFilename, type);
      }
    } catch (error) {
      console.error('❌ MinIO upload failed, falling back to local storage:', error);
      // 如果 MinIO 失败，fallback 到本地存储
      return uploadToLocal(file, fileBuffer, filename, type, result, generateThumbnail, thumbnailWidth, dimensions);
    }
  } else {
    // 使用本地存储
    return uploadToLocal(file, fileBuffer, filename, type, result, generateThumbnail, thumbnailWidth, dimensions);
  }

  return result;
};

// 本地存储 fallback 函数
async function uploadToLocal(
  file: Express.Multer.File,
  fileBuffer: Buffer,
  filename: string,
  type: string,
  result: any,
  generateThumbnail: boolean,
  thumbnailWidth: number,
  dimensions?: { width: number; height: number }
) {
  const uploadPath = path.join(UPLOAD_DIR, type);
  ensureDir(uploadPath);

  const filePath = path.join(uploadPath, filename);

  // 保存原图
  await sharp(fileBuffer).toFile(filePath);

  // 生成缩略图
  if (generateThumbnail && dimensions && dimensions.width > thumbnailWidth) {
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(uploadPath, thumbnailFilename);

    await sharp(fileBuffer)
      .resize(thumbnailWidth, null, { withoutEnlargement: true })
      .toFile(thumbnailPath);

    result.thumbnailUrl = getFileUrl(thumbnailFilename, type);
  }

  // 清理 multer(diskStorage) 落盘的原始临时文件，避免与 sharp 处理后的文件重复占用磁盘
  if (file.path && fs.existsSync(file.path) && path.resolve(file.path) !== path.resolve(filePath)) {
    try { fs.unlinkSync(file.path); } catch { /* 忽略清理失败 */ }
  }

  return result;
}

// 安全辅助：对 filename 和 type 做 basename 截断，阻止路径穿越
const safeName = (input: string): string => path.basename(input);

// 删除文件
export const deleteFile = async (
  filename: string,
  type: string = 'gallery'
): Promise<boolean> => {
  try {
    const safeFilename = safeName(filename);
    const safeType = safeName(type);

    if (USE_MINIO) {
      // 从 MinIO 删除
      const minioClient = getMinioClient();
      const bucket = process.env.MINIO_BUCKET || 'ink-spirit-blog';

      // 删除原图
      const objectKey = getObjectKey(safeFilename, safeType);
      await minioClient.removeObject(bucket, objectKey);

      // 删除缩略图
      const thumbnailKey = getObjectKey(`thumb_${safeFilename}`, safeType);
      try {
        await minioClient.removeObject(bucket, thumbnailKey);
      } catch (err) {
        // 缩略图可能不存在，忽略错误
      }

      console.log(`✅ Deleted from MinIO: ${objectKey}`);
      return true;
    } else {
      // 从本地删除
      const filePath = path.join(UPLOAD_DIR, safeType, safeFilename);
      const thumbnailPath = path.join(UPLOAD_DIR, safeType, `thumb_${safeFilename}`);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }

      return true;
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
};

// 获取文件信息
export const getFileInfo = (
  filename: string,
  type: string = 'gallery'
): {
  exists: boolean;
  url: string;
  thumbnailUrl?: string;
  path: string;
} => {
  const safeFilename = safeName(filename);
  const safeType = safeName(type);

  const filePath = path.join(UPLOAD_DIR, safeType, safeFilename);
  const thumbnailPath = path.join(UPLOAD_DIR, safeType, `thumb_${safeFilename}`);

  return {
    exists: fs.existsSync(filePath),
    url: getFileUrl(safeFilename, safeType),
    thumbnailUrl: fs.existsSync(thumbnailPath)
      ? getFileUrl(`thumb_${safeFilename}`, safeType)
      : undefined,
    path: filePath,
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
