import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {deviceSaveHint} from '../lib/ui/device-save-hint.ts';
import {SAVE_KEY} from '../lib/game/save.ts';

test('launcher presence check preserves legacy local data and handles blocked storage',async()=>{
  assert.equal(await deviceSaveHint({getItem:key=>key===SAVE_KEY?'existing-save':null},undefined),'present');
  assert.equal(await deviceSaveHint({getItem(){throw Error('denied');}},undefined),'unknown');
});
test('launcher hint does not create a database on a first visit',async()=>{
  const factory=new IDBFactory();
  assert.equal(await deviceSaveHint({getItem:()=>null},factory),'empty');
  assert.equal((await factory.databases()).length,0);
});
test('launcher recognizes old and rotated saves without touching stored values',async()=>{
  for(const key of ['current','snapshot-a']){
    const factory=new IDBFactory();
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=factory.open('ocak-vadisi-worlds',1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>resolve(r.result);r.onerror=reject;});
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put({keep:'unchanged'},key);tx.oncomplete=()=>resolve();tx.onerror=reject;});
    assert.equal(await deviceSaveHint({getItem:()=>null},factory),'present');
    const stored=await new Promise((resolve,reject)=>{const r=db.transaction('saves').objectStore('saves').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=reject;});
    assert.deepEqual(stored,{keep:'unchanged'});db.close();
  }
});
