/**
 * 启动辅助工具 — 端口检测、Prisma 生成、错误格式化
 *
 * 从 index.ts 拆分出来，保持入口文件简洁。
 */

import { spawn } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import * as net from 'net';

const PRISMA_CLIENT_PATH = join(__dirname, '../../node_modules/.prisma/client/index.js');

/**
 * 检查端口是否被占用
 */
export function isPortInUse(port: number): Promise<boolean> {
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
export async function getProcessUsingPort(port: number): Promise<string | null> {
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
export function formatDatabaseError(error: any): string {
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
export async function formatPortError(port: number): Promise<string> {
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
export async function generatePrismaClient(): Promise<boolean> {
  console.log('🔄 Generating Prisma Client...');

  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';

    const proc = spawn(
      isWindows ? 'cmd' : 'npx',
      isWindows ? ['/c', 'npx', 'prisma', 'generate'] : ['prisma', 'generate'],
      {
        cwd: join(__dirname, '../..'),
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
export async function ensurePrismaClient(): Promise<boolean> {
  if (existsSync(PRISMA_CLIENT_PATH)) {
    return true;
  }

  console.log('⚠️  Prisma Client not found. Attempting to generate...');

  const cachePath = join(__dirname, '../../node_modules/.prisma');
  try {
    if (existsSync(cachePath)) {
      rmSync(cachePath, { recursive: true, force: true });
    }
  } catch {}

  return await generatePrismaClient();
}
