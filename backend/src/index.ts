// Pre-start: Ensure Prisma Client exists before loading any modules
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const prismaClientPath = join(__dirname, '../node_modules/.prisma/client/index.js');

if (!existsSync(prismaClientPath)) {
  console.log('🔄 Prisma Client not found. Generating...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit', cwd: join(__dirname, '..') });
    console.log('✅ Prisma Client generated.\n');
  } catch (error) {
    console.error('❌ Failed to generate Prisma Client');
    process.exit(1);
  }
}

// Now safely load modules that depend on Prisma Client
async function main() {
  // Dynamic imports to avoid loading Prisma-dependent modules before generation
  const [{ default: app }, { config }, { initializeDatabase }] = await Promise.all([
    import('./app'),
    import('./config/env'),
    import('./lib/database')
  ]);

  const PORT = config.PORT || 3001;

  try {
    // Initialize database on startup
    await initializeDatabase();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`
🚀 INK.SPIRIT Backend Server
═════════════════════════════════════
📡 Server running on port: ${PORT}
🌐 Environment: ${config.NODE_ENV}
📊 API Health: http://localhost:${PORT}/api/health
🔐 Admin Panel: http://localhost:3000/admin/login
═════════════════════════════════════
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
