import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { success, error } from '../utils/response';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { uploadMixed, handleUploadError } from '../middleware/upload.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { fileSchema } from '../schemas';

const router = Router();

// 内容目录（Markdown 文件存储位置）
const CONTENT_DIR = path.join(process.cwd(), 'content');

// 确保目录存在
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 获取文件列表（模拟文件系统 - About 页面使用）
router.get('/', async (req, res) => {
  try {
    const { path: dirPath = '' } = req.query;

    // 安全：防止目录遍历攻击
    const safePath = path.normalize(dirPath as string).replace(/^\.+(\/|\\)/g, '');
    const fullPath = path.join(CONTENT_DIR, safePath);

    // 确保路径在 CONTENT_DIR 内
    if (!fullPath.startsWith(CONTENT_DIR)) {
      return error(res, '无效的路径', 400);
    }

    ensureDir(CONTENT_DIR);

    if (!fs.existsSync(fullPath)) {
      return success(res, { data: [] });
    }

    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      return error(res, '路径不是目录', 400);
    }

    const items = fs.readdirSync(fullPath).map((name) => {
      const itemPath = path.join(fullPath, name);
      const itemStats = fs.statSync(itemPath);
      const ext = path.extname(name).toLowerCase();

      // 文件类型映射
      const fileTypes: Record<string, string> = {
        '.md': 'markdown',
        '.txt': 'text',
        '.json': 'json',
        '.pdf': 'pdf',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.css': 'css',
        '.html': 'html',
      };

      return {
        name,
        path: path.join(safePath, name).replace(/\\/g, '/'),
        type: itemStats.isDirectory() ? 'directory' : 'file',
        fileType: itemStats.isFile() ? (fileTypes[ext] || 'unknown') : undefined,
        size: itemStats.isFile() ? itemStats.size : undefined,
        modifiedAt: itemStats.mtime.toISOString(),
      };
    });

    // 排序：目录在前，文件在后，按名称排序
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return success(res, { data: items });
  } catch (err: any) {
    console.error('获取文件列表失败:', err);
    return error(res, err.message, 500);
  }
});

// 获取文件内容
router.get('/content', async (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return error(res, '文件路径不能为空', 400);
    }

    // 安全：防止目录遍历攻击
    const safePath = path.normalize(filePath).replace(/^\.+(\/|\\)/g, '');
    const fullPath = path.join(CONTENT_DIR, safePath);

    // 确保路径在 CONTENT_DIR 内
    if (!fullPath.startsWith(CONTENT_DIR)) {
      return error(res, '无效的文件路径', 400);
    }

    if (!fs.existsSync(fullPath)) {
      return error(res, '文件不存在', 404);
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return error(res, '无法读取目录内容', 400);
    }

    // 读取文件内容
    const content = fs.readFileSync(fullPath, 'utf-8');
    const ext = path.extname(safePath).toLowerCase();

    return success(res, {
      data: {
        path: safePath,
        name: path.basename(safePath),
        content,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
        extension: ext,
      },
    });
  } catch (err: any) {
    console.error('读取文件失败:', err);
    return error(res, err.message, 500);
  }
});

// 下载文件
router.get('/download', async (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return error(res, '文件路径不能为空', 400);
    }

    // 安全：防止目录遍历攻击
    const safePath = path.normalize(filePath).replace(/^\.+(\/|\\)/g, '');
    const fullPath = path.join(CONTENT_DIR, safePath);

    // 确保路径在 CONTENT_DIR 内
    if (!fullPath.startsWith(CONTENT_DIR)) {
      return error(res, '无效的文件路径', 400);
    }

    if (!fs.existsSync(fullPath)) {
      return error(res, '文件不存在', 404);
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return error(res, '无法下载目录', 400);
    }

    // 设置下载头
    const filename = path.basename(safePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // 发送文件
    res.sendFile(fullPath);
  } catch (err: any) {
    console.error('下载文件失败:', err);
    return error(res, err.message, 500);
  }
});

// 创建文件/目录（管理员）
router.post('/', authenticate, requireAdmin, validateBody(fileSchema), async (req, res) => {
  try {
    const { path: filePath, type = 'file', content = '' } = req.body;

    if (!filePath) {
      return error(res, '路径不能为空', 400);
    }

    // 安全：防止目录遍历攻击
    const safePath = path.normalize(filePath).replace(/^\.+(\/|\\)/g, '');
    const fullPath = path.join(CONTENT_DIR, safePath);

    // 确保路径在 CONTENT_DIR 内
    if (!fullPath.startsWith(CONTENT_DIR)) {
      return error(res, '无效的路径', 400);
    }

    // 检查是否已存在
    if (fs.existsSync(fullPath)) {
      return error(res, '文件或目录已存在', 409);
    }

    // 创建目录
    if (type === 'directory') {
      fs.mkdirSync(fullPath, { recursive: true });
      return success(res, { path: safePath, type: 'directory' }, '目录创建成功', undefined, 201);
    }

    // 创建文件
    ensureDir(path.dirname(fullPath));
    fs.writeFileSync(fullPath, content, 'utf-8');

    return success(res, {
      path: safePath,
      type: 'file',
      size: Buffer.byteLength(content, 'utf-8'),
    }, '文件创建成功', undefined, 201);
  } catch (err: any) {
    console.error('创建文件失败:', err);
    return error(res, err.message, 500);
  }
});

// 更新文件内容（管理员）
router.put('/content', authenticate, requireAdmin, validateBody(fileSchema), async (req, res) => {
  try {
    const { path: filePath, content } = req.body;

    // 安全：防止目录遍历攻击
    const safePath = path.normalize(filePath).replace(/^\.+(\/|\\)/g, '');
    const fullPath = path.join(CONTENT_DIR, safePath);

    // 确保路径在 CONTENT_DIR 内
    if (!fullPath.startsWith(CONTENT_DIR)) {
      return error(res, '无效的文件路径', 400);
    }

    if (!fs.existsSync(fullPath)) {
      return error(res, '文件不存在', 404);
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return error(res, '无法更新目录', 400);
    }

    // 写入文件
    fs.writeFileSync(fullPath, content, 'utf-8');

    return success(res, {
      path: safePath,
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

    // 安全：防止目录遍历攻击
    const safePath = path.normalize(filePath).replace(/^\.+(\/|\\)/g, '');
    const fullPath = path.join(CONTENT_DIR, safePath);

    // 确保路径在 CONTENT_DIR 内
    if (!fullPath.startsWith(CONTENT_DIR)) {
      return error(res, '无效的文件路径', 400);
    }

    if (!fs.existsSync(fullPath)) {
      return error(res, '文件或目录不存在', 404);
    }

    const stats = fs.statSync(fullPath);

    // 删除文件或目录
    if (stats.isDirectory()) {
      fs.rmdirSync(fullPath, { recursive: true });
    } else {
      fs.unlinkSync(fullPath);
    }

    return success(res, undefined, '删除成功');
  } catch (err: any) {
    console.error('删除失败:', err);
    return error(res, err.message, 500);
  }
});

// 上传文件到内容目录（管理员）
router.post(
  '/upload',
  authenticate,
  requireAdmin,
  uploadMixed,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.files) {
        return error(res, '请选择要上传的文件', 400);
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const uploadedFiles: any[] = [];

      // 处理文件字段
      for (const [fieldname, fileArray] of Object.entries(files)) {
        for (const file of fileArray) {
          uploadedFiles.push({
            fieldname,
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path.replace(CONTENT_DIR, '').replace(/\\/g, '/'),
          });
        }
      }

      return success(res, uploadedFiles, `成功上传 ${uploadedFiles.length} 个文件`);
    } catch (err: any) {
      return error(res, err.message, 500);
    }
  }
);

export default router;
