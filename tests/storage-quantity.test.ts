import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine,createState} from '../lib/game/model.ts';
import {serialize,deserialize} from '../lib/game/save.ts';
import {storageQuote} from '../lib/ui/storage-view.ts';
function chest(){const e=new Engine(deserialize(serialize(createState())));e.s.buildings.find(b=>b.type==='campfire')!.type='chest';return e;}

test('exact transfer amount preserves total stock and legacy save round trip',()=>{
  const e=chest(),before=e.s.inventory.wood;
  const q=storageQuote(e,'wood',true,7);assert.equal(q.amount,7);assert.equal(e.s.inventory.wood,before);
  assert.ok(e.transferStorage(q.id,q.amount,q.deposit));
  assert.equal(e.s.inventory.wood,before-7);assert.equal(e.s.storage.wood,7);
  assert.ok(e.transferStorage('wood',3,false));
  const loaded=deserialize(serialize(e.s));assert.equal(loaded.inventory.wood+loaded.storage.wood,before);
});
test('invalid requested quantities cannot create an actionable quote',()=>{
  const e=chest(),before=structuredClone(e.s);
  for(const n of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.equal(storageQuote(e,'wood',true,n).amount,0);
  assert.deepEqual(e.s,before);
  assert.equal(e.s.inventory.wood,25);assert.equal(e.s.storage.wood||0,0);
});
test('quote is bounded by stock and destination capacity; changed intent invalidates confirmation',()=>{
  const e=chest();assert.equal(storageQuote(e,'wood',true,100).amount,25);
  const small=storageQuote(e,'wood',true,2),large=storageQuote(e,'wood',true,10);
  assert.notEqual(small.signature,large.signature);
  e.s.storage.stone=1199;assert.equal(storageQuote(e,'wood',true,10).amount,1);
  assert.notEqual(storageQuote(e,'wood',true,2).signature,small.signature);
  e.s.storage.stone=1200;assert.equal(storageQuote(e,'wood',true,2).amount,0);
});
test('guest exact transfer waits for authority; shared/de-dup rules stay in Engine/server',()=>{
  const e=chest(),sent:unknown[]=[];
  e.network={guest:true,server:true,shared:true,peers:[],send:(method,args)=>{sent.push([method,args]);return true;}};
  const before=structuredClone([e.s.inventory,e.s.storage]);
  const q=storageQuote(e,'wood',true,4);assert.ok(e.transferStorage(q.id,q.amount,q.deposit));
  assert.deepEqual([e.s.inventory,e.s.storage],before);assert.deepEqual(sent,[['transferStorage',['wood',4,true]]]);
});
