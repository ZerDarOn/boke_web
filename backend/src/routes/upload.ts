import { Router } from 'express';
import {
  uploadSingleImage,
  uploadMultipleImages,
  handleUploadError,
} from '../middleware/upload.middleware';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { success, error } from '../utils/response';
import * as uploadService from '../services/upload.service';

const router = Router();

// 单图片上传（相册、项目封面等）
router.post(
  '/image/:type',
  authenticate,
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

      return success(res, {
        message: '上传成功',
        data: result,
      });
    } catch (err: any) {
      return error(res, err.message, 500);
    }
  }
);

// 多图片上传（相册批量上传）
router.post(
  '/images/:type',
  authenticate,
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

      return success(res, {
        message: `成功上传 ${results.length} 张图片`,
        data: results,
      });
    } catch (err: any) {
      return error(res, err.message, 500);
    }
  }
);

// 删除文件
router.delete('/:type/:filename', authenticate, async (req, res) => {
  try {
    const { type, filename } = req.params;
    const deleted = await uploadService.deleteFile(filename, type);

    if (deleted) {
      return success(res, { message: '文件已删除' });
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

    return success(res, { data: info });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;
