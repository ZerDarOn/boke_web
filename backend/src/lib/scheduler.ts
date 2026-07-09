/**
 * 定时任务调度器 — Steam 游戏库 & B站追番同步
 *
 * 从 index.ts 拆分出来，启动逻辑和业务逻辑分离。
 */

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Steam 库定时同步
 * - 仅当 STEAM_API_KEY 和 STEAM_USER_ID 都配置时生效
 * - 启动时执行一次，之后每 24 小时重复
 * - 同步失败仅记录日志，不影响服务器运行
 */
export function startSteamSyncSchedule(): void {
  const steamApiKey = process.env.STEAM_API_KEY;
  const steamUserId = process.env.STEAM_USER_ID;

  if (!steamApiKey || !steamUserId) {
    console.log('ℹ️  Steam sync skipped: STEAM_API_KEY / STEAM_USER_ID not configured.');
    return;
  }

  const runSync = async () => {
    try {
      const { GameService } = await import('../services/game.service');
      const result = await GameService.syncSteamLibrary(steamUserId, steamApiKey);
      console.log(`🎮 Steam sync: ${result.created} created, ${result.updated} updated, ${result.total} total`);
    } catch (err: any) {
      console.error(`⚠️  Steam scheduled sync failed: ${err.message}`);
    }
  };

  runSync();
  setInterval(runSync, SYNC_INTERVAL_MS);
  console.log('🎮 Steam library sync scheduled (every 24h).');
}

/**
 * B站追番定时同步
 * - 仅当 BILIBILI_UID 配置时生效
 * - 启动时执行一次，之后每 24 小时重复
 * - 失败仅记日志，不影响服务器（如用户临时关闭"公开追番"，同步失败会被静默吞掉）
 */
export function startBilibiliAnimeSyncSchedule(): void {
  const uid = process.env.BILIBILI_UID;
  if (!uid) {
    console.log('ℹ️  Bilibili anime sync skipped: BILIBILI_UID not configured.');
    return;
  }

  const run = async () => {
    try {
      const { syncBilibiliAnime } = await import('../services/bilibili.service');
      const r = await syncBilibiliAnime(uid);
      console.log(
        `📺 Bilibili anime sync: ${r.created} created, ${r.updated} updated, ${r.total} total`,
      );
    } catch (err: any) {
      console.error(`⚠️  Bilibili anime scheduled sync failed: ${err.message}`);
    }
  };

  run();
  setInterval(run, SYNC_INTERVAL_MS);
  console.log('📺 Bilibili anime sync scheduled (every 24h).');
}
