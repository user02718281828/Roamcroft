import test from 'node:test';
import assert from 'node:assert/strict';
import {CrazyGamesDataStore,createCrazyGamesDataSession,DATA_KEY,DATA_LIMIT} from '../lib/platform/crazygames-data.ts';
import {createState} from '../lib/game/model.ts';
import {Buffer} from 'node:buffer';
function fixture(){
 const values=new Map<string,string>(),errors:string[]=[],listeners=new Set<()=>void>();
 const auth={addAuthListener:(fn:()=>void)=>{listeners.add(fn);},removeAuthListener:(fn:()=>void)=>{listeners.delete(fn);}};
 const data={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};
 return {values,errors,data,setOwner:(_v:string)=>{for(const fn of listeners)fn();},store:()=>createCrazyGamesDataSession(data,auth,()=>{},e=>errors.push(e)).store};
}

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
 const disabled=new CrazyGamesDataStore({getItem(){throw Error('dataModuleDisabled');},setItem(){throw Error('unexpected');}},()=>{});await assert.rejects(disabled.load(),/dataModuleDisabled/);
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
 const sessions:ReturnType<typeof createCrazyGamesDataSession>[]=[];
 const session=()=>{const s=createCrazyGamesDataSession(data,undefined,()=>{},()=>{});sessions.push(s);return s.store;};
 // SDK reload destroys the previous game when switching account scope.
 const changeOwner=(next:string)=>{for(const s of sessions)s.dispose();owner=next;};
 const guest=session(),g=await guest.load();g.gold=123;await guest.save(g);
 changeOwner('account-a');assert.equal(await guest.save(g),false);assert.equal(bucket().size,0);
 const a=session(),world=await a.load();world.gold=456;await a.save(world);
 changeOwner('guest');assert.equal((await session().load()).gold,123);
 changeOwner('account-a');assert.equal((await session().load()).gold,456);
});


test('Data Module boot/reopen never requires getUser, userId or a token, even when User APIs fail',async()=>{
 const f=fixture();let removed=0;
 const auth={get isUserAccountAvailable(){throw Error('temporary user failure');},getUser(){throw Error('temporary getUser failure');},getUserToken(){throw Error('token must not be requested');},addAuthListener(_fn:()=>void){},removeAuthListener(_fn:()=>void){removed++;}};
 const session=createCrazyGamesDataSession(f.data,auth,()=>{},()=>{});
 const state=await session.store.load();state.gold=912;
 assert.equal(await session.store.save(state),true);
 session.dispose();assert.equal(removed,1);
 assert.equal((await createCrazyGamesDataSession(f.data,auth,()=>{},()=>{}).store.load()).gold,912);
 assert.equal((await createCrazyGamesDataSession(f.data,undefined,()=>{},()=>{}).store.load()).gold,912);
 const unavailable={addAuthListener(){throw Error('userModuleDisabled');}};
 assert.equal((await createCrazyGamesDataSession(f.data,unavailable,()=>{},()=>{}).store.load()).gold,912);
});

test('auth event during load or compression blocks stale reads/writes',async()=>{
 const f=fixture(),seed=f.store(),original=await seed.load();await seed.save(original);
 const before=f.values.get(DATA_KEY);let notify:()=>void=()=>{},changes=0;
 const auth={addAuthListener(fn:()=>void){notify=fn;}};
 const first=createCrazyGamesDataSession(f.data,auth,()=>{changes++;},()=>{});
 const loading=first.store.load();notify();
 await assert.rejects(loading,/Account changed/);assert.equal(f.values.get(DATA_KEY),before);
 const second=createCrazyGamesDataSession(f.data,auth,()=>{changes++;},()=>{});
 const state=await second.store.load();
 const saving=second.store.save(state);notify();
 assert.equal(await saving,false);assert.equal(f.values.get(DATA_KEY),before);
 assert.equal(changes,2);assert.equal(await second.store.save(state),false);
});
