import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {Buffer} from 'node:buffer';
import {verifyCrazyGamesToken,portalSecret} from '../lib/server/crazygames-auth.ts';
import {handleCrazyGames,type PortalEnv} from '../lib/server/crazygames-api.ts';
import {handleShared} from '../lib/server/shared-api.ts';
const pair=crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const encode=(v:unknown)=>Buffer.from(JSON.stringify(v)).toString('base64url');
async function token(user='user1',changes:Record<string,unknown>={},header:Record<string,unknown>={}){
 const now=Math.floor(Date.now()/1000),raw=encode({alg:'RS256',kid:'ingame-auth',typ:'JWT',...header})+'.'+encode({userId:user,gameId:'game-test',username:'Player.'+user,iat:now,exp:now+3600,...changes});
 return raw+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',(await pair).privateKey,new TextEncoder().encode(raw))).toString('base64url');
}
const verify=(value:string,game:string)=>verifyCrazyGamesToken(value,game,Date.now(),async()=>(await pair).publicKey);
test('portal tokens require pinned algorithm/key, valid signature, game, lifetime and a verified subject',async()=>{
 const good=await token();assert.equal((await verify(good,'game-test')).userId,'user1');
 for(const bad of [await token('user1',{gameId:'another'}),await token('user1',{exp:1}),await token('user1',{nbf:Math.floor(Date.now()/1000)+120}),await token('user1',{iat:Math.floor(Date.now()/1000)+120}),await token('user1',{}, {alg:'HS256'}),await token('user1',{}, {kid:'ingame-auth-legacy'}),await token('user1',{}, {jku:'https://evil.test/key'}),good.split('.').slice(0,2).join('.')+'.AAAA'])await assert.rejects(verify(bad,'game-test'));
 const identity=await verify(good,'game-test'),secret='a'.repeat(64);
 assert.equal(await portalSecret(identity,secret),await portalSecret(identity,secret));
 assert.notEqual(await portalSecret(identity,secret),await portalSecret({...identity,userId:'user2'},secret));
 assert.notEqual(await portalSecret(identity,secret),await portalSecret({...identity,gameId:'other'},secret));
});
function harness(){
 const sqlite=new DatabaseSync(':memory:');let touches=0;
 class Statement{sql:string;args:any[]=[];constructor(sql:string){this.sql=sql;}bind(...args:any[]){this.args=args;return this;}async first(){return sqlite.prepare(this.sql).get(...this.args)||null;}async all(){return {results:sqlite.prepare(this.sql).all(...this.args)};}async run(){return {meta:{changes:Number(sqlite.prepare(this.sql).run(...this.args).changes)}};}}
 const db={prepare:(sql:string)=>{touches++;return new Statement(sql);},batch:async(rows:Statement[])=>{sqlite.exec('BEGIN');try{const r=rows.map(row=>({meta:{changes:Number(sqlite.prepare(row.sql).run(...row.args).changes)}}));sqlite.exec('COMMIT');return r;}catch(e){sqlite.exec('ROLLBACK');throw e;}}} as unknown as D1Database;
 const env:PortalEnv={DB:db,CRAZYGAMES_ENABLED:'true',CRAZYGAMES_GAME_ID:'game-test',CRAZYGAMES_ORIGINS:'https://game-files.test',CRAZYGAMES_IDENTITY_SECRET:'a'.repeat(64)};
 const call=async(path:string,body:unknown,value:string,origin='https://game-files.test',extra:Record<string,string>={})=>{
 const response=await handleCrazyGames(new Request('https://farm.test/api/portal/'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Authorization:'Bearer '+value,'CF-Connecting-IP':value.slice(-16),...extra},body:JSON.stringify(body)}),env,request=>handleShared(request,db),verify);
 return {response,data:await response.json() as any};
 };
 return {env,db,sqlite,call,touches:()=>touches};
}
test('portal gateway denies foreign origins/disabled/forged identity before DB and exposes no cookie',async()=>{
 const h=harness();try{
 assert.equal((await h.call('world',{op:'session'},'forged')).response.status,401);
 assert.equal((await h.call('world',{op:'session'},await token(),'https://evil.test')).response.status,403);
 assert.equal(h.touches(),0);
 h.env.CRAZYGAMES_ENABLED='false';assert.equal((await h.call('world',{op:'session'},await token())).response.status,503);assert.equal(h.touches(),0);
 h.env.CRAZYGAMES_ENABLED='true';const created=await h.call('world',{op:'session'},await token());assert.equal(created.response.status,201);
 assert.equal(created.response.headers.get('Set-Cookie'),null);assert.equal(created.response.headers.get('Access-Control-Allow-Origin'),'https://game-files.test');assert.equal(created.response.headers.get('Access-Control-Allow-Credentials'),null);
 const options=await handleCrazyGames(new Request('https://farm.test/api/portal/lobby',{method:'OPTIONS',headers:{Origin:'https://game-files.test'}}),h.env,async()=>{throw Error('unexpected');},verify);assert.equal(options.status,204);assert.equal(options.headers.get('Access-Control-Allow-Origin'),'https://game-files.test');
 }finally{h.sqlite.close();}
});
test('verified portal identities reuse existing world/lobby/shared authority: four players, no account merges or name injection',async()=>{
 const h=harness();try{
 const tokens=[];for(let i=0;i<5;i++){const value=await token('user'+i);tokens.push(value);assert.equal((await h.call('world',{op:'session'},value)).response.status,201);}
 const reopened=await h.call('world',{op:'session'},tokens[0]);assert.equal(reopened.response.status,200);
 assert.equal((h.sqlite.prepare('SELECT COUNT(*) AS n FROM authoritative_worlds').get() as any).n,5);
 const host=await h.call('lobby',{op:'create',name:'Injected name'},tokens[0]),code=host.data.room.code;
 assert.equal(host.data.room.members[0].name,'Player.user0');
 assert.equal((await h.call('shared',{op:'connect'},tokens[0],undefined,{'X-Roamcroft-Protocol':'2'})).response.status,200);
 for(let i=1;i<4;i++){
  assert.equal((await h.call('lobby',{op:'join',code,name:'Spoof'},tokens[i])).response.status,200);
  assert.equal((await h.call('shared',{op:'connect'},tokens[i],undefined,{'X-Roamcroft-Protocol':'2'})).response.status,200);
 }
 assert.equal((await h.call('lobby',{op:'join',code,name:'Fifth'},tokens[4])).response.status,409);
 const status=await h.call('lobby',{op:'status'},tokens[1]);assert.equal(status.data.room.members.length,4);
 assert.deepEqual(status.data.room.members.map((m:any)=>m.name).sort(),['Player.user0','Player.user1','Player.user2','Player.user3']);
 assert.equal((await h.call('shared',{op:'connect'},tokens[4],undefined,{'X-Roamcroft-Protocol':'2'})).response.status,410);
 assert.equal((await h.call('lobby',{op:'leave'},tokens[1])).response.status,200);
 assert.equal((await h.call('lobby',{op:'status'},tokens[0])).data.room.members.length,3);
 }finally{h.sqlite.close();}
});

test('portal WebSocket authentication strips external identity headers and binds expiry without URL tokens',async()=>{
 const h=harness();try{
 const value=await token(),identity=await verify(value,'game-test');let forwarded:Request|undefined,expiry=0;
 const r=await handleCrazyGames(new Request('https://farm.test/api/portal/realtime?v=1',{headers:{Origin:'https://game-files.test',Upgrade:'websocket','Sec-WebSocket-Protocol':'roamcroft.portal.v1, cg.'+value,Cookie:'forged','X-Room-User':'forged','X-Portal-Expiry':'9999999999999'}}),h.env,async(request,expires)=>{forwarded=request;expiry=expires;return Response.json({ok:true});},verify);
 assert.equal(r.status,200);assert.equal(forwarded!.url,'https://farm.test/api/realtime?v=1');assert.equal(forwarded!.headers.get('X-Room-User'),null);assert.equal(forwarded!.headers.get('X-Portal-Expiry'),null);assert.equal(forwarded!.headers.get('Authorization'),null);assert.equal(forwarded!.headers.get('Sec-WebSocket-Protocol'),null);assert.equal(expiry,identity.exp*1000);
 assert.equal(forwarded!.headers.get('Cookie'),'__Host-roamcroft-session='+await portalSecret(identity,h.env.CRAZYGAMES_IDENTITY_SECRET!));
 assert.equal(h.touches(),0);
 const wrong=await handleCrazyGames(new Request('https://farm.test/api/portal/realtime?v=1',{headers:{Origin:'https://game-files.test',Upgrade:'websocket','Sec-WebSocket-Protocol':'roamcroft.portal.v1, cg.forged'}}),h.env,async()=>{throw Error('must not forward');},verify);assert.equal(wrong.status,401);
 }finally{h.sqlite.close();}
});
