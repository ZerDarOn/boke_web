import assert from 'node:assert/strict';
import test from 'node:test';
import { isMusicTrackCurations } from '../src/lib/music-track-curations';

test('accepts bounded music track curations', () => {
  assert.equal(isMusicTrackCurations([{
    trackKey: 'netease:playlist:1:track:artist',
    sourceKey: 'netease:playlist:1',
    pinned: true,
    category: '夜晚',
    note: '适合写字',
    order: 1,
  }]), true);
});

test('rejects malformed or oversized music track curations', () => {
  assert.equal(isMusicTrackCurations([{ trackKey: '', sourceKey: 'source' }]), false);
  assert.equal(isMusicTrackCurations(Array.from({ length: 1001 }, () => ({ trackKey: 'track', sourceKey: 'source' }))), false);
});
