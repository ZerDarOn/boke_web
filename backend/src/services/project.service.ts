import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { PaginationParams } from '../types';

export class ProjectService {
  static async findMany(params: {
    pagination: PaginationParams;
    featured?: boolean;
    status?: string;
  }) {
    const { pagination, featured, status } = params;

    const where: Prisma.ProjectWhereInput = {
      ...(featured !== undefined && { featured }),
      ...(status && { status: status as any }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total };
  }

  static async findById(id: string) {
    return prisma.project.findUnique({ where: { id } });
  }

  static async findBySlug(slug: string) {
    return prisma.project.findUnique({ where: { slug } });
  }

  static async getStats() {
    const [total, completed, active, techList] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({
        where: { status: { in: ['DEPLOYED', 'ARCHIVED'] } },
      }),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.project.findMany({ select: { tech: true } }),
    ]);

    // 统计技术栈分布
    const techCount: Record<string, number> = {};
    techList.forEach((p) => {
      p.tech.forEach((t) => {
        techCount[t] = (techCount[t] || 0) + 1;
      });
    });

    const techDistribution = Object.entries(techCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return { total, completed, active, techDistribution };
  }

  static async create(data: Prisma.ProjectCreateInput) {
    return prisma.project.create({ data });
  }

  static async update(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.project.delete({ where: { id } });
  }
}
