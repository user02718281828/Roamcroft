import test from 'node:test';
import assert from 'node:assert/strict';
import { firstSteps, toolNotes } from '../lib/ui/first-steps.ts';
import { readGuidance, GUIDANCE_KEY } from '../lib/ui/guidance.ts';
import { Engine, createState, tileAt, SAVE_VERSION } from '../lib/game/model.ts';
import { serialize, deserialize } from '../lib/game/save.ts';
import { scenarioState, startingOptions, simulateFirstLoop } from '../scripts/first-session-audit.ts';

test('first steps use earned counters, accept out-of-order progress and do not count initial stock', () => {
  const s = createState();
  assert.ok(s.inventory.wood >= 12);
  assert.equal(firstSteps(s).find(step => step.id === 'gather')!.value, 0);
  s.stats.sell = 10; s.stats.craft = 1; s.stats.harvest = 1;
  assert.equal(firstSteps(s).find(step => step.id === 'sell')!.done, true);
  assert.equal(firstSteps(s).find(step => step.id === 'gather')!.done, false);
  s.claimed.push('gather'); delete s.stats.wood;
  assert.equal(firstSteps(s).find(step => !step.done)!.id, 'till');
});

test('opening the guide, changing language-facing notes and reading preferences never rewrites a legacy save or upgrades', () => {
  const s = createState(42); s.upgrades.axe = 3; s.upgrades.sword = 2; s.inventory.wood = 1200;
  const before = JSON.parse(serialize(s));
  firstSteps(s); toolNotes(s); readGuidance({getItem: () => 'off'});
  const after = JSON.parse(serialize(s));
  assert.equal(SAVE_VERSION, 1); assert.deepEqual(after.payload, before.payload); assert.equal(after.checksum, before.checksum);
  const restored = deserialize(serialize(s));
  assert.equal(restored.inventory.wood, 1200); assert.equal(restored.upgrades.axe, 3); assert.equal(restored.upgrades.sword, 2);
});

test('tool energy notes match Engine charges at all vigor ranks and gathering tiers preserve node yield', () => {
  for (const vigor of [0,1,2,3,4,5]) {
    const state = createState(); state.talents.vigor = vigor;
    for (const [id, base] of [['axe',3],['pickaxe',3],['hoe',2],['water',1],['fish',3]] as const) {
      const engine = new Engine(structuredClone(state)); engine.s.player.energy = 100;
      engine.energy(base);
      assert.ok(Math.abs((100-engine.s.player.energy)-toolNotes(state).find(tool=>tool.id===id)!.energy)<1e-8);
    }
  }
  for (const [tool, resource, item] of [['axe','tree','wood'],['pickaxe','stone','stone']] as const) {
    const yields: number[] = [], hits: number[] = [];
    for (const tier of [0,1,2,3]) {
      const engine = new Engine(createState(42)); engine.s.upgrades[tool] = tier;
      const tile = tileAt(engine.s,17,18)!;
      Object.assign(tile,{terrain:'grass',resource,source:resource,amount:3,crop:null});
      Object.assign(engine.s.player,{x:17,z:19});
      const start = engine.s.inventory[item] || 0;
      let count=0;
      while (tile.resource) {engine.actionCooldown=0;engine.act(tile.x,tile.z,tool);count++;}
      yields.push(engine.s.inventory[item]-start); hits.push(count);
      const note=toolNotes(engine.s).find(note=>note.id===tool)!;
      assert.ok('power' in note); assert.equal(note.power, tier+1);
    }
    assert.deepEqual(yields,[9,9,9,9]); assert.deepEqual(hits,[3,2,1,1]);
  }
});

test('sword note matches applied damage and the current zero-energy attack rule', () => {
  const engine = new Engine(createState()); engine.s.upgrades.sword=2;
  const note=toolNotes(engine.s).find(tool=>tool.id==='sword')!;
  engine.s.enemies=[{id:42,x:16,z:19,hp:200,maxHp:200,cooldown:1}];
  const energy=engine.s.player.energy;
  assert.equal(engine.attack(),true);
  assert.equal(200-engine.s.enemies[0].hp,note.damage); assert.equal(engine.s.player.energy,energy); assert.equal(note.energy,0);
});

test('a sent guest action is not acknowledged progress or a receipt', () => {
  const engine=new Engine(createState()); let sends=0;
  engine.network={guest:true,send:()=>{sends++;return true;},peers:[]};
  const before=JSON.parse(serialize(engine.s));
  engine.act(10,19,'axe');
  assert.equal(sends,1); assert.equal(engine.events.length,0);
  assert.equal(firstSteps(engine.s)[0].done,false);
  const after=JSON.parse(serialize(engine.s));
  assert.equal(after.checksum,before.checksum); assert.deepEqual(after.payload,before.payload);
});

test('guidance can be disabled independently, including storage failure and malformed preferences', () => {
  assert.equal(readGuidance({getItem:key=>{assert.equal(key,GUIDANCE_KEY);return 'off';}}),false);
  for (const value of [null,'on','invalid']) assert.equal(readGuidance({getItem:()=>value}),true);
  assert.equal(readGuidance(undefined),true); assert.equal(readGuidance({getItem:()=>{throw Error('blocked');}}),true);
});

test('the sparse profile is experiment-only; two seeded routes finish without negative stock or duplicated rewards', () => {
  const baseline = serialize(createState(42));
  assert.deepEqual(startingOptions(scenarioState(42,'current')).buildings,['workshop','campfire','coop','chest','fence']);
  assert.deepEqual(startingOptions(scenarioState(42,'proposal')).buildings,['fence']);
  for (const seed of [42,84621]) {
    const current=simulateFirstLoop(seed,'current'), proposal=simulateFirstLoop(seed,'proposal');
    for (const run of [current,proposal]) {
      assert.equal(run.state.stats.build,1); assert.equal(run.state.stats.craft,1); assert.equal(run.state.stats.sell,10);
      assert.equal(run.state.buildings.filter(b=>b.type==='workshop').length,1);
      assert.ok(Object.values(run.state.inventory).every(n=>n>=0));
      const restored=new Engine(deserialize(serialize(run.state))), gold=restored.s.gold;
      for (const id of run.claims) restored.claim(id);
      assert.equal(restored.s.gold,gold);
    }
    assert.equal(current.start.units,94); assert.equal(current.start.gold,180);
    assert.equal(proposal.start.units,34); assert.equal(proposal.start.gold,60);
    assert.equal(proposal.hits-current.hits,5);
    assert.equal(current.gold-proposal.gold,120);
  }
  assert.deepEqual(JSON.parse(serialize(createState(42))).payload,JSON.parse(baseline).payload);
});
