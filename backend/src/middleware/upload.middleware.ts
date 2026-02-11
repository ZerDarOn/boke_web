import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// 确保上传目录存在
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 配置存储
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const type = req.params.type || 'general';
    const uploadPath = path.join(process.cwd(), 'uploads', type);
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// 文件过滤器
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // 允许的图片类型
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  // 允许的文档类型（About 页面文件）
  const allowedDocMimes = [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/json',
  ];

  const allowedTypes = [...allowedMimes, ...allowedDocMimes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`));
  }
};

// 配置上传限制
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 5, // 最多 5 个文件
};

// 创建 multer 实例
export const upload = multer({
  storage,
  fileFilter,
  limits,
});

// 单文件上传（图片）
export const uploadSingleImage = upload.single('image');

// 多文件上传（相册）
export const uploadMultipleImages = upload.array('images', 20);

// 混合上传（项目和文件）
export const uploadMixed = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 20 },
  { name: 'file', maxCount: 1 },
]);

// 错误处理中间件
export const handleUploadError = (
  err: Error,
  req: Request,
  res: any,
  next: any
) => {
  if (err instanceof multer.MulterError) {
    // Multer 错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大 10MB）',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超过限制',
      });
    }
    return res.status(400).json({
      success: false,
      message: `上传错误: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};
