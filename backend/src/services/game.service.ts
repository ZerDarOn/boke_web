import { Prisma, GamePlatform, GameStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { PaginationParams } from '../types';
import { fetchSteamLibrary, steamGameToPrisma } from '../lib/steam-sync';
import { log, logError } from '../lib/logger';

export class GameService {
  static async findMany(params: {
    pagination: PaginationParams;
    status?: string;
    platform?: string;
    favorite?: boolean;
    includeHidden?: boolean;
  }) {
    const { pagination, status, platform, favorite, includeHidden } = params;

    const where: Prisma.GameWhereInput = {
      // 默认只返回可见游戏；后台管理传 includeHidden 查看全部
      ...(!includeHidden && { isHidden: false }),
      ...(status && { status: status as GameStatus }),
      ...(platform && { platform: platform as GamePlatform }),
      ...(favorite !== undefined && { favorite }),
    };

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: [
          { favorite: 'desc' },
          { updatedAt: 'desc' },
        ],
      }),
      prisma.game.count({ where }),
    ]);

    return { games, total };
  }

  static async findById(id: string) {
    return prisma.game.findUnique({ where: { id } });
  }

  static async create(data: Prisma.GameCreateInput) {
    return prisma.game.create({ data });
  }

  static async update(id: string, data: Prisma.GameUpdateInput) {
    return prisma.game.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.game.delete({ where: { id } });
  }

  static async toggleFavorite(id: string) {
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return null;

    return prisma.game.update({
      where: { id },
      data: { favorite: !game.favorite },
    });
  }

  static async updateScore(id: string, score: number) {
    return prisma.game.update({
      where: { id },
      data: { score },
    });
  }

  static async updateProgress(id: string, playtime: number) {
    return prisma.game.update({
      where: { id },
      data: { playtime },
    });
  }

  static async updateAchievements(id: string, unlocked: number) {
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return null;

    return prisma.game.update({
      where: { id },
      data: {
        achievementsUnlocked: unlocked,
        status: unlocked >= game.achievementsTotal && game.achievementsTotal > 0
          ? 'COMPLETED'
          : undefined,
      },
    });
  }

  /**
   * 从 Steam API 同步游戏库
   * - 已存在的游戏（按 platformId + platform='STEAM' 匹配）：更新 playtime、lastPlayed、steamLastSync
   * - 新游戏：创建记录，默认 isHidden=true, status=WANT_TO_PLAY
   * - 不在 Steam 库中的已有游戏不会被删除或修改
   */
  static async syncSteamLibrary(steamId: string, apiKey: string): Promise<{
    created: number;
    updated: number;
    total: number;
  }> {
    const steamGames = await fetchSteamLibrary(steamId, apiKey);

    let created = 0;
    let updated = 0;
    const syncTime = new Date();

    for (const sg of steamGames) {
      const platformId = String(sg.appid);
      const existing = await prisma.game.findFirst({
        where: { platform: 'STEAM', platformId },
      });

      if (existing) {
        // 仅更新 Steam 可提供的运行时数据，不覆盖用户手动设置的字段
        await prisma.game.update({
          where: { id: existing.id },
          data: {
            playtime: sg.playtime_forever,
            lastPlayed: sg.rtime_last_played
              ? new Date(sg.rtime_last_played * 1000)
              : null,
            steamLastSync: syncTime,
          },
        });
        updated++;
      } else {
        const data = steamGameToPrisma(sg);
        await prisma.game.create({
          data: { ...data, steamLastSync: syncTime },
        });
        created++;
      }
    }

    log('info', 'SteamSync', `Sync completed: ${created} created, ${updated} updated, ${steamGames.length} total`);

    return { created, updated, total: steamGames.length };
  }
}
