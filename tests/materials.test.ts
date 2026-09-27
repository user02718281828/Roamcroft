import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine, createState } from '../lib/game/model.ts';
import { materialCost, materialPlan } from '../lib/game/materials.ts';
import { dailyOrders } from '../lib/game/orders.ts';
import { inventoryCapacity } from '../lib/game/progression.ts';
import { serialize, deserialize } from '../lib/game/save.ts';
import { validServerCommand } from '../lib/server/protocol.ts';
import { RoomCore } from '../lib/server/room-core.ts';
import { ensureSharedPlayer, type SharedRecord } from '../lib/server/shared-world.ts';

function farm() {
  const e = new Engine(createState(42));
  assert.ok(e.build('chest',14,20));
  e.s.inventory = { wood: 1 };
  e.s.storage = { wood: 100, fiber: 100 };
  return e;
}
void test('prepare exact missing ingredients, preserve total stock and survive save/load without auto crafting',()=>{
  const e=farm();
  assert.ok(e.prepareMaterials('craft','plank'));
  assert.equal(e.s.inventory.wood,3);assert.equal(e.s.storage.wood,98);
  assert.equal(e.s.jobs.length,0);assert.equal(e.s.player.energy,100);
  assert.equal(e.prepareMaterials('craft','plank'),false);
  const restored=new Engine(deserialize(serialize(e.s)));
  assert.equal(restored.s.inventory.wood,3);assert.equal(restored.s.storage.wood,98);
  assert.ok(restored.craft('plank'));
  assert.equal(restored.s.inventory.wood,0);assert.equal(restored.s.jobs.length,1);
});
void test('multi-item preparation is all or nothing when inventory is full or shared stock changes',()=>{
  const e=farm();e.s.level=3;e.s.storage={copper:3,coal:0};e.s.inventory={};
  const before=JSON.stringify([e.s.inventory,e.s.storage]);
  assert.equal(e.prepareMaterials('craft','copperbar'),false);
  assert.equal(JSON.stringify([e.s.inventory,e.s.storage]),before);
  e.s.storage.coal=1;e.s.inventory.wood=inventoryCapacity(e.s)-3;
  assert.equal(e.prepareMaterials('craft','copperbar'),false);
  assert.equal(e.s.storage.copper,3);assert.equal(e.s.storage.coal,1);
  e.s.inventory.wood--;assert.ok(e.prepareMaterials('craft','copperbar'));
  assert.equal(e.s.inventory.copper,3);assert.equal(e.s.inventory.coal,1);
});
void test('authoritative costs track queued upgrades, machine recipe changes, daily order expiry and unlocks',()=>{
  const e=farm();
  assert.equal(materialCost(e.s,'craft','copperbar'),undefined);
  assert.equal(materialCost(e.s,'craft','__proto__'),undefined);
  e.s.level=20;e.s.upgrades.axe=1;
  e.s.jobs.push({recipe:'axe',remaining:20,total:30});
  const cost=materialCost(e.s,'craft','axe')!;
  e.s.upgrades.axe=0;e.s.jobs=[];
  const base=materialCost(e.s,'craft','axe')!;
  for(const [id,n] of Object.entries(base))assert.equal(cost[id],n*3);
  const b={id:e.s.nextId++,type:'mill',x:16,z:15,level:1,hp:180,timer:0,enabled:true,recipe:'feed',processing:false};
  e.s.buildings.push(b);e.s.storage.wheat=30;
  assert.equal(e.prepareMaterials('machine',b.id,'default'),false);
  assert.ok(e.prepareMaterials('machine',b.id,'feed'));
  assert.equal(e.s.inventory.wheat,3);assert.equal(e.s.storage.wheat,27);
  b.processing=true;assert.equal(e.prepareMaterials('machine',b.id,'feed'),false);
  const order=dailyOrders(e.s,'narin')[0];
  e.s.storage={...order.input};e.s.inventory={};
  assert.ok(e.prepareMaterials('order','narin',order.token));
  e.s.inventory={};e.s.storage={...order.input};e.s.day++;
  assert.equal(e.prepareMaterials('order','narin',order.token),false);
  assert.deepEqual(e.s.storage,order.input);
  e.s.overflow={wood:3};
  assert.equal(materialPlan(e.s,{wood:3}).missing[0].delivery,3);
});
void test('preparation commands reject supplied costs, invalid target shapes and forged order tokens',()=>{
  for(const args of [['craft',{wood:1000}],['craft','plank',{wood:1}],['machine',1],['machine',-1,'default'],['order','narin','1:torin:repair'],['other','plank']])
    assert.equal(validServerCommand({seq:1,method:'prepareMaterials',args}),false);
  assert.ok(validServerCommand({seq:1,method:'prepareMaterials',args:['craft','plank']}));
});
void test('four players competing for shared stock conserve items across duplicate requests and room reconstruction',async()=>{
  const e=farm();e.s.storage={wood:3};e.s.inventory={};
  const record:SharedRecord={world:{state:e.s},players:{},room:'materials',history:[]};
  const ids=['host','a','b','c'];
  for(const id of ids){const p=ensureSharedPlayer(record,id,'host',id,1000);p.inventory={};p.paused=true;}
  record.world.state.inventory=record.players.host.inventory;
  let room=new RoomCore(record,'host',0);room.connect('host','host',1000);
  for(const id of ids){
    const p=room.record.players[id];
    const request={op:'pulse',revision:room.revision,pulse:{seq:1,paused:true,pose:{...p.player},commands:[{seq:1,method:'prepareMaterials',args:['craft','plank']}]}};
    const nonce=p.nonce;
    assert.equal((await room.pulse(id,id,request,nonce,1100)).status,200);
    assert.equal((await room.pulse(id,id,request,nonce,1200)).status,200);
  }
  assert.equal(room.record.world.state.storage.wood,0);
  assert.deepEqual(ids.map(id=>room.record.players[id].inventory.wood||0),[3,0,0,0]);
  room=new RoomCore(JSON.parse(JSON.stringify(room.record)), 'host',room.revision);
  room.connect('host','host',1300);
  room.connect('a','a',1300);
  assert.equal(room.record.players.host.inventory.wood,3);
  assert.equal(room.record.world.state.storage.wood,0);
});
