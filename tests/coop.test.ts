import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleCoop} from '../lib/coop/server.ts';
import {CoopAuthority,applySharedState} from '../lib/coop/authority.ts';
import {encodeWorld,decodeWorld} from '../lib/coop/codec.ts';
import {Engine,createState,tileAt} from '../lib/game/model.ts';
import type {RoomSession,Command} from '../lib/coop/protocol.ts';

function database(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../drizzle/0000_dear_toro.sql',import.meta.url),'utf8'));
 class Statement {
  args:(string|number|null)[]=[];
  sql:string;
  constructor(sql:string){this.sql=sql;}
  bind(...args:(string|number|null)[]){this.args=args;return this;}
  async first(){return sqlite.prepare(this.sql).get(...this.args)||null;}
  async all(){return {results:sqlite.prepare(this.sql).all(...this.args),success:true};}
  async run(){const result=sqlite.prepare(this.sql).run(...this.args);return {meta:{changes:Number(result.changes)},success:true};}
 }
 const db={prepare:(sql:string)=>new Statement(sql),batch:async(statements:Statement[])=>{sqlite.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 return {sqlite,db:db as unknown as D1Database};
}
function harness(){const {db,sqlite}=database();let now=100000;
 return {sqlite,advance:(ms:number)=>now+=ms,call:async(user:string,body:Record<string,unknown>,session?:RoomSession,extra:Record<string,string>={})=>{
 const response=await handleCoop(new Request('https://farm.test/api/coop',{method:'POST',headers:{'Content-Type':'application/json','X-Roamcroft':'1','oai-authenticated-user-id':user,...(session?{Authorization:'Bearer '+session.token}:{}),...extra},body:JSON.stringify({...body,...(session?{member:session.member}:{})})}),db,now);
 return {status:response.status,data:await response.json() as RoomSession & {rooms:{id:string}[];snapshot:string;commands:{id:number}[];acceptedSeq:number}};
 }};
}
test('co-op authenticates identities, enforces four seats, persists world and resumes only for owner',async()=>{
 const h=harness();
 assert.equal((await h.call('',{op:'list'})).status,401);
 assert.equal((await h.call('owner',{op:'list'},undefined,{Origin:'https://evil.test'})).status,403);
 const host=(await h.call('owner',{op:'create',name:'Çiftçi',worldName:'Yuvam'})).data as RoomSession;
 assert.equal(host.role,'host');assert.equal((await h.call('friend',{op:'join',name:'Ada',room:host.room})).status,409);
 const world=await encodeWorld({state:new Engine(createState()).s,peers:[]});
 assert.equal((await h.call('owner',{op:'publish',snapshot:world,revision:1,ack:0},host)).status,200);
 const guests:RoomSession[]=[];
 for(let i=0;i<3;i++){const response=await h.call('friend'+i,{op:'join',name:'Arkadaş '+i,room:host.room});assert.equal(response.status,200);guests.push(response.data);}
 assert.equal((await h.call('fifth',{op:'join',name:'Beşinci',room:host.room})).status,409);
 assert.equal((await h.call('imposter',{op:'pulse'},guests[0])).status,401);
 assert.equal((await h.call('friend0',{op:'publish',snapshot:world,revision:2,ack:0},guests[0])).status,403);
 assert.equal((await h.call('owner',{op:'list'})).data.rooms.length,1);
 assert.equal((await h.call('friend0',{op:'list'})).data.rooms.length,0);
 await h.call('friend0',{op:'leave'},guests[0]);
 assert.equal((await h.call('fifth',{op:'join',name:'Yeni',room:host.room})).status,200);
 await h.call('owner',{op:'leave'},host);
 assert.equal((await h.call('friend1',{op:'resume',name:'Olmaz',room:host.room})).status,403);
 const resumed=await h.call('owner',{op:'resume',name:'Çiftçi',room:host.room});assert.equal(resumed.status,200);assert.equal(resumed.data.snapshot,world);
 assert.equal((await h.call('owner',{op:'resume',name:'İkinci pencere',room:host.room})).status,409);
 h.sqlite.close();
});
test('command acknowledgements survive deletion and retries; full queues never acknowledge dropped commands',async()=>{
 const h=harness(),host=(await h.call('host',{op:'create',name:'Ev'})).data as RoomSession;
 await h.call('host',{op:'publish',snapshot:'d29ybGQ=',revision:1,ack:0},host);
 const guest=(await h.call('guest',{op:'join',name:'Konuk',room:host.room})).data as RoomSession;
 const command=(seq:number):Command=>({seq,method:'attack',args:[]});
 for(let offset=0;offset<32;offset+=8){const r=await h.call('guest',{op:'pulse',commands:Array.from({length:8},(_,i)=>command(offset+i+1))},guest);assert.equal(r.data.acceptedSeq,offset+8);}
 const full=await h.call('guest',{op:'pulse',commands:[command(33)]},guest);assert.equal(full.data.acceptedSeq,32);
 const pulse=await h.call('host',{op:'pulse'},host);assert.equal(pulse.data.commands.length,32);
 const ack=pulse.data.commands.at(-1)!.id;
 await h.call('host',{op:'publish',snapshot:'d29ybGQ=',revision:2,ack},host);
 await h.call('guest',{op:'pulse',commands:[command(32)]},guest);
 assert.equal((await h.call('host',{op:'pulse'},host)).data.commands.length,0);
 assert.equal((await h.call('guest',{op:'pulse',commands:[command(33)]},guest)).data.acceptedSeq,33);
 assert.equal((await h.call('guest',{op:'pulse',commands:[command(34),command(33)]},guest)).status,400);
 assert.equal((await h.call('host',{op:'publish',snapshot:'d29ybGQ=',revision:1,ack:0},host)).status,409);
 h.sqlite.close();
});
test('host authority applies shared harvest once and keeps each player position and energy separate',()=>{
 const e=new Engine(createState()),authority=new CoopAuthority(),hostPosition={...e.s.player};
 const tile=tileAt(e.s,18,18)!;tile.crop='wheat';tile.growth=1000;
 authority.peers.set('guest',{id:'guest',name:'Ada',player:{...e.s.player,x:18,z:19}});
 const members=[{id:'host',name:'Ev',pose:'{}'},{id:'guest',name:'Ada',pose:JSON.stringify({x:18,z:19,facing:0})}];
 const commands=[{id:1,member:'guest',payload:JSON.stringify({seq:1,method:'act',args:[18,18,'hand','wheat']})}];
 authority.update(e,'host',members,commands,.3);const wheat=e.s.inventory.wheat;
 assert.ok(wheat>0);assert.deepEqual(e.s.player,hostPosition);assert.ok(authority.peers.get('guest')!.player.energy<100);
 authority.update(e,'host',members,commands,.3);assert.equal(e.s.inventory.wheat,wheat);assert.equal(tile.crop,null);
 const guest=new Engine(createState()),incoming=structuredClone(e.s);applySharedState(guest,incoming,authority.peers.get('guest'));
 assert.equal(guest.s.inventory.wheat,wheat);assert.equal(guest.s.player.energy,authority.peers.get('guest')!.player.energy);
});
test('shared snapshot codec round-trips storage and rejects corrupted or oversized worlds',async()=>{
 const e=new Engine(createState());e.s.storage.wood=800;
 const encoded=await encodeWorld({state:e.s,peers:[{id:'p',name:'Ada',player:{...e.s.player}}]});
 const decoded=await decodeWorld(encoded);assert.equal(decoded.state.storage.wood,800);assert.equal(decoded.peers[0].name,'Ada');
 await assert.rejects(()=>decodeWorld('broken'));await assert.rejects(()=>decodeWorld('a'.repeat(800001)));
});
