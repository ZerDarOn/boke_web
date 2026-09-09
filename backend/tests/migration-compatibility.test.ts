import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import dotenv from 'dotenv';
import { Client } from 'pg';

const backendRoot = path.resolve(__dirname, '..');
const migrationsRoot = path.join(backendRoot, 'prisma', 'migrations');
const prismaCliPath = require.resolve('prisma/build/index.js');
const schemaNamePattern = /^migration_compat_[a-z0-9_]+$/;

dotenv.config({ path: path.join(backendRoot, '.env') });

function readMigration(name: string): string {
  return fs.readFileSync(path.join(migrationsRoot, name, 'migration.sql'), 'utf8').replace(/^\uFEFF/, '');
}

function databaseUrlForSchema(databaseUrl: string, schemaName: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set('schema', schemaName);
  return url.toString();
}

function runPrisma(args: string[], databaseUrl: string): string {
  return execFileSync(process.execPath, [prismaCliPath, ...args], {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('migrate deploy preserves media highlights from a legacy db-push schema', { timeout: 120_000 }, async (t) => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    t.skip('DATABASE_URL is required for the isolated PostgreSQL migration test');
    return;
  }

  const schemaName = `migration_compat_${process.pid}_${Date.now()}`;
  assert.match(schemaName, schemaNamePattern);

  const isolatedDatabaseUrl = databaseUrlForSchema(databaseUrl, schemaName);
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(`CREATE SCHEMA "${schemaName}"`);
    await client.query(`SET search_path TO "${schemaName}"`);
    await client.query(readMigration('0_init'));

    runPrisma(['migrate', 'resolve', '--applied', '0_init'], isolatedDatabaseUrl);

    await client.query(readMigration('20260821150000_create_games'));
    await client.query('ALTER TABLE "anime" ADD COLUMN "highlights" JSONB');
    await client.query('ALTER TABLE "games" ADD COLUMN "highlights" JSONB');

    const animeHighlights = { quote: 'legacy anime highlight' };
    const gameHighlights = { moment: 'legacy game highlight' };

    await client.query(
      `INSERT INTO "anime" (
        "id", "title", "cover", "episodes", "studios", "genres", "tags", "updatedAt", "highlights"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8::jsonb)`,
      ['legacy-anime', 'Legacy Anime', '/anime.jpg', 12, [], [], [], JSON.stringify(animeHighlights)],
    );
    await client.query(
      `INSERT INTO "games" (
        "id", "title", "cover", "screenshots", "genres", "tags",
        "relatedPostIds", "relatedProjectIds", "relatedDiaryIds", "updatedAt", "highlights"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10::jsonb)`,
      ['legacy-game', 'Legacy Game', '/game.jpg', [], [], [], [], [], [], JSON.stringify(gameHighlights)],
    );

    runPrisma(['migrate', 'deploy'], isolatedDatabaseUrl);

    const preserved = await client.query<{
      anime_highlights: unknown;
      game_highlights: unknown;
    }>(`
      SELECT
        (SELECT "highlights" FROM "anime" WHERE "id" = 'legacy-anime') AS anime_highlights,
        (SELECT "highlights" FROM "games" WHERE "id" = 'legacy-game') AS game_highlights
    `);
    assert.deepEqual(preserved.rows[0]?.anime_highlights, animeHighlights);
    assert.deepEqual(preserved.rows[0]?.game_highlights, gameHighlights);

    const backupColumns = await client.query<{ count: string }>(`
      SELECT COUNT(*)::text AS count
      FROM information_schema.columns
      WHERE table_schema = $1
        AND column_name = '__legacy_db_push_highlights'
    `, [schemaName]);
    assert.equal(backupColumns.rows[0]?.count, '0');

    assert.match(runPrisma(['migrate', 'status'], isolatedDatabaseUrl), /Database schema is up to date/);
  } finally {
    await client.query('SET search_path TO public');
    if (schemaNamePattern.test(schemaName)) {
      await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    }
    await client.end();
  }
});
