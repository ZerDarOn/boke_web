import { Client } from 'pg';

async function testConnection(password: string): Promise<boolean> {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres'
  });

  try {
    await client.connect();
    await client.end();
    return true;
  } catch (error) {
    return false;
  }
}

async function findCorrectPassword() {
  const commonPasswords = [
    'postgres',
    '123456',
    'password',
    'admin',
    '',
    'root',
    '12345678',
    '1234',
    'qwerty'
  ];

  console.log('🔍 尝试常见密码...\n');

  for (const pwd of commonPasswords) {
    const displayPwd = pwd === '' ? '(空密码)' : pwd;
    process.stdout.write(`尝试密码: ${displayPwd}... `);

    const success = await testConnection(pwd);

    if (success) {
      console.log('✅ 成功！\n');
      console.log(`正确密码是: ${displayPwd}`);
      console.log('\n请更新 backend/.env 文件中的 DATABASE_URL:');
      console.log(`DATABASE_URL=postgresql://postgres:${pwd}@localhost:5432/ink_spirit`);
      return pwd;
    } else {
      console.log('❌ 失败');
    }
  }

  console.log('\n❌ 没有找到正确的密码');
  console.log('\n💡 建议：');
  console.log('1. 检查 PostgreSQL 安装时的配置');
  console.log('2. 查看 pg_hba.conf 文件');
  console.log('3. 尝试使用 pgAdmin 工具连接数据库');
  return null;
}

findCorrectPassword();
