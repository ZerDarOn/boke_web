#!/usr/bin/env tsx
/**
 * Standalone Database Initialization Script
 * Run manually: npm run db:init
 */

import { initializeDatabase, resetDatabase, checkDatabaseHealth } from './src/lib/database';

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

      default:
        await initializeDatabase();
    }
  } catch (error) {
    console.error('\n❌ Database operation failed:', error);
    process.exit(1);
  }
}

main();
