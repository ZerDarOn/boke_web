/**
 * B站追番同步（手动运行）
 * 用法（在 backend 目录下）：
 *   npx tsx scripts/sync-bilibili-anime.ts --dry   # 只预览，不写库
 *   npx tsx scripts/sync-bilibili-anime.ts         # 正式写入
 *   BILIBILI_UID=104973922 npx tsx scripts/sync-bilibili-anime.ts
 *
 * 核心逻辑在 src/services/bilibili.service.ts（同时被 index.ts 的定时任务复用）。
 */
import { syncBilibiliAnime } from '../src/services/bilibili.service';

const UID = process.env.BILIBILI_UID || '104973922';
const DRY = process.argv.includes('--dry');

console.log(`\n🔄 同步 B站追番 UID=${UID}${DRY ? '  [DRY-RUN 仅预览，不写库]' : ''}`);

syncBilibiliAnime(UID, { dryRun: DRY, log: (m) => console.log(m) })
  .then((r) => {
    console.log(
      `\n✅ ${DRY ? '预览' : '同步'}完成：新增 ${r.created} / 补全 ${r.updated} / 跳过 ${r.skipped}（追番共 ${r.total} 部）\n`,
    );
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ 同步失败:', e.message || e);
    process.exit(1);
  });
