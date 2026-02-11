import prisma from '../lib/prisma';
import { DashboardStats } from '../types';

export class DashboardService {
  // 获取仪表盘统计数据
  static async getStats(): Promise<DashboardStats> {
    const [
      postCount,
      diaryCount,
      photoCount,
      animeCount,
      totalLikes,
      totalViews,
    ] = await Promise.all([
      prisma.post.count({ where: { isPublished: true } }),
      prisma.diary.count(),
      prisma.galleryImage.count(),
      prisma.anime.count(),
      prisma.post.aggregate({ _sum: { likeCount: true } }),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
    ]);

    // 计算运行时间（从第一个内容创建时间算起）
    const firstPost = await prisma.post.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    const uptime = firstPost
      ? this.calculateUptime(firstPost.createdAt)
      : '0d 00h 00m';

    return {
      uptime,
      totalRequests: 842100, // 示例数据，实际应从统计表获取
      uniqueVisitors: 24500, // 示例数据
      contentStats: {
        articles: postCount,
        diaries: diaryCount,
        photos: photoCount,
        anime: animeCount,
      },
      interactions: {
        likes: totalLikes._sum.likeCount || 0,
        favorites: 3200, // 示例数据
        comments: 1247, // 示例数据
      },
      commentDistribution: {
        posts: 856,
        anime: 234,
        gallery: 157,
      },
    };
  }

  // 获取热门内容
  static async getPopularContent() {
    const [popularPosts, featuredProjects] = await Promise.all([
      prisma.post.findMany({
        where: { isPublished: true },
        orderBy: [{ viewCount: 'desc' }, { likeCount: 'desc' }],
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          viewCount: true,
        },
      }),
      prisma.project.findMany({
        where: { featured: true },
        take: 3,
        select: {
          id: true,
          name: true,
          status: true,
        },
      }),
    ]);

    return { posts: popularPosts, projects: featuredProjects };
  }

  // 获取内容分布
  static async getContentDistribution() {
    const [posts, diaries, albums, anime] = await Promise.all([
      prisma.post.count({ where: { isPublished: true } }),
      prisma.diary.count(),
      prisma.album.count(),
      prisma.anime.count(),
    ]);

    const total = posts + diaries + albums + anime;

    return [
      { label: '文章', count: posts, percentage: total ? (posts / total) * 100 : 0 },
      { label: '日记', count: diaries, percentage: total ? (diaries / total) * 100 : 0 },
      { label: '相册', count: albums, percentage: total ? (albums / total) * 100 : 0 },
      { label: '动漫', count: anime, percentage: total ? (anime / total) * 100 : 0 },
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
