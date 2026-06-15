import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.anime.count();
  console.log('Total anime in DB:', count);
  const all = await prisma.anime.findMany({ select: { id: true, title: true, status: true, cover: true } });
  console.log(JSON.stringify(all, null, 2));
}
main().finally(() => prisma.$disconnect());
