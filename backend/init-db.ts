#!/usr/bin/env tsx
/**
 * Standalone Database Initialization Script
 * Run manually: npm run db:init
 * 
 * Commands:
 *   npm run db:init         - Initialize/update database (safe, idempotent)
 *   npm run db:init reset   - Force reset all data
 *   npm run db:init health  - Check database connection
 *   npm run db:init schema  - Sync schema only (add missing tables)
 */

import { initializeDatabase, resetDatabase, checkDatabaseHealth } from './src/lib/database';
import { execSync } from 'child_process';

const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case 'health':
        console.log('🔍 Checking database health...\n');
        const isHealthy = await checkDatabaseHealth();
        console.log(isHealthy ? '✅ Database is healthy!' : '❌ Database is not healthy!');
        break;

      case 'reset':
        console.log('⚠️  WARNING: This will DELETE ALL DATA!\n');
        await resetDatabase();
        break;

      case 'schema':
        console.log('🔄 Syncing database schema only...\n');
        execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
        console.log('\n✅ Schema synced!');
        console.log('💡 Run "npm run db:seed" to seed data if needed.');
        break;

      case 'seed':
        console.log('🌱 Seeding data...\n');
        execSync('npx prisma db seed', { stdio: 'inherit' });
        break;

      default:
        await initializeDatabase();
    }
  } catch (error) {
    console.error('\n❌ Database operation failed:', error);
    process.exit(1);
  }
}

main();
