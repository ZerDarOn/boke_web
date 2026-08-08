import prisma from '../lib/prisma';

export class DivinationService {
  /**
   * 获取用户的占卜历史
   */
  static async findMany(userId: string, options: {
    type?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { type, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type;

    const [records, total] = await Promise.all([
      prisma.divinationRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.divinationRecord.count({ where }),
    ]);

    return { records, total };
  }

  /**
   * 获取单条占卜记录
   */
  static async findById(id: string, userId: string) {
    return prisma.divinationRecord.findFirst({
      where: { id, userId },
    });
  }

  /**
   * 创建占卜记录
   */
  static async create(userId: string, data: {
    type: 'TAROT' | 'ICHING' | 'ASTROLOGY';
    question?: string;
    result: any;
    isPublic?: boolean;
  }) {
    return prisma.divinationRecord.create({
      data: {
        userId,
        type: data.type,
        question: data.question,
        result: data.result,
        isPublic: data.isPublic ?? false,
      },
    });
  }

  /**
   * 更新 AI 解读
   */
  static async updateAiReading(id: string, userId: string, aiReading: string) {
    return prisma.divinationRecord.updateMany({
      where: { id, userId },
      data: { aiReading },
    });
  }

  /**
   * 删除占卜记录
   */
  static async delete(id: string, userId: string) {
    const result = await prisma.divinationRecord.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}
