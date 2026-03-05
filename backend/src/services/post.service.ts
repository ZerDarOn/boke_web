import { Prisma, AccessLevel } from '@prisma/client';
import prisma from '../lib/prisma';
import { PaginationParams } from '../types';

export class PostService {
  // 获取文章列表（公开 + 密码保护，排除私密）
  static async findMany(params: {
    pagination: PaginationParams;
    category?: string;
    tag?: string;
    search?: string;
  }) {
    const { pagination, category, tag, search } = params;

    const where: Prisma.PostWhereInput = {
      isPublished: true,
      accessLevel: { not: 'PRIVATE' }, // 排除私密文章
      ...(category && { category }),
      ...(tag && { tags: { has: tag } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          date: true,
          category: true,
          tags: true,
          readingTime: true,
          viewCount: true,
          likeCount: true,
          accessLevel: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    return { posts, total };
  }

  // 获取文章详情
  static async findById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // 获取文章详情（通过 slug）
  static async findBySlug(slug: string) {
    return prisma.post.findUnique({
      where: { slug },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // 验证文章访问密码
  static async verifyPassword(postId: string, password: string): Promise<boolean> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { password: true, accessLevel: true },
    });

    if (!post || post.accessLevel !== 'PASSWORD') {
      return false;
    }

    return post.password === password;
  }

  // 创建文章
  static async create(data: Prisma.PostCreateInput) {
    return prisma.post.create({ data });
  }

  // 更新文章
  static async update(id: string, data: Prisma.PostUpdateInput) {
    return prisma.post.update({
      where: { id },
      data,
    });
  }

  // 删除文章
  static async delete(id: string) {
    return prisma.post.delete({ where: { id } });
  }

  // 增加阅读量
  static async incrementView(id: string) {
    return prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  // 点赞
  static async incrementLike(id: string) {
    return prisma.post.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    });
  }

  // 获取相关文章
  static async findRelated(id: string, limit = 3) {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { tags: true, category: true },
    });

    if (!post) return [];

    return prisma.post.findMany({
      where: {
        id: { not: id },
        isPublished: true,
        OR: [
          { tags: { hasSome: post.tags } },
          { category: post.category },
        ],
      },
      take: limit,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        date: true,
        category: true,
      },
    });
  }

  // 获取所有分类
  static async getCategories() {
    const categories = await prisma.post.groupBy({
      by: ['category'],
      _count: { category: true },
      where: { isPublished: true },
    });

    return categories.map((c) => ({
      name: c.category,
      count: c._count.category,
    }));
  }

  // 获取所有标签
  static async getAllTags() {
    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      select: { tags: true },
    });

    const tagCount: Record<string, number> = {};
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCount).map(([name, count]) => ({
      name,
      count,
    }));
  }

  // 获取热门标签
  static async getPopularTags(limit = 20) {
    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      select: { tags: true, viewCount: true },
    });

    const tagStats: Record<
      string,
      { count: number; views: number }
    > = {};

    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        if (!tagStats[tag]) {
          tagStats[tag] = { count: 0, views: 0 };
        }
        tagStats[tag].count += 1;
        tagStats[tag].views += post.viewCount || 0;
      });
    });

    // 按使用次数和浏览量排序
    return Object.entries(tagStats)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        views: stats.views,
        // 热度分数：文章数 * 10 + 浏览量 * 0.1
        score: stats.count * 10 + stats.views * 0.1,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
