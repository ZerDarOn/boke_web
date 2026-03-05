#!/usr/bin/env tsx
/**
 * 添加文章访问控制字段
 * 直接执行 SQL 来添加 accessLevel 和 password 字段
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 加载环境变量
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addAccessLevelFields() {
  console.log('🔄 开始添加文章访问控制字段...\n');

  try {
    // 1. 创建枚举类型
    console.log('📦 创建 AccessLevel 枚举类型...');
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "AccessLevel" AS ENUM ('PUBLIC', 'PRIVATE', 'PASSWORD');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('   ✅ 枚举类型已就绪\n');

    // 2. 添加 accessLevel 字段
    console.log('📦 添加 accessLevel 字段...');
    await pool.query(`
      ALTER TABLE "posts" 
      ADD COLUMN IF NOT EXISTS "accessLevel" "AccessLevel" NOT NULL DEFAULT 'PUBLIC';
    `);
    console.log('   ✅ accessLevel 字段已添加\n');

    // 3. 添加 password 字段
    console.log('📦 添加 password 字段...');
    await pool.query(`
      ALTER TABLE "posts" 
      ADD COLUMN IF NOT EXISTS "password" TEXT;
    `);
    console.log('   ✅ password 字段已添加\n');

    // 4. 创建索引
    console.log('📦 创建索引...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "posts_accessLevel_idx" ON "posts"("accessLevel");
    `);
    console.log('   ✅ 索引已创建\n');

    // 5. 验证
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'posts' 
      AND column_name IN ('accessLevel', 'password');
    `);
    
    console.log('🔍 验证结果:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✅ 数据库字段添加完成！');
    console.log('⚠️  请重启后端服务以加载新的 Prisma Client');

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addAccessLevelFields().catch(console.error);
