import prisma from '../lib/prisma';

// 检查表是否存在，不存在则尝试创建
async function ensureTableExists() {
  try {
    // 尝试查询，如果表不存在会抛出错误
    await prisma.currentStatus.findFirst();
  } catch (error: any) {
    // 如果是表不存在的错误，抛出更友好的提示
    if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
      throw new Error('Database table "current_status" does not exist. Please run: npm run db:push or execute prisma/create_timeline_tables.sql');
    }
    throw error;
  }
}

export class CurrentStatusService {
  static async findAll() {
    return prisma.currentStatus.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async findActive() {
    return prisma.currentStatus.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async findById(id: string) {
    return prisma.currentStatus.findUnique({ where: { id } });
  }

  static async create(data: {
    title: string;
    currentFocus: string;
    location: string;
    vibe: string;
    emoji?: string;
    isActive?: boolean;
  }) {
    // 如果新设置为 active，先将其他设置为 inactive
    if (data.isActive) {
      await prisma.currentStatus.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }
    return prisma.currentStatus.create({ data });
  }

  static async update(
    id: string,
    data: Partial<{
      title: string;
      currentFocus: string;
      location: string;
      vibe: string;
      emoji: string;
      isActive: boolean;
    }>
  ) {
    // 如果新设置为 active，先将其他设置为 inactive
    if (data.isActive) {
      await prisma.currentStatus.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }
    return prisma.currentStatus.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.currentStatus.delete({ where: { id } });
  }

  static async setActive(id: string) {
    // 先将所有设置为 inactive
    await prisma.currentStatus.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
    // 再将指定 id 设置为 active
    return prisma.currentStatus.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
