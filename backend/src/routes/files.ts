import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import extract from 'extract-zip';
import multer from 'multer';
import { success, error } from '../utils/response';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { fileSchema } from '../schemas';
import fileService, {
  FileContentTooLargeError,
  FileListTooLargeError,
  FileMetadataTrustError,
} from '../services/file.service';
import { AuthPayload } from '../types';
import { resolveStoragePath, StoragePathError } from '../lib/storage-path-security';
import { authorizeStoredFileAccess } from '../lib/file-access-policy';
import { apiLog } from '../lib/logger';
import {
  FILE_ACCESS_PASSWORD_HEADER,
  resolveFileAccessPassword,
} from '../lib/file-access-password';
import { pipeReadableToResponse } from '../lib/pipe-readable-to-response';
import { assertZipEntryIsNotSymlink } from '../lib/zip-entry-security';

declare module 'express' {
  interface Request {
    files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
    user?: AuthPayload;
  }
}

const router = Router();

async function getAuthorizedFileKey(
  req: Request,
  res: Response,
  storageKey: string,
  endpoint: 'content' | 'download'
): Promise<string | null> {
  const password = resolveFileAccessPassword(req.get(FILE_ACCESS_PASSWORD_HEADER));
  const access = await authorizeStoredFileAccess({
    storageKey,
    password,
    userRole: req.user?.role,
    isProtected: (canonicalKey) => fileService.isPasswordProtected(canonicalKey),
    verifyPassword: (canonicalKey, candidate) =>
      fileService.verifyPassword(canonicalKey, candidate),
  });

  if (access.allowed === true) return access.storageKey;

  apiLog.warn('Protected file access denied', {
    endpoint,
    reason: access.reason,
    authenticated: Boolean(req.user),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  if (access.reason === 'password_required') {
    error(res, '该文件需要密码访问', 403);
  } else {
    error(res, '密码错误', 401);
  }
  return null;
}

function applyFileCachePolicy(res: Response, storageKey: string): void {
  if (fileService.isPasswordProtected(storageKey)) {
    res.setHeader('Cache-Control', 'private, no-store');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
}

function isMissingStoredFileError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const candidate = err as { code?: string; statusCode?: number };
  return (
    candidate.statusCode === 404 ||
    candidate.code === 'ENOENT' ||
    candidate.code === 'NoSuchKey' ||
    candidate.code === 'NotFound'
  );
}

function sendPublicFileError(
  res: Response,
  err: unknown,
  operation: 'list' | 'content' | 'download'
): Response | void {
  apiLog.error(
    `Public file ${operation} failed`,
    err instanceof Error ? err : String(err),
    {
      operation,
      code: err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: unknown }).code)
        : undefined,
    }
  );

  if (res.headersSent || res.destroyed) {
    if (!res.destroyed) res.destroy();
    return;
  }
  for (const header of ['Content-Disposition', 'Content-Length', 'Content-Type', 'ETag']) {
    res.removeHeader(header);
  }
  res.setHeader('Cache-Control', 'private, no-store');
  if (err instanceof StoragePathError) {
    return error(res, '文件路径无效', 400);
  }
  if (err instanceof FileMetadataTrustError) {
    return error(res, '文件服务暂不可用', 503);
  }
  if (err instanceof FileContentTooLargeError) {
    return error(res, '文件内容过大，请下载后查看', 413);
  }
  if (err instanceof FileListTooLargeError) {
    return error(res, '目录项目过多，请缩小查询范围', 413);
  }
  if (isMissingStoredFileError(err)) {
    return error(res, '文件不存在', 404);
  }
  const message = operation === 'list' ? '获取文件列表失败' : '读取文件失败';
  return error(res, message, 500);
}

// 配置 multer 用于 ZIP 文件导入
const uploadZip = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      // 使用原始文件名，但清理危险字符
      const safeName = file.originalname.replace(/[^\w.-]/g, '_');
      cb(null, `import-${Date.now()}-${safeName}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    // 只允许 ZIP 文件
    if (file.mimetype === 'application/zip' || 
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('只支持 ZIP 格式文件'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// 获取文件列表（公开访问）
router.get('/', async (req, res) => {
  try {
    const { path: dirPath = '' } = req.query;
    const files = await fileService.listFiles(dirPath as string);
    return success(res, files);
  } catch (err: any) {
    return sendPublicFileError(res, err, 'list');
  }
});

// 获取文件内容（公开访问，但受密码保护的文件需要密码，管理员免密码）
router.get('/content', optionalAuth, async (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return error(res, '文件路径不能为空', 400);
    }

    const authorizedKey = await getAuthorizedFileKey(req, res, filePath, 'content');
    if (!authorizedKey) return;

    applyFileCachePolicy(res, authorizedKey);

    const meta = fileService.getMetadata(authorizedKey);
    const content = await fileService.getFileContent(authorizedKey);

    return success(res, {
      path: authorizedKey,
      name: authorizedKey.split('/').pop() || '',
      content,
      size: Buffer.byteLength(content),
      modifiedAt: meta?.modifiedAt || new Date().toISOString(),
      extension: authorizedKey.split('.').pop() || '',
    });
  } catch (err: any) {
    return sendPublicFileError(res, err, 'content');
  }
});

// 下载文件（公开访问，但受密码保护的文件需要密码，管理员免密码）
router.get('/download', optionalAuth, async (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return error(res, '文件路径不能为空', 400);
    }

    const authorizedKey = await getAuthorizedFileKey(req, res, filePath, 'download');
    if (!authorizedKey) return;

    applyFileCachePolicy(res, authorizedKey);

    // Keep every download on this origin and use one error-aware stream path
    // for both local and MinIO storage. Password changes therefore take effect
    // immediately and large files are never buffered in process memory.
    const fileStream = await fileService.getFileStream(authorizedKey);
    res.attachment(path.basename(authorizedKey));
    res.type('application/octet-stream');
    await pipeReadableToResponse(fileStream, res);
    return;
  } catch (err: any) {
    return sendPublicFileError(res, err, 'download');
  }
});

// 创建文件/目录（管理员）
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { path: filePath, type = 'file', content = '', password } = req.body;

    if (!filePath) {
      return error(res, '路径不能为空', 400);
    }

    // 检查是否已存在（检查文件系统）
    const localPath = resolveStoragePath(
      path.join(process.cwd(), 'content-files'),
      filePath
    );
    if (fs.existsSync(localPath)) {
      return error(res, '文件或目录已存在', 409);
    }
    if (type === 'directory') {
      await fileService.createDirectory(filePath, { name: filePath.split('/').pop() });
      return success(res, { path: filePath, type: 'directory' }, '目录创建成功', undefined, 201);
    }

    // 带密码时先原子持久化保护元数据，再写入内容，避免失败后留下公开文件。
    await fileService.uploadFile(
      filePath,
      content,
      { name: filePath.split('/').pop() },
      password
    );

    return success(res, {
      path: filePath,
      type: 'file',
      size: Buffer.byteLength(content, 'utf-8'),
    }, '文件创建成功', undefined, 201);
  } catch (err: any) {
    console.error('创建文件失败:', err);
    return error(res, err.message || '创建失败', 500);
  }
});

// 更新文件内容（管理员）
router.put('/content', authenticate, requireAdmin, validateBody(fileSchema), async (req, res) => {
  try {
    const { path: filePath, content, password } = req.body;

    await fileService.uploadFile(filePath, content, undefined, password);

    return success(res, {
      path: filePath,
      size: Buffer.byteLength(content, 'utf-8'),
      modifiedAt: new Date().toISOString(),
    }, '文件更新成功');
  } catch (err: any) {
    console.error('更新文件失败:', err);
    return error(res, err.message, 500);
  }
});

// 删除文件/目录（管理员）
router.delete('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return error(res, '路径不能为空', 400);
    }

    await fileService.deleteFile(filePath);

    return success(res, undefined, '删除成功');
  } catch (err: any) {
    console.error('删除失败:', err);
    return error(res, err.message, 500);
  }
});

// 设置文件密码（管理员）
router.post('/password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { path: filePath, password } = req.body;

    if (!filePath || !password) {
      return error(res, '路径和密码不能为空', 400);
    }

    await fileService.setPassword(filePath, password);

    return success(res, undefined, '密码设置成功');
  } catch (err: any) {
    console.error('设置密码失败:', err);
    return error(res, err.message, 500);
  }
});

// 移除文件密码保护（管理员）
router.delete('/password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return error(res, '路径不能为空', 400);
    }

    await fileService.removePassword(filePath);

    return success(res, undefined, '密码保护已移除');
  } catch (err: any) {
    console.error('移除密码保护失败:', err);
    return error(res, err.message, 500);
  }
});

// 上传文件（管理员 - 简化版，只支持文本文件）
router.post('/upload', authenticate, requireAdmin, async (req, res) => {
  try {
    const { path: dirPath = '' } = req.query;
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return error(res, '请提供文件数据', 400);
    }

    const uploadedFiles: any[] = [];

    for (const file of files) {
      const { name, content, type = 'file' } = file;

      if (!name) continue;

      const fullPath = dirPath ? `${dirPath}/${name}` : name;

      if (type === 'file') {
        await fileService.uploadFile(fullPath, content || '', { name });
      } else {
        await fileService.createDirectory(fullPath, { name });
      }

      uploadedFiles.push({
        name,
        path: fullPath,
        type,
        size: Buffer.byteLength(content || '', 'utf-8'),
      });
    }

    return success(res, uploadedFiles, `成功上传 ${uploadedFiles.length} 个文件`);
  } catch (err: any) {
    console.error('上传文件失败:', err);
    return error(res, err.message || '上传失败', 500);
  }
});

// 批量导出文件（管理员）
router.post('/export', authenticate, requireAdmin, async (req, res) => {
  try {
    const { paths } = req.body; // 要导出的文件路径数组

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return error(res, '请选择要导出的文件', 400);
    }

    const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'content-files');

    // 设置响应头
    const filename = `backup-${new Date().toISOString().slice(0, 10)}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // 处理每个路径
    for (const filePath of paths) {
      const localPath = resolveStoragePath(LOCAL_STORAGE_DIR, filePath);

      if (!fs.existsSync(localPath)) {
        console.warn(`文件不存在，跳过: ${filePath}`);
        continue;
      }

      const stats = fs.statSync(localPath);

      if (stats.isDirectory()) {
        // 递归添加目录
        const addDirectory = (dir: string, basePath: string) => {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const relativePath = `${basePath}/${item}`;
            const itemStats = fs.lstatSync(fullPath);
            if (itemStats.isSymbolicLink()) {
              throw new StoragePathError();
            }

            if (itemStats.isDirectory()) {
              addDirectory(fullPath, relativePath);
            } else {
              archive.file(fullPath, { name: relativePath });
            }
          }
        };
        addDirectory(localPath, filePath);
      } else {
        // 添加单个文件
        archive.file(localPath, { name: filePath });
      }
    }

    archive.finalize();
  } catch (err: any) {
    console.error('导出文件失败:', err);
    return error(res, err.message || '导出失败', 500);
  }
});

// 批量导入文件（管理员）- 从ZIP导入
router.post('/import', authenticate, requireAdmin, uploadZip.single('file'), async (req, res) => {
  let tempZipPath: string | null = null;

  try {
    const { targetPath = '' } = req.query; // 导入目标路径

    // 检查是否有文件上传 (multer 格式)
    if (!req.file) {
      return error(res, '请上传ZIP文件', 400);
    }

    tempZipPath = req.file.path;

    const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'content-files');
    const targetDir = resolveStoragePath(
      LOCAL_STORAGE_DIR,
      targetPath as string,
      { allowRoot: true }
    );

    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 解压到目标目录
    await extract(tempZipPath, {
      dir: targetDir,
      onEntry: assertZipEntryIsNotSymlink,
    });

    // 清理临时文件
    if (tempZipPath && fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
      tempZipPath = null;
    }

    // 统计导入的文件
    const countFiles = (dir: string): number => {
      let count = 0;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.lstatSync(fullPath);
        if (stats.isSymbolicLink()) {
          throw new StoragePathError();
        }
        if (stats.isDirectory()) {
          count += countFiles(fullPath);
        } else {
          count++;
        }
      }
      return count;
    };

    const fileCount = countFiles(targetDir);

    return success(res, {
      targetPath,
      fileCount,
      message: `成功导入 ${fileCount} 个文件`
    }, '导入成功');
  } catch (err: any) {
    console.error('导入文件失败:', err);

    // 清理临时文件
    if (tempZipPath && fs.existsSync(tempZipPath)) {
      try {
        fs.unlinkSync(tempZipPath);
      } catch {}
    }

    return error(res, err.message || '导入失败', 500);
  }
});

export default router;
