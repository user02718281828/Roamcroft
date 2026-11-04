// Server-only SDK v3 IN_GAME_AUTH verification. Never accept client IDs/JWK URLs.
const JWKS='https://userportal.crazygames.com/.well-known/jwks.json';
let cached:{key:CryptoKey;until:number}|undefined;
let flight:Promise<CryptoKey>|undefined;
let retryAfter=0,lastRotationCheck=0;
function bytes(text:string){if(!/^[A-Za-z0-9_-]+$/.test(text))throw Error('token');return Uint8Array.from(atob(text.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
function object(text:string){const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes(text)));if(!value||typeof value!=='object'||Array.isArray(value))throw Error('token');return value;}
async function signingKey(){
 if(cached&&cached.until>Date.now())return cached.key;
 if(flight)return flight;
 if(Date.now()<retryAfter)throw Error('keys unavailable');
 flight=(async()=>{const response=await fetch(JWKS,{signal:AbortSignal.timeout(5000),redirect:'error'});if(!response.ok)throw Error('keys');
 const reader=response.body!.getReader(),chunks:Uint8Array[]=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw Error('keys');}chunks.push(value);}
 const text=await new Blob(chunks as BlobPart[]).text(),set=JSON.parse(text);
 const jwk=set.keys?.find((k:JsonWebKey&{kid?:string})=>k.kid==='ingame-auth'&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256')&&(!k.use||k.use==='sig'));
 if(!jwk)throw Error('keys');const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);cached={key,until:Date.now()+600000};return key;})();
 try{return await flight;}catch(error){retryAfter=Date.now()+30000;throw error;}finally{flight=undefined;}
}
export type PortalIdentity={userId:string;gameId:string;username:string;exp:number};
export async function verifyCrazyGamesToken(token:string,gameId:string,now=Date.now(),keyProvider:()=>Promise<CryptoKey>=signingKey):Promise<PortalIdentity>{
 if(!gameId||token.length>8192)throw Error('token');const parts=token.split('.');if(parts.length!==3)throw Error('token');
 const header=object(parts[0]),claims=object(parts[1]),seconds=Math.floor(now/1000);
 if(header.alg!=='RS256'||header.kid!=='ingame-auth'||Object.keys(header).some(k=>!['alg','kid','typ'].includes(k)))throw Error('token');
 if(claims.gameId!==gameId||typeof claims.userId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(claims.userId)||typeof claims.username!=='string'||!/^[A-Za-z0-9._]{6,20}$/.test(claims.username))throw Error('token');
 if(claims.nbf!==undefined&&(!Number.isSafeInteger(claims.nbf)||claims.nbf>seconds))throw Error('token');
 if(!Number.isSafeInteger(claims.exp)||!Number.isSafeInteger(claims.iat)||claims.exp<=seconds||claims.iat>seconds+30||claims.exp<=claims.iat||claims.exp-claims.iat>3660)throw Error('token');
 const signature=bytes(parts[2]),message=new TextEncoder().encode(parts[0]+'.'+parts[1]);
 let valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',await keyProvider(),signature,message);
 if(!valid&&keyProvider===signingKey&&Date.now()-lastRotationCheck>=60000){lastRotationCheck=Date.now();cached=undefined;valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',await signingKey(),signature,message);}
 if(!valid)throw Error('token');
 return {userId:claims.userId,gameId:claims.gameId,username:claims.username,exp:claims.exp};
}
export async function portalSecret(identity:PortalIdentity,secret:string){
 if(!/^[a-f0-9]{64,128}$/.test(secret))throw Error('configuration');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const value=JSON.stringify(['roamcroft/crazygames/v1',identity.gameId,identity.userId]);
 return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
}
