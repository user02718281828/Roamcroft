import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Engine,
  createState,
  tileAt,
  tradeUnitPrice,
} from '../lib/game/model.ts';
import { NPCS, LANDMARKS } from '../lib/game/content.ts';
import { serialize, deserialize } from '../lib/game/save.ts';
import { dailyOrders } from '../lib/game/orders.ts';
const fresh = () => new Engine(createState());
test('construction cannot occupy the character tile at a diagonal corner', () => {
  const e = fresh();
  Object.assign(e.s.player, { x: 14.49, z: 17.49 });
  e.go(14, 17, 'build', 'campfire');
  assert.equal(e.s.buildings.length, 3);
  assert.deepEqual(deserialize(serialize(e.s)), e.s);
});
test('daily contracts pay once per day and never spend twice', () => {
  const e = fresh();
  e.s.inventory = {...dailyOrders(e.s,'narin')[0].input};
  assert.equal(e.completeContract('narin'), true);
  const gold = e.s.gold,
    carrot = e.s.inventory.carrot;
  assert.equal(e.completeContract('narin'), false);
  assert.equal(e.s.gold, gold);
  assert.equal(e.s.inventory.carrot, carrot);
  e.nextDay();
  e.s.inventory = {...dailyOrders(e.s,'narin')[0].input};
  assert.equal(e.completeContract('narin'), true);
});
test('gifts have a daily limit and unlock an actual price advantage', () => {
  const e = fresh();
  e.s.inventory.carrot = 10;
  const before = tradeUnitPrice(e.s, 'soup', true);
  assert.ok(e.gift('narin'));
  assert.equal(e.gift('narin'), false);
  assert.ok(tradeUnitPrice(e.s, 'soup', true) < before);
  assert.equal(e.s.friendship.narin, 12);
});
test('talents spend level points and cannot exceed five ranks', () => {
  const e = fresh();
  assert.equal(e.unlockTalent('forage'), false);
  e.s.level = 10;
  e.s.gold = 2000;
  for (let i = 0; i < 5; i++) assert.ok(e.unlockTalent('forage'));
  assert.equal(e.unlockTalent('forage'), false);
  assert.equal(e.talentPoints(), 4);
  assert.equal(e.unlockTalent('unknown'), false);
});
test('talents change resource yield and energy costs', () => {
  const a = fresh(),
    b = fresh();
  b.s.level = 5;
  b.s.talents = { forage: 2, vigor: 2 };
  for (const e of [a, b]) {
    Object.assign(e.s.player, { x: 11, z: 19 });
    e.act(10, 19, 'axe');
  }
  assert.ok(b.s.inventory.wood > a.s.inventory.wood);
  assert.ok(b.s.player.energy > a.s.player.energy);
});
test('discovery rewards are unique and become permanent save state', () => {
  const e = fresh(),
    l = LANDMARKS[0];
  Object.assign(e.s.player, { x: l.x, z: l.z });
  e.systems(0.5);
  const gold = e.s.gold;
  assert.ok(e.s.discoveries.includes(l.id));
  e.systems(0.5);
  assert.equal(e.s.gold, gold);
  assert.deepEqual(deserialize(serialize(e.s)).discoveries, e.s.discoveries);
});
test('achievements pay once and accept persisted identifiers', () => {
  const e = fresh();
  e.s.stats.wood = 300;
  assert.ok(e.claimAchievement('woodland_hand'));
  const gold = e.s.gold;
  assert.equal(e.claimAchievement('woodland_hand'), false);
  assert.equal(e.s.gold, gold);
  assert.deepEqual(deserialize(serialize(e.s)), e.s);
});
test('NPC and landmark sites cannot be overwritten by construction', () => {
  const e = fresh();
  e.s.inventory = { wood: 1000, stone: 1000 };
  for (const n of [...NPCS, ...LANDMARKS])
    assert.equal(e.build('workshop', n.x, n.z), false);
});
test('beacon level three ends raids but preserves continuing simulation', () => {
  const e = fresh();
  e.s.level = 10;
  e.s.inventory = {
    wood: 1000,
    stone: 1000,
    bar: 1000,
    plank: 1000,
    crystal: 1000,
  };
  assert.ok(e.build('beacon', 17, 21));
  const b = e.s.buildings.at(-1)!;
  assert.ok(e.upgrade(b.id));
  assert.ok(e.upgrade(b.id));
  assert.equal(e.s.won, true);
  e.s.day = 30;
  e.raid();
  assert.equal(e.s.enemies.length, 0);
  const time = e.s.time;
  e.tick(0.1);
  assert.ok(e.s.time > time);
});
