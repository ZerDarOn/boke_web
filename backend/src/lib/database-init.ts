import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// 数据库连接配置
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

/**
 * 执行命令（异步，不阻塞）- Windows 兼容
 */
function runCommand(cmd: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    // Windows 下需要通过 shell 执行
    const isWindows = process.platform === 'win32';
    
    const proc = spawn(
      isWindows ? 'cmd' : cmd,
      isWindows ? ['/c', cmd, ...args] : args,
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: process.env,
        shell: isWindows,
      }
    );

    proc.on('close', (code) => {
      console.log(`📝 命令执行完成，退出码: ${code}`);
      resolve(code === 0);
    });
    
    proc.on('error', (err) => {
      console.error('❌ 命令执行错误:', err.message);
      resolve(false);
    });
  });
}

/**
 * 清理 Prisma 缓存（解决 Windows 文件锁定问题）
 */
function cleanPrismaCache(): void {
  const cachePaths = [
    path.join(process.cwd(), 'node_modules', '.prisma'),
    path.join(process.cwd(), 'node_modules', '@prisma', 'client'),
  ];

  for (const cachePath of cachePaths) {
    if (fs.existsSync(cachePath)) {
      try {
        console.log(`🧹 清理缓存: ${cachePath}`);
        fs.rmSync(cachePath, { recursive: true, force: true });
      } catch (error: any) {
        // Windows 可能因为文件锁定失败，尝试重命名后删除
        if (error.code === 'EPERM') {
          try {
            const tempPath = `${cachePath}.old.${Date.now()}`;
            fs.renameSync(cachePath, tempPath);
            console.log(`⚠️  已重命名旧缓存，将在后台清理`);
            // 尝试异步删除
            setTimeout(() => {
              try {
                fs.rmSync(tempPath, { recursive: true, force: true });
              } catch {}
            }, 5000);
          } catch {
            console.warn(`⚠️  无法清理缓存，可能被其他进程占用`);
          }
        }
      }
    }
  }
}

/**
 * 检查数据库连接
 */
async function checkConnection(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error: any) {
    const message = error.message || String(error);

    // 密码认证失败
    if (message.includes('password authentication failed')) {
      console.error(`
❌ 数据库密码认证失败

💡 请检查以下内容：
   1. PostgreSQL 的 postgres 用户密码是否正确
   2. 检查 backend/.env 文件中的 DATABASE_URL
   3. 格式：postgresql://postgres:<密码>@localhost:5432/ink_spirit

📝 如果忘记密码，可以：
   - 运行：npx tsx scripts/find-password.ts 查找常见密码
   - 使用 pgAdmin 工具重置密码
`);
    } else if (message.includes('does not exist')) {
      console.error(`
❌ 数据库不存在

💡 请创建数据库：
   - 运行：npx tsx scripts/create-db-final.ts
   - 或手动：CREATE DATABASE ink_spirit;
`);
    } else if (message.includes('ECONNREFUSED') || message.includes('connect ECONNREFUSED')) {
      console.error(`
❌ 无法连接到数据库服务器

💡 请检查：
   1. PostgreSQL 服务是否启动
   2. 端口 5432 是否正确
   3. 防火墙是否阻止连接

🔧 启动 PostgreSQL：
   - Windows: services.msc -> PostgreSQL
   - macOS: brew services start postgresql
   - Linux: sudo systemctl start postgresql
`);
    } else {
      console.error(`❌ 数据库连接失败: ${message}`);
    }

    return false;
  }
}

/**
 * 重试连接
 */
async function connectWithRetry(prisma: PrismaClient): Promise<boolean> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    console.log(`🔄 尝试连接数据库 (${i + 1}/${MAX_RETRIES})...`);
    
    if (await checkConnection(prisma)) {
      return true;
    }
    
    if (i < MAX_RETRIES - 1) {
      console.log(`⏳ ${RETRY_DELAY}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  return false;
}

/**
 * 检查是否需要 schema 同步
 */
async function needsSchemaSync(prisma: PrismaClient): Promise<boolean> {
  try {
    // 尝试查询最新 schema 中的新增字段（字段名需要加引号保留大小写）
    await prisma.$queryRaw`SELECT "image", "buttonEnabled" FROM "skills" LIMIT 1`;
    return false;
  } catch (error: any) {
    const msg = error.message || '';
    // 字段不存在 - 需要同步
    if (msg.includes('column') || msg.includes('Column') || msg.includes('does not exist')) {
      console.log('⚠️ 检测到 schema 字段缺失，需要同步');
      return true;
    }
    // 表不存在 - 也需要同步
    if (msg.includes('relation') || msg.includes('table')) {
      console.log('⚠️ 检测到表不存在，需要同步');
      return true;
    }
    return false;
  }
}

/**
 * 自动同步数据库 schema
 */
async function syncSchema(): Promise<boolean> {
  console.log('🔄 正在同步数据库 schema...');
  
  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ 未找到 schema.prisma 文件:', schemaPath);
      return false;
    }

    // 检查是否在开发环境
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (isDev) {
      // 开发环境：使用 db push 快速同步
      console.log('🔧 开发模式：执行 prisma db push --accept-data-loss');
      
      const success = await runCommand('npx', ['prisma', 'db', 'push', '--accept-data-loss']);
      
      if (success) {
        console.log('✅ Schema 同步成功');
        return true;
      } else {
        console.error('❌ Schema 同步失败');
        return false;
      }
    } else {
      // 生产环境：建议手动迁移
      console.warn('⚠️ 生产环境请手动执行迁移:');
      console.warn('   npx prisma migrate deploy');
      return false;
    }
  } catch (error) {
    console.error('❌ Schema 同步出错:', error);
    return false;
  }
}

/**
 * 生成 Prisma Client
 */
async function generatePrismaClient(): Promise<boolean> {
  console.log('🔄 生成 Prisma Client...');
  
  // 先清理旧缓存（解决 Windows 文件锁定问题）
  cleanPrismaCache();
  
  // 等待文件系统完成删除
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const success = await runCommand('npx', ['prisma', 'generate']);
  
  if (success) {
    console.log('✅ Prisma Client 生成成功');
  } else {
    console.error('❌ Prisma Client 生成失败');
  }
  return success;
}

/**
 * 初始化数据库
 */
export async function initializeDatabase(): Promise<PrismaClient | null> {
  console.log('\n🚀 初始化数据库连接...\n');

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
  });

  // 1. 检查连接
  if (!await connectWithRetry(prisma)) {
    console.error('\n❌ 无法连接到数据库，请检查:');
    console.error('   1. PostgreSQL 服务是否运行');
    console.error('   2. DATABASE_URL 环境变量是否正确');
    console.error('   3. 数据库是否存在且有权限访问\n');
    return null;
  }

  // 2. 检查并同步 schema
  if (await needsSchemaSync(prisma)) {
    console.log('\n⚠️ 检测到数据库 schema 需要更新\n');
    
    // 同步 schema
    if (await syncSchema()) {
      console.log('✅ 数据库 schema 已同步\n');
      
      // 同步成功后重新生成 Client 以确保类型匹配
      if (!await generatePrismaClient()) {
        console.warn('⚠️ Prisma Client 生成失败，尝试继续...');
      }
    } else {
      console.warn('⚠️ 无法自动同步 schema，请手动执行:');
      console.warn('   npx prisma db push\n');
    }
  }

  // 3. 最终验证
  try {
    // 测试查询
    const skillCount = await prisma.skill.count();
    const nodeCount = await prisma.networkNode.count();
    console.log(`📊 数据库状态: ${skillCount} 个技能, ${nodeCount} 个人脉节点\n`);
    
    return prisma;
  } catch (error) {
    console.error('❌ 数据库验证失败:', error);
    return prisma; // 仍然返回 client，让应用决定如何处理
  }
}

/**
 * 健康检查
 */
export async function healthCheck(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export default initializeDatabase;
