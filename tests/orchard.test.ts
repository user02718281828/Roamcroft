import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine, createState, tileAt } from '../lib/game/model.ts';
import { orchardStatus } from '../lib/game/orchard.ts';
import { serialize, deserialize } from '../lib/game/save.ts';
import { shiftWindow } from '../lib/game/world.ts';
import { validServerCommand } from '../lib/server/protocol.ts';
import { inventoryCapacity, inventoryUsed } from '../lib/game/progression.ts';

function planted(type='appletree') {
  const e=new Engine(createState());
  const t=tileAt(e.s,16,20)!;Object.assign(t,{resource:null,source:null,crop:null,tilled:false});
  e.s.level=4;e.s.inventory.applesapling=1;e.s.inventory.pearsapling=1;
  assert.equal(e.build(type,16,20),true);
  return {e,b:e.s.buildings.at(-1)!};
}
test('sapling consumes materials, matures across days, harvests once daily and persists',()=>{
  const {e,b}=planted();
  assert.equal(e.s.inventory.applesapling,0);
  assert.equal(e.s.inventory.wood,21);
  assert.equal(orchardStatus(b,e.s)!.ready,false);
  e.nextDay();assert.equal(orchardStatus(b,e.s)!.stage,1);
  e.nextDay();assert.equal(orchardStatus(b,e.s)!.ready,true);
  e.act(b.x,b.z,'hand');assert.equal(e.s.inventory.apple,3);
  e.actionCooldown=0;e.act(b.x,b.z,'hand');assert.equal(e.s.inventory.apple,3);
  const saved=deserialize(serialize(e.s)),tree=saved.buildings.find(v=>v.id===b.id)!;
  assert.equal(orchardStatus(tree,saved)!.ready,false);
  e.nextDay();e.act(b.x,b.z,'hand');assert.equal(e.s.inventory.apple,6);
  assert.equal(e.s.stats.fruit,6);
  assert.equal(e.claim('fruit'),true);
  assert.equal(e.claim('fruit'),false);
});
test('seasons, range and inventory capacity protect orchard harvest',()=>{
  const {e,b}=planted('peartree');e.s.day=4;
  assert.equal(orchardStatus(b,e.s)!.inSeason,false);
  e.act(b.x,b.z,'hand');assert.equal(e.s.inventory.pear,undefined);
  e.s.day=8;
  e.s.player.x=1;e.s.player.z=1;e.act(b.x,b.z,'hand');assert.equal(e.s.inventory.pear,undefined);
  e.s.player.x=15;e.s.player.z=19;
  e.s.inventory.stone += inventoryCapacity(e.s)-inventoryUsed(e.s);
  e.act(b.x,b.z,'hand');assert.equal(orchardStatus(b,e.s)!.ready,true);
  assert.ok(e.events.some(v=>v.text.startsWith('ÇANTA DOLU')));
  e.s.inventory.stone-=3;e.act(b.x,b.z,'hand');assert.equal(e.s.inventory.pear,3);
});
test('orchards survive streaming and old saves; invalid dates are rejected',()=>{
  const {e,b}=planted();e.s.day=4;
  shiftWindow(e.s,200,200,true);shiftWindow(e.s,15,19,true);
  const saved=deserialize(serialize(e.s));assert.equal(orchardStatus(saved.buildings.at(-1)!,saved)!.ready,true);
  const old=createState();assert.deepEqual(deserialize(serialize(old)).inventory,old.inventory);
  b.plantedDay=100;assert.throws(()=>deserialize(serialize(e.s)));
  assert.equal(validServerCommand({seq:1,method:'build',args:['appletree',16,20,0,false]}),true);
  assert.equal(validServerCommand({seq:1,method:'craft',args:['applejam']}),true);
});
