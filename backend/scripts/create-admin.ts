/**
 * 创建管理员账号脚本
 *
 * 用于干净起步（seedClean 不创建任何用户）时，安全地创建第一个 ADMIN 账号，
 * 不引入任何示例数据。
 *
 * 用法：
 *   交互式：  npx tsx scripts/create-admin.ts
 *   参数式：  npx tsx scripts/create-admin.ts <username> <email> <password> [displayName]
 *   npm：     npm run create:admin
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';
import { PrismaClient } from '@prisma/client';
import { validatePassword } from '../src/lib/password-validator';

const prisma = new PrismaClient();

function ask(question: string, { hidden = false } = {}): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    if (hidden) {
      // 隐藏密码输入
      const stdout = process.stdout as any;
      const onData = (char: Buffer) => {
        const s = char.toString();
        if (s === '\n' || s === '\r' || s === '') {
          (process.stdin as any).removeListener('data', onData);
        } else {
          stdout.clearLine?.(0);
          stdout.cursorTo?.(0);
          stdout.write(question);
        }
      };
      process.stdin.on('data', onData);
    }
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const [, , argUsername, argEmail, argPassword, argDisplayName] = process.argv;

  const username = argUsername || (await ask('用户名: '));
  const email = argEmail || (await ask('邮箱: '));
  const password = argPassword || (await ask('密码: ', { hidden: true }));
  const displayName = argDisplayName || username;

  if (!username || !email || !password) {
    console.error('❌ 用户名、邮箱、密码均不能为空');
    process.exit(1);
  }

  // 密码强度校验（与注册接口一致）
  const pwd = validatePassword(password);
  if (!pwd.isValid) {
    console.error(`❌ 密码强度不足：${pwd.errors.join('，')}`);
    process.exit(1);
  }

  // 检查冲突
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    console.error('❌ 用户名或邮箱已被占用');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      displayName,
      role: 'ADMIN',
    },
    select: { id: true, username: true, email: true, role: true },
  });

  console.log('\n✅ 管理员账号已创建：');
  console.log(`   用户名: ${user.username}`);
  console.log(`   邮箱:   ${user.email}`);
  console.log(`   角色:   ${user.role}`);
  console.log('\n🚀 现在可以到 /admin/login 登录并开始填充内容了。\n');
}

main()
  .catch((err) => {
    console.error('❌ 创建失败:', err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
