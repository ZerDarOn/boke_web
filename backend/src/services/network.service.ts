import prisma from '../lib/prisma';

export class NetworkService {
  static async findNodes() {
    return prisma.networkNode.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async findById(id: string) {
    return prisma.networkNode.findUnique({ where: { id } });
  }

  static async create(data: any) {
    return prisma.networkNode.create({ data });
  }

  static async update(id: string, data: any) {
    return prisma.networkNode.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.networkNode.delete({ where: { id } });
  }

  static async getConnections() {
    const nodes = await prisma.networkNode.findMany({
      select: { id: true, connections: true },
    });

    const connections: { source: string; target: string }[] = [];

    nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        // 避免重复连接（只添加一次）
        const exists = connections.some(
          (c) =>
            (c.source === node.id && c.target === targetId) ||
            (c.source === targetId && c.target === node.id)
        );

        if (!exists) {
          connections.push({ source: node.id, target: targetId });
        }
      });
    });

    return connections;
  }
}
