import assert from 'node:assert/strict';
import test from 'node:test';
import { animeSchema, gameSchema } from '../src/schemas';

const validHighlight = {
  title: '最终战',
  url: 'https://www.bilibili.com/video/BV1xx411c7mD',
  thumbnail: 'https://example.com/thumb.jpg',
  description: '最值得重看的十分钟。',
};

test('accepts structured highlights on anime and games', () => {
  const anime = animeSchema.safeParse({
    title: '测试番剧',
    cover: 'https://example.com/cover.jpg',
    episodes: 12,
    highlights: [validHighlight],
  });
  const game = gameSchema.safeParse({
    title: '测试游戏',
    cover: 'https://example.com/cover.jpg',
    highlights: [validHighlight],
  });

  assert.equal(anime.success, true);
  assert.equal(game.success, true);
});

test('rejects unsafe or excessive highlights', () => {
  const unsafe = animeSchema.safeParse({
    title: '测试番剧',
    cover: 'https://example.com/cover.jpg',
    episodes: 12,
    highlights: [{ ...validHighlight, url: 'javascript:alert(1)' }],
  });
  const excessive = gameSchema.safeParse({
    title: '测试游戏',
    cover: 'https://example.com/cover.jpg',
    highlights: Array.from({ length: 9 }, (_, index) => ({ ...validHighlight, title: `片段 ${index}` })),
  });

  assert.equal(unsafe.success, false);
  assert.equal(excessive.success, false);
});
