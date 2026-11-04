import test from 'node:test';
import assert from 'node:assert/strict';
import {CrazyGamesDataStore,DATA_KEY,DATA_LIMIT} from '../lib/platform/crazygames-data.ts';
import {createState} from '../lib/game/model.ts';
import {Buffer} from 'node:buffer';
function fixture(){const values=new Map<string,string>();let owner='guest';const errors:string[]=[];const data={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};return {values,errors,data,setOwner:(v:string)=>{owner=v;},store:()=>new CrazyGamesDataStore(data,async()=>owner,owner,e=>errors.push(e))};}
test('read gate prevents blank overwrite; guest/account reopen retains validated compressed state and backup',async()=>{
 const f=fixture(),early=f.store();assert.equal(await early.save(createState(9)),false);assert.equal(f.values.size,0);
 const store=f.store(),state=await store.load();state.gold=777;assert.equal(await store.save(state),true);
 assert.ok(new TextEncoder().encode(JSON.stringify(Object.fromEntries(f.values))).length<DATA_LIMIT);
 assert.equal((await f.store().load()).gold,777);
 state.gold=888;assert.equal(await store.save(state),true);assert.ok(JSON.parse(f.values.get(DATA_KEY)!).backup);
 assert.equal((await f.store().load()).gold,888);
});
test('identity change, concurrent cloud change, corrupt data and disabled module never replace existing progress',async()=>{
 const f=fixture(),store=f.store(),state=await store.load();state.gold=123;await store.save(state);const before=f.values.get(DATA_KEY);
 f.setOwner('account-b');assert.equal(await store.save(createState(2)),false);assert.equal(f.values.get(DATA_KEY),before);
 const second=f.store();await second.load();f.values.set(DATA_KEY,'invalid');assert.equal(await second.save(state),false);assert.equal(f.values.get(DATA_KEY),'invalid');
 await assert.rejects(f.store().load());assert.equal(f.values.get(DATA_KEY),'invalid');
 const disabled=new CrazyGamesDataStore({getItem(){throw Error('dataModuleDisabled');},setItem(){throw Error('unexpected');}},async()=>'guest','guest',()=>{});await assert.rejects(disabled.load(),/dataModuleDisabled/);
});
test('oversize incompressible snapshot is rejected without truncating or overwriting',async()=>{
 const f=fixture(),store=f.store(),state=await store.load();await store.save(state);const before=f.values.get(DATA_KEY);
 const cryptoRandom=Buffer.from((await import('node:crypto')).randomBytes(1200000)).toString('base64');
 (state as unknown as {testPadding:string}).testPadding=cryptoRandom;
 assert.equal(await store.save(state),false);assert.equal(f.values.get(DATA_KEY),before);assert.match(f.errors.at(-1)!,/1 MB/);
});
test('SDK-scoped account stores remain separate and stale guest writes are blocked',async()=>{
 let owner='guest';const accounts=new Map<string,Map<string,string>>();
 const bucket=()=>{if(!accounts.has(owner))accounts.set(owner,new Map());return accounts.get(owner)!;};
 const data={getItem:(key:string)=>bucket().get(key)??null,setItem:(key:string,value:string)=>{bucket().set(key,value);}};
 const session=()=>new CrazyGamesDataStore(data,async()=>owner,owner,()=>{});
 const guest=session(),g=await guest.load();g.gold=123;await guest.save(g);
 owner='account-a';assert.equal(await guest.save(g),false);assert.equal(bucket().size,0);
 const a=session(),world=await a.load();world.gold=456;await a.save(world);
 owner='guest';assert.equal((await session().load()).gold,123);
 owner='account-a';assert.equal((await session().load()).gold,456);
});
