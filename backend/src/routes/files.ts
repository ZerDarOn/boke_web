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
import fileService from '../services/file.service';

declare module 'express' {
  interface Request {
    files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
  }
}

const router = Router();

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
    console.error('获取文件列表失败:', err);
    return error(res, err.message, 500);
  }
});

// 获取文件内容（公开访问，但受密码保护的文件需要密码，管理员免密码）
router.get('/content', optionalAuth, async (req, res) => {
  try {
    const { path: filePath, password } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return error(res, '文件路径不能为空', 400);
    }

    // 检查文件是否受密码保护
    const meta = fileService['metadata'].get(filePath);
    if (meta?.protected) {
      // 管理员免密码访问
      if (req.user?.role === 'ADMIN') {
        // 管理员直接通过
      } else {
        // 普通用户需要密码
        if (!password || typeof password !== 'string') {
          return error(res, '该文件需要密码访问', 403);
        }
        
        const isValid = await fileService.verifyPassword(filePath, password);
        if (!isValid) {
          return error(res, '密码错误', 401);
        }
      }
    }

    const content = await fileService.getFileContent(filePath);

    return success(res, {
      path: filePath,
      name: filePath.split('/').pop() || '',
      content,
      size: Buffer.byteLength(content),
      modifiedAt: meta?.modifiedAt || new Date().toISOString(),
      extension: filePath.split('.').pop() || '',
    });
  } catch (err: any) {
    console.error('读取文件失败:', err);
    return error(res, err.message, 500);
  }
});

// 下载文件（公开访问，但受密码保护的文件需要密码，管理员免密码）
router.get('/download', optionalAuth, async (req, res) => {
  try {
    const { path: filePath, password } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return error(res, '文件路径不能为空', 400);
    }

    // 检查文件是否受密码保护
    const meta = fileService['metadata'].get(filePath);
    if (meta?.protected) {
      // 管理员免密码下载
      if (req.user?.role === 'ADMIN') {
        // 管理员直接通过
      } else {
        // 普通用户需要密码
        if (!password || typeof password !== 'string') {
          return error(res, '该文件需要密码访问', 403);
        }

        const isValid = await fileService.verifyPassword(filePath, password);
        if (!isValid) {
          return error(res, '密码错误', 401);
        }
      }
    }

    // 检查是否使用 MinIO
    const useMinIO = !!process.env.MINIO_ENDPOINT;

    if (useMinIO) {
      // 获取预签名URL
      const url = await fileService.getPresignedUrl(filePath);
      return res.redirect(url);
    } else {
      // 使用本地文件系统
      const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'content-files');
      const localPath = path.join(LOCAL_STORAGE_DIR, filePath);

      if (!fs.existsSync(localPath)) {
        return error(res, '文件不存在', 404);
      }

      // 设置下载头
      const filename = path.basename(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      // 发送文件
      res.sendFile(localPath);
    }
  } catch (err: any) {
    console.error('下载文件失败:', err);
    return error(res, err.message, 500);
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
    const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'content-files');
    const localPath = path.join(LOCAL_STORAGE_DIR, filePath);
    if (fs.existsSync(localPath)) {
      return error(res, '文件或目录已存在', 409);
    }
    // 同时清理可能残留的元数据
    if (fileService['metadata'].has(filePath)) {
      fileService['metadata'].delete(filePath);
    }

    if (type === 'directory') {
      await fileService.createDirectory(filePath, { name: filePath.split('/').pop() });
      return success(res, { path: filePath, type: 'directory' }, '目录创建成功', undefined, 201);
    }

    // 创建文件
    await fileService.uploadFile(filePath, content, { name: filePath.split('/').pop() });

    // 如果有密码，设置密码保护
    if (password) {
      await fileService.setPassword(filePath, password);
    }

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

    await fileService.uploadFile(filePath, content);

    // 如果有密码，更新密码保护
    if (password) {
      await fileService.setPassword(filePath, password);
    }

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
      const localPath = path.join(LOCAL_STORAGE_DIR, filePath);

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
            const itemStats = fs.statSync(fullPath);

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
    const targetDir = targetPath ? path.join(LOCAL_STORAGE_DIR, targetPath as string) : LOCAL_STORAGE_DIR;

    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 解压到目标目录
    await extract(tempZipPath, { dir: targetDir });

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
        const stats = fs.statSync(fullPath);
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
