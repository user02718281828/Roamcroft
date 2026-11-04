import {handleWorld,readBody} from './api.ts';
import {handleLobby} from './lobby.ts';
import {portalSecret,verifyCrazyGamesToken} from './crazygames-auth.ts';
export type PortalEnv={DB:D1Database;CRAZYGAMES_ENABLED?:string;CRAZYGAMES_GAME_ID?:string;CRAZYGAMES_ORIGINS?:string;CRAZYGAMES_IDENTITY_SECRET?:string};
type Realtime=(request:Request,expires:number)=>Promise<Response>;
const paths=new Set(['world','lobby','shared','realtime']);
const json=(status:number,error:string)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function handleCrazyGames(request:Request,env:PortalEnv,realtime:Realtime,verify=verifyCrazyGamesToken){
 const url=new URL(request.url),path=url.pathname.slice('/api/portal/'.length),origin=request.headers.get('Origin')||'';
 if(env.CRAZYGAMES_ENABLED!=='true')return json(503,'Portal multiplayer is not enabled on this backend.');
 const origins=(env.CRAZYGAMES_ORIGINS||'').split(',').filter(Boolean);
 const exact=origins.every(o=>{try{const u=new URL(o);return u.protocol==='https:'&&u.origin===o;}catch{return false;}});
 if(!exact||!origins.includes(origin)||!paths.has(path))return json(403,'Portal origin or route denied.');
 const cors=(response:Response)=>{const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin');headers.set('Access-Control-Expose-Headers','Retry-After');headers.set('Cache-Control','no-store');headers.delete('Set-Cookie');headers.delete('Access-Control-Allow-Credentials');if(response.status===101)headers.set('Sec-WebSocket-Protocol','roamcroft.portal.v1');return new Response(response.body,{status:response.status,headers,...((response as Response&{webSocket?:WebSocket}).webSocket?{webSocket:(response as Response&{webSocket:WebSocket}).webSocket}:{})});};
 if(request.method==='OPTIONS')return cors(new Response(null,{status:204,headers:{'Access-Control-Allow-Methods':'POST, GET, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Roamcroft-Nonce, X-Roamcroft-Protocol','Access-Control-Max-Age':'600'}}));
 if(path==='realtime'?(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket'):request.method!=='POST')return cors(json(405,'Method denied.'));
 if(path!=='realtime'&&request.headers.get('Content-Type')?.split(';')[0].trim()!=='application/json')return cors(json(415,'JSON required.'));
 if(!env.CRAZYGAMES_GAME_ID||!/^[a-f0-9]{64,128}$/.test(env.CRAZYGAMES_IDENTITY_SECRET||''))return cors(json(503,'Portal identity configuration missing.'));
 const protocols=(request.headers.get('Sec-WebSocket-Protocol')||'').split(',').map(v=>v.trim());
 const token=path==='realtime'?(protocols.length===2&&protocols[0]==='roamcroft.portal.v1'&&protocols[1].startsWith('cg.')?protocols[1].slice(3):''):(/^Bearer [A-Za-z0-9_.-]+$/.test(request.headers.get('Authorization')||'')?request.headers.get('Authorization')!.slice(7):'');
 try{
  const identity=await verify(token,env.CRAZYGAMES_GAME_ID),secret=await portalSecret(identity,env.CRAZYGAMES_IDENTITY_SECRET!);
  const headers=new Headers({'Origin':url.origin,'Content-Type':'application/json','Cookie':'__Host-roamcroft-session='+secret});
  for(const name of ['X-Roamcroft-Nonce','X-Roamcroft-Protocol','CF-Connecting-IP','Upgrade']){const value=request.headers.get(name);if(value)headers.set(name,value);}
  let body=path==='realtime'?undefined:await readBody(request);
  if(path==='lobby'){
   const input=JSON.parse(body!);if(input.op==='create'||input.op==='join')input.name=identity.username;
   body=JSON.stringify(input);
  }
  const internal=new Request(url.origin+'/api/'+path+url.search,{method:request.method,headers,body});
  const response=path==='world'?await handleWorld(internal,env.DB,Date.now(),secret):path==='lobby'?await handleLobby(internal,env.DB):await realtime(internal,identity.exp*1000);
  return cors(response);
 }catch{return cors(json(401,'Portal authentication or request failed. Sign in and retry.'));}
}
