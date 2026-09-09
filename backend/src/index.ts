/**
 * INK.SPIRIT Blog — Backend Entry Point
 *
 * 启动顺序（不可变更）：
 *   1. 加载配置 + 安全告警
 *   2. Prisma Client 检查/生成
 *   3. 动态导入 app / database-init / cache（依赖 Prisma）
 *   4. 端口检测 → DB 初始化 → HTTP 服务器 → 定时任务
 */

import {
  isPortInUse,
  formatDatabaseError,
  formatPortError,
  ensurePrismaClient,
} from './lib/boot-utils';
import {
  startSteamSyncSchedule,
  startBilibiliAnimeSyncSchedule,
} from './lib/scheduler';

async function main() {
  // ── 1. 配置 + 安全告警 ──
  const { config, validateProductionEnv, logSecurityWarnings } = await import('./config/env');

  logSecurityWarnings();

  const envValidation = validateProductionEnv();
  if (!envValidation.valid) {
    console.error('\n🔒 生产环境安全检查失败:\n');
    envValidation.errors.forEach(err => console.error(`   ❌ ${err}`));
    console.error('\n💡 请在 .env 文件中正确配置以上环境变量\n');
    process.exit(1);
  }

  // ── 2. Prisma Client ──
  const hasClient = await ensurePrismaClient();

  if (!hasClient) {
    console.error('\n❌ Prisma Client is required but could not be generated.');
    console.error('💡 Please run manually:\n');
    console.error('   cd ink-spirit-blog/backend');
    console.error('   npm run db:fix\n');
    process.exit(1);
  }

  // ── 3. 动态导入（依赖 Prisma Client） ──
  const [
    { default: app },
    { initializeDatabase },
    { initializeCache, shutdownCache },
    { default: fileService },
  ] = await Promise.all([
    import('./app'),
    import('./lib/database-init'),
    import('./lib/cache'),
    import('./services/file.service'),
  ]);

  const PORT = config.PORT || 3001;

  // ── 4. 启动 ──
  try {
    const portInUse = await isPortInUse(PORT);
    if (portInUse) {
      console.error(await formatPortError(PORT));
      process.exit(1);
    }

    const prisma = await initializeDatabase();
    if (!prisma) {
      console.error('❌ Database initialization failed.');
      console.error('💡 Check DATABASE_URL and ensure PostgreSQL is running.');
      process.exit(1);
    }

    // File storage must settle on MinIO or local mode before the first request.
    // Otherwise an upload during a slow MinIO probe can be written locally and
    // disappear as soon as the mode flips to MinIO.
    await fileService.initialize();
    await initializeCache().catch(err => {
      console.error('Failed to initialize cache:', err);
    });

    const server = app.listen(PORT, () => {
      console.log(`
🚀 INK.SPIRIT Backend Server
════════════════════════════════════
📡 Server running on port: ${PORT}
🌐 Environment: ${config.NODE_ENV}
📊 API Health: http://localhost:${PORT}/api/health
🔐 Admin Panel: ${config.FRONTEND_URL}/admin/login
════════════════════════════════════
      `);

      startSteamSyncSchedule();
      startBilibiliAnimeSyncSchedule();
    });

    const gracefulShutdown = () => {
      console.log('\n🔄 Shutting down gracefully...');
      shutdownCache();
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    server.on('error', async (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(await formatPortError(PORT));
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(formatDatabaseError(error));
    process.exit(1);
  }
}

main();
