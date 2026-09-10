import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Engine,
  createState,
  tileAt,
  walkable,
  DAY_SECONDS,
} from '../lib/game/model.ts';
import { BUILDINGS, CROPS } from '../lib/game/data.ts';
import { serialize, deserialize } from '../lib/game/save.ts';
import { gameTools } from '../lib/game/webmcp.ts';
const run = (e: Engine, seconds: number) => {
  for (let i = 0; i < Math.round(seconds * 10); i++) e.tick(0.1);
};
const fresh = () => new Engine(createState());
test('same seed gives the same world, different seeds change resources', () => {
  assert.deepEqual(createState(12), createState(12));
  assert.notDeepEqual(createState(12).tiles, createState(13).tiles);
});
test('starting character has a valid route to harvest and market', () => {
  const e = fresh();
  assert.ok(walkable(e.s, 15, 19));
  assert.ok(e.findPath(18, 18, true));
  assert.ok(e.findPath(18, 14, true));
});
test('fractional starting positions finish adjacent resource actions', () => {
  const e = fresh();
  Object.assign(e.s.player, { x: 11.49, z: 20.49 });
  const t = tileAt(e.s, 10, 19)!;
  assert.equal(t.resource, 'tree');
  e.go(10, 19, 'axe');
  run(e, 2);
  assert.ok(e.s.inventory.wood > 25);
});
test('upgraded tools preserve node stock while reducing number of hits', () => {
  const totals = [];
  for (const tier of [0, 1, 2, 3]) {
    const e = fresh();
    e.s.upgrades.axe = tier;
    Object.assign(e.s.player, { x: 11, z: 19 });
    const start = e.s.inventory.wood;
    while (tileAt(e.s, 10, 19)?.resource) {
      e.actionCooldown = 0;
      e.act(10, 19, 'axe');
    }
    totals.push(e.s.inventory.wood - start);
  }
  assert.deepEqual(totals, [9, 9, 9, 9]);
});
test('resources renew after three days and never replace farmland', () => {
  const e = fresh();
  Object.assign(e.s.player, { x: 11, z: 19 });
  while (tileAt(e.s, 10, 19)?.resource) {
    e.actionCooldown = 0;
    e.act(10, 19, 'axe');
  }
  e.nextDay();
  e.nextDay();
  e.nextDay();
  assert.equal(tileAt(e.s, 10, 19)?.resource, null);
  e.s.player.x = 15;
  e.nextDay();
  assert.equal(tileAt(e.s, 10, 19)?.resource, 'tree');
  const t = tileAt(e.s, 10, 19)!;
  t.resource = null;
  t.tilled = true;
  t.respawn = e.s.day;
  e.nextDay();
  assert.equal(t.resource, null);
});
test('cooldown preserves a pending resource action', () => {
  const e = fresh();
  Object.assign(e.s.player, { x: 11, z: 19 });
  e.actionCooldown = 0.3;
  e.go(10, 19, 'axe');
  assert.ok(e.pending);
  run(e, 0.5);
  assert.equal(e.s.inventory.wood, 28);
});
test('empty energy never spends seeds and resting restores energy', () => {
  const e = fresh();
  Object.assign(e.s.player, { x: 17, z: 19, energy: 0 });
  const before = e.s.inventory.wheatseed;
  e.act(18, 19, 'seed', 'wheat');
  assert.equal(e.s.inventory.wheatseed, before);
  e.resting = true;
  run(e, 2);
  assert.ok(e.s.player.energy > 0);
});
test('crop growth needs water and honors seasons', () => {
  const e = fresh(),
    t = tileAt(e.s, 18, 19)!;
  t.crop = 'carrot';
  t.water = 0;
  e.systems(20);
  assert.equal(t.growth, 0);
  t.water = 100;
  e.systems(20);
  assert.ok(t.growth > 0);
  const growth = t.growth;
  e.s.day = 8;
  e.systems(20);
  assert.equal(t.growth, growth);
});
test('sleep splits crop simulation exactly at season transition', () => {
  const e = fresh();
  Object.assign(e.s.player, { x: 13, z: 14 });
  e.s.day = 7;
  e.s.time = 0.99;
  const t = tileAt(e.s, 18, 19)!;
  t.crop = 'carrot';
  t.water = 100;
  t.growth = 0;
  assert.equal(e.sleep(), true);
  assert.equal(e.s.day, 8);
  assert.ok(Math.abs(t.growth - 3) < 0.00001);
});
test('sleep rejects .25 daytime boundary, attack nights and distance', () => {
  const e = fresh();
  e.s.time = 0.25;
  assert.equal(e.sleep(), false);
  Object.assign(e.s.player, { x: 13, z: 14 });
  e.s.day = 3;
  e.s.time = 0.8;
  assert.equal(e.sleep(), false);
});
test('building costs are atomic and placement rejects occupied cells', () => {
  const e = fresh(),
    before = structuredClone(e.s.inventory);
  assert.equal(e.build('workshop', 13, 15), false);
  assert.deepEqual(e.s.inventory, before);
  e.s.inventory.wood = 0;
  assert.equal(e.build('workshop', 16, 20), false);
  assert.equal(e.s.buildings.length, 3);
});
test('crafting reserves resources, takes time and caps queue size', () => {
  const e = fresh();
  assert.ok(e.craft('plank'));
  assert.equal(e.s.inventory.wood, 22);
  assert.equal(e.s.inventory.plank || 0, 0);
  run(e, 8);
  assert.equal(e.s.inventory.plank, 2);
  e.s.inventory.wood = 50;
  for (let i = 0; i < 3; i++) assert.ok(e.craft('plank'));
  const before = e.s.inventory.wood;
  assert.equal(e.craft('plank'), false);
  assert.equal(e.s.inventory.wood, before);
});
test('trade rejects invalid quantities and does not create debt', () => {
  const e = fresh(),
    before = serialize(e.s);
  for (const q of [-1, 0, 0.5, Infinity, NaN, 1000])
    assert.equal(e.trade('wood', q, true), false);
  assert.equal(
    serialize(e.s).replace(/savedAt[^,]+/, ''),
    before.replace(/savedAt[^,]+/, ''),
  );
  e.s.gold = 0;
  assert.equal(e.trade('wood', 1, true), false);
});
test('splitting sales cannot multiply XP or level rewards', () => {
  const a = fresh(),
    b = fresh();
  a.s.inventory.wood = b.s.inventory.wood = 100;
  a.trade('wood', 100, false);
  for (let i = 0; i < 100; i++) b.trade('wood', 1, false);
  assert.equal(a.s.xp, b.s.xp);
  assert.equal(a.s.gold, b.s.gold);
});
test('quest rewards cannot be claimed twice', () => {
  const e = fresh();
  e.s.stats.wood = 12;
  assert.ok(e.claim('gather'));
  const before = e.s.gold;
  assert.equal(e.claim('gather'), false);
  assert.equal(e.s.gold, before);
});
test('animal purchase checks capacity and finds different positions', () => {
  const e = fresh();
  e.s.level = 2;
  e.s.gold = 1000;
  e.s.inventory.wood = 100;
  assert.ok(e.build('coop', 16, 15));
  assert.ok(e.buyAnimal('chicken'));
  assert.ok(e.buyAnimal('chicken'));
  assert.ok(e.buyAnimal('chicken'));
  assert.equal(e.buyAnimal('chicken'), false);
  assert.equal(new Set(e.s.animals.map((a) => `${a.x},${a.z}`)).size, 3);
});
test('foodless animals pause, fed animals produce', () => {
  const e = fresh();
  e.s.level = 2;
  e.s.inventory.wood = 100;
  e.build('coop', 16, 15);
  e.buyAnimal('chicken');
  e.s.inventory.feed = 0;
  for (let i = 0; i < 220; i++) e.systems(0.5);
  assert.equal(e.s.inventory.egg || 0, 0);
  e.s.inventory.feed = 1;
  for (let i = 0; i < 220; i++) e.systems(0.5);
  assert.equal(e.s.animals[0].ready, 1);
  assert.equal(e.harvestAnimal(e.s.animals[0].id), true);
  assert.equal(e.s.inventory.egg, 1);
});
test('raiders navigate around protected homes', () => {
  const e = fresh();
  Object.assign(e.s.player, { x: 13, z: 14 });
  e.s.enemies = [{ id: 10, x: 13, z: 16, hp: 100, maxHp: 100, cooldown: 0 }];
  e.s.nextId = 11;
  for (let i = 0; i < 250; i++) e.combat(0.1);
  assert.ok(e.s.player.health < 100);
});
test('melee does not pass through buildings', () => {
  const e = fresh();
  Object.assign(e.s.player, { x: 13, z: 14 });
  e.s.enemies = [{ id: 10, x: 13, z: 16, hp: 100, maxHp: 100, cooldown: 0 }];
  assert.equal(e.attack(), false);
  assert.equal(e.s.enemies[0].hp, 100);
});
test('raid spawns exactly once for each eligible night', () => {
  const e = fresh();
  e.s.day = 3;
  e.raid();
  const count = e.s.enemies.length;
  assert.ok(count > 0);
  e.raid();
  assert.equal(e.s.enemies.length, count);
});
test('ordinary play with idle towers and map boundaries round-trips through saves', () => {
  const e = fresh();
  e.s.level = 3;
  e.s.inventory = { wood: 100, stone: 100, plank: 100 };
  e.build('tower', 16, 20);
  run(e, 20);
  const t = tileAt(e.s, 0, 0)!;
  t.resource = null;
  Object.assign(e.s.player, { x: 0, z: 0 });
  e.move(-1, 0, 0.1);
  assert.ok(e.s.player.x < 0);
  assert.deepEqual(deserialize(serialize(e.s)), e.s);
});
test('malformed, tampered, nonfinite and incompatible saves fail before replacement', () => {
  const e = fresh();
  assert.throws(() => deserialize('bad'));
  assert.throws(() => deserialize('{}'));
  let text = serialize(e.s).replace('"gold":180', '"gold":999');
  assert.throws(() => deserialize(text));
  e.s.player.health = NaN;
  assert.throws(() => deserialize(serialize(e.s)));
});
test('five days of unattended simulation remain saveable', () => {
  const e = fresh();
  run(e, DAY_SECONDS * 5);
  assert.equal(e.s.day, 6);
  assert.deepEqual(deserialize(serialize(e.s)), e.s);
});
test('WebMCP contracts use the same engine and reject invalid input', () => {
  const e = fresh();
  let updates = 0;
  const tools = gameTools(
    e,
    () => updates++,
    () => false,
  );
  assert.deepEqual(
    tools.map((t) => t.name),
    ['read_game_state', 'start_tile_action', 'queue_crafting'],
  );
  const craft = tools.find((t) => t.name === 'queue_crafting')!;
  assert.throws(() => craft.execute({ recipe: 'unknown' }));
  craft.execute({ recipe: 'plank' });
  assert.equal(e.s.jobs.length, 1);
  assert.equal(updates, 1);
  assert.throws(() => tools[1].execute({ x: -10000, z: 10, tool: 'axe' }));
  assert.equal(tools[0].annotations.readOnlyHint, true);
});
