import { spawn } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const prismaClientPath = join(__dirname, '../node_modules/.prisma/client/index.js');

/**
 * 异步生成 Prisma Client
 */
async function generatePrismaClient(): Promise<boolean> {
  console.log('🔄 Generating Prisma Client...');
  
  return new Promise((resolve) => {
    // Windows 下需要通过 shell 执行
    const isWindows = process.platform === 'win32';
    
    const proc = spawn(
      isWindows ? 'cmd' : 'npx',
      isWindows ? ['/c', 'npx', 'prisma', 'generate'] : ['prisma', 'generate'],
      {
        cwd: join(__dirname, '..'),
        stdio: 'inherit',
        env: process.env,
        shell: isWindows,
      }
    );

    proc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Prisma Client generated.\n');
        resolve(true);
      } else {
        console.error(`❌ Prisma generate failed with code ${code}`);
        resolve(false);
      }
    });

    proc.on('error', (err) => {
      console.error('❌ Failed to spawn prisma:', err.message);
      resolve(false);
    });
  });
}

/**
 * 检查并生成 Prisma Client
 */
async function ensurePrismaClient(): Promise<boolean> {
  if (existsSync(prismaClientPath)) {
    return true;
  }

  console.log('⚠️  Prisma Client not found. Attempting to generate...');
  
  // 清理旧缓存
  const cachePath = join(__dirname, '../node_modules/.prisma');
  try {
    if (existsSync(cachePath)) {
      rmSync(cachePath, { recursive: true, force: true });
    }
  } catch {}

  return await generatePrismaClient();
}

// Main startup
async function main() {
  // 检查/生成 Prisma Client
  const hasClient = await ensurePrismaClient();
  
  if (!hasClient) {
    console.error('\n❌ Prisma Client is required but could not be generated.');
    console.error('💡 Please run manually:\n');
    console.error('   cd ink-spirit-blog/backend');
    console.error('   npm run db:fix\n');
    process.exit(1);
  }

  // 动态导入依赖 Prisma 的模块
  const [{ default: app }, { config }, { initializeDatabase }] = await Promise.all([
    import('./app'),
    import('./config/env'),
    import('./lib/database-init')
  ]);

  const PORT = config.PORT || 3001;

  try {
    // 初始化数据库（包含自动 schema 同步）
    const prisma = await initializeDatabase();
    
    if (!prisma) {
      console.error('❌ Database initialization failed.');
      console.error('💡 Check DATABASE_URL and ensure PostgreSQL is running.');
      process.exit(1);
    }

    // 启动 HTTP 服务器
    app.listen(PORT, () => {
      console.log(`
🚀 INK.SPIRIT Backend Server
═════════════════════════════════════
📡 Server running on port: ${PORT}
🌐 Environment: ${config.NODE_ENV}
📊 API Health: http://localhost:${PORT}/api/health
🔐 Admin Panel: http://localhost:3000/admin/login
═════════════════════════════════════
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
