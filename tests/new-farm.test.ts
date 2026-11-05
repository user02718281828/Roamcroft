import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {createState, Engine, SAVE_VERSION} from '../lib/game/model.ts';
import {createNewFarm, prepareNewFarm, type StartProfile} from '../lib/game/new-farm.ts';
import {serialize, deserialize} from '../lib/game/save.ts';
import {saveStored, loadStored} from '../lib/game/storage.ts';
import {scenarioState, simulateFirstLoop, startingOptions} from '../scripts/first-session-audit.ts';

test('standard new farm is exactly the existing default and profiles do not leak between farms',()=>{
  for(const seed of [42,84621,20261029]) {
    const standard=createState(seed),before=structuredClone(standard);
    assert.deepEqual(createNewFarm(seed),standard);
    assert.deepEqual(createNewFarm(seed,'standard'),standard);
    const lean=createNewFarm(seed,'lean');
    assert.equal(lean.gold,60);
    assert.deepEqual(lean,scenarioState(seed,'proposal'));
    const {gold,inventory,...rest}=lean;
    const {gold:oldGold,inventory:oldInventory,...oldRest}=standard;
    assert.deepEqual(rest,oldRest,'only starting gold and supplies differ');
    assert.deepEqual(standard,before);
    lean.inventory.wood=900;
    assert.equal(createNewFarm(seed,'lean').inventory.wood,8);
    assert.deepEqual(createNewFarm(seed),standard);
    assert.equal(SAVE_VERSION,1);
    assert.equal(gold,60);assert.equal(oldGold,180);assert.notDeepEqual(inventory,oldInventory);
  }
});

test('lean supplies can finish the existing real Engine first loop on all audited seeds',()=>{
  for(const seed of [42,84621,20261029]) {
    assert.deepEqual(startingOptions(createNewFarm(seed,'lean')).buildings,['fence']);
    const run=simulateFirstLoop(seed,'lean');
    for(const id of ['gather','till','plant','harvest','craft','sell','build'])assert.ok(run.marks[id]>=0);
    assert.ok(run.hits>0);
    assert.ok(run.state.buildings.some(b=>b.type==='workshop'));
    const restored=new Engine(deserialize(serialize(run.state)));
    const inventory=structuredClone(restored.s.inventory);
    assert.equal(restored.claim('firstcraft'),true);
    assert.equal(restored.claim('firstsale'),true);
    assert.equal(restored.s.inventory.carrotseed,(inventory.carrotseed||0)+4);
    assert.equal(restored.s.inventory.wood,(inventory.wood||0)+6);
    const claimed=structuredClone(restored.s);
    assert.equal(restored.claim('firstsale'),false);assert.equal(restored.claim('firstcraft'),false);
    assert.deepEqual(restored.s,claimed);
  }
});

test('new farm is not published before persistence ACK; false and thrown errors reject',async()=>{
  const current=createState(42);current.gold=789;current.upgrades.axe=3;
  const original=serialize(current);
  let ack!:(ok:boolean)=>void,finished=false,calls=0;
  const promise=prepareNewFarm(84621,'lean',async state=>{
    calls++;assert.equal(state.gold,60);return new Promise<boolean>(resolve=>{ack=resolve;});
  }).then(state=>{finished=true;return state;});
  await Promise.resolve();assert.equal(finished,false);assert.equal(calls,1);
  ack(true);const candidate=await promise;assert.equal(candidate.gold,60);
  assert.equal(deserialize(original).gold,current.gold);assert.equal(current.upgrades.axe,3);
  await assert.rejects(prepareNewFarm(42,'standard',async()=>false),/kaydedilemedi/);
  await assert.rejects(prepareNewFarm(42,'lean',async()=>{throw Error('quota');}),/quota/);
  assert.equal(current.gold,789);assert.equal(current.upgrades.axe,3);
  await assert.rejects(prepareNewFarm(42,'unknown' as StartProfile,async()=>{throw Error('must not write');}),/Unknown start profile/);
});

test('confirmed new farm persists through IndexedDB and retains the previous farm snapshot',async()=>{
  Object.defineProperty(globalThis,'indexedDB',{value:indexedDB,configurable:true});
  const values=new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{value:{
    getItem:(key:string)=>values.get(key)||null,
    setItem:(key:string,value:string)=>values.set(key,value),
    removeItem:(key:string)=>values.delete(key),
  },configurable:true});
  const previous=createState(42);previous.gold=789;previous.upgrades.axe=3;
  assert.equal(await saveStored(previous),true);
  const next=await prepareNewFarm(84621,'lean',saveStored);
  assert.deepEqual((await loadStored()).state,next);
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open('ocak-vadisi-worlds',1);
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  try {
    const head=await new Promise<{backup:string}>((resolve,reject)=>{
      const r=db.transaction('saves','readonly').objectStore('saves').get('head');
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    const backup=await new Promise<{state:ReturnType<typeof createState>}>((resolve,reject)=>{
      const r=db.transaction('saves','readonly').objectStore('saves').get(head.backup);
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    assert.equal(backup.state.seed,42);assert.equal(backup.state.gold,789);assert.equal(backup.state.upgrades.axe,3);
    const reloaded=new Engine((await loadStored()).state!);
    assert.equal(reloaded.s.gold,60);assert.equal(reloaded.s.inventory.wood,8);
  } finally {db.close();}
});
