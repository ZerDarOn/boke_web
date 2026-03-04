import prisma from '../lib/prisma';

export class SkillService {
  static async findAll() {
    const skills = await prisma.skill.findMany({
      orderBy: [{ category: 'asc' }, { level: 'desc' }],
    });

    // 按 category 分组
    const grouped = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, typeof skills>);

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      items,
    }));
  }

  static async findNodes() {
    return prisma.skill.findMany({
      where: {
        nodeX: { not: null },
        nodeY: { not: null },
      },
      select: {
        id: true,
        name: true,
        nodeX: true,
        nodeY: true,
        nodeType: true,
        connections: true,
        level: true,
      },
    });
  }

  static async findById(id: string) {
    return prisma.skill.findUnique({ where: { id } });
  }

  static async create(data: any) {
    // 使用 upsert 避免重复创建同名技能
    const { name, ...rest } = data;
    return prisma.skill.upsert({
      where: { name },
      create: data,
      update: rest,
    });
  }

  static async update(id: string, data: any) {
    return prisma.skill.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.skill.delete({ where: { id } });
  }

  static async getStats() {
    const [total, masters, experts, adepts] = await Promise.all([
      prisma.skill.count(),
      prisma.skill.count({ where: { rank: 'Master' } }),
      prisma.skill.count({ where: { rank: 'Expert' } }),
      prisma.skill.count({ where: { rank: 'Adept' } }),
    ]);

    return {
      total,
      distribution: {
        Master: masters,
        Expert: experts,
        Adept: adepts,
        Novice: total - masters - experts - adepts,
      },
    };
  }
}
