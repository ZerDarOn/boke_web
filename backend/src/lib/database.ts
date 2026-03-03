/**
 * Database Initialization Module
 * Automatically initializes database on first startup
 * Features:
 * - Async execution (non-blocking)
 * - Smart detection (only init when needed)
 * - Force reset option
 * - Backward compatible (only add missing tables/fields)
 */

import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';
import { Client } from 'pg';
import { spawn } from 'child_process';
import { promisify } from 'util';

const prisma = new PrismaClient();

/**
 * Run command asynchronously (non-blocking)
 */
async function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`   → Executing: ${command} ${args.join(' ')}`);

    const proc = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    let output = '';
    let errorOutput = '';

    // Capture stdout
    proc.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Log line by line
      text.split('\n').filter(line => line.trim()).forEach(line => {
        console.log(`   ${line}`);
      });
    });

    // Capture stderr
    proc.stderr?.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error(`   ${text}`);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`   → Command completed successfully`);
        resolve();
      } else {
        console.error(`   → Command failed with exit code ${code}`);
        reject(new Error(`Command failed with exit code ${code}\nError: ${errorOutput}`));
      }
    });

    proc.on('error', (err) => {
      console.error(`   → Command error:`, err);
      reject(err);
    });
  });
}

/**
 * Create database if it doesn't exist
 */
async function createDatabaseIfNotExists(): Promise<void> {
  try {
    // Parse DATABASE_URL to extract connection info
    const url = new URL(config.DATABASE_URL);
    const dbName = url.pathname.slice(1);
    const host = url.hostname;
    const port = url.port || '5432';
    const username = url.username;
    const password = url.password;

    console.log(`🔍 Checking if database "${dbName}" exists...`);

    // Connect to PostgreSQL (without specifying database)
    const client = new Client({
      host: host,
      port: parseInt(port),
      user: username,
      password: password,
      database: 'postgres', // Connect to default database
    });

    await client.connect();

    // Check if database exists
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );

    if (checkResult.rows.length === 0) {
      console.log(`📦 Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log('✅ Database created successfully.');
    } else {
      console.log('✅ Database already exists.');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Failed to create database:', error);
    throw error;
  }
}

/**
 * Check if database is already initialized
 */
async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // Check if users table has any records
    const userCount = await prisma.user.count();
    return userCount > 0;
  } catch (error) {
    // If table doesn't exist, database is not initialized
    return false;
  }
}

/**
 * Check if a specific table exists in the database
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `;
    return result[0]?.exists || false;
  } catch (error) {
    return false;
  }
}

/**
 * Check if schema needs sync (new tables missing)
 * Returns true if any required table is missing
 */
async function schemaNeedsSync(): Promise<boolean> {
  const requiredTables = [
    'users',
    'posts',
    'projects',
    'skills',
    'site_config',  // New table for SiteConfig feature
  ];
  
  for (const table of requiredTables) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`   ⚠️  Missing table: ${table}`);
      return true;
    }
  }
  return false;
}

/**
 * Generate Prisma Client after schema change
 */
async function generateClient(): Promise<void> {
  console.log('🔄 Generating Prisma Client...');
  try {
    await runCommand('npx', ['prisma', 'generate']);
    console.log('✅ Prisma Client generated successfully.');
  } catch (error) {
    console.error('❌ Prisma Client generation failed:', error);
    throw error;
  }
}

/**
 * Sync database schema (smart, non-blocking)
 * Prisma db push:
 * - Creates missing tables
 * - Adds missing columns
 * - Preserves existing data
 * - Backward compatible
 */
async function syncSchema(): Promise<void> {
  console.log('🔄 Syncing database schema (async)...');
  try {
    // Run Prisma db push (generate client to include new models)
    await runCommand('npx', ['prisma', 'db', 'push']);
    console.log('✅ Database schema synced successfully.');
    console.log('💡 Only missing tables/fields were created (existing data preserved).');
  } catch (error) {
    console.error('❌ Schema sync failed:', error);
    throw error;
  }
}

/**
 * Seed data
 */
async function runSeed(): Promise<void> {
  console.log('🌱 Seeding data...');
  try {
    // Import and run seed function
    const { main: seedMain } = await import('../../prisma/seed');
    await seedMain();
    console.log('✅ Seeding completed.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

/**
 * Seed site config using raw SQL (avoids Prisma client cache issues after schema change)
 */
async function seedSiteConfigRaw(): Promise<void> {
  console.log('🌱 Seeding site config (raw SQL)...');
  
  const configs = [
    { key: 'blogName', value: 'INK.SPIRIT' },
    { key: 'blogSubtitle', value: '数字编年史' },
    { key: 'authorName', value: 'CYBER.RONIN' },
    { key: 'authorTitle', value: 'Fullstack Alchemist' },
    { key: 'authorAvatar', value: '' },
    { key: 'authorBio', value: '在数字虚空中记录灵魂的回响' },
    { key: 'email', value: 'ronin@cyber.ink' },
    { key: 'github', value: 'github.com/cyber-ronin' },
    { key: 'twitter', value: 'twitter.com/cyber_ronin' },
    { key: 'bilibili', value: 'bilibili.com/user/123456' },
    { key: 'wechat', value: '' },
    { key: 'primaryColor', value: '#10b981' },
    { key: 'secondaryColor', value: '#8b5cf6' },
    { key: 'defaultTheme', value: 'dark' },
    { key: 'pageCopy', value: JSON.stringify({
      diaryTitle: 'DIARY.STREAM',
      diarySubtitle: 'Private Thoughts',
      diaryQuote: 'Writing is defragmentation of the soul.',
      diaryStartLabel: '记录开始',
      thoughtsTitle: 'THOUGHT STREAM',
      thoughtsLabel: 'MICRO-BLOG',
      thoughtsBgText: '念',
      footerQuote: 'The code flows like wind, invisible yet mighty.',
      announcementTitle: '公告',
      announcementContent: '本站采用 React & Cyber-Ink 驱动。最新主题 "VOID" 已上线，包含全新的夜间模式和水墨渲染引擎。',
      announcementLink: '/announcement',
      announcementLinkText: '了解更多',
      aboutContactTitle: '联系方式',
      aboutContactCopyTip: '点击卡片复制链接或访问',
    })},
    { key: 'heroBackgrounds', value: JSON.stringify([
      {
        id: 'ink',
        name: 'Ink Slash',
        enabled: true,
        contentZH: {
          tag: '数字编年史(2025)',
          titleStart: '以',
          titleHighlight: '代码',
          titleEnd: '书写',
          quote: '"在数字虚空中记录灵魂的回响。"'
        },
        contentEN: {
          tag: 'DIGITAL.CHRONICLES(2025)',
          titleStart: 'WRITTEN IN',
          titleHighlight: 'CODE',
          titleEnd: '',
          quote: '"Documenting the ghost in the shell, one line at a time."'
        }
      },
      {
        id: 'grid',
        name: 'Cyber Grid',
        enabled: true,
        contentZH: {
          tag: '系统重构中...',
          titleStart: '矩阵',
          titleHighlight: '重载',
          titleEnd: '',
          quote: '"系统即是现实，逻辑构建真理。"'
        },
        contentEN: {
          tag: 'SYSTEM.REFACTORING...',
          titleStart: 'MATRIX',
          titleHighlight: 'RELOADED',
          titleEnd: '',
          quote: '"The system is the reality. Logic builds truth."'
        }
      },
      {
        id: 'nebula',
        name: 'Void Nebula',
        enabled: true,
        contentZH: {
          tag: '星海漫游指南',
          titleStart: '凝视',
          titleHighlight: '深渊',
          titleEnd: '',
          quote: '"在数据洪流中寻找秩序的星光。"'
        },
        contentEN: {
          tag: 'GUIDE.TO.GALAXY',
          titleStart: 'VOID',
          titleHighlight: 'GAZING',
          titleEnd: '',
          quote: '"Staring into the abyss of data, finding order in chaos."'
        }
      }
    ])},
  ];

  let insertedCount = 0;
  for (const config of configs) {
    try {
      // Use INSERT ... ON CONFLICT DO NOTHING to skip duplicates
      await prisma.$executeRaw`
        INSERT INTO site_config (id, key, value, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${config.key}, ${config.value}, NOW(), NOW())
        ON CONFLICT (key) DO NOTHING
      `;
      insertedCount++;
    } catch (err) {
      console.log(`   ⚠️  Skipped ${config.key} (may already exist)`);
    }
  }
  
  console.log(`✅ Site config seeding completed (${insertedCount} entries).`);
}



/**
 * Initialize database with smart checking
 * Features:
 * - First-time setup (no tables)
 * - Schema migration (new tables added)
 * - Idempotent (safe to run multiple times)
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('\n🔍 Checking database status...\n');

    // Check if auto-initialization is enabled
    const shouldAutoInit = config.INIT_DB === 'true';
    const shouldReset = config.RESET_DB === 'true';

    if (!shouldAutoInit && config.NODE_ENV === 'production') {
      console.log('ℹ️  Database initialization skipped (production mode with INIT_DB=false)');
      console.log('💡 To enable auto-initialization, set INIT_DB=true in .env');
      return;
    }

    // Force reset mode - nukes everything
    if (shouldReset) {
      console.log('⚠️  RESET_DB=true - Forcing database rebuild...\n');
      await createDatabaseIfNotExists();
      await syncSchema();
      await generateClient();
      await runSeed();
      console.log('\n✨ Database force reset completed!\n');
      return;
    }

    // Check if database is already initialized (has user data)
    const isInitialized = await isDatabaseInitialized();
    
    // Check if schema needs sync (missing tables like site_config)
    const needsSchemaSync = await schemaNeedsSync();

    // Case 1: First-time initialization (no data, no tables)
    if (!isInitialized && needsSchemaSync) {
      console.log('⚠️  Database not initialized. Starting first-time setup...\n');

      await createDatabaseIfNotExists();
      await syncSchema();
      await generateClient();
      await runSeed();

      console.log('\n✨ Database initialization completed successfully!\n');
      console.log('💡 Next startup will skip full initialization.\n');
      return;
    }

    // Case 2: Has data but missing new tables (schema migration)
    if (isInitialized && needsSchemaSync) {
      console.log('🔄 Existing database detected but schema needs update...\n');

      await syncSchema();
      console.log('✅ Schema synced. New tables created.');

      // Seed site_config using raw SQL (avoids Prisma client cache issues)
      console.log('🌱 Seeding site config...');
      await seedSiteConfigRaw();

      console.log('\n✨ Database schema updated successfully!\n');
      return;
    }

    // Case 3: Fully initialized
    console.log('✅ Database already initialized and up to date.');
    console.log('💡 To reset database, set RESET_DB=true in .env or run: npm run db:reset');

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    console.error('💡 Please check your DATABASE_URL and try again.');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Force reset and reinitialize database
 * ⚠️  WARNING: This will delete all data!
 */
export async function resetDatabase(): Promise<void> {
  try {
    console.log('\n⚠️  WARNING: Resetting database...\n');

    // Force reset using Prisma
    await runCommand('npx', ['prisma', 'migrate', 'reset', '--force']);

    // Re-seed
    await runSeed();

    console.log('\n✨ Database reset completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Database reset failed:', error);
    throw error;
  }
}

/**
 * Check database connection and health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}
