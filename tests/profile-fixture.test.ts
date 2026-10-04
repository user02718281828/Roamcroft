import test from 'node:test';
import assert from 'node:assert/strict';
import { profileFixture } from '../lib/game/profile-fixture.ts';
import { serialize, deserialize } from '../lib/game/save.ts';
import { Engine } from '../lib/game/model.ts';

test('profiling worlds remain loadable after simulation and streaming', () => {
  for (const dense of [false, true]) {
    const state = profileFixture(dense),
      engine = new Engine(state);
    for (let i = 0; i < 300; i++) engine.tick(0.05);
    state.player.z = 44;
    engine.streamWorld();
    const restored = deserialize(serialize(state));
    assert.equal(restored.day, 4);
    assert.equal(restored.animals.length, dense ? 72 : 0);
    assert.equal(restored.player.z, 44);
  }
});
