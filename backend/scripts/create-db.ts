import { Client } from 'pg';

async function createDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres', // 尝试默认密码
    database: 'postgres' // 连接到默认的 postgres 数据库
  });

  try {
    await client.connect();
    console.log('✅ 连接到 PostgreSQL 成功');

    // 检查数据库是否存在
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'ink_spirit'"
    );

    if (checkResult.rows.length === 0) {
      console.log('📝 数据库 ink_spirit 不存在，正在创建...');

      // 创建数据库
      await client.query('CREATE DATABASE ink_spirit');
      console.log('✅ 数据库 ink_spirit 创建成功');
    } else {
      console.log('✅ 数据库 ink_spirit 已存在');
    }
  } catch (error: any) {
    console.error('❌ 数据库操作失败:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 提示：密码认证失败');
      console.log('请检查以下内容：');
      console.log('1. PostgreSQL 的 postgres 用户密码是否为 "postgres"？');
      console.log('2. 如果不是，请修改 backend/.env 文件中的 DATABASE_URL');
      console.log('   格式：postgresql://postgres:<你的密码>@localhost:5432/ink_spirit');
    }
  } finally {
    await client.end();
  }
}

createDatabase();
