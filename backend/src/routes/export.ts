import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { success, error } from '../utils/response';
import ExportService from '../services/export.service';
import prisma from '../lib/prisma';

const router = Router();
const exportService = new ExportService();

/**
 * GET /api/export/stats
 * 获取导出统计信息
 */
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = {
      posts: await prisma.post.count(),
      projects: await prisma.project.count(),
      anime: await prisma.anime.count(),
      diaries: await prisma.diary.count(),
      timeline: await prisma.timelineEvent.count(),
      skills: await prisma.skill.count(),
      gallery: await prisma.galleryImage.count(),
      announcements: await prisma.announcement.count(),
      total: 0
    };

    stats.total = Object.values(stats).reduce((sum: any, count: any) => sum + count, 0);

    return success(res, stats, 'Stats retrieved successfully');
  } catch (err: any) {
    console.error('Failed to get stats:', err);
    error(res, err.message || 'Failed to get stats', 500);
  }
});

/**
 * GET /api/export/all
 * 导出所有内容
 */
router.get('/all', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const zipBuffer = await exportService.exportAll({});

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=blog-backup.zip');
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Export failed:', err);
    error(res, err.message || 'Export failed', 500);
  }
});

/**
 * GET /api/export/:type
 * 按类型导出
 */
router.get('/:type', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    const zipBuffer = await exportService.exportByType(type);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-backup.zip`);
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Export failed:', err);
    error(res, err.message || 'Export failed', 500);
  }
});

/**
 * GET /api/export/:type/:id
 * 导出单个内容
 */
router.get('/:type/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;

    const contentExport = await exportService.exportById(type, id);

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${contentExport.filePath.split('/').pop()}`);
    res.send(contentExport.content);
  } catch (err: any) {
    console.error('Export failed:', err);
    error(res, err.message || 'Export failed', 500);
  }
});

export default router;
