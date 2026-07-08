/**
 * 一次性修复：把 anime 表里 B站的 http 封面改成 https。
 * 原因：B站 season 接口返回的 cover 是 http://i0.hdslb.com/...，而站点是 https，
 * http 图片会被浏览器"混合内容"拦截、也被后端 helmet CSP(imgSrc 只含 https:)拦，导致封面空白。
 *
 * 用法：cd backend && npx tsx scripts/fix-anime-covers.ts
 */
import prisma from '../src/lib/prisma';

async function main() {
  const n = await prisma.$executeRawUnsafe(
    `UPDATE anime SET cover = replace(cover, 'http://', 'https://') WHERE cover LIKE 'http://%'`,
  );
  console.log(`✅ 已把 ${n} 条 http 封面改为 https`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ 修复失败:', e);
  process.exit(1);
});
