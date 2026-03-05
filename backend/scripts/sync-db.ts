#!/usr/bin/env tsx
/**
 * 数据库同步脚本
 * 自动同步 Prisma schema 到 PostgreSQL 数据库
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema.prisma');

function checkPrismaSchema(): boolean {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error('❌ 未找到 schema.prisma 文件');
    return false;
  }
  
  const content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  
  // 检查关键字段是否存在
  const hasImageField = content.includes('image') && content.includes('Skill');
  const hasButtonFields = content.includes('buttonEnabled');
  
  console.log('📋 Schema 检查:');
  console.log(`   - image 字段: ${hasImageField ? '✅' : '❌'}`);
  console.log(`   - buttonEnabled 字段: ${hasButtonFields ? '✅' : '❌'}`);
  
  return true;
}

import { spawn } from 'child_process';

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

async function generateClient(): Promise<void> {
  console.log('\n🔧 生成 Prisma Client...');
  const success = await runCommand('npx', ['prisma', 'generate']);
  if (success) {
    console.log('✅ Prisma Client 生成成功\n');
  } else {
    console.error('❌ Prisma Client 生成失败');
    process.exit(1);
  }
}

async function pushSchema(): Promise<void> {
  console.log('🔄 同步数据库 schema...');
  console.log('   ⚠️  开发模式：使用 --accept-data-loss\n');
  
  const success = await runCommand('npx', ['prisma', 'db', 'push', '--accept-data-loss']);
  if (success) {
    console.log('\n✅ 数据库 schema 同步成功');
  } else {
    console.error('\n❌ 数据库 schema 同步失败');
    console.error('💡 请检查:');
    console.error('   1. PostgreSQL 服务是否运行');
    console.error('   2. DATABASE_URL 环境变量是否正确');
    console.error('   3. 数据库是否有写入权限\n');
    process.exit(1);
  }
}

async function verifySync(): Promise<void> {
  console.log('\n🔍 验证同步结果...');
  console.log('   重新生成 Prisma Client...');
  const success = await runCommand('npx', ['prisma', 'generate']);
  if (success) {
    console.log('✅ 验证通过\n');
  } else {
    console.warn('⚠️  验证警告: Client 生成可能有问题\n');
  }
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════╗
║       INK.SPIRIT 数据库同步工具                   ║
╚══════════════════════════════════════════════════╝
`);

  // 检查环境变量
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  未设置 DATABASE_URL 环境变量，尝试从 .env 文件加载...');
    
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
      if (dbUrlMatch) {
        process.env.DATABASE_URL = dbUrlMatch[1].trim();
        console.log('✅ 已从 .env 文件加载 DATABASE_URL\n');
      }
    }
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ 无法找到 DATABASE_URL');
      console.error('💡 请确保:');
      console.error('   1. 后端目录有 .env 文件');
      console.error('   2. 或手动设置环境变量: set DATABASE_URL=postgresql://...\n');
      process.exit(1);
    }
  }

  // 检查 schema
  if (!checkPrismaSchema()) {
    process.exit(1);
  }

  // 生成 Client
  await generateClient();

  // 推送 schema
  await pushSchema();

  // 验证
  await verifySync();

  console.log(`
╔══════════════════════════════════════════════════╗
║              ✅ 同步完成                          ║
║                                                  ║
║   现在可以启动后端服务: npm run dev              ║
╚══════════════════════════════════════════════════╝
`);
}

main().catch(console.error);
