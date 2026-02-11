import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { PaginationParams } from '../types';

export class AnimeService {
  static async findMany(params: {
    pagination: PaginationParams;
    status?: string;
    favorite?: boolean;
  }) {
    const { pagination, status, favorite } = params;

    const where: Prisma.AnimeWhereInput = {
      ...(status && { status: status as any }),
      ...(favorite !== undefined && { favorite }),
    };

    const [anime, total] = await Promise.all([
      prisma.anime.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.anime.count({ where }),
    ]);

    return { anime, total };
  }

  static async findById(id: string) {
    return prisma.anime.findUnique({ where: { id } });
  }

  static async create(data: Prisma.AnimeCreateInput) {
    return prisma.anime.create({ data });
  }

  static async update(id: string, data: Prisma.AnimeUpdateInput) {
    return prisma.anime.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.anime.delete({ where: { id } });
  }

  static async updateProgress(id: string, episodes: number) {
    const anime = await prisma.anime.findUnique({ where: { id } });
    if (!anime) return null;

    const isCompleted = episodes >= anime.episodes;

    return prisma.anime.update({
      where: { id },
      data: {
        currentEp: episodes,
        status: isCompleted ? 'COMPLETED' : 'WATCHING',
        finishDate: isCompleted ? new Date() : undefined,
      },
    });
  }

  static async updateScore(id: string, score: number) {
    return prisma.anime.update({
      where: { id },
      data: { score },
    });
  }

  static async toggleFavorite(id: string) {
    const anime = await prisma.anime.findUnique({ where: { id } });
    if (!anime) return null;

    return prisma.anime.update({
      where: { id },
      data: { favorite: !anime.favorite },
    });
  }
}
