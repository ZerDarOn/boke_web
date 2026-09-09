import { Router, type RequestHandler } from 'express';
import type { Client } from 'minio';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware';
import { getMinioClient, getObjectKey, isMinioEnabled } from '../config/minio';
import { success, error } from '../utils/response';
import fileService from '../services/file.service';
import { authorizeStoredFileAccess } from '../lib/file-access-policy';
import { apiLog } from '../lib/logger';
import {
  FILE_ACCESS_PASSWORD_HEADER,
  resolveFileAccessPassword,
} from '../lib/file-access-password';
import { pipeReadableToResponse } from '../lib/pipe-readable-to-response';
import { deleteFile as deleteUploadedFile } from '../services/upload.service';

const router = Router();

export interface MinioProxyDependencies {
  isEnabled: () => boolean;
  getClient: () => Pick<Client, 'statObject' | 'getObject'> | null;
  isPasswordProtected: (key: string) => boolean;
  verifyPassword: (key: string, password: string) => Promise<boolean>;
}

const defaultMinioProxyDependencies: MinioProxyDependencies = {
  isEnabled: isMinioEnabled,
  getClient: getMinioClient,
  isPasswordProtected: (key) => fileService.isPasswordProtected(key),
  verifyPassword: (key, password) => fileService.verifyPassword(key, password),
};

export const createMinioFileProxyHandler = (
  dependencies: MinioProxyDependencies = defaultMinioProxyDependencies
): RequestHandler => async (req, res) => {
  try {
    const { type, filename } = req.params;
    const bucket = process.env.MINIO_BUCKET || 'ink-spirit-blog';

    if (!dependencies.isEnabled()) {
      return error(res, 'MinIO not enabled', 501);
    }

    const access = await authorizeStoredFileAccess({
      storageKey: getObjectKey(filename, type),
      password: resolveFileAccessPassword(req.get(FILE_ACCESS_PASSWORD_HEADER)),
      userRole: req.user?.role,
      isProtected: dependencies.isPasswordProtected,
      verifyPassword: dependencies.verifyPassword,
    });

    if (access.allowed === false) {
      apiLog.warn('Protected MinIO object access denied', {
        reason: access.reason,
        authenticated: Boolean(req.user),
      });
      res.setHeader('Cache-Control', 'private, no-store');
      return error(
        res,
        access.reason === 'password_required' ? '该文件需要密码访问' : '密码错误',
        access.reason === 'password_required' ? 403 : 401
      );
    }

    const minioClient = dependencies.getClient();
    if (!minioClient) {
      return error(res, '对象存储暂不可用', 503);
    }

    const objectKey = access.storageKey;
    const protectedFile = dependencies.isPasswordProtected(objectKey);
    const stat = await minioClient.statObject(bucket, objectKey);

    res.setHeader('Content-Type', stat.metaData?.['content-type'] || 'image/jpeg');
    res.setHeader('Content-Length', stat.size);
    res.setHeader(
      'Cache-Control',
      protectedFile ? 'private, no-store' : 'public, max-age=0, must-revalidate'
    );
    res.setHeader('ETag', stat.etag);

    const stream = await minioClient.getObject(bucket, objectKey);
    await pipeReadableToResponse(stream, res);
  } catch (err: any) {
    if (res.headersSent || res.destroyed) {
      if (!res.destroyed) res.destroy();
      return;
    }
    for (const header of ['Content-Length', 'Content-Type', 'ETag']) {
      res.removeHeader(header);
    }
    res.setHeader('Cache-Control', 'private, no-store');
    if (err?.code === 'NoSuchKey' || err?.code === 'NoSuchObject' || err?.statusCode === 404) {
      return error(res, '文件不存在', 404);
    }
    console.error('MinIO proxy error:', {
      code: err?.code,
      errorName: err instanceof Error ? err.name : 'UnknownError',
    });
    return error(res, '获取文件失败', 500);
  }
};

// 代理访问 MinIO 文件
router.get('/:type/:filename', optionalAuth, createMinioFileProxyHandler());

// 删除 MinIO 文件（代理）
router.delete('/:type/:filename', authenticate, requireAdmin, async (req, res) => {
  try {
    const { type, filename } = req.params;

    if (!isMinioEnabled()) {
      return error(res, 'MinIO not enabled', 501);
    }

    const deleted = await deleteUploadedFile(filename, type, 'minio');
    if (!deleted) {
      return error(res, '删除文件失败', 500);
    }
    return success(res, undefined, '文件已删除');
  } catch (err: any) {
    console.error('MinIO delete error:', err);
    return error(res, '删除文件失败', 500);
  }
});

export default router;
