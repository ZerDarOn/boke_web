import { spawn } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import * as net from 'net';

const prismaClientPath = join(__dirname, '../node_modules/.prisma/client/index.js');

/**
 * 检查端口是否被占用
 */
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

/**
 * 获取占用端口的进程信息
 */
async function getProcessUsingPort(port: number): Promise<string | null> {
  try {
    const { exec } = require('child_process');
    const platform = process.platform;

    let command: string;
    if (platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port} | grep LISTEN`;
    }

    return new Promise((resolve) => {
      exec(command, (error: any, stdout: string) => {
        if (error || !stdout.trim()) {
          resolve(null);
          return;
        }

        const lines = stdout.trim().split('\n');
        if (lines.length > 0) {
          resolve(stdout.trim());
        } else {
          resolve(null);
        }
      });
    });
  } catch {
    return null;
  }
}

/**
 * 格式化数据库错误信息
 */
function formatDatabaseError(error: any): string {
  const message = error.message || String(error);

  if (message.includes('password authentication failed')) {
    return `
❌ 数据库密码认证失败

💡 请检查以下内容：
   1. PostgreSQL 的 postgres 用户密码是否正确
   2. 检查 backend/.env 文件中的 DATABASE_URL
   3. 格式：postgresql://postgres:<密码>@localhost:5432/ink_spirit

📝 如果忘记密码，可以：
   - 运行：npx tsx scripts/find-password.ts 查找常见密码
`;
  }

  if (message.includes('does not exist')) {
    return `
❌ 数据库不存在

💡 请创建数据库：
   - 运行：npx tsx scripts/create-db-final.ts
   - 或手动：CREATE DATABASE ink_spirit;
`;
  }

  if (message.includes('ECONNREFUSED') || message.includes('connect ECONNREFUSED')) {
    return `
❌ 无法连接到数据库服务器

💡 请检查：
   1. PostgreSQL 服务是否启动
   2. 端口 5432 是否正确
   3. 防火墙是否阻止连接

🔧 启动 PostgreSQL：
   - Windows: 服务管理器 -> PostgreSQL
   - macOS: brew services start postgresql
   - Linux: sudo systemctl start postgresql
`;
  }

  return `❌ 数据库错误: ${message}`;
}

/**
 * 格式化端口占用错误信息
 */
async function formatPortError(port: number): Promise<string> {
  const processInfo = await getProcessUsingPort(port);

  return `
❌ 端口 ${port} 已被占用

💡 解决方案：

   方案 1：关闭占用端口的进程
   - Windows: taskkill //F //PID <进程ID>
   - macOS/Linux: kill -9 <进程ID>

   方案 2：更改端口号
   - 修改 backend/.env 中的 PORT 环境变量
   - 设置：PORT=3002（或其他可用端口）

${processInfo ? `📊 占用端口 ${port} 的进程信息：\n${processInfo}\n` : ''}

🔧 快速关闭占用端口（Windows）：
   netstat -ano | findstr :${port}
   taskkill //F //PID <进程ID>
`;
}

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
  // 动态导入配置模块
  const { config, validateProductionEnv } = await import('./config/env');
  
  // 生产环境安全检查
  const envValidation = validateProductionEnv();
  if (!envValidation.valid) {
    console.error('\n🔒 生产环境安全检查失败:\n');
    envValidation.errors.forEach(err => console.error(`   ❌ ${err}`));
    console.error('\n💡 请在 .env 文件中正确配置以上环境变量\n');
    process.exit(1);
  }

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
  const [{ default: app }, { initializeDatabase }] = await Promise.all([
    import('./app'),
    import('./lib/database-init')
  ]);

  const PORT = config.PORT || 3001;

  try {
    // 检查端口是否被占用
    const portInUse = await isPortInUse(PORT);
    if (portInUse) {
      const errorMessage = await formatPortError(PORT);
      console.error(errorMessage);
      process.exit(1);
    }

    // 初始化数据库（包含自动 schema 同步）
    const prisma = await initializeDatabase();

    if (!prisma) {
      console.error('❌ Database initialization failed.');
      console.error('💡 Check DATABASE_URL and ensure PostgreSQL is running.');
      process.exit(1);
    }

    // 启动 HTTP 服务器
    const server = app.listen(PORT, () => {
      console.log(`
🚀 INK.SPIRIT Backend Server
════════════════════════════════════
📡 Server running on port: ${PORT}
🌐 Environment: ${config.NODE_ENV}
📊 API Health: http://localhost:${PORT}/api/health
🔐 Admin Panel: http://localhost:3000/admin/login
════════════════════════════════════
      `);
    });

    // 处理服务器错误（包括端口占用）
    server.on('error', async (error: any) => {
      if (error.code === 'EADDRINUSE') {
        const errorMessage = await formatPortError(PORT);
        console.error(errorMessage);
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    const errorMessage = formatDatabaseError(error);
    console.error(errorMessage);
    process.exit(1);
  }
}

main();
