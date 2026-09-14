import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine, createState, tileAt } from '../lib/game/model.ts';
import {
  BUNDLES,
  inventoryCapacity,
  inventoryUsed,
  movementSpeed,
  farmCoverage,
} from '../lib/game/progression.ts';
import { MILESTONES, nextMilestone } from '../lib/game/settlement.ts';
import { serialize, deserialize } from '../lib/game/save.ts';
import { spatialAmbience } from '../lib/game/ambience.ts';
import { BUILDINGS, ANIMALS } from '../lib/game/data.ts';
import { MINE_ENTRANCE, MINE_STAIRS } from '../lib/game/expedition.ts';
const fresh = () => new Engine(createState());
function donateAll(e: Engine, id: string) {
  for (const [item, quantity] of Object.entries(BUNDLES[id].items)) {
    e.s.inventory[item] = (e.s.inventory[item] || 0) + quantity;
    assert.ok(e.donate(id, item, quantity));
  }
}
void test('Roamcroft keeps old inventories and saves while migrating new fields', () => {
  const s = createState();
  s.inventory.wood = 900;
  const legacy = structuredClone(s) as unknown as Record<string, unknown>;
  for (const key of ['settlement', 'bundles', 'talks', 'overflow', 'storage'])
    delete legacy[key];
  const restored = deserialize(serialize(legacy as unknown as typeof s));
  assert.equal(restored.inventory.wood, 900);
  assert.deepEqual(restored.storage, {});
  assert.deepEqual(restored.settlement, { name: 'Yuvam', milestones: [] });
  const e = new Engine(restored);
  assert.ok(e.renameSettlement('  Çam   Yuvam  '));
  assert.equal(e.renameSettlement(' '), false);
  assert.equal(e.renameSettlement('x'.repeat(33)), false);
  assert.equal(deserialize(serialize(e.s)).settlement.name, 'Çam Yuvam');
});
void test('bundle donations are partial, atomic, validated and pay only once', () => {
  const e = fresh();
  e.s.inventory = { wheat: 20, carrot: 12, potato: 8 };
  assert.equal(e.donate('pantry', 'wheat', 21), false);
  assert.equal(e.donate('pantry', 'wheat', -1), false);
  assert.equal(e.donate('__proto__', 'wheat', 1), false);
  assert.equal(e.donate('pantry', 'toString', 1), false);
  assert.ok(e.donate('pantry', 'wheat', 7));
  const restored = new Engine(deserialize(serialize(e.s)));
  assert.ok(restored.donate('pantry', 'wheat', 13));
  assert.ok(restored.donate('pantry', 'carrot', 12));
  assert.equal(inventoryCapacity(restored.s), 600);
  assert.ok(restored.donate('pantry', 'potato', 8));
  assert.equal(inventoryCapacity(restored.s), 900);
  const xp = restored.s.xp;
  assert.equal(restored.donate('pantry', 'potato', 1), false);
  assert.equal(restored.s.xp, xp);
  assert.equal(restored.events.filter((x) => x.celebration).length, 1);
  assert.deepEqual(
    deserialize(serialize(restored.s)).bundles,
    restored.s.bundles,
  );
});
void test('forged bundle and milestone data cannot replace a valid save', () => {
  const s = createState();
  s.bundles.completed = ['pantry'];
  assert.throws(() => deserialize(serialize(s)));
  s.bundles.completed = [];
  s.bundles.donations = { pantry: { wheat: 21 } };
  assert.throws(() => deserialize(serialize(s)));
  s.bundles.donations = {};
  s.settlement.milestones = ['legacy'];
  assert.throws(() => deserialize(serialize(s)));
});
void test('full inventory never loses earned items or charges blocked purchases', () => {
  const e = fresh();
  e.s.inventory = { wood: 599 };
  e.add({ stone: 4 });
  assert.equal(inventoryUsed(e.s), 600);
  assert.deepEqual(e.s.overflow, { stone: 3 });
  assert.ok(
    e.events.some((x) => x.kind === 'bad' && x.text.includes('ÇANTA DOLU')),
  );
  const gold = e.s.gold;
  assert.equal(e.trade('wheatseed', 1, true), false);
  assert.equal(e.s.gold, gold);
  e.s.inventory.wood -= 2;
  e.collectDelivery();
  assert.equal(e.s.inventory.stone, 3);
  assert.equal(e.s.overflow.stone, 1);
  const restored = new Engine(deserialize(serialize(e.s)));
  restored.s.inventory.wood -= 2;
  restored.collectDelivery();
  assert.equal(restored.s.inventory.stone, 4);
  assert.deepEqual(restored.s.overflow, {});
});
void test('machines retain inputs when output will not fit and resume after selling', () => {
  const e = fresh();
  e.s.buildings.push({
    id: e.s.nextId++,
    type: 'feedmill',
    x: 16,
    z: 15,
    level: 1,
    hp: 180,
    timer: 0,
    enabled: true,
  });
  e.s.inventory = { wood: 597, wheat: 3 };
  e.systems(60);
  assert.equal(e.s.inventory.wheat, 3);
  assert.equal(e.s.inventory.feed || 0, 0);
  assert.ok(e.trade('wood', 6, false));
  e.systems(0.5);
  assert.equal(e.s.inventory.wheat, 0);
  assert.equal(e.s.inventory.feed, 9);
  assert.equal(inventoryUsed(e.s), 600);
});
void test('crafted sprinklers water adjacent tiles, bundle expands coverage, disabled units stop', () => {
  const e = fresh();
  e.s.level = 2;
  e.s.inventory = { stone: 5, copperbar: 2, iron: 2 };
  assert.ok(e.craft('sprinkler'));
  e.systems(8);
  assert.equal(e.s.inventory.sprinkler, 1);
  assert.ok(e.build('sprinkler', 17, 18));
  const tile = tileAt(e.s, 18, 18)!;
  tile.water = 0;
  const outer = tileAt(e.s, 19, 18)!;
  outer.water = 0;
  e.systems(0.5);
  assert.ok(tile.water > 99);
  assert.equal(outer.water, 0);
  donateAll(e, 'irrigation');
  e.systems(0.5);
  assert.ok(outer.water > 99);
  assert.equal(farmCoverage(e.s).watered.size, 25);
  e.s.buildings.find((b) => b.type === 'sprinkler')!.enabled = false;
  tile.water = 0;
  e.systems(0.5);
  assert.equal(tile.water, 0);
  assert.equal(
    deserialize(serialize(e.s)).buildings.some((b) => b.type === 'sprinkler'),
    true,
  );
});
void test('daily feeding and manual collection cannot duplicate animal products', () => {
  const e = fresh();
  e.s.inventory.wood = 100;
  assert.ok(e.build('coop', 16, 15));
  assert.ok(e.buyAnimal('chicken'));
  e.s.inventory.feed = 3;
  const a = e.s.animals[0];
  e.systems(ANIMALS.chicken.time);
  assert.equal(a.ready, 1);
  assert.equal(e.s.inventory.feed, 2);
  assert.equal(e.feedAnimal(a.id), false);
  e.s.inventory = { wood: 600, feed: 2 };
  assert.equal(e.harvestAnimal(a.id), false);
  assert.equal(a.ready, 1);
  e.s.inventory.wood = 20;
  assert.ok(e.harvestAnimal(a.id));
  assert.equal(e.harvestAnimal(a.id), false);
  e.systems(ANIMALS.chicken.time * 2);
  assert.equal(a.ready, 0);
  assert.equal(e.s.inventory.feed, 2);
  e.nextDay();
  e.systems(ANIMALS.chicken.time);
  assert.equal(a.ready, 1);
  assert.equal(e.s.inventory.feed, 1);
  const restored = new Engine(deserialize(serialize(e.s)));
  assert.ok(restored.harvestAnimal(a.id));
  assert.equal(restored.s.inventory.egg, 2);
  assert.equal(restored.s.stats.animalharvest, 2);
});
void test('daily NPC conversation improves hearts once per day and survives saves', () => {
  const e = fresh();
  assert.ok(e.talk('narin'));
  assert.ok(e.talk('narin'));
  assert.equal(e.s.friendship.narin, 2);
  const restored = new Engine(deserialize(serialize(e.s)));
  restored.talk('narin');
  assert.equal(restored.s.friendship.narin, 2);
  restored.nextDay();
  restored.talk('narin');
  assert.equal(restored.s.friendship.narin, 4);
  assert.equal(restored.talk('unknown'), false);
});
void test('low energy reduces manual and click movement equally without immobilizing player', () => {
  for (const energy of [0, 10, 20, 100]) {
    const manual = fresh(),
      click = fresh();
    manual.s.player.energy = click.s.player.energy = energy;
    manual.move(1, 0, 0.1);
    click.path = [{ x: 16, z: 19 }];
    click.tick(0.1);
    assert.ok(Math.abs(manual.s.player.x - click.s.player.x) < 1e-8);
    assert.ok(
      Math.abs(manual.s.player.x - 15 - movementSpeed(energy) * 0.1) < 1e-8,
    );
  }
  assert.ok(movementSpeed(0) > 0 && movementSpeed(0) < movementSpeed(100));
});
void test('elevator remembers reached floors and rejects unearned checkpoints', () => {
  const e = fresh();
  e.s.level = 3;
  Object.assign(e.s.player, MINE_ENTRANCE);
  assert.equal(e.enterMine(2), false);
  assert.ok(e.enterMine());
  e.s.enemies = [];
  e.s.mine!.mined = 4;
  Object.assign(e.s.player, MINE_STAIRS);
  assert.ok(e.descendMine());
  assert.equal(e.s.stats.minecheckpoint, 2);
  e.leaveMine(true);
  e.nextDay();
  const restored = new Engine(deserialize(serialize(e.s)));
  Object.assign(restored.s.player, MINE_ENTRANCE);
  assert.equal(restored.enterMine(3), false);
  assert.ok(restored.enterMine(2));
  assert.equal(restored.s.mine!.floor, 2);
});
void test('spatial ambience follows camera distance, rotation, zoom and environment', () => {
  const s = createState();
  for (const t of s.tiles) {
    t.terrain = 'grass';
    t.resource = null;
  }
  tileAt(s, 20, 19)!.terrain = 'water';
  tileAt(s, 17, 19)!.resource = 'tree';
  const camera = { x: 15, z: 19, angle: 0, zoom: 17 };
  const near = spatialAmbience(s, camera);
  assert.ok(near.river.gain > 0 && near.river.pan > 0 && near.birds.gain > 0);
  assert.ok(spatialAmbience(s, { ...camera, angle: Math.PI }).river.pan < 0);
  assert.ok(
    spatialAmbience(s, { ...camera, zoom: 34 }).river.gain < near.river.gain,
  );
  assert.equal(spatialAmbience(s, { ...camera, x: -50 }).river.gain, 0);
  s.time = 0.9;
  assert.equal(spatialAmbience(s, camera).birds.gain, 0);
  s.time = 0.3;
  s.weather = 'rain';
  assert.equal(spatialAmbience(s, camera).birds.gain, 0);
});
void test('settlement rewards follow a persistent sequence and supply the next production loop', () => {
  const e = fresh();
  assert.equal(e.claimMilestone('workshop'), false);
  assert.equal(e.claimMilestone('roots'), false);
  e.s.stats.harvest = 8;
  e.s.stats.sell = 100;
  assert.ok(e.claimMilestone('roots'));
  assert.equal(e.s.inventory.copper, 8);
  assert.equal(e.claimMilestone('roots'), false);
  e.s.stats.build = 3;
  e.s.stats.craft = 5;
  assert.ok(e.claimMilestone('workshop'));
  assert.equal(e.s.inventory.sprinkler, 1);
  const restored = new Engine(deserialize(serialize(e.s)));
  assert.equal(nextMilestone(restored.s)?.id, 'ranch');
  assert.equal(restored.claimMilestone('workshop'), false);
  assert.equal(e.events.filter((x) => x.celebration).length, 2);
  for (const m of MILESTONES)
    for (const count of Object.values(m.reward))
      assert.ok(Number.isSafeInteger(count) && count > 0);
  assert.ok(BUILDINGS.sprinkler);
});
