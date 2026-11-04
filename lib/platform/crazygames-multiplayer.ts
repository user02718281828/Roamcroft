import type {PortalSDK} from './crazygames.ts';
import type {OnlineTransport} from '../server/client.ts';
type Room={code:string;members:{name:string;you:boolean;host:boolean;online:boolean}[]};
export function inviteRoom(params:unknown){
 if(!params||typeof params!=='object'||Array.isArray(params))throw Error('Invalid invitation');
 const code=(params as Record<string,unknown>).roomName;
 if(typeof code!=='string'||!/^[a-f0-9]{24}$/.test(code))throw Error('Invalid invitation');return code;
}
export function initialPortalMultiplayer(game:PortalSDK['game']):{code?:string}|null{
 if(game.inviteParams?.roomName!==undefined)return {code:inviteRoom(game.inviteParams)};
 return game.isInstantMultiplayer?{}:null;
}
export function createPortalMultiplayer(sdk:PortalSDK,backend:string,fetcher:typeof fetch=fetch,openSocket:(url:URL,protocols:string[])=>WebSocket=(url,p)=>new WebSocket(url,p)){
 const base=new URL(backend);if(base.protocol!=='https:'||base.origin!==backend)throw Error('HTTPS backend origin required');
 let active=true,token='',room:Room|null=null,timer:ReturnType<typeof setInterval>|undefined;
 const abort=new AbortController();
 const check=()=>{if(!active)throw Error('Portal session ended');};
 const credentials=async()=>{check();if(!sdk.user?.getUserToken)throw Error('Sign in to CrazyGames to play co-op. Single player remains available.');
  const value=await sdk.user.getUserToken({signingKeyType:'IN_GAME_AUTH'});check();if(typeof value!=='string'||value.length>8192||value.split('.').length!==3)throw Error('Portal sign-in unavailable');token=value;return value;};
 const report=()=>{if(room)sdk.game.updateRoom?.({roomId:room.code,isJoinable:room.members.length<4,inviteParams:{roomName:room.code}});else sdk.game.leftRoom?.();};
 const transport:OnlineTransport={initialShared:true,fetcher:async(input,init)=>{
  check();const path=String(input);if(!['/api/world','/api/lobby','/api/shared'].includes(path))throw Error('Unsupported portal route');
  const bearer=await credentials(),headers=new Headers(init?.headers);headers.set('Authorization','Bearer '+bearer);
  const response=await fetcher(new URL('/api/portal/'+path.slice(5),base),{...init,headers,credentials:'omit',signal:init?.signal?AbortSignal.any([init.signal,abort.signal]):abort.signal});check();
  if(path==='/api/lobby'&&response.ok){const value=await response.clone().json() as {room:Room|null};check();room=value.room;report();}
  return response;
 },socket:()=>{check();if(!token)throw Error('Portal sign-in required');const url=new URL('/api/portal/realtime?v=1',base);url.protocol='wss:';return openSocket(url,['roamcroft.portal.v1','cg.'+token]);},inviteLink:async()=>{
  check();if(!room||!sdk.game.inviteLink)throw Error('Invitation unavailable');return await sdk.game.inviteLink({roomName:room.code});
 }};
 const call=async(path:string,body:unknown)=>{const response=await transport.fetcher(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});if(!response.headers.get('Content-Type')?.includes('application/json'))throw Error('Co-op backend is not ready. Single player remains available.');const value=await response.json() as {error?:string;room?:Room|null};if(!response.ok)throw Error(value.error||'Portal backend unavailable');return value;};
 return {transport,async prepare(code?:string){
  if(!sdk.game.updateRoom||!sdk.game.leftRoom||!sdk.game.addJoinRoomListener||!sdk.game.inviteLink)throw Error('Multiplayer SDK features unavailable');
  if(code)inviteRoom({roomName:code});
  await call('/api/world',{op:'session'});
  const current=await call('/api/lobby',{op:'status'});
  if(current.room&&code&&current.room.code!==code)await call('/api/lobby',{op:'leave'});
  if(!current.room||(code&&current.room.code!==code))await call('/api/lobby',code?{op:'join',code,name:'Portal player'}:{op:'create',name:'Portal player'});
  check();timer=setInterval(()=>{void call('/api/lobby',{op:'status'}).catch(()=>{try{sdk.game.leftRoom?.();}catch{}});},10000);
 },dispose(){if(!active)return;active=false;abort.abort();if(timer)clearInterval(timer);token='';room=null;try{sdk.game.leftRoom?.();}catch{}}};
}
