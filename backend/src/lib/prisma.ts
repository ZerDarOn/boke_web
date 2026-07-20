import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaOptions = {
  log: process.env.NODE_ENV === 'development'
    ? [
        { emit: 'stdout' as const, level: 'warn' as const },
        { emit: 'stdout' as const, level: 'error' as const },
      ]
    : [{ emit: 'stdout' as const, level: 'error' as const }],
  errorFormat: 'pretty' as const,
};

// 创建或复用 Prisma 实例
function createPrismaClient(): PrismaClient {
  // 检查是否有全局实例（开发热重载时）
  if (globalForPrisma.prisma) {
    console.log('♻️  复用已有的 Prisma Client 实例');
    return globalForPrisma.prisma;
  }

  console.log('🔧 创建新的 Prisma Client 实例');
  const client = new PrismaClient(prismaOptions);

  // 开发环境缓存实例
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = createPrismaClient();

// 优雅的关闭处理
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('\n👋 收到 SIGINT，正在关闭数据库连接...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 收到 SIGTERM，正在关闭数据库连接...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
