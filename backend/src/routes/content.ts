import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { success, error, notFound } from '../utils/response';
import { parseMarkdown, buildPrismaData, generateId, generateSlug, ParsedContent } from '../services/markdown.service';
import * as response from '../utils/response';
import { PrismaClient } from '@prisma/client';
import extractZip from 'extract-zip';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/content/import/single
 * 导入单个 Markdown 文件
 */
router.post('/import/single', authenticate, async (req: Request, res: Response) => {
  try {
    const { content, conflictResolution = 'skip' } = req.body;

    // 验证内容
    if (!content) {
      return error(res, '请提供 Markdown 内容', 400);
    }

    // 解析 Markdown
    const parsed = await parseMarkdown(content);

    // 检查冲突
    const existing = await findExistingContent(parsed);
    if (existing) {
      if (conflictResolution === 'skip') {
        return success(res, { skipped: true, existing }, '已跳过已存在的内容');
      }
      // 覆盖模式：删除旧内容
      await deleteContent(parsed.type, existing.id);
    }

    // 保存到数据库
    const saved = await saveContent(parsed);

    return success(res, saved, '导入成功');
  } catch (err: any) {
    console.error('导入失败:', err);
    return error(res, err.message || '导入失败', 500);
  }
});

/**
 * POST /api/content/import/batch
 * 批量导入 Markdown 文件
 */
router.post('/import/batch', authenticate, async (req: Request, res: Response) => {
  try {
    const { files, conflictResolution = 'skip' } = req.body;

    // 验证文件
    if (!files || !Array.isArray(files) || files.length === 0) {
      return error(res, '请选择文件', 400);
    }

    if (files.length > 10) {
      return error(res, '一次最多上传 10 个文件', 400);
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
      skipped: [] as any[]
    };

    // 逐个处理文件
    for (const file of files) {
      try {
        // 验证文件
        if (!file.name || !file.name.endsWith('.md')) {
          results.failed.push({ file: file.name, message: '只支持 Markdown 文件' });
          continue;
        }

        // 验证文件大小
        if (file.size > 1 * 1024 * 1024) { // 1MB
          results.failed.push({ file: file.name, message: '文件大小不能超过 1MB' });
          continue;
        }

        // 解析并保存
        const parsed = await parseMarkdown(file.content);
        const existing = await findExistingContent(parsed);

        if (existing) {
          if (conflictResolution === 'skip') {
            results.skipped.push({ file: file.name, message: '内容已存在' });
            continue;
          }
          // 覆盖模式：删除旧内容
          await deleteContent(parsed.type, existing.id);
        }

        const saved = await saveContent(parsed);
        results.success.push({ file: file.name, saved });
      } catch (err: any) {
        console.error(`导入 ${file.name} 失败:`, err);
        results.failed.push({ file: file.name, message: err.message || '导入失败' });
      }
    }

    return success(
      res,
      results,
      `导入完成：成功 ${results.success.length}，失败 ${results.failed.length}，跳过 ${results.skipped.length}`
    );
  } catch (err: any) {
    console.error('批量导入失败:', err);
    return error(res, err.message || '批量导入失败', 500);
  }
});

/**
 * POST /api/content/import/folder
 * 导入文件夹
 */
router.post('/import/folder', authenticate, async (req: Request, res: Response) => {
  try {
    const { files, conflictResolution = 'skip' } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return error(res, '请选择文件', 400);
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
      skipped: [] as any[]
    };

    for (const file of files) {
      try {
        // 检测内容类型
        const type = detectContentType(file);

        // 解析并保存
        const parsed = await parseMarkdown(file.content);
        parsed.type = type; // 使用文件夹检测的类型

        const existing = await findExistingContent(parsed);

        if (existing) {
          if (conflictResolution === 'skip') {
            results.skipped.push({ file: file.name, message: '内容已存在' });
            continue;
          }
          await deleteContent(parsed.type, existing.id);
        }

        const saved = await saveContent(parsed);
        results.success.push({ file: file.name, type, saved });
      } catch (err: any) {
        console.error(`导入 ${file.name} 失败:`, err);
        results.failed.push({ file: file.name, message: err.message || '导入失败' });
      }
    }

    return success(res, results, '文件夹导入完成');
  } catch (err: any) {
    console.error('文件夹导入失败:', err);
    return error(res, err.message || '文件夹导入失败', 500);
  }
});

/**
 * POST /api/content/import/zip
 * 导入 ZIP 压缩包
 */
router.post('/import/zip', authenticate, async (req: Request, res: Response) => {
  try {
    const { zipData, conflictResolution = 'skip' } = req.body;

    if (!zipData) {
      return error(res, '请提供 ZIP 文件数据', 400);
    }

    // 创建临时目录
    const tempDir = path.join(__dirname, '../../temp', uuidv4());
    await fs.promises.mkdir(tempDir, { recursive: true });

    try {
      // 将 base64 数据写入临时 ZIP 文件
      const zipBuffer = Buffer.from(zipData, 'base64');
      const zipPath = path.join(tempDir, 'upload.zip');
      await fs.promises.writeFile(zipPath, zipBuffer);

      // 解压 ZIP 文件
      await extractZip(zipPath, { dir: tempDir });

      // 递归查找所有 Markdown 文件
      const mdFiles = await findMarkdownFiles(tempDir);

      if (mdFiles.length === 0) {
        return error(res, 'ZIP 文件中未找到 Markdown 文件', 400);
      }

      // 读取所有 Markdown 文件内容
      const filesWithContent = await Promise.all(
        mdFiles.map(async (filePath) => {
          const relativePath = path.relative(tempDir, filePath);
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const stats = await fs.promises.stat(filePath);

          return {
            name: path.basename(filePath),
            path: relativePath,
            size: stats.size,
            content,
            lastModified: stats.mtime.getTime()
          };
        })
      );

      // 复用文件夹导入的逻辑
      const results = {
        success: [] as any[],
        failed: [] as any[],
        skipped: [] as any[]
      };

      for (const file of filesWithContent) {
        try {
          const type = detectContentType(file);
          const parsed = await parseMarkdown(file.content);
          parsed.type = type;

          const existing = await findExistingContent(parsed);

          if (existing) {
            if (conflictResolution === 'skip') {
              results.skipped.push({ file: file.name, message: '内容已存在' });
              continue;
            }
            await deleteContent(parsed.type, existing.id);
          }

          const saved = await saveContent(parsed);
          results.success.push({ file: file.name, type, saved });
        } catch (err: any) {
          console.error(`导入 ${file.name} 失败:`, err);
          results.failed.push({ file: file.name, message: err.message || '导入失败' });
        }
      }

      return success(res, results, `ZIP 导入完成：成功 ${results.success.length}，失败 ${results.failed.length}，跳过 ${results.skipped.length}`);
    } finally {
      // 清理临时目录
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  } catch (err: any) {
    console.error('ZIP 导入失败:', err);
    return error(res, err.message || 'ZIP 导入失败', 500);
  }
});

/**
 * 递归查找所有 Markdown 文件
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await findMarkdownFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 检测内容类型（基于文件路径）
 */
function detectContentType(file: any): string {
  const path = file.path || file.name;
  const pathParts = path.split(/[/\\]/);

  // 查找 content 下的文件夹名
  const contentIndex = pathParts.indexOf('content');
  if (contentIndex !== -1 && pathParts.length > contentIndex + 1) {
    const folderName = pathParts[contentIndex + 1].toLowerCase();

    const folderToType: Record<string, string> = {
      'posts': 'post',
      'projects': 'project',
      'anime': 'anime',
      'diary': 'diary',
      'timeline': 'timeline',
      'skills': 'skill',
      'gallery': 'gallery',
      'announcements': 'announcement'
    };

    return folderToType[folderName] || 'post';
  }

  return 'post';
}

/**
 * 查找已存在的内容
 */
async function findExistingContent(parsed: any): Promise<any> {
  const { type, slug } = parsed;

  try {
    switch (type) {
      case 'post':
        return await prisma.post.findUnique({ where: { slug } });
      case 'project':
        return await prisma.project.findUnique({ where: { slug } });
      case 'anime':
        return await prisma.anime.findUnique({ where: { id: slug } });
      case 'diary':
        return await prisma.diary.findUnique({ where: { id: slug } });
      case 'timeline':
        return await prisma.timelineEvent.findUnique({ where: { id: slug } });
      case 'skill':
        return await prisma.skill.findUnique({ where: { id: slug } });
      case 'gallery':
        return await prisma.galleryImage.findUnique({ where: { id: slug } });
      case 'announcement':
        return await prisma.announcement.findUnique({ where: { id: slug } });
      default:
        return null;
    }
  } catch (err) {
    console.error('查找内容失败:', err);
    return null;
  }
}

/**
 * 删除内容
 */
async function deleteContent(type: string, id: string): Promise<void> {
  try {
    switch (type) {
      case 'post':
        await prisma.post.delete({ where: { id } });
        break;
      case 'project':
        await prisma.project.delete({ where: { id } });
        break;
      case 'anime':
        await prisma.anime.delete({ where: { id } });
        break;
      case 'diary':
        await prisma.diary.delete({ where: { id } });
        break;
      case 'timeline':
        await prisma.timelineEvent.delete({ where: { id } });
        break;
      case 'skill':
        await prisma.skill.delete({ where: { id } });
        break;
      case 'gallery':
        await prisma.galleryImage.delete({ where: { id } });
        break;
      case 'announcement':
        await prisma.announcement.delete({ where: { id } });
        break;
    }
  } catch (err) {
    console.error('删除内容失败:', err);
    throw err;
  }
}

/**
 * 保存内容到数据库
 */
async function saveContent(parsed: ParsedContent): Promise<any> {
  const prismaData = buildPrismaData(parsed);

  try {
    switch (parsed.type) {
      case 'post':
        return await prisma.post.create({ data: prismaData });

      case 'project':
        return await prisma.project.create({ data: prismaData });

      case 'anime':
        return await prisma.anime.create({ data: prismaData });

      case 'diary':
        return await prisma.diary.create({ data: prismaData });

      case 'timeline':
        return await prisma.timelineEvent.create({ data: prismaData });

      case 'skill':
        return await prisma.skill.create({ data: prismaData });

      case 'gallery':
        return await prisma.galleryImage.create({ data: prismaData });

      case 'announcement':
        return await prisma.announcement.create({ data: prismaData });

      default:
        throw new Error(`不支持的内容类型: ${parsed.type}`);
    }
  } catch (err) {
    console.error('保存内容失败:', err);
    throw err;
  }
}

export default router;
