import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleWorld} from '../lib/server/api.ts';
import {applyDelta} from '../lib/server/delta.ts';
import {ServerWorldClient} from '../lib/server/client.ts';
import {Engine} from '../lib/game/model.ts';

function harness(){
  const sqlite=new DatabaseSync(':memory:');let now=100000;
  const snapshots=new Map<string,{state:any;seq:number}>();
  class Statement{args:any[]=[];sql:string;constructor(sql:string){this.sql=sql;}bind(...args:any[]){this.args=args;return this;}
    async first(){return sqlite.prepare(this.sql).get(...this.args)||null;}
    async run(){const r=sqlite.prepare(this.sql).run(...this.args);return {meta:{changes:Number(r.changes)}};}}
  const db={prepare:(sql:string)=>new Statement(sql),batch:async(statements:Statement[])=>{sqlite.exec('BEGIN');try{const results=[];for(const s of statements){const r=sqlite.prepare(s.sql).run(...s.args);results.push({meta:{changes:Number(r.changes)}});}sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}} as unknown as D1Database;
  return {sqlite,advance:(ms:number)=>now+=ms,call:async(body:unknown,cookie='',nonce='',headers:Record<string,string>={})=>{
    const response=await handleWorld(new Request('https://farm.test/api/world',{method:'POST',headers:{Origin:'https://farm.test','Content-Type':'application/json',Cookie:cookie,'X-Roamcroft-Nonce':nonce,...headers},body:JSON.stringify(body)}),db,now);
    const data=await response.json() as any,bytes=JSON.stringify(data).length;
    const key=(response.headers.get('Set-Cookie')||cookie).split(';')[0];
    if(data.delta){const previous=snapshots.get(key)!;data.state=applyDelta(previous.state,data.delta,previous.seq);}
    if(data.state)snapshots.set(key,{state:data.state,seq:data.seq});
    return {status:response.status,headers:response.headers,data,bytes};
  }};
}
const pulse=(seq:number,commands:unknown[]=[],pose={x:15,z:20,facing:0})=>({op:'pulse',pulse:{seq,commands,pose,paused:false}});
test('server sessions use hashed secrets and strict cookies; foreign origins and forged sessions fail',async()=>{
  const h=harness();assert.equal((await h.call({op:'session'},'','',{Origin:'https://evil.test'})).status,403);
  const session=await h.call({op:'session'});assert.equal(session.status,201);
  const cookie=session.headers.get('Set-Cookie')!;for(const flag of ['HttpOnly','Secure','SameSite=Strict','Path=/'])assert.ok(cookie.includes(flag));
  const row=h.sqlite.prepare('SELECT id FROM authoritative_worlds').get() as {id:string};assert.ok(!cookie.includes(row.id));
  assert.equal((await h.call(pulse(1))).status,401);
  assert.equal((await h.call(pulse(1),cookie.split(';')[0],'forged')).status,403);
  assert.equal((await h.call({op:'session'},cookie.split(';')[0])).data.state.gold,session.data.state.gold);
  h.sqlite.close();
});

test('client retries a lost response with the same nonce and drains its command queue on save',async()=>{
  const h=harness(),originalFetch=globalThis.fetch;let cookie='',loseResponse=true,engine:Engine|null=null;
  globalThis.fetch=async(_url,options)=>{
    const result=await h.call(JSON.parse(String(options!.body)),cookie,(options!.headers as Record<string,string>)['X-Roamcroft-Nonce']||'');
    if(result.headers.get('Set-Cookie'))cookie=result.headers.get('Set-Cookie')!.split(';')[0];
    if(JSON.parse(String(options!.body)).op==='pulse'&&loseResponse){loseResponse=false;throw Error('Yanıt bağlantıda kayboldu.');}
    // Test istemciyi gerçek ağdaki fark paketiyle besler.
    if(result.data.delta)delete result.data.state;
    return Response.json(result.data,{status:result.status,headers:result.headers});
  };
  const client=new ServerWorldClient(()=>engine,()=>true,()=>{});
  try{
    engine=new Engine(await client.start());client.bind(engine);
    for(let i=0;i<12;i++)assert.equal(engine.trade('wood',1,false),true);
    assert.equal(engine.s.inventory.wood,25);
    await assert.rejects(()=>client.flush());
    await client.flush();
    assert.equal(engine.s.inventory.wood,13);
    const row=h.sqlite.prepare('SELECT world,command_seq FROM authoritative_worlds').get() as {world:string;command_seq:number};
    assert.equal(row.command_seq,12);assert.equal(JSON.parse(row.world).state.inventory.wood,13);
  }finally{client.dispose();globalThis.fetch=originalFetch;h.sqlite.close();}
});
test('server rejects client state, time, unsafe method names and replayed reward changes',async()=>{
  const h=harness(),session=await h.call({op:'session'}),cookie=session.headers.get('Set-Cookie')!.split(';')[0],nonce=session.data.nonce;
  assert.equal((await h.call({...pulse(1),state:{gold:999999}},cookie,nonce)).status,400);
  const forged=pulse(1);Object.assign(forged.pulse,{elapsed:99999});assert.equal((await h.call(forged,cookie,nonce)).status,400);
  for(const method of ['add','gainXp','nextDay','constructor','__proto__'])assert.equal((await h.call(pulse(1,[{seq:1,method,args:[]}]),cookie,nonce)).status,400);
  const body=pulse(1,[{seq:1,method:'trade',args:['wood',1,false]}]);
  const accepted=await h.call(body,cookie,nonce);assert.equal(accepted.status,200);assert.ok(accepted.data.state.gold>session.data.state.gold);
  const duplicate=await h.call(body,cookie,nonce);assert.equal(duplicate.status,200);assert.equal(duplicate.data.state.gold,accepted.data.state.gold);
  const altered=await h.call(pulse(1,[{seq:1,method:'trade',args:['wood',9,false]}]),cookie,nonce);assert.equal(altered.status,403);
  assert.equal((await h.call(pulse(3),cookie,accepted.data.nonce)).status,409);
  h.sqlite.close();
});
test('simultaneous commands commit only once and stale retries return the committed world',async()=>{
  const h=harness(),s=await h.call({op:'session'}),cookie=s.headers.get('Set-Cookie')!.split(';')[0];
  const body=pulse(1,[{seq:1,method:'trade',args:['wood',1,false]}]);
  const results=await Promise.all([h.call(body,cookie,s.data.nonce),h.call(body,cookie,s.data.nonce)]);
  assert.ok(results.some(r=>r.status===200));assert.ok(results.every(r=>[200,409].includes(r.status)));
  const retry=await h.call(body,cookie,s.data.nonce);assert.equal(retry.status,200);assert.equal(retry.data.state.inventory.wood,s.data.state.inventory.wood-1);
  h.sqlite.close();
});
test('server time limits movement, paused time and disconnected catch-up',async()=>{
  const h=harness(),s=await h.call({op:'session'}),cookie=s.headers.get('Set-Cookie')!.split(';')[0];
  let current=await h.call(pulse(1),cookie,s.data.nonce);const start=current.data.state.player;
  h.advance(600000);
  current=await h.call(pulse(2,[],{x:1e8,z:1e8,facing:0}),cookie,current.data.nonce);
  assert.ok(Math.hypot(current.data.state.player.x-start.x,current.data.state.player.z-start.z)<6);
  assert.ok(current.data.state.time-s.data.state.time<.01);
  const pause=pulse(3);pause.pulse.paused=true;h.advance(600000);
  const stopped=await h.call(pause,cookie,current.data.nonce);assert.equal(stopped.data.state.time,current.data.state.time);
  h.sqlite.close();
});
test('anonymous world creation and oversized bodies are rate-limited before engine work',async()=>{
  const h=harness();assert.equal((await h.call({op:'session',padding:'a'.repeat(9000)})).status,413);
  for(let i=0;i<5;i++)assert.equal((await h.call({op:'session'})).status,201);
  const limited=await h.call({op:'session'});assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'3600');
  h.sqlite.close();
});

test('incremental updates reconstruct persisted state and do not retransmit unchanged terrain',async()=>{
  const h=harness(),s=await h.call({op:'session'}),cookie=s.headers.get('Set-Cookie')!.split(';')[0];
  const update=await h.call(pulse(1,[{seq:1,method:'trade',args:['wood',1,false]}]),cookie,s.data.nonce);
  assert.equal(update.status,200);assert.ok(update.bytes<s.bytes/10);assert.equal(update.data.delta.tiles,undefined);
  const row=h.sqlite.prepare('SELECT world FROM authoritative_worlds').get() as {world:string};
  assert.deepEqual(update.data.state,JSON.parse(row.world).state);
  assert.throws(()=>applyDelta(s.data.state,update.data.delta,99));h.sqlite.close();
});

test('another session cannot reuse a nonce and invalid purchases cannot create wealth',async()=>{
  const h=harness(),a=await h.call({op:'session'}),b=await h.call({op:'session'}),cookie=b.headers.get('Set-Cookie')!.split(';')[0];
  assert.equal((await h.call(pulse(1),cookie,a.data.nonce)).status,403);
  const r=await h.call(pulse(1,[{seq:1,method:'trade',args:['wood',999,false]},{seq:2,method:'claim',args:['__proto__']},{seq:3,method:'enterMine',args:[5]}]),cookie,b.data.nonce);
  assert.equal(r.status,200);assert.equal(r.data.state.gold,b.data.state.gold);assert.deepEqual(r.data.state.inventory,b.data.state.inventory);assert.equal(r.data.state.mine,null);
  assert.equal((await h.call(pulse(2,[{seq:4,method:'gift',args:[['narin']]}]),cookie,r.data.nonce)).status,400);
  h.sqlite.close();
});

test('active sessions renew their lifetime without changing the owning secret',async()=>{
  const h=harness(),s=await h.call({op:'session'}),cookie=s.headers.get('Set-Cookie')!.split(';')[0];
  h.advance(29*86400000);
  const active=await h.call(pulse(1),cookie,s.data.nonce);assert.equal(active.status,200);assert.ok(active.headers.get('Set-Cookie')!.startsWith(cookie+';'));
  h.advance(2*86400000);assert.equal((await h.call({op:'session'},cookie)).status,200);
  h.sqlite.close();
});
