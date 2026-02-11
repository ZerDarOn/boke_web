import prisma from '../lib/prisma';

export class TimelineService {
  static async findAll(params: { type?: string; year?: string }) {
    const { type, year } = params;

    const where: any = {
      ...(type && { type }),
      ...(year && { year }),
    };

    return prisma.timelineEvent.findMany({
      where,
      orderBy: [{ year: 'desc' }, { date: 'desc' }],
    });
  }

  static async findById(id: string) {
    return prisma.timelineEvent.findUnique({ where: { id } });
  }

  static async create(data: any) {
    return prisma.timelineEvent.create({ data });
  }

  static async update(id: string, data: any) {
    return prisma.timelineEvent.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.timelineEvent.delete({ where: { id } });
  }

  static async getCurrentStatus() {
    // 返回最近的事件作为当前状态
    const latest = await prisma.timelineEvent.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: latest?.title || 'Coding...',
      description: latest?.description || 'Writing code and creating things.',
      since: latest?.date,
    };
  }

  static async getYears() {
    const events = await prisma.timelineEvent.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    return events.map((e) => e.year);
  }
}
