import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,Engine,SAVE_VERSION} from '../lib/game/model.ts';
import {serialize,deserialize,SAVE_KEY} from '../lib/game/save.ts';
import {DEFAULT_HOTBAR,HOTBAR_KEY,readHotbar,bindHotbarSlot,hotbarCount,hotbarIntent,eatHotbarItem} from '../lib/ui/hotbar.ts';

test('nine-slot preferences whitelist references and never accept quantities, tiers or forged IDs',()=>{
  const slots=readHotbar(JSON.stringify({version:1,slots:[{kind:'item',id:'bread',quantity:999,tier:3},{kind:'tool',id:'axe',level:3},{kind:'item',id:'__proto__'},{kind:'command',id:'trade'},{kind:'tool',id:'unknown'}]}));
  assert.equal(slots.length,9);assert.deepEqual(slots[0],{kind:'item',id:'bread'});assert.deepEqual(slots[1],{kind:'tool',id:'axe'});
  assert.ok(slots.slice(2).every(s=>s===null));
  for(const raw of [null,'invalid','x'.repeat(4097),JSON.stringify({version:2,slots:[]})])assert.deepEqual(readHotbar(raw),DEFAULT_HOTBAR);
  assert.notEqual(HOTBAR_KEY,SAVE_KEY);assert.equal(SAVE_VERSION,1);
});
test('binding/rebinding/clearing is immutable and preserves legacy inventory, upgrades, gold and save payload',()=>{
  const e=new Engine(deserialize(serialize(createState())));e.s.inventory.wood=1200;e.s.upgrades.axe=3;
  const before=JSON.parse(serialize(e.s)).payload;
  const a=bindHotbarSlot(DEFAULT_HOTBAR,8,{kind:'item',id:'bread'}),b=bindHotbarSlot(a,0,{kind:'item',id:'bread'});
  assert.equal(DEFAULT_HOTBAR[8],null);assert.equal(b.length,9);assert.equal(hotbarCount(b[0],e.s.inventory),e.s.inventory.bread);
  assert.deepEqual(hotbarIntent(b[8],e.s.inventory),{tool:'hand',item:'bread',available:true});
  assert.equal(bindHotbarSlot(b,9,null),b);assert.equal(bindHotbarSlot(b,-1,null),b);
  assert.equal(bindHotbarSlot(b,8,null)[8],null);
  assert.deepEqual(JSON.parse(serialize(e.s)).payload,before);
  const roundTrip=deserialize(serialize(e.s));assert.equal(roundTrip.inventory.wood,1200);assert.equal(roundTrip.upgrades.axe,3);
});
test('two bound references read a single live stock and depleted bindings cannot send consumption',()=>{
  const e=new Engine(createState());e.s.player.hunger=10;e.s.inventory.bread=1;
  const a=bindHotbarSlot(bindHotbarSlot(DEFAULT_HOTBAR,8,{kind:'item',id:'bread'}),0,{kind:'item',id:'bread'});
  assert.equal(hotbarCount(a[0],e.s.inventory),1);assert.ok(eatHotbarItem(e,'bread'));
  assert.equal(hotbarCount(a[8],e.s.inventory),0);assert.equal(eatHotbarItem(e,'bread'),false);
  assert.equal(hotbarIntent(a[0],e.s.inventory)?.available,false);assert.equal(a[0]?.id,'bread');
  e.s.inventory.bread=2;assert.equal(hotbarCount(a[8],e.s.inventory),2);
});
test('seed, fertilizer, building item and intrinsic tool bindings use existing action IDs without granting stock',()=>{
  const bag={wheatseed:2,fertilizer:1,applesapling:1};
  assert.deepEqual(hotbarIntent({kind:'item',id:'wheatseed'},bag),{tool:'seed',seed:'wheat',item:'wheatseed',available:true});
  assert.equal(hotbarIntent({kind:'item',id:'fertilizer'},bag)?.tool,'fertilize');
  assert.equal(hotbarIntent({kind:'item',id:'applesapling'},bag)?.build,'appletree');
  assert.deepEqual(hotbarIntent({kind:'tool',id:'axe'},{}),{tool:'axe',item:null,available:true});
  assert.equal(hotbarIntent({kind:'item',id:'wood'},{wood:20})?.available,false);
  assert.deepEqual(bag,{wheatseed:2,fertilizer:1,applesapling:1});
});
test('guest binding/use waits for existing authority; empty guest bag cannot create or consume an item',()=>{
  const e=new Engine(createState()),sent:unknown[]=[];
  e.s.inventory={};e.network={guest:true,server:true,shared:true,peers:[],send:(method,args)=>{sent.push([method,args]);return true;}};
  const slot=readHotbar(JSON.stringify({version:1,slots:[{kind:'item',id:'bread'}]}))[0];
  assert.equal(hotbarIntent(slot,e.s.inventory)?.available,false);assert.equal(eatHotbarItem(e,'bread'),false);assert.deepEqual(sent,[]);
  e.s.inventory.bread=1;const before=structuredClone(e.s);
  assert.ok(eatHotbarItem(e,'bread'));assert.deepEqual(e.s,before);assert.deepEqual(sent,[['eat',['bread']]]);
});
