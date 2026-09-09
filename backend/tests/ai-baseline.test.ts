import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('recommendation route preserves post and user parameter order', () => {
  const source = fs.readFileSync(path.join('src', 'routes', 'ai.ts'), 'utf8');
  assert.match(source, /recommendPosts\(post_id,\s*user_id,\s*limit\)/);
});

test('knowledge indexing reads the mapped public posts table', () => {
  const source = fs.readFileSync(
    path.join('..', 'ai-service', 'app', 'services', 'knowledge_base.py'),
    'utf8'
  );
  assert.match(source, /FROM posts[\s\S]*WHERE \\"isPublished\\" = true AND \\"accessLevel\\" = 'PUBLIC'/);
  assert.doesNotMatch(source, /FROM "Post"/);
});

test('knowledge indexing activates a completed collection and retains the rollback version', () => {
  const source = fs.readFileSync(
    path.join('..', 'ai-service', 'app', 'services', 'knowledge_base.py'),
    'utf8'
  );
  const buildPosition = source.indexOf('staging_collection.add,');
  const activatePosition = source.indexOf('_write_active_collection_name(staging_name)');

  assert.ok(buildPosition >= 0);
  assert.ok(activatePosition > buildPosition);
  assert.doesNotMatch(source, /delete_collection\(name=previous_name\)/);
});

test('post mutations notify indexing only after the database mutation succeeds', () => {
  const source = fs.readFileSync(path.join('src', 'services', 'post.service.ts'), 'utf8');

  assert.match(source, /const post = await prisma\.post\.create\([\s\S]*notifyPostIndex\(post\.id\);[\s\S]*return post;/);
  assert.match(source, /const post = await prisma\.post\.update\([\s\S]*notifyPostIndex\(post\.id\);[\s\S]*return post;/);
  assert.match(source, /const post = await prisma\.post\.delete\([\s\S]*notifyPostIndexRemoval\(post\.id\);[\s\S]*return post;/);
});

test('index maintenance routes remain admin-only', () => {
  const source = fs.readFileSync(path.join('src', 'routes', 'ai.ts'), 'utf8');

  assert.match(source, /router\.get\('\/index\/status', authenticate, requireAdmin/);
  assert.match(source, /router\.get\('\/grounding\/status', authenticate, requireAdmin/);
  assert.match(source, /router\.post\('\/index\/reconcile', authenticate, requireAdmin/);
  assert.match(source, /router\.post\('\/index\/rebuild', authenticate, requireAdmin/);
});

test('companion chat validates and forwards bounded page context', () => {
  const routeSource = fs.readFileSync(path.join('src', 'routes', 'ai.ts'), 'utf8');
  const clientSource = fs.readFileSync(path.join('src', 'services', 'ai.client.ts'), 'utf8');

  assert.match(routeSource, /isValidCompanionContext\(context\)/);
  assert.match(routeSource, /'music', 'divination'/);
  assert.match(routeSource, /aiClient\.chat\(message\.trim\(\), history, context\)/);
  assert.match(clientSource, /\{ message, history, context \}/);
});

test('companion streaming serializes grounded source dictionaries safely', () => {
  const source = fs.readFileSync(
    path.join('..', 'ai-service', 'app', 'api', 'v1', '__init__.py'),
    'utf8'
  );

  assert.match(source, /def _serialize_chat_sources/);
  assert.match(source, /source\["citation"\]/);
  assert.doesNotMatch(source, /\bs\.citation\b/);
});

test('companion sends only previous messages as history and falls back from stream failure', () => {
  const source = fs.readFileSync(
    path.join('..', 'frontend', 'src', 'components', 'AiCompanion.tsx'),
    'utf8'
  );

  assert.match(source, /messages\.slice\(-8\)/);
  assert.doesNotMatch(source, /next\.slice\(-8\)/);
  assert.match(source, /aiApi\.chat\(text, history, pageContext\)/);
});

test('all public AI generation routes share a dedicated production-strict rate limit', () => {
  const routeSource = fs.readFileSync(path.join('src', 'routes', 'ai.ts'), 'utf8');
  const rateLimitSource = fs.readFileSync(
    path.join('src', 'middleware', 'rate-limit.middleware.ts'),
    'utf8'
  );

  assert.match(routeSource, /router\.post\('\/chat', publicAiGenerationRateLimit, optionalAuth/);
  assert.match(routeSource, /router\.post\('\/divination', publicAiGenerationRateLimit, optionalAuth/);
  assert.match(routeSource, /router\.post\('\/chat\/stream', publicAiGenerationRateLimit, optionalAuth/);
  assert.match(rateLimitSource, /export const publicAiGenerationRateLimit = rateLimit\(/);
  assert.match(rateLimitSource, /windowMs:\s*15 \* 60 \* 1000/);
  assert.match(rateLimitSource, /max:\s*process\.env\.NODE_ENV === 'development' \? 120 : 12/);
});
