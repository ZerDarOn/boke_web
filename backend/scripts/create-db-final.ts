import { Client } from 'pg';

async function createDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123456',
    database: 'postgres'
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
  } finally {
    await client.end();
  }
}

createDatabase();
