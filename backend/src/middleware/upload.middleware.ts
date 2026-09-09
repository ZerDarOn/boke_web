import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { apiLog } from '../lib/logger';
import {
  cleanupExpiredTemporaryUploads,
  TemporaryUploadCleanupResult,
} from '../lib/temporary-upload-cleanup';
import { resolveBackendRoot, resolveBackendRuntimePath } from '../config/backend-env-path';

const PUBLIC_UPLOAD_DIR = resolveBackendRuntimePath(process.env.UPLOAD_DIR, 'uploads');
const TEMPORARY_UPLOAD_DIR = path.join(resolveBackendRoot(), 'temp', 'uploads');

/**
 * 危险的文件扩展名（防止上传可执行文件）
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar',
  '.app', '.deb', '.rpm', '.dmg', '.pkg', '.msi',
  '.docm', '.dotm', '.xlsm', '.xltm', '.xlam', '.pptm',
];

/**
 * 允许的图片扩展名
 */
const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
];

const ALLOWED_CURSOR_EXTENSIONS = ['.cur', '.png'];

/**
 * 允许的文档扩展名
 */
const ALLOWED_DOC_EXTENSIONS = [
  '.txt', '.md', '.pdf', '.json',
];

/**
 * 文件类型的魔术字节（用于验证真实的文件类型）
 */
const FILE_MAGIC_BYTES: Record<string, string> = {
  'image/jpeg': 'ffd8ffe0',
  'image/png': '89504e47',
  'image/gif': '47494638',
  'image/webp': '52494646',
};

/**
 * 确保上传目录存在
 */
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * 清理文件名（防止路径遍历攻击）
 */
function sanitizeFilename(filename: string): string {
  // 移除路径分隔符
  filename = filename.replace(/[\/\\]/g, '');

  // 移除危险字符
  filename = filename.replace(/[<>:"|?*]/g, '');

  // 移除点号开头（防止隐藏文件）
  filename = filename.replace(/^\.+/, '');

  // 限制文件名长度
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const maxNameLength = 100;
  const trimmedName = name.slice(0, maxNameLength);

  return trimmedName + ext;
}

/**
 * 验证文件扩展名
 */
function validateExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext) && !DANGEROUS_EXTENSIONS.includes(ext);
}

/**
 * 验证文件 MIME 类型
 */
function validateMimeType(mimetype: string, allowedMimes: string[]): boolean {
  return allowedMimes.includes(mimetype);
}

/**
 * 检查文件的魔术字节
 */
function checkFileMagicBytes(filePath: string): Promise<string | null> {
  return new Promise((resolve) => {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8);
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex').slice(0, 8).toLowerCase();

    for (const [mimetype, magic] of Object.entries(FILE_MAGIC_BYTES)) {
      if (hex.startsWith(magic)) {
        resolve(mimetype);
        return;
      }
    }
    resolve(null);
  });
}

/**
 * 配置存储
 */
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    ensureDir(TEMPORARY_UPLOAD_DIR);
    cb(null, TEMPORARY_UPLOAD_DIR);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const sanitized = sanitizeFilename(file.originalname);
    const uniqueName = `${uuidv4()}_${sanitized}`;
    cb(null, uniqueName);
  },
});

const cursorStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    const uploadPath = path.join(PUBLIC_UPLOAD_DIR, 'cursors');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${extension}`);
  },
});

/**
 * 文件过滤器 - 图片
 */
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 检查扩展名
  if (!validateExtension(file.originalname, ALLOWED_IMAGE_EXTENSIONS)) {
    cb(new Error(`不支持的图片格式。支持的格式：${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`));
    return;
  }

  // 检查 MIME 类型
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  if (!validateMimeType(file.mimetype, allowedMimes)) {
    cb(new Error(`不支持的图片类型：${file.mimetype}`));
    return;
  }

  cb(null, true);
};

const cursorFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!validateExtension(file.originalname, ALLOWED_CURSOR_EXTENSIONS)) {
    cb(new Error('不支持的光标格式。请上传 .cur 或透明 .png 文件'));
    return;
  }

  const allowedMimes = ['application/octet-stream', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/png'];
  if (!validateMimeType(file.mimetype, allowedMimes)) {
    cb(new Error(`不支持的光标文件类型：${file.mimetype}`));
    return;
  }

  cb(null, true);
};

/**
 * 文件过滤器 - 文档
 */
const docFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 检查扩展名
  if (!validateExtension(file.originalname, ALLOWED_DOC_EXTENSIONS)) {
    cb(new Error(`不支持的文档格式。支持的格式：${ALLOWED_DOC_EXTENSIONS.join(', ')}`));
    return;
  }

  // 检查 MIME 类型
  const allowedMimes = [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/json',
  ];

  if (!validateMimeType(file.mimetype, allowedMimes)) {
    cb(new Error(`不支持的文档类型：${file.mimetype}`));
    return;
  }

  cb(null, true);
};

/**
 * 通用文件过滤器
 */
const generalFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_DOC_EXTENSIONS];

  if (!validateExtension(file.originalname, allowedExtensions)) {
    cb(new Error(`不支持的文件格式。支持的格式：${allowedExtensions.join(', ')}`));
    return;
  }

  const allowedMimes = [
    ...['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    ...['text/plain', 'text/markdown', 'application/pdf', 'application/json'],
  ];

  if (!validateMimeType(file.mimetype, allowedMimes)) {
    cb(new Error(`不支持的文件类型：${file.mimetype}`));
    return;
  }

  cb(null, true);
};

/**
 * 上传限制配置
 */
const limits = {
  fileSize: 10 * 1024 * 1024,  // 10MB
  files: 10,  // 最多 10 个文件
  fieldNameSize: 100,  // 字段名最大长度
  fieldSize: 1024 * 1024,  // 字段值最大长度（1MB）
  fields: 20,  // 最多 20 个字段
};

/**
 * 创建 multer 实例 - 图片
 */
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    ...limits,
    fileSize: 5 * 1024 * 1024,  // 图片最大 5MB
  },
});

/**
 * 创建 multer 实例 - 文档
 */
export const uploadDoc = multer({
  storage,
  fileFilter: docFileFilter,
  limits: {
    ...limits,
    fileSize: 2 * 1024 * 1024,  // 文档最大 2MB
  },
});

/**
 * 创建 multer 实例 - 通用
 */
export const uploadGeneral = multer({
  storage,
  fileFilter: generalFileFilter,
  limits,
});

export const uploadCursor = multer({
  storage: cursorStorage,
  fileFilter: cursorFileFilter,
  limits: { ...limits, fileSize: 1024 * 1024, files: 1 },
});

/**
 * 向后兼容的导出（使用通用上传）
 */
export const upload = uploadGeneral;

/**
 * 单文件上传（图片）
 */
export const uploadSingleImage = uploadImage.single('image');

/**
 * 多文件上传（相册）
 */
export const uploadMultipleImages = uploadImage.array('images', 20);

export const uploadSingleCursor = uploadCursor.single('cursor');

/**
 * 混合上传（项目和文件）
 */
export const uploadMixed = uploadGeneral.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 20 },
  { name: 'file', maxCount: 1 },
]);

/**
 * 错误处理中间件
 */
export const handleUploadError = (
  err: Error,
  req: Request,
  res: any,
  next: any
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '文件大小超过限制（图片最大 5MB，文档最大 2MB，通用文件最大 10MB）',
        code: 5000,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: '文件数量超过限制',
        code: 5000,
      });
    }
    if (err.code === 'LIMIT_FIELD_KEY') {
      return res.status(400).json({
        success: false,
        error: '字段名过长',
        code: 5000,
      });
    }
    if (err.code === 'LIMIT_FIELD_VALUE') {
      return res.status(400).json({
        success: false,
        error: '字段值过大',
        code: 5000,
      });
    }
    if (err.code === 'LIMIT_FIELD_COUNT') {
      return res.status(400).json({
        success: false,
        error: '字段数量过多',
        code: 5000,
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: '不预期的文件字段',
        code: 5000,
      });
    }

    return res.status(400).json({
      success: false,
      error: err.message,
      code: 5000,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 5000,
    });
  }

  next();
};

/**
 * 验证已上传的文件
 */
export async function validateUploadedFile(filePath: string, expectedMime?: string): Promise<boolean> {
  try {
    // 检查魔术字节
    const magicMime = await checkFileMagicBytes(filePath);

    if (expectedMime && magicMime !== expectedMime) {
      return false;
    }

    // 检查文件大小
    const stats = fs.statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) {  // 10MB
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 删除上传的文件，并把失败交给需要统计补偿结果的调用方。
 */
export function deleteUploadedFileOrThrow(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * 尽力删除单个上传文件；适合无需返回补偿结果的请求收尾。
 */
export function deleteUploadedFile(filePath: string): void {
  try {
    deleteUploadedFileOrThrow(filePath);
  } catch (error) {
    console.error('Failed to delete uploaded file:', error);
  }
}

/**
 * 清理临时文件（定期运行）
 */
export function cleanupTempFiles(
  maxAge: number = 24 * 60 * 60 * 1000
): TemporaryUploadCleanupResult {
  const result = cleanupExpiredTemporaryUploads(TEMPORARY_UPLOAD_DIR, maxAge);

  if (result.removedFiles > 0 || result.failedEntries > 0) {
    apiLog.info('Temporary upload cleanup completed', result);
  }

  return result;
}

// 每天清理一次临时文件
const temporaryUploadCleanupTimer = setInterval(() => {
  cleanupTempFiles();
}, 24 * 60 * 60 * 1000);
temporaryUploadCleanupTimer.unref();
