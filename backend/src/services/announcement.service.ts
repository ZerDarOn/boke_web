import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { PaginationParams } from '../types';

export class AnnouncementService {
  static async findMany(params: { pagination: PaginationParams; type?: string }) {
    const { pagination, type } = params;

    const where: Prisma.AnnouncementWhereInput = {
      ...(type && { type: type as any }),
    };

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { date: 'desc' },
      }),
      prisma.announcement.count({ where }),
    ]);

    return { announcements, total };
  }

  static async findById(id: string) {
    return prisma.announcement.findUnique({ where: { id } });
  }

  static async create(data: Prisma.AnnouncementCreateInput) {
    return prisma.announcement.create({ data });
  }

  static async update(id: string, data: Prisma.AnnouncementUpdateInput) {
    return prisma.announcement.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.announcement.delete({ where: { id } });
  }

  static async getLatest(limit = 3) {
    return prisma.announcement.findMany({
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}
