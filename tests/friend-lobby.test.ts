import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import {handleWorld} from '../lib/server/api.ts';
import {handleLobby} from '../lib/server/lobby.ts';
function harness(){
  const sqlite=new DatabaseSync(':memory:');let now=1_000_000;
  class Statement{args:SQLInputValue[]=[];sql:string;constructor(sql:string){this.sql=sql;}bind(...args:SQLInputValue[]){this.args=args;return this;}
    async first(){return sqlite.prepare(this.sql).get(...this.args)||null;}
    async all(){return {results:sqlite.prepare(this.sql).all(...this.args)};}
    async run(){return {meta:{changes:Number(sqlite.prepare(this.sql).run(...this.args).changes)}};}}
  const db={prepare:(sql:string)=>new Statement(sql),batch:async(statements:Statement[])=>{sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}} as unknown as D1Database;
  const request=(path:string,body:unknown,cookie='',origin='https://farm.test')=>new Request('https://farm.test'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
  return {sqlite,advance:(ms:number)=>now+=ms,session:async()=>{const r=await handleWorld(request('/api/world',{op:'session'}),db,now);assert.equal(r.status,201);return r.headers.get('Set-Cookie')!.split(';')[0];},call:async(body:unknown,cookie='',origin='https://farm.test')=>{const r=await handleLobby(request('/api/lobby',body,cookie,origin),db,now);return {status:r.status,data:await r.json() as {room:null|{code:string;host:boolean;sharedWorld:true;members:{name:string;you:boolean;host:boolean;online:boolean}[]};error?:string},headers:r.headers};}};
}
void test('lobbies require a real cookie session and reject foreign origins and injected state',async()=>{
  const h=harness();try{
    assert.equal((await h.call({op:'status'})).status,401);
    assert.equal((await h.call({op:'status'},'__Host-roamcroft-session='+'a'.repeat(64))).status,401);
    const cookie=await h.session();assert.equal((await h.call({op:'create',name:'A'},cookie,'https://evil.test')).status,403);
    assert.equal((await h.call({op:'create',name:'A',world:{gold:999}},cookie)).status,400);
    assert.equal((await h.call({op:'create',name:'\n'},cookie)).status,400);
  }finally{h.sqlite.close();}
});
void test('four friends can join, fifth is refused; guests cannot close host room and no identities leak',async()=>{
  const h=harness();try{
    const cookies=[];for(let i=0;i<5;i++)cookies.push(await h.session());
    const first=await h.call({op:'create',name:'Ev sahibi'},cookies[0]),code=first.data.room!.code;
    assert.equal(first.status,200);assert.equal(first.data.room!.sharedWorld,true);assert.equal(first.headers.get('Cache-Control'),'no-store');
    for(let i=1;i<4;i++)assert.equal((await h.call({op:'join',name:'Arkadaş '+i,code},cookies[i])).status,200);
    assert.equal((await h.call({op:'join',name:'Beşinci',code},cookies[4])).status,409);
    const status=await h.call({op:'status'},cookies[1]);assert.equal(status.data.room!.host,false);assert.equal(status.data.room!.members.length,4);
    assert.deepEqual(Object.keys(status.data.room!.members[0]).sort(),['host','name','online','you']);
    assert.equal((await h.call({op:'leave'},cookies[1])).data.room,null);
    assert.equal((await h.call({op:'status'},cookies[0])).data.room!.members.length,3);
    assert.equal((await h.call({op:'join',name:'Beşinci',code},cookies[4])).status,200);
    assert.equal((await h.call({op:'create',name:'Tekrar'},cookies[0])).data.room!.code,code);
    await h.call({op:'leave'},cookies[0]);assert.equal((await h.call({op:'status'},cookies[2])).data.room,null);
  }finally{h.sqlite.close();}
});
void test('lobby expiration, stale presence and request limits are enforced server side',async()=>{
  const h=harness();try{
    const host=await h.session(),guest=await h.session();const room=(await h.call({op:'create',name:'Ev sahibi'},host)).data.room!;
    await h.call({op:'join',name:'Konuk',code:room.code},guest);h.advance(91_000);
    assert.equal((await h.call({op:'status'},host)).data.room!.members.length,1);
    assert.equal((await h.call({op:'status'},guest)).data.room,null);
    let limited=false;for(let i=0;i<32;i++)if((await h.call({op:'status'},host)).status===429)limited=true;assert.ok(limited);
    h.advance(301_000);assert.equal((await h.call({op:'status'},host)).data.room,null);
    assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM friend_members').get()!.n,0);
  }finally{h.sqlite.close();}
});
