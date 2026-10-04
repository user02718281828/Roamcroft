import test from 'node:test';
import assert from 'node:assert/strict';
import { LinkMetrics } from '../lib/coop/realtime-protocol.ts';
import { AnimalPresentation } from '../lib/game/animal-presentation.ts';

test('steady snapshot arrivals need no extra buffer for a high fixed RTT', () => {
  for (const rtt of [50, 100, 300, 700]) {
    const link = new LinkMetrics();
    link.sampleRtt(rtt);
    for (let i = 0; i < 100; i++) link.snapshot(i * 2, i * 100 + rtt / 2);
    assert.equal(link.buffer, 120);
    assert.equal(link.arrivalJitter, 0);
    assert.equal(link.rtt, rtt, 'RTT stays distinct from render delay');
  }
});
test('arrival jitter increases buffering and old disruptions age out', () => {
  const link = new LinkMetrics();
  for (let i = 0; i < 100; i++) link.snapshot(i * 2, i * 100);
  for (let i = 100; i < 140; i++)
    link.snapshot(i * 2, i * 100 + (i % 2 ? 80 : 0));
  assert.ok(link.buffer >= 250);
  assert.equal(link.arrivalJitter, 80);
  const before = link.buffer;
  assert.equal(link.snapshot(276, 14100), false);
  assert.equal(link.buffer, before);
  link.snapshot(300, 15000);
  assert.ok(link.recentLoss > 0);
  for (let i = 151; i < 270; i++) link.snapshot(i * 2, i * 100);
  assert.equal(link.buffer, 120);
  assert.equal(link.recentLoss, 0);
  assert.ok(link.gaps > 0);
});
test('animal presentation smooths half-second snapshots without changing authority', () => {
  for (const hz of [30, 60, 144]) {
    const target = { x: 10, z: 10 },
      view = new AnimalPresentation(target),
      dt = 1 / hz;
    let maxStep = 0;
    for (let i = 0; i < hz * 5; i++) {
      if (i % Math.round(hz / 2) === 0) target.x += 0.4;
      const x = view.x;
      view.sample(target, dt, false);
      maxStep = Math.max(maxStep, Math.abs(view.x - x));
      assert.ok(view.x <= target.x, 'must not extrapolate past authority');
    }
    assert.ok(maxStep <= 3 / hz + 1e-9);
    const destination = { ...target };
    for (let i = 0; i < hz * 2; i++) view.sample(target, dt, false);
    assert.ok(Math.abs(view.x - target.x) < 0.001);
    assert.equal(view.moving, false);
    assert.deepEqual(target, destination);
    const x = view.x;
    target.x += 20;
    view.sample(target, 5, true);
    assert.ok(view.x - x <= 0.3000001, 'resume/crash update must not teleport');
  }
});
