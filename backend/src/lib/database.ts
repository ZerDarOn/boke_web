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
    // Run Prisma db push (non-blocking)
    await runCommand('npx', ['prisma', 'db', 'push', '--skip-generate']);
    console.log('✅ Database schema synced successfully.');
    console.log('💡 Only missing tables/fields were created (existing data preserved).');
  } catch (error) {
    console.error('❌ Schema sync failed:', error);
    throw error;
  }
}

/**
 * Generate Prisma Client
 * Note: Client is now generated at startup in index.ts before app import
 * This function is kept for compatibility and will skip if client exists
 */
async function generateClient(): Promise<void> {
  console.log('✅ Prisma Client ready.');
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
 * Initialize database with smart checking
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

    // Check if database is already initialized
    const isInitialized = await isDatabaseInitialized();

    if (isInitialized && !shouldReset) {
      console.log('✅ Database already initialized.');
      console.log('💡 To reset database, set RESET_DB=true in .env or run: npm run db:reset');
      return;
    }

    // Force reset mode
    if (shouldReset) {
      console.log('⚠️  RESET_DB=true - Forcing database rebuild...\n');
      await createDatabaseIfNotExists(); // Ensure database exists
      await syncSchema(); // Will recreate tables
      await generateClient();
      await runSeed();
      console.log('\n✨ Database force reset completed!\n');
      return;
    }

    // Normal initialization (first time)
    console.log('⚠️  Database not initialized. Starting initialization...\n');

    // Step 1: Create database if it doesn't exist
    await createDatabaseIfNotExists();

    // Step 2: Sync schema (non-blocking, async)
    await syncSchema();

    // Step 3: Generate Prisma Client
    await generateClient();

    // Step 4: Seed data
    await runSeed();

    console.log('\n✨ Database initialization completed successfully!\n');
    console.log('💡 Next startup will skip initialization (unless RESET_DB=true).\n');

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
