import { Router, Request, Response } from 'express';
import {
  uploadSingleImage,
  uploadMultipleImages,
  uploadSingleCursor,
  handleUploadError,
  deleteUploadedFile,
} from '../middleware/upload.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { success, error } from '../utils/response';
import * as uploadService from '../services/upload.service';
import fs from 'fs';
import path from 'path';
import { apiLog } from '../lib/logger';
import { hasValidCursorSignature } from '../lib/cursor-file';

const router = Router();

// 网站鼠标皮肤上传：只接受浏览器可用的 CUR/PNG，并在落盘后校验文件头。
router.post(
  '/cursor',
  authenticate,
  requireAdmin,
  uploadSingleCursor,
  handleUploadError,
  async (req, res) => {
    if (!req.file) return error(res, '请选择要上传的光标文件', 400);

    if (!hasValidCursorSignature(req.file.path)) {
      deleteUploadedFile(req.file.path);
      apiLog.warn('Rejected cursor upload with invalid signature', {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
      });
      return error(res, '文件内容与扩展名不匹配', 400);
    }

    apiLog.info('Cursor asset uploaded', {
      filename: req.file.filename,
      size: req.file.size,
      userId: req.user?.userId,
    });
    return success(res, {
      originalUrl: `/uploads/cursors/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
    }, '光标上传成功');
  }
);

// 单图片上传（相册、项目封面等）
router.post(
  '/image/:type',
  authenticate,
  requireAdmin,
  uploadSingleImage,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return error(res, '请选择要上传的文件', 400);
      }

      const { type = 'gallery' } = req.params;
      const result = await uploadService.processImageUpload(req.file, {
        type,
        generateThumbnail: true,
      });

      return success(res, result, '上传成功');
    } catch (err: any) {
      return error(res, err.message, 500);
    }
  }
);

// 多图片上传（相册批量上传）
router.post(
  '/images/:type',
  authenticate,
  requireAdmin,
  uploadMultipleImages,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return error(res, '请选择要上传的文件', 400);
      }

      const { type = 'gallery' } = req.params;
      const results = await Promise.all(
        req.files.map((file) =>
          uploadService.processImageUpload(file, {
            type,
            generateThumbnail: true,
          })
        )
      );

      return success(res, results, `成功上传 ${results.length} 张图片`);
    } catch (err: any) {
      return error(res, err.message, 500);
    }
  }
);

// 删除文件
router.delete('/:type/:filename', authenticate, requireAdmin, async (req, res) => {
  try {
    const { type, filename } = req.params;
    const deleted = await uploadService.deleteFile(filename, type);

    if (deleted) {
      return success(res, undefined, '文件已删除');
    } else {
      return error(res, '文件删除失败或文件不存在', 404);
    }
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// 获取文件信息
router.get('/:type/:filename/info', async (req, res) => {
  try {
    const { type, filename } = req.params;
    const info = uploadService.getFileInfo(filename, type);

    if (!info.exists) {
      return error(res, '文件不存在', 404);
    }

    return success(res, info);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// 获取已上传文件列表（需管理员权限）
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return success(res, { data: [] });
    }
    
    const files = fs.readdirSync(uploadsDir).map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        name: filename,
        path: `/uploads/${filename}`,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
        isFile: stats.isFile(),
      };
    });
    
    return success(res, { data: files });
  } catch (err: any) {
    return error(res, err.message || '获取文件列表失败', 500);
  }
});

export default router;
