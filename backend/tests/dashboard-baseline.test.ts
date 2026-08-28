import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readSource = (...parts: string[]) => fs.readFileSync(path.join(...parts), 'utf8');

test('dashboard tracking accepts only UUID visitor identifiers and applies a dedicated limit', () => {
  const source = readSource('src', 'routes', 'dashboard.ts');
  assert.match(source, /z\.object\(\{ visitorId: z\.string\(\)\.uuid\(\) \}\)/);
  assert.match(source, /createRateLimit\(\{ windowMs: 60_000, max: 120/);
});

test('admin dashboard overview remains protected', () => {
  const source = readSource('src', 'routes', 'dashboard.ts');
  assert.match(source, /router\.get\('\/admin-overview', authenticate, requireAdmin/);
});

test('content operations is restricted to administrators and does not expose a public scan endpoint', () => {
  const source = readSource('src', 'routes', 'dashboard.ts');
  assert.match(source, /router\.get\('\/content-operations', authenticate, requireAdmin, DashboardController\.getContentOperations\)/);
  assert.match(source, /router\.post\('\/content-operations\/:type\/:id\/suggestions', authenticate, requireAdmin, validate\(contentOperationsTargetSchema\), DashboardController\.getContentSuggestions\)/);
  assert.match(source, /router\.post\('\/content-operations\/:type\/:id\/apply', authenticate, requireAdmin, validate\(contentOperationsTargetSchema\), validateBody\(contentOperationsApplySchema\), DashboardController\.applyContentSuggestions\)/);
});

test('content operations only scans editable public-facing fields and produces a bounded checklist', () => {
  const source = readSource('src', 'services', 'dashboard.service.ts');
  assert.match(source, /static async getContentOperations\(\)/);
  assert.match(source, /where: \{ isPublished: true, accessLevel: 'PUBLIC' \}/);
  assert.match(source, /where: \{ isHidden: false \}/);
  assert.match(source, /CONTENT_OPERATIONS_MAX_ITEMS/);
  assert.match(source, /Content operations scan completed/);
  assert.match(source, /static async getContentSuggestions\(type: ContentOperationType, id: string\)/);
  assert.match(source, /static async applyContentSuggestions\(/);
  assert.match(source, /PostService\.update\(id, update\)/);
});

test('visit tracking hashes identifiers and only increments daily uniques once', () => {
  const source = readSource('src', 'services', 'dashboard.service.ts');
  assert.match(source, /createHash\('sha256'\)\.update\(visitorId\)\.digest\('hex'\)/);
  assert.match(source, /tx\.dailyVisit\.create/);
  assert.match(source, /uniqueVisitors: isNewVisitor \? 1 : 0/);
});

test('public statistics do not fabricate traffic fallbacks', () => {
  const source = readSource('src', 'services', 'dashboard.service.ts');
  assert.match(source, /const totalRequests = siteStatsAgg\._sum\.pageViews \?\? 0/);
  assert.match(source, /const uniqueVisitors = siteStatsAgg\._sum\.uniqueVisitors \?\? 0/);
  assert.doesNotMatch(source, /84100|24\.5K|1,247/);
});

test('anonymous behavior events only accept an allowlisted event type and bounded site paths', () => {
  const source = readSource('src', 'routes', 'dashboard.ts');
  assert.match(source, /eventType: z\.enum\(\['page_view', 'content_click', 'site_search'\]\)/);
  assert.match(source, /path: z\.string\(\)\.startsWith\('\/'\)\.max\(240\)/);
  assert.match(source, /router\.post\('\/events', trackingRateLimit, validateBody\(eventSchema\), DashboardController\.trackEvent\)/);
});

test('behavior tracking stores only a hashed anonymous identifier', () => {
  const source = readSource('src', 'services', 'dashboard.service.ts');
  assert.match(source, /recordBehaviorEvent\(visitorId: string, event:/);
  assert.match(source, /createHash\('sha256'\)\.update\(visitorId\)\.digest\('hex'\)/);
  assert.doesNotMatch(source, /ipAddress|userAgent/);
});
