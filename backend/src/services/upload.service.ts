import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// 确保目录存在
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 生成文件 URL
export const getFileUrl = (filename: string, type: string = 'general'): string => {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  return `${baseUrl}/uploads/${type}/${filename}`;
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

  const uploadPath = path.join(UPLOAD_DIR, type);
  ensureDir(uploadPath);

  const filename = `${uuidv4()}${path.extname(file.originalname)}`;
  const filePath = path.join(uploadPath, filename);

  // 获取图片尺寸
  const metadata = await sharp(file.buffer).metadata();
  const dimensions = metadata.width && metadata.height
    ? { width: metadata.width, height: metadata.height }
    : undefined;

  // 保存原图
  await sharp(file.buffer).toFile(filePath);

  const result: any = {
    originalUrl: getFileUrl(filename, type),
    filename,
    mimetype: file.mimetype,
    size: file.size,
    dimensions,
  };

  // 生成缩略图
  if (generateThumbnail && dimensions && dimensions.width > thumbnailWidth) {
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(uploadPath, thumbnailFilename);

    await sharp(file.buffer)
      .resize(thumbnailWidth, null, { withoutEnlargement: true })
      .toFile(thumbnailPath);

    result.thumbnailUrl = getFileUrl(thumbnailFilename, type);
  }

  return result;
};

// 删除文件
export const deleteFile = async (
  filename: string,
  type: string = 'gallery'
): Promise<boolean> => {
  try {
    const filePath = path.join(UPLOAD_DIR, type, filename);
    const thumbnailPath = path.join(UPLOAD_DIR, type, `thumb_${filename}`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    return true;
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
  const filePath = path.join(UPLOAD_DIR, type, filename);
  const thumbnailPath = path.join(UPLOAD_DIR, type, `thumb_${filename}`);

  return {
    exists: fs.existsSync(filePath),
    url: getFileUrl(filename, type),
    thumbnailUrl: fs.existsSync(thumbnailPath)
      ? getFileUrl(`thumb_${filename}`, type)
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
