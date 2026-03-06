import prisma from '../lib/prisma';

// 检查表是否存在
async function ensureTableExists() {
  try {
    await prisma.historyItem.findFirst();
  } catch (error: any) {
    if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
      throw new Error('Database table "history_items" does not exist. Please run: npm run db:push or execute prisma/create_timeline_tables.sql');
    }
    throw error;
  }
}

export class HistoryItemService {
  static async findAll(params?: { isActive?: boolean }) {
    const where: any = {};
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    return prisma.historyItem.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  static async findById(id: string) {
    return prisma.historyItem.findUnique({ where: { id } });
  }

  static async create(data: {
    date: string;
    title: string;
    role: string;
    description: string;
    duration: string;
    location: string;
    tags?: string[];
    color?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }) {
    return prisma.historyItem.create({ data });
  }

  static async update(
    id: string,
    data: Partial<{
      date: string;
      title: string;
      role: string;
      description: string;
      duration: string;
      location: string;
      tags: string[];
      color: string;
      icon: string;
      order: number;
      isActive: boolean;
    }>
  ) {
    return prisma.historyItem.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.historyItem.delete({ where: { id } });
  }

  static async reorder(id: string, newOrder: number) {
    return prisma.historyItem.update({
      where: { id },
      data: { order: newOrder },
    });
  }

  static async getMaxOrder() {
    const result = await prisma.historyItem.aggregate({
      _max: { order: true },
    });
    return result._max.order || 0;
  }
}
