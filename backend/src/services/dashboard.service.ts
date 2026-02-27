import prisma from '../lib/prisma';
import { DashboardStats } from '../types';

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    const [postCount, diaryCount, photoCount, animeCount, totalLikes, totalViews, firstPost] = await Promise.all([
      prisma.post.count({ where: { isPublished: true } }),
      prisma.diary.count(),
      prisma.galleryImage.count(),
      prisma.anime.count(),
      prisma.post.aggregate({ _sum: { likeCount: true } }),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      prisma.post.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } })
    ]);

    const uptime = firstPost ? this.calculateUptime(firstPost.createdAt) : '0d 00h 00m';

    const totalContent = postCount + diaryCount + photoCount + animeCount;

    const postCommentsCount = await prisma.comment.count();
    const galleryCommentsCount = await prisma.photoComment.count();
    const animeCommentsCount = 0;

    const totalCommentsCount = postCommentsCount + galleryCommentsCount + animeCommentsCount;

    const commentDistribution = [
      { label: 'Post Comments', count: postCommentsCount, color: 'bg-neon' },
      { label: 'Anime Comments', count: animeCommentsCount, color: 'bg-pink-400' },
      { label: 'Gallery Comments', count: galleryCommentsCount, color: 'bg-amber-500' },
    ];

    return {
      uptime,
      totalRequests: totalViews._sum.viewCount ?? 0,
      uniqueVisitors: Math.floor((totalViews._sum.viewCount ?? 0) * 0.3),
      contentStats: {
        totalContent,
        totalLikes: totalLikes._sum.likeCount ?? 0,
        totalFavorites: 0,
        totalComments: totalCommentsCount,
        articles: postCount,
        photos: photoCount,
        diaries: diaryCount,
      },
      commentDistribution,
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
