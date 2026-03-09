import prisma from '../lib/prisma';
import { DashboardStats } from '../types';

// 记录服务器启动时间
const SERVER_START_TIME = new Date();

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    const [postCount, diaryCount, photoCount, animeCount, totalLikes, totalViews, siteStatsAgg, recentSiteStats] = await Promise.all([
      prisma.post.count({ where: { isPublished: true } }),
      prisma.diary.count(),
      prisma.galleryImage.count(),
      prisma.anime.count(),
      prisma.post.aggregate({ _sum: { likeCount: true } }),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      prisma.siteStats.aggregate({
        _sum: { pageViews: true, uniqueVisitors: true }
      }),
      prisma.siteStats.findMany({
        orderBy: { date: 'desc' },
        take: 7,
        select: { date: true, pageViews: true, uniqueVisitors: true }
      })
    ]);

    // 使用服务器启动时间计算运行时间
    const uptime = this.calculateUptime(SERVER_START_TIME);

    const totalContent = postCount + diaryCount + photoCount + animeCount;

    const postCommentsCount = await prisma.comment.count();
    const galleryCommentsCount = await prisma.photoComment.count();
    const animeCommentsCount = 0;

    const totalCommentsCount = postCommentsCount + galleryCommentsCount + animeCommentsCount;

    // 从 SiteStats 获取真实的访问数据，如果没有则使用文章浏览量作为 fallback
    const totalRequests = (siteStatsAgg._sum.pageViews ?? 0) || (totalViews._sum.viewCount ?? 0);
    const uniqueVisitors = (siteStatsAgg._sum.uniqueVisitors ?? 0) || Math.floor((totalViews._sum.viewCount ?? 0) * 0.3);
    
    // 从 anime 表统计 favorites
    const animeData = await prisma.anime.findMany({ select: { favorite: true } });
    const totalFavorites = animeData.filter(a => a.favorite).length;

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
    const [posts, diaries, albums, anime] = await Promise.all([
      prisma.post.count({ where: { isPublished: true } }),
      prisma.diary.count(),
      prisma.album.count(),
      prisma.anime.count(),
    ]);

    const total = posts + diaries + albums + anime;

    return [
      { label: 'Articles', count: posts, percentage: total ? (posts / total) * 100 : 0 },
      { label: 'Diary', count: diaries, percentage: total ? (diaries / total) * 100 : 0 },
      { label: 'Albums', count: albums, percentage: total ? (albums / total) * 100 : 0 },
      { label: 'Anime', count: anime, percentage: total ? (anime / total) * 100 : 0 },
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
