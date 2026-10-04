import test from 'node:test';
import assert from 'node:assert/strict';
import { distribution, FrameProfile } from '../lib/game/profile.ts';
test('frame distribution reports the tail rather than averaging FPS reciprocals', () => {
  const profiler = new FrameProfile();
  profiler.frames = [...Array(99).fill(10), 100];
  const summary = profiler.summary();
  assert.equal(summary.frames?.mean, 10.9);
  assert.equal(summary.frames?.p99, 10);
  assert.equal(summary.frames?.max, 100);
  assert.equal(summary.onePercentLowFps, 10);
  assert.equal(summary.averageFps, 1000 / 10.9);
  assert.equal(distribution([]), null);
});
