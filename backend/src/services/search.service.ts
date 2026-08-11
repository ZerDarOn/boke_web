import prisma from '../lib/prisma';
import { publicPostWhere } from '../lib/post-access-policy';

export class SearchService {
  static async search(query: string) {
    const searchPattern = query.toLowerCase();

    const [posts, projects, announcements, diaries, anime, gallery] = await Promise.all([
      // 搜索文章
      prisma.post.findMany({
        where: {
          ...publicPostWhere,
          OR: [
            { title: { contains: searchPattern, mode: 'insensitive' } },
            { content: { contains: searchPattern, mode: 'insensitive' } },
            { excerpt: { contains: searchPattern, mode: 'insensitive' } },
            { tags: { hasSome: [searchPattern] } },
          ],
        },
        take: 5,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          date: true,
        },
      }),

      // 搜索项目
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: searchPattern, mode: 'insensitive' } },
            { description: { contains: searchPattern, mode: 'insensitive' } },
            { tech: { hasSome: [searchPattern] } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
        },
      }),

      // 搜索公告
      prisma.announcement.findMany({
        where: {
          OR: [
            { title: { contains: searchPattern, mode: 'insensitive' } },
            { content: { contains: searchPattern, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          title: true,
          date: true,
        },
      }),

      // 搜索日记
      prisma.diary.findMany({
        where: {
          OR: [
            { content: { contains: searchPattern, mode: 'insensitive' } },
            { title: { contains: searchPattern, mode: 'insensitive' } },
            { longContent: { contains: searchPattern, mode: 'insensitive' } },
            { tags: { hasSome: [searchPattern] } },
          ],
        },
        take: 5,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          content: true,
          title: true,
          date: true,
        },
      }),

      // 搜索动漫
      prisma.anime.findMany({
        where: {
          OR: [
            { title: { contains: searchPattern, mode: 'insensitive' } },
            { synopsis: { contains: searchPattern, mode: 'insensitive' } },
            { studios: { hasSome: [searchPattern] } },
            { genres: { hasSome: [searchPattern] } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
        },
      }),

      // 搜索相册
      prisma.galleryImage.findMany({
        where: {
          OR: [
            { title: { contains: searchPattern, mode: 'insensitive' } },
            { location: { contains: searchPattern, mode: 'insensitive' } },
            { tags: { hasSome: [searchPattern] } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          location: true,
        },
      }),
    ]);

    return {
      posts,
      projects,
      announcements,
      diaries,
      anime,
      gallery,
    };
  }
}
