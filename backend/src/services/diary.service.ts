import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { PaginationParams } from '../types';

export class DiaryService {
  static async findMany(params: {
    pagination: PaginationParams;
    type?: 'SHORT' | 'LONG';
  }) {
    const { pagination, type } = params;

    const where: Prisma.DiaryWhereInput = {
      ...(type && { type }),
    };

    const [diaries, total] = await Promise.all([
      prisma.diary.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { date: 'desc' },
      }),
      prisma.diary.count({ where }),
    ]);

    return { diaries, total };
  }

  static async findById(id: string) {
    return prisma.diary.findUnique({ where: { id } });
  }

  static async create(data: Prisma.DiaryCreateInput) {
    return prisma.diary.create({ data });
  }

  static async update(id: string, data: Prisma.DiaryUpdateInput) {
    return prisma.diary.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.diary.delete({ where: { id } });
  }
}
