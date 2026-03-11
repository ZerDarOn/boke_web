import { Prisma, AccessLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

    if (!post || post.accessLevel !== 'PASSWORD' || !post.password) {
      return false;
    }

    // 检查密码是否已经是 bcrypt 哈希（以 $2a$ 或 $2b$ 开头）
    const isHashed = post.password.startsWith('$2a$') || post.password.startsWith('$2b$');
    
    if (isHashed) {
      // 使用 bcrypt 验证
      return bcrypt.compare(password, post.password);
    } else {
      // 兼容旧的明文密码
      if (post.password === password) {
        // 自动升级为 bcrypt 哈希
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.post.update({
          where: { id: postId },
          data: { password: hashedPassword },
        });
        return true;
      }
      return false;
    }
  }

  // 创建文章
  static async create(data: Prisma.PostCreateInput) {
    // 如果设置了密码，进行哈希处理
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return prisma.post.create({ data });
  }

  // 更新文章
  static async update(id: string, data: Prisma.PostUpdateInput) {
    // 如果更新了密码，进行哈希处理
    if (data.password && typeof data.password === 'string') {
      data.password = await bcrypt.hash(data.password, 10);
    }
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
