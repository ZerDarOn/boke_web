import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getMinioClient, getObjectKey } from '../config/minio';
import { success, error } from '../utils/response';

const router = Router();

// 代理访问 MinIO 文件
router.get('/:type/:filename', async (req, res) => {
  try {
    const { type, filename } = req.params;
    const bucket = process.env.MINIO_BUCKET || 'ink-spirit-blog';

    // 检查是否启用了 MinIO
    if (process.env.USE_MINIO !== 'true') {
      return error(res, 'MinIO not enabled', 501);
    }

    const minioClient = getMinioClient();
    const objectKey = getObjectKey(filename, type);

    try {
      // 从 MinIO 获取文件流
      const stat = await minioClient.statObject(bucket, objectKey);

      // 设置响应头
      res.setHeader('Content-Type', stat.metaData['content-type'] || 'image/jpeg');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 缓存一年
      res.setHeader('ETag', stat.etag);

      // 获取文件流并 pipe 到响应
      const stream = await minioClient.getObject(bucket, objectKey);
      stream.pipe(res);
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        return error(res, '文件不存在', 404);
      }
      throw err;
    }
  } catch (err: any) {
    console.error('MinIO proxy error:', err);
    return error(res, '获取文件失败', 500);
  }
});

// 删除 MinIO 文件（代理）
router.delete('/:type/:filename', authenticate, async (req, res) => {
  try {
    const { type, filename } = req.params;
    const bucket = process.env.MINIO_BUCKET || 'ink-spirit-blog';

    if (process.env.USE_MINIO !== 'true') {
      return error(res, 'MinIO not enabled', 501);
    }

    const minioClient = getMinioClient();
    const objectKey = getObjectKey(filename, type);

    try {
      await minioClient.removeObject(bucket, objectKey);

      // 尝试删除缩略图
      const thumbnailKey = getObjectKey(`thumb_${filename}`, type);
      try {
        await minioClient.removeObject(bucket, thumbnailKey);
      } catch (err) {
        // 缩略图可能不存在，忽略
      }

      return success(res, undefined, '文件已删除');
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        return error(res, '文件不存在', 404);
      }
      throw err;
    }
  } catch (err: any) {
    console.error('MinIO delete error:', err);
    return error(res, '删除文件失败', 500);
  }
});

export default router;
