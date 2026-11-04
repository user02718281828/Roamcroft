import test from 'node:test';
import assert from 'node:assert/strict';
import type {PortalSDK} from '../lib/platform/crazygames.ts';
import {createPortalMultiplayer,inviteRoom,initialPortalMultiplayer} from '../lib/platform/crazygames-multiplayer.ts';
const code='a'.repeat(24);
function fixture(){
 const calls:{url:URL;init:RequestInit}[]=[],reports:any[]=[],sockets:{url:URL;protocols:string[]}[]=[];let members=1,exists=false,signedIn=true;
 const sdk={user:{async getUserToken(options:unknown){assert.deepEqual(options,{signingKeyType:'IN_GAME_AUTH'});if(!signedIn)throw Error('userNotAuthenticated');return 'header.claims.signature';}},game:{updateRoom:(room:unknown)=>reports.push(room),leftRoom:()=>reports.push('left'),addJoinRoomListener(){},inviteLink:(params:{roomName:string})=>'https://www.crazygames.com/invite/'+params.roomName}} as unknown as PortalSDK;
 const fetcher:typeof fetch=async(input,init)=>{const url=new URL(String(input));calls.push({url,init:init!});const body=JSON.parse(String(init!.body));if(url.pathname.endsWith('/lobby')){if(body.op==='create'||body.op==='join')exists=true;if(body.op==='leave')exists=false;return Response.json({room:exists?{code,members:Array.from({length:members},()=>({name:'Friend'}))}:null});}return Response.json({state:{}});};
 const connection=createPortalMultiplayer(sdk,'https://backend.test',fetcher,(url,protocols)=>{sockets.push({url,protocols});return {} as WebSocket;});
 return {connection,calls,reports,sockets,setMembers:(n:number)=>members=n,setGuest:()=>signedIn=false};
}
test('portal host/invite flows authenticate without cookies and report room fullness/leave; token never enters URLs',async()=>{
 const game=(value:unknown)=>value as PortalSDK['game'];
 assert.equal(initialPortalMultiplayer(game({inviteParams:{}})),null);
 assert.deepEqual(initialPortalMultiplayer(game({isInstantMultiplayer:true})),{});
 assert.deepEqual(initialPortalMultiplayer(game({isInstantMultiplayer:true,inviteParams:{roomName:code}})),{code});
 assert.throws(()=>initialPortalMultiplayer(game({inviteParams:{roomName:'invalid'}})));
 const f=fixture();try{
 await f.connection.prepare();assert.ok(f.calls.some(c=>JSON.parse(String(c.init.body)).op==='create'));
 assert.equal(f.reports.at(-1).isJoinable,true);assert.equal(f.reports.at(-1).inviteParams.roomName,code);
 assert.equal(await f.connection.transport.inviteLink!(),'https://www.crazygames.com/invite/'+code);
 f.connection.transport.socket(new URL('https://ignored.test'));
 assert.equal(f.sockets[0].url.href,'wss://backend.test/api/portal/realtime?v=1');assert.deepEqual(f.sockets[0].protocols,['roamcroft.portal.v1','cg.header.claims.signature']);
 for(const c of f.calls){assert.equal(c.init.credentials,'omit');assert.equal(new Headers(c.init.headers).get('Authorization'),'Bearer header.claims.signature');assert.equal(c.url.search,'');}
 f.setMembers(4);await f.connection.transport.fetcher('/api/lobby',{method:'POST',body:JSON.stringify({op:'status'})});assert.equal(f.reports.at(-1).isJoinable,false);
 await f.connection.transport.fetcher('/api/lobby',{method:'POST',body:JSON.stringify({op:'leave'})});assert.equal(f.reports.at(-1),'left');
 }finally{f.connection.dispose();}
 await assert.rejects(f.connection.transport.fetcher('/api/world',{}),/ended/);
 const join=fixture();try{await join.connection.prepare(code);assert.ok(join.calls.some(c=>JSON.parse(String(c.init.body)).op==='join'));}finally{join.connection.dispose();}
});
test('guest and malformed invitations cannot create a server world; disposed token requests cannot send',async()=>{
 const guest=fixture();guest.setGuest();try{await assert.rejects(guest.connection.prepare(),/userNotAuthenticated/);assert.equal(guest.calls.length,0);}finally{guest.connection.dispose();}
 for(const params of [null,{},[],{roomName:'bad'},{roomName:'https://evil.test'}])assert.throws(()=>inviteRoom(params));
 assert.equal(inviteRoom({roomName:code}),code);
 let resolve!:(value:string)=>void,writes=0;
 const sdk={user:{getUserToken:()=>new Promise<string>(r=>{resolve=r;})},game:{}} as unknown as PortalSDK;
 const c=createPortalMultiplayer(sdk,'https://backend.test',async()=>{writes++;return Response.json({});});
 const pending=c.transport.fetcher('/api/world',{method:'POST'});c.dispose();resolve('a.b.c');await assert.rejects(pending,/ended/);assert.equal(writes,0);
});
