import prisma from '../lib/prisma';
import { DashboardStats } from '../types';
import crypto from 'crypto';
import { cache } from '../lib/cache';
import { aiClient } from './ai.client';
import { apiLog } from '../lib/logger';
import { PostService } from './post.service';
import { GameService } from './game.service';
import { AnimeService } from './anime.service';
import { GalleryService } from './gallery.service';

// 记录服务器启动时间
const SERVER_START_TIME = new Date();

export type ContentOperationType = 'post' | 'game' | 'anime' | 'gallery';
type ContentOperationPriority = 'high' | 'medium' | 'low';

interface ContentOperationItem {
  id: string;
  type: ContentOperationType;
  title: string;
  path: string;
  priority: ContentOperationPriority;
  issues: string[];
}

export interface ContentSuggestionProposal {
  field: 'excerpt' | 'tags';
  value: string | string[];
  label: string;
}

export interface ContentSuggestionResult {
  suggestions: ContentSuggestionProposal[];
  notice?: string;
}

export interface ContentSuggestionInput {
  excerpt?: string;
  tags?: string[];
}

const CONTENT_OPERATIONS_MAX_ITEMS = 80;
const CONTENT_SUGGESTION_SOURCE_MAX_LENGTH = 12_000;
const CONTENT_SUGGESTION_MAX_TAGS = 5;

export class DashboardService {
  private static readonly HEALTH_TIMEOUT_MS = 3_000;
  private static readonly BEHAVIOR_LOOKBACK_DAYS = 30;

  private static startOfToday(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  static async recordVisit(visitorId: string): Promise<void> {
    const date = this.startOfToday();
    const visitorHash = crypto.createHash('sha256').update(visitorId).digest('hex');
    let isNewVisitor = false;

    await prisma.$transaction(async (tx) => {
      try {
        await tx.dailyVisit.create({ data: { date, visitorHash } });
        isNewVisitor = true;
      } catch (error: any) {
        if (error?.code !== 'P2002') throw error;
      }

      await tx.siteStats.upsert({
        where: { date },
        create: { date, pageViews: 1, uniqueVisitors: isNewVisitor ? 1 : 0 },
        update: {
          pageViews: { increment: 1 },
          ...(isNewVisitor ? { uniqueVisitors: { increment: 1 } } : {}),
        },
      });
    });

    if (isNewVisitor) {
      apiLog.info('Dashboard daily visitor recorded', { day: date.toISOString().slice(0, 10) });
    }
  }

  static async recordBehaviorEvent(visitorId: string, event: {
    eventType: 'page_view' | 'content_click' | 'site_search';
    path: string;
    targetPath?: string;
  }): Promise<void> {
    const visitorHash = crypto.createHash('sha256').update(visitorId).digest('hex');
    await prisma.visitorEvent.create({
      data: {
        visitorHash,
        eventType: event.eventType,
        path: event.path,
        targetPath: event.targetPath,
      },
    });
  }

  private static async getBehaviorOverview() {
    const since = new Date(Date.now() - this.BEHAVIOR_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const [eventCount, eventTypes, topPaths] = await Promise.all([
      prisma.visitorEvent.count({ where: { date: { gte: since } } }),
      prisma.visitorEvent.groupBy({
        by: ['eventType'],
        where: { date: { gte: since } },
        _count: { _all: true },
      }),
      prisma.visitorEvent.groupBy({
        by: ['path'],
        where: { date: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { path: 'desc' } },
        take: 6,
      }),
    ]);
    return {
      days: this.BEHAVIOR_LOOKBACK_DAYS,
      eventCount,
      eventTypes: eventTypes.map((item) => ({ eventType: item.eventType, count: item._count._all })),
      topPaths: topPaths.map((item) => ({ path: item.path, count: item._count._all })),
    };
  }

  static async getAdminOverview() {
    const startedAt = Date.now();
    const [stats, drafts, gamesMissingDetails, animeMissingDetails, postsMissingCover, aiHealthy, behavior, contentOperations] = await Promise.all([
      this.getStats(),
      prisma.post.count({ where: { isPublished: false } }),
      prisma.game.count({ where: { OR: [{ description: null }, { screenshots: { isEmpty: true } }, { notes: null }] } }),
      prisma.anime.count({ where: { OR: [{ synopsis: null }, { notes: null }] } }),
      prisma.post.count({ where: { isPublished: true, coverImage: null } }),
      this.withTimeout(aiClient.health(), this.HEALTH_TIMEOUT_MS, false),
      this.getBehaviorOverview(),
      this.getContentOperations(),
    ]);

    const databaseStartedAt = Date.now();
    const databaseHealthy = await this.withTimeout(prisma.$queryRaw`SELECT 1`, this.HEALTH_TIMEOUT_MS, null);
    const databaseLatencyMs = Date.now() - databaseStartedAt;
    const memory = process.memoryUsage();
    const cacheStats = cache.getStats();
    const services = [
      { key: 'database', label: '数据库', status: databaseHealthy ? 'healthy' : 'unhealthy', detail: databaseHealthy ? `${databaseLatencyMs}ms` : '连接超时或不可用' },
      { key: 'cache', label: '缓存', status: 'healthy', detail: `${cacheStats.backend} · 命中率 ${cacheStats.hitRate}` },
      { key: 'ai', label: 'AI 服务', status: aiHealthy ? 'healthy' : 'degraded', detail: aiHealthy ? '可用' : '未响应或未启动' },
      { key: 'storage', label: '文件存储', status: process.env.MINIO_ENDPOINT ? 'configured' : 'local', detail: process.env.MINIO_ENDPOINT ? 'MinIO 已配置' : '本地存储模式' },
    ];

    apiLog.info('Admin dashboard overview generated', { durationMs: Date.now() - startedAt, databaseHealthy: Boolean(databaseHealthy), aiHealthy });
    return {
      stats,
      pending: [
        { key: 'drafts', label: '待发布文章', count: drafts, path: '/admin/posts' },
        { key: 'games', label: '待补全游戏资料', count: gamesMissingDetails, path: '/admin/games' },
        { key: 'anime', label: '待补全追番资料', count: animeMissingDetails, path: '/admin/anime' },
        { key: 'post-covers', label: '缺少封面的文章', count: postsMissingCover, path: '/admin/posts' },
      ],
      services,
      behavior,
      contentOperations: { total: contentOperations.total, path: '/admin/content-operations' },
      runtime: { uptime: process.uptime(), memoryUsedBytes: memory.heapUsed, memoryTotalBytes: memory.heapTotal },
    };
  }

  static async getContentOperations() {
    const startedAt = Date.now();
    const [posts, games, anime, gallery] = await Promise.all([
      prisma.post.findMany({
        where: { isPublished: true, accessLevel: 'PUBLIC' },
        select: { id: true, title: true, excerpt: true, coverImage: true, tags: true },
      }),
      prisma.game.findMany({
        where: { isHidden: false },
        select: { id: true, title: true, description: true, notes: true, screenshots: true, highlights: true, tags: true },
      }),
      prisma.anime.findMany({
        select: { id: true, title: true, synopsis: true, notes: true, highlights: true, tags: true },
      }),
      prisma.galleryImage.findMany({
        select: { id: true, title: true, description: true, tags: true, albumId: true },
      }),
    ]);

    const items: ContentOperationItem[] = [
      ...posts.flatMap((post) => {
        const issues = [
          ...(!post.excerpt?.trim() ? ['补充摘要'] : []),
          ...(!post.coverImage?.trim() ? ['补充封面'] : []),
          ...(post.tags.length === 0 ? ['添加标签'] : []),
        ];
        return issues.length ? [{ id: post.id, type: 'post' as const, title: post.title, path: '/admin/posts', priority: issues.length >= 2 ? 'high' as const : 'medium' as const, issues }] : [];
      }),
      ...games.flatMap((game) => {
        const issues = [
          ...(!game.description?.trim() ? ['补充游戏介绍'] : []),
          ...(!game.notes?.trim() ? ['写下游玩点评'] : []),
          ...(game.screenshots.length === 0 ? ['添加截图'] : []),
          ...(!Array.isArray(game.highlights) || game.highlights.length === 0 ? ['补充精彩片段'] : []),
          ...(game.tags.length === 0 ? ['添加标签'] : []),
        ];
        return issues.length ? [{ id: game.id, type: 'game' as const, title: game.title, path: '/admin/games', priority: issues.length >= 3 ? 'high' as const : 'medium' as const, issues }] : [];
      }),
      ...anime.flatMap((entry) => {
        const issues = [
          ...(!entry.synopsis?.trim() ? ['补充作品简介'] : []),
          ...(!entry.notes?.trim() ? ['写下追番感想'] : []),
          ...(!Array.isArray(entry.highlights) || entry.highlights.length === 0 ? ['补充精彩片段'] : []),
          ...(entry.tags.length === 0 ? ['添加标签'] : []),
        ];
        return issues.length ? [{ id: entry.id, type: 'anime' as const, title: entry.title, path: '/admin/anime', priority: issues.length >= 2 ? 'high' as const : 'medium' as const, issues }] : [];
      }),
      ...gallery.flatMap((photo) => {
        const issues = [
          ...(!photo.description?.trim() ? ['补充照片描述'] : []),
          ...(photo.tags.length === 0 ? ['添加标签'] : []),
          ...(!photo.albumId ? ['归入相册'] : []),
        ];
        return issues.length ? [{ id: photo.id, type: 'gallery' as const, title: photo.title, path: '/admin/gallery', priority: issues.length >= 2 ? 'medium' as const : 'low' as const, issues }] : [];
      }),
    ];

    const priorityOrder: Record<ContentOperationPriority, number> = { high: 0, medium: 1, low: 2 };
    items.sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority] || right.issues.length - left.issues.length || left.title.localeCompare(right.title, 'zh-CN'));
    const visibleItems = items.slice(0, CONTENT_OPERATIONS_MAX_ITEMS);
    const byType = (['post', 'game', 'anime', 'gallery'] as ContentOperationType[]).map((type) => ({
      type,
      count: items.filter((item) => item.type === type).length,
    }));

    apiLog.info('Content operations scan completed', {
      durationMs: Date.now() - startedAt,
      totalItems: items.length,
      returnedItems: visibleItems.length,
    });

    return {
      total: items.length,
      visibleCount: visibleItems.length,
      maxItems: CONTENT_OPERATIONS_MAX_ITEMS,
      byType,
      items: visibleItems,
    };
  }

  static async getContentSuggestions(type: ContentOperationType, id: string): Promise<ContentSuggestionResult> {
    const target = await this.findSuggestionTarget(type, id);
    if (!target) throw new Error('Content not found or not eligible for operations');

    const suggestions: ContentSuggestionProposal[] = [];
    const source = target.source.slice(0, CONTENT_SUGGESTION_SOURCE_MAX_LENGTH);
    const tasks: Array<() => Promise<void>> = [];

    if (type === 'post' && !target.excerpt && source.length >= 80) {
      tasks.push(async () => {
        const result = await aiClient.summarizeContent(source, 180);
        const excerpt = result.summary.trim();
        if (excerpt) suggestions.push({ field: 'excerpt', value: excerpt, label: '摘要建议' });
      });
    }

    if (target.tags.length === 0 && source.length >= 20) {
      tasks.push(async () => {
        const result = await aiClient.generateTags(target.title, source, CONTENT_SUGGESTION_MAX_TAGS);
        const tags = this.normalizeSuggestedTags(result.tags);
        if (tags.length) suggestions.push({ field: 'tags', value: tags, label: '标签建议' });
      });
    }

    if (tasks.length === 0) {
      return { suggestions, notice: '这条内容缺少可依据的已有资料，暂不生成，避免 AI 凭空补写。' };
    }

    const startedAt = Date.now();
    apiLog.info('Content operations AI suggestion requested', { type, contentId: id, taskCount: tasks.length });
    await Promise.all(tasks.map((task) => task()));
    apiLog.info('Content operations AI suggestion completed', {
      type,
      contentId: id,
      suggestionCount: suggestions.length,
      durationMs: Date.now() - startedAt,
    });

    return suggestions.length
      ? { suggestions }
      : { suggestions, notice: 'AI 没有给出可安全应用的建议，请保留原内容自行补充。' };
  }

  static async applyContentSuggestions(type: ContentOperationType, id: string, input: ContentSuggestionInput) {
    const target = await this.findSuggestionTarget(type, id);
    if (!target) throw new Error('Content not found or not eligible for operations');

    const update: ContentSuggestionInput = {};
    if (input.excerpt && type === 'post' && !target.excerpt) update.excerpt = input.excerpt.trim();
    if (input.tags?.length && target.tags.length === 0) update.tags = this.normalizeSuggestedTags(input.tags);
    if (!update.excerpt && !update.tags?.length) throw new Error('Suggested fields are no longer eligible to apply');

    apiLog.info('Content operations suggestions applying', { type, contentId: id, fields: Object.keys(update) });
    if (type === 'post') await PostService.update(id, update);
    if (type === 'game') await GameService.update(id, update);
    if (type === 'anime') await AnimeService.update(id, update);
    if (type === 'gallery') await GalleryService.update(id, update);
    apiLog.info('Content operations suggestions applied', { type, contentId: id, fields: Object.keys(update) });

    return { applied: Object.keys(update), indexRebuildRequired: type !== 'post' };
  }

  private static normalizeSuggestedTags(tags: string[]): string[] {
    return Array.from(new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0 && tag.length <= 30))).slice(0, CONTENT_SUGGESTION_MAX_TAGS);
  }

  private static async findSuggestionTarget(type: ContentOperationType, id: string): Promise<{
    title: string;
    source: string;
    tags: string[];
    excerpt?: string | null;
  } | null> {
    if (type === 'post') {
      const post = await prisma.post.findFirst({
        where: { id, isPublished: true, accessLevel: 'PUBLIC' },
        select: { title: true, content: true, excerpt: true, tags: true },
      });
      return post ? { title: post.title, source: post.content, tags: post.tags, excerpt: post.excerpt } : null;
    }
    if (type === 'game') {
      const game = await prisma.game.findFirst({
        where: { id, isHidden: false },
        select: { title: true, description: true, notes: true, genres: true, developer: true, publisher: true, tags: true },
      });
      return game ? { title: game.title, tags: game.tags, source: [game.description, game.notes, game.genres.join('、'), game.developer, game.publisher].filter(Boolean).join('\n') } : null;
    }
    if (type === 'anime') {
      const anime = await prisma.anime.findUnique({
        where: { id },
        select: { title: true, synopsis: true, notes: true, genres: true, studios: true, tags: true },
      });
      return anime ? { title: anime.title, tags: anime.tags, source: [anime.synopsis, anime.notes, anime.genres.join('、'), anime.studios.join('、')].filter(Boolean).join('\n') } : null;
    }
    const photo = await prisma.galleryImage.findUnique({
      where: { id },
      select: { title: true, description: true, location: true, camera: true, settings: true, tags: true },
    });
    return photo ? { title: photo.title, tags: photo.tags, source: [photo.description, photo.location, photo.camera, photo.settings].filter(Boolean).join('\n') } : null;
  }

  private static async withTimeout<T>(operation: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    return Promise.race([operation, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))]);
  }

  static async getStats(): Promise<DashboardStats> {
    const [postCount, diaryCount, photoCount, animeCount, gameCount, totalLikes, siteStatsAgg, recentSiteStats, postCommentsCount, galleryCommentsCount, totalFavorites] = await Promise.all([
      prisma.post.count({ where: { isPublished: true } }),
      prisma.diary.count(),
      prisma.galleryImage.count(),
      prisma.anime.count(),
      prisma.game.count({ where: { isHidden: false } }),
      prisma.post.aggregate({ _sum: { likeCount: true } }),
      prisma.siteStats.aggregate({
        _sum: { pageViews: true, uniqueVisitors: true }
      }),
      prisma.siteStats.findMany({
        orderBy: { date: 'desc' },
        take: 7,
        select: { date: true, pageViews: true, uniqueVisitors: true }
      }),
      prisma.comment.count(),
      prisma.photoComment.count(),
      prisma.anime.count({ where: { favorite: true } })
    ]);

    // 使用服务器启动时间计算运行时间
    const uptime = this.calculateUptime(SERVER_START_TIME);

    const totalContent = postCount + diaryCount + photoCount + animeCount + gameCount;

    const animeCommentsCount = 0;

    const totalCommentsCount = postCommentsCount + galleryCommentsCount + animeCommentsCount;

    const totalRequests = siteStatsAgg._sum.pageViews ?? 0;
    const uniqueVisitors = siteStatsAgg._sum.uniqueVisitors ?? 0;

    // 计算评论分布百分比
    const totalComments = postCommentsCount + galleryCommentsCount + animeCommentsCount;
    const commentDistribution = [
      { 
        label: 'Post Comments', 
        count: postCommentsCount, 
        percentage: totalComments ? (postCommentsCount / totalComments) * 100 : 0,
        color: 'bg-neon' 
      },
      { 
        label: 'Anime Comments', 
        count: animeCommentsCount, 
        percentage: totalComments ? (animeCommentsCount / totalComments) * 100 : 0,
        color: 'bg-pink-400' 
      },
      { 
        label: 'Gallery Comments', 
        count: galleryCommentsCount, 
        percentage: totalComments ? (galleryCommentsCount / totalComments) * 100 : 0,
        color: 'bg-amber-500' 
      },
    ];

    // 计算访问趋势（最近7天）
    const trafficTrend = recentSiteStats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      pageViews: stat.pageViews,
      uniqueVisitors: stat.uniqueVisitors
    })).reverse();

    return {
      uptime,
      totalRequests,
      uniqueVisitors,
      contentStats: {
        totalContent,
        totalLikes: totalLikes._sum.likeCount ?? 0,
        totalFavorites,
        totalComments: totalCommentsCount,
        articles: postCount,
        photos: photoCount,
        diaries: diaryCount,
        anime: animeCount,
        games: gameCount,
      },
      commentDistribution,
      trafficTrend,
    };
  }

  static async getPopularContent() {
    const [popularPosts, featuredProjects] = await Promise.all([
      prisma.post.findMany({
        where: { isPublished: true },
        orderBy: [{ viewCount: 'desc' }, { likeCount: 'desc' }],
        take: 5,
        select: { id: true, title: true, category: true, viewCount: true },
      }),
      prisma.project.findMany({
        where: { featured: true },
        take: 3,
        select: { id: true, name: true, status: true },
      }),
    ]);

    return { posts: popularPosts, projects: featuredProjects };
  }

  static async getContentDistribution() {
    const [posts, diaries, photos, anime, games] = await Promise.all([
      prisma.post.count({ where: { isPublished: true } }),
      prisma.diary.count(),
      prisma.galleryImage.count(),
      prisma.anime.count(),
      prisma.game.count({ where: { isHidden: false } }),
    ]);

    const total = posts + diaries + photos + anime + games;

    return [
      { label: 'Articles', count: posts, percentage: total ? (posts / total) * 100 : 0 },
      { label: 'Diary', count: diaries, percentage: total ? (diaries / total) * 100 : 0 },
      { label: 'Photos', count: photos, percentage: total ? (photos / total) * 100 : 0 },
      { label: 'Anime', count: anime, percentage: total ? (anime / total) * 100 : 0 },
      { label: 'Games', count: games, percentage: total ? (games / total) * 100 : 0 },
    ];
  }

  private static calculateUptime(startDate: Date): string {
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  }
}
