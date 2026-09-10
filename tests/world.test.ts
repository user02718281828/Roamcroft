import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { Engine, createState, tileAt, walkable } from '../lib/game/model.ts';
import {
  shiftWindow,
  generatedTile,
  tileIndex,
  tileKey,
} from '../lib/game/world.ts';
import { serialize, deserialize } from '../lib/game/save.ts';
import { saveStored, loadStored } from '../lib/game/storage.ts';

test('streaming crosses all former boundaries and only retains 3600 active tiles', () => {
  const e = new Engine(createState());
  for (const [x, z] of [
    [-500, -900],
    [500, 900],
    [-900, 500],
    [900, -500],
    [15000, -15000],
  ]) {
    shiftWindow(e.s, x, z);
    const t = tileAt(e.s, x, z)!;
    t.resource = null;
    t.terrain = 'grass';
    t.height = 0;
    Object.assign(e.s.player, { x, z });
    assert.equal(e.s.tiles.length, 3600);
    assert.equal(t.x, x);
    assert.equal(t.z, z);
    assert.ok(tileIndex(e.s, x, z) >= 0);
    assert.deepEqual(deserialize(serialize(e.s)), e.s);
  }
});
test('harvested resources and buildings survive unloading, saving and returning', () => {
  const e = new Engine(createState());
  shiftWindow(e.s, -90, -90);
  Object.assign(e.s.player, { x: -90, z: -90 });
  const t = tileAt(e.s, -90, -90)!;
  t.resource = null;
  const site = tileAt(e.s, -88, -90)!;
  site.resource = null;
  assert.equal(e.build('campfire', site.x, site.z), true);
  const ore = e.s.tiles.find((t) => t.resource === 'stone')!;
  ore.resource = null;
  ore.amount = 0;
  ore.respawn = e.s.day + 3;
  const position = { x: ore.x, z: ore.z };
  e.returnHome();
  const restored = new Engine(deserialize(serialize(e.s)));
  shiftWindow(restored.s, position.x, position.z);
  assert.equal(tileAt(restored.s, position.x, position.z)!.resource, null);
  assert.ok(restored.s.buildings.some((b) => b.x === site.x && b.z === site.z));
});
test('unmodified exploration is regenerated deterministically without accumulating tiles', (t) => {
  const e = new Engine(createState()),
    samples: number[] = [];
  const original = generatedTile(e.s.seed, -85, 64);
  for (let i = 0; i < 300; i++) {
    const start = performance.now();
    shiftWindow(e.s, 48 + i * 12, 66);
    samples.push(performance.now() - start);
    assert.equal(e.s.tiles.length, 3600);
  }
  samples.sort((a, b) => a - b);
  t.diagnostic(
    `300 region transitions: median ${samples[150].toFixed(2)} ms, p95 ${samples[285].toFixed(2)} ms; active tiles ${e.s.tiles.length}; persisted edits ${Object.keys(e.s.world.edits).length}`,
  );
  assert.equal(Object.keys(e.s.world.edits).length, 0);
  assert.deepEqual(generatedTile(e.s.seed, -85, 64), original);
});
test('pathfinding and manual movement work at negative global coordinates', () => {
  const e = new Engine(createState());
  shiftWindow(e.s, -18, -18);
  Object.assign(e.s.player, { x: -18, z: -18 });
  const destination = { x: -18, z: -10 };
  assert.ok(walkable(e.s, -18, -18));
  assert.ok(e.findPath(destination.x, destination.z));
  e.move(0, 1, 0.1);
  assert.ok(e.s.player.z > -18);
  assert.deepEqual(deserialize(serialize(e.s)), e.s);
});
test('far-away death restores home in a loaded region', () => {
  const e = new Engine(createState());
  shiftWindow(e.s, 1200, 1206);
  Object.assign(e.s.player, { x: 1206, z: 1206 });
  e.recover();
  assert.ok(e.s.player.x < 36 && e.s.player.z < 36);
  assert.ok(walkable(e.s, e.s.player.x, e.s.player.z));
  assert.deepEqual(deserialize(serialize(e.s)), e.s);
});
test('corrupt archived coordinates cannot overwrite another region', () => {
  const e = new Engine(createState());
  e.s.world.edits[tileKey(-10, -10)] = {
    ...generatedTile(e.s.seed, -10, -10),
    x: 100,
  };
  assert.throws(() => deserialize(serialize(e.s)));
});
test('ranch breeding reserves feed, obeys capacity and preserves animal care', () => {
  const e = new Engine(createState());
  e.s.gold = 500;
  assert.equal(e.build('coop', 14, 20), true);
  assert.equal(e.buyAnimal('chicken'), true);
  assert.equal(e.buyAnimal('chicken'), true);
  const parent = e.s.animals[0],
    feed = e.s.inventory.feed;
  assert.equal(e.petAnimal(parent.id), true);
  assert.equal(e.petAnimal(parent.id), false);
  assert.equal(e.renameAnimal(parent.id, 'Pamuk'), true);
  assert.equal(e.breedAnimal(parent.id), true);
  assert.equal(e.s.inventory.feed, feed - 6);
  assert.equal(e.breedAnimal(parent.id), false);
  const child = e.s.animals[2];
  assert.equal(child.bornDay, e.s.day);
  const childTimer = child.timer;
  e.systems(10);
  assert.equal(child.timer, childTimer);
  assert.deepEqual(deserialize(serialize(e.s)), e.s);
});

test('previous game saves gain streaming data without resetting the village', () => {
  const state = createState();
  state.inventory.wood = 123;
  const previous = { ...state } as Partial<typeof state>;
  delete previous.world;
  const loaded = deserialize(serialize(previous as typeof state));
  assert.deepEqual(loaded.world, { x: 0, z: 0, edits: {} });
  assert.equal(loaded.inventory.wood, 123);
  assert.deepEqual(loaded.tiles, state.tiles);
});

test('when IndexedDB is unavailable, the local backup still saves and restores progress', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage'),
    values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => values.set(k, v),
    },
  });
  try {
    const state = createState();
    state.gold = 245;
    assert.equal(await saveStored(state), true);
    assert.equal((await loadStored()).state.gold, 245);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
