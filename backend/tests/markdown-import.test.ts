import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPrismaData, parseMarkdown } from '../src/services/markdown.service';
import { createMarkdownDocument, formatTimelineExportDate } from '../src/services/export.service';

test('maps post Markdown to the fields accepted by the Post model', async () => {
  const parsed = await parseMarkdown(`---
id: design-principles
title: 设计原则与实践
slug: design-principles
date: 2026-03-03
published: true
accessLevel: PUBLIC
category: DESIGN
tags: [UI设计, UX]
readingTime: 5 min
---

# 正文`);

  const data = buildPrismaData(parsed);

  assert.equal(data.id, 'design-principles');
  assert.equal(data.slug, 'design-principles');
  assert.equal(data.readingTime, '5 min');
  assert.equal(data.isPublished, true);
  assert.equal(data.content.trim(), '# 正文');
  assert.equal('lastUpdated' in data, false);
  assert.equal('html' in data, false);
});

test('infers anime when legacy front matter reuses type for the media format', async () => {
  const parsed = await parseMarkdown(`---
id: spirited-away
title: Spirited Away
date: 2026-03-01
type: Movie
episodes: 1
studios: [Studio Ghibli]
genres: [Animation]
cover: https://example.com/cover.jpg
---

一部动画电影。`);

  const data = buildPrismaData(parsed);

  assert.equal(parsed.type, 'anime');
  assert.equal(data.type, 'Movie');
  assert.equal(data.synopsis.trim(), '一部动画电影。');
  assert.deepEqual(data.studios, ['Studio Ghibli']);
});

test('maps long-form diary Markdown without leaking generic importer fields', async () => {
  const parsed = await parseMarkdown(`---
id: weekend-trip
title: 周末小旅行
date: 2026-03-04
mood: 😊
weather: ☀️
diaryType: LONG
tags: [生活]
---

今天去旅行。`);

  const data = buildPrismaData(parsed);

  assert.equal(parsed.type, 'diary');
  assert.equal(data.type, 'LONG');
  assert.equal(data.longContent.trim(), '今天去旅行。');
  assert.equal('slug' in data, false);
});

test('restores numeric anime fields from legacy backups that quoted every scalar', async () => {
  const parsed = await parseMarkdown(`---
id: legacy-anime
title: Legacy Anime
date: "2026-03-01T00:00:00.000Z"
type: "anime"
episodes: "24"
currentEp: "12"
score: "8.5"
cover: "https://example.com/cover.jpg"
---

简介`);

  const data = buildPrismaData(parsed);

  assert.equal(data.episodes, 24);
  assert.equal(data.currentEp, 12);
  assert.equal(data.score, 8.5);
});

test('restores timeline dates duplicated by legacy exports', async () => {
  const parsed = await parseMarkdown(`---
id: legacy-timeline
title: API 完成
date: "2024-2024-03"
type: "timeline"
category: "MILESTONE"
---

完成后端 API。`);

  const data = buildPrismaData(parsed);

  assert.equal(parsed.date, '2024-03-01T00:00:00.000Z');
  assert.equal(data.year, '2024');
  assert.equal(data.date, '03.01');
});

test('writes numeric front matter as YAML numbers for new backups', async () => {
  const markdown = createMarkdownDocument({
    id: 'roundtrip-anime',
    title: 'Roundtrip Anime',
    date: '2026-03-01T00:00:00.000Z',
    type: 'anime',
    episodes: 24,
    currentEp: 12,
    score: 8.5,
    cover: 'https://example.com/cover.jpg',
  }, '简介');

  const data = buildPrismaData(await parseMarkdown(markdown));

  assert.equal(data.episodes, 24);
  assert.equal(data.currentEp, 12);
  assert.equal(data.score, 8.5);
});

test('formats both supported timeline date shapes as importable ISO dates', () => {
  assert.equal(formatTimelineExportDate('2024', '03.20'), '2024-03-20');
  assert.equal(formatTimelineExportDate('2024', '2024-03'), '2024-03-01');
});
