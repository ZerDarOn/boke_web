import assert from 'node:assert/strict';
import test from 'node:test';
import { boundedLevel, rankLabel, radialLayout, skillLink } from './skillAtlas';

test('normalizes stored ranks and bounded levels without inventing experience', () => {
  assert.equal(rankLabel('Expert'), '高级');
  assert.equal(rankLabel('NOVICE'), '初级');
  assert.equal(rankLabel('自定义'), '自定义');
  assert.equal(boundedLevel(140), 100);
  assert.equal(boundedLevel(-8), 0);
  assert.equal(boundedLevel(Number.NaN), 0);
});
test('radial layout supports empty, single and many nodes within canvas', () => {
  for (const count of [0, 1, 9, 65, 180]) {
    const layout = radialLayout(count);
    assert.equal(layout.nodes.length, count);
    for (const point of layout.nodes) {
      assert(point.x >= 50 && point.x <= layout.size - 50);
      assert(point.y >= 50 && point.y <= layout.size - 50);
    }
  }
});
test('allows safe configured links, rejects executable and protocol-relative URLs', () => {
  assert.equal(skillLink('/projects/demo'), '/projects/demo');
  assert.equal(skillLink('https://example.com'), 'https://example.com/');
  for (const value of ['javascript:alert(1)', 'data:text/html,x', '//evil.test', '/\\evil.test']) assert.equal(skillLink(value), null);
});
