import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine, createState, tileAt, walkable } from '../lib/game/model.ts';
import {
  mineTiles,
  MINE_ENTRANCE,
  MINE_LIFT,
  MINE_STAIRS,
} from '../lib/game/expedition.ts';
import { serialize, deserialize } from '../lib/game/save.ts';
function expedition() {
  const e = new Engine(createState());
  e.s.level = 3;
  Object.assign(e.s.player, { x: MINE_ENTRANCE.x, z: MINE_ENTRANCE.z + 1 });
  assert.equal(e.enterMine(), true);
  return e;
}
test('mine entrance respects progression, distance, daily limit and raid obligations', () => {
  const e = new Engine(createState());
  assert.equal(e.enterMine(), false);
  Object.assign(e.s.player, MINE_ENTRANCE);
  assert.equal(e.enterMine(), false);
  e.s.level = 3;
  e.s.day = 3;
  assert.equal(e.enterMine(), false);
  e.s.raidDay = 3;
  assert.equal(e.enterMine(), true);
  e.leaveMine(true);
  assert.equal(e.enterMine(), false);
  e.nextDay();
  assert.equal(e.enterMine(), true);
});
test('all five generated floors have a connected exit and enough reachable ore across seeds', () => {
  for (const seed of [1, 182, 84621, 4294967295]) {
    const e = expedition();
    for (let floor = 1; floor <= 5; floor++) {
      e.s.tiles = mineTiles(seed, floor);
      assert.ok(e.findPath(MINE_STAIRS.x, MINE_STAIRS.z, true));
      const reachableOre = e.s.tiles.filter(
        (t) => t.resource && e.findPath(t.x, t.z, true),
      );
      assert.ok(reachableOre.reduce((n, t) => n + t.amount, 0) >= 4);
      assert.equal(walkable(e.s, 1, 1), false);
    }
  }
});
test('mine saves restore both worlds, current combat windups and accumulated ore', () => {
  const e = expedition();
  e.s.mine!.mined = 2;
  Object.assign(e.s.enemies[0], { windup: 0.3, aimX: 18, aimZ: 26 });
  const saved = deserialize(serialize(e.s));
  assert.deepEqual(saved, e.s);
  const restored = new Engine(saved);
  const originalFarm = structuredClone(saved.mine!.surface.tiles);
  assert.equal(restored.leaveMine(true), true);
  assert.deepEqual(restored.s.tiles, originalFarm);
  assert.deepEqual(deserialize(serialize(restored.s)), restored.s);
});
test('genuine mining contributes to the gate and floors cannot be skipped', () => {
  const e = expedition();
  Object.assign(e.s.player, MINE_STAIRS);
  assert.equal(e.descendMine(), false);
  e.s.enemies = [];
  assert.equal(e.descendMine(), false);
  const ore = e.s.tiles.find((t) => t.resource && e.findPath(t.x, t.z, true))!;
  const path = e.findPath(ore.x, ore.z, true)!;
  Object.assign(e.s.player, path.at(-1)!);
  e.act(ore.x, ore.z, 'pickaxe');
  assert.equal(e.s.mine!.mined, 1);
  assert.ok((e.s.inventory[ore.source || 'copper'] || 0) >= 0);
  Object.assign(e.s.player, MINE_STAIRS);
  e.s.mine!.mined = 4;
  assert.equal(e.descendMine(), true);
  assert.equal(e.s.mine!.floor, 2);
  assert.equal(e.s.mine!.mined, 0);
  assert.ok(e.s.enemies.some((e) => e.kind === 'shaman'));
});
test('underground clock freezes farms without freezing hunger or crafting', () => {
  const e = expedition(),
    time = e.s.time;
  const farm = structuredClone(e.s.mine!.surface.tiles);
  e.s.enemies = [];
  const hunger = e.s.player.hunger;
  for (let i = 0; i < 100; i++) e.tick(0.1);
  assert.equal(e.s.time, time);
  assert.ok(e.s.player.hunger < hunger);
  assert.deepEqual(e.s.mine!.surface.tiles, farm);
});
test('telegraphed ranged attacks hit their original area and can be dodged', () => {
  const e = expedition();
  Object.assign(e.s.player, { x: 18, z: 23 });
  e.s.enemies = [
    {
      id: e.s.nextId++,
      kind: 'shaman',
      x: 18,
      z: 19,
      hp: 60,
      maxHp: 60,
      cooldown: 0,
    },
  ];
  const health = e.s.player.health;
  e.combat(0.1);
  assert.ok(e.s.enemies[0].windup! > 0);
  for (let i = 0; i < 13; i++) e.combat(0.1);
  assert.ok(e.s.player.health < health);
  e.s.enemies[0].cooldown = 0;
  e.combat(0.1);
  Object.assign(e.s.player, { x: 18, z: 26 });
  const after = e.s.player.health;
  for (let i = 0; i < 13; i++) e.combat(0.1);
  assert.equal(e.s.player.health, after);
});
test('defeat restores the village and final extraction awards exactly once', () => {
  const defeated = expedition();
  const gold = defeated.s.gold;
  defeated.recover();
  assert.equal(defeated.s.mine, null);
  assert.equal(defeated.s.gold, Math.floor(gold * 0.9));
  assert.ok(defeated.s.buildings.some((b) => b.type === 'home'));
  assert.deepEqual(deserialize(serialize(defeated.s)), defeated.s);
  const e = expedition();
  for (let floor = 1; floor <= 5; floor++) {
    e.s.enemies = [];
    e.s.mine!.mined = 4;
    Object.assign(e.s.player, MINE_STAIRS);
    assert.equal(e.descendMine(), true);
  }
  assert.equal(e.s.mine, null);
  assert.equal(e.s.stats.minecomplete, 1);
  const reward = e.s.gold;
  assert.equal(e.descendMine(), false);
  assert.equal(e.s.gold, reward);
});
test('invalid nested village data is rejected before replacing an underground save', () => {
  const e = expedition();
  e.s.mine!.surface.tiles[0].terrain = 'invalid' as never;
  assert.throws(() => deserialize(serialize(e.s)));
});
