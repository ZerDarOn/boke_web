import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPrismaData, parseMarkdown } from '../src/services/markdown.service';

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
