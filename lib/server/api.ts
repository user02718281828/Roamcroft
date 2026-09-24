import {advanceWorld,freshWorld,type WorldRecord} from './world.ts';
import {validPulse} from './protocol.ts';
import {captureState,makeDelta} from './delta.ts';

const COOKIE='__Host-roamcroft-session',TTL=30*86400,MAX_BODY=8192;
const sessionCookie=(secret:string)=>`${COOKIE}=${secret}; Path=/; Max-Age=${TTL}; HttpOnly; Secure; SameSite=Strict`;
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
const hash=async(text:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
const json=(data:unknown,status=200,extra:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
type Row={id:string;nonce:string;previous_nonce:string;digest:string;seq:number;command_seq:number;world:string;updated:number;expires:number;active:number};
const initialized=new WeakMap<D1Database,Promise<unknown>>();
async function init(db:D1Database){
  let promise=initialized.get(db);
  if(!promise){promise=db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS authoritative_worlds (id TEXT PRIMARY KEY, nonce TEXT NOT NULL, previous_nonce TEXT NOT NULL DEFAULT \'\', digest TEXT NOT NULL DEFAULT \'\', seq INTEGER NOT NULL DEFAULT 0, command_seq INTEGER NOT NULL DEFAULT 0, world TEXT NOT NULL, updated INTEGER NOT NULL, expires INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 0)'),
    db.prepare('CREATE INDEX IF NOT EXISTS authoritative_expiry ON authoritative_worlds(expires)'),
    db.prepare('CREATE TABLE IF NOT EXISTS authoritative_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)'),
    db.prepare('CREATE INDEX IF NOT EXISTS authoritative_limit_expiry ON authoritative_limits(expires)'),
  ]);initialized.set(db,promise);promise.catch(()=>initialized.delete(db));}
  await promise;
}
export async function allowed(db:D1Database,id:string,now:number,limit:number,window:number){
  const row=await db.prepare('INSERT INTO authoritative_limits(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END, expires=CASE WHEN expires<=? THEN ? ELSE expires END RETURNING count').bind(id,now+window,now,now,now+window).first<{count:number}>();
  return !!row&&row.count<=limit;
}
export async function readBody(request:Request){
  if(Number(request.headers.get('Content-Length'))>MAX_BODY)throw Error('size');
  const reader=request.body?.getReader();if(!reader)throw Error('json');
  const chunks:Uint8Array[]=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX_BODY){await reader.cancel();throw Error('size');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
function cookie(request:Request){const matches=(request.headers.get('Cookie')||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(COOKIE+'='));return matches.length===1?matches[0].slice(COOKIE.length+1):'';}
export async function worldIdentity(request:Request,db:D1Database,now:number){
  const secret=cookie(request);if(!/^[a-f0-9]{64}$/.test(secret))return null;
  await init(db);const id=await hash(secret);
  return await db.prepare('SELECT id FROM authoritative_worlds WHERE id=? AND expires>?').bind(id,now).first<{id:string}>();
}
function packet(row:Row){return {state:(JSON.parse(row.world) as WorldRecord).state,nonce:row.nonce,seq:row.seq,commandSeq:row.command_seq};}

export async function handleWorld(request:Request,db:D1Database,now=Date.now()){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  if(request.method!=='POST')return json({error:'Yalnızca POST desteklenir.'},405,{Allow:'POST'});
  if(origin!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Kaynak doğrulanamadı.'},403);
  if(request.headers.get('Content-Type')?.split(';')[0].trim()!=='application/json')return json({error:'JSON gerekli.'},415);
  let body:unknown,raw:string;
  try{raw=await readBody(request);body=JSON.parse(raw);}catch(error){return json({error:'İstek okunamadı.'},error instanceof Error&&error.message==='size'?413:400);}
  if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'Geçersiz istek.'},400);
  const input=body as Record<string,unknown>;
  await init(db);
  const ip=request.headers.get('CF-Connecting-IP');
  // IP platformdan gelir; oturum kimliği olarak kullanılmaz. Yerel testte tek ortak kota vardır.
  const ipKey=await hash(ip||'local');
  if(!await allowed(db,'request:'+ipKey,now,300,60000))return json({error:'İstek sınırı aşıldı.'},429,{'Retry-After':'60'});
  const rawCookie=cookie(request),id=/^[a-f0-9]{64}$/.test(rawCookie)?await hash(rawCookie):'';
  const row=id?await db.prepare('SELECT * FROM authoritative_worlds WHERE id=? AND expires>?').bind(id,now).first<Row>():null;
  if(input.op==='session'&&Object.keys(input).length===1){
    if(row){
      await db.prepare('UPDATE authoritative_worlds SET expires=? WHERE id=?').bind(now+TTL*1000,id).run();
      return json(packet(row),200,{'Set-Cookie':sessionCookie(rawCookie)});
    }
    if(!await allowed(db,'create:'+ipKey,now,5,3600000)||!await allowed(db,'create:global',now,1000,86400000))return json({error:'Yeni dünya sınırı aşıldı.'},429,{'Retry-After':'3600'});
    const secret=token(),newId=await hash(secret),nonce=token();
    const world=JSON.stringify(freshWorld());
    const created=await db.batch([db.prepare('DELETE FROM authoritative_worlds WHERE expires<=?').bind(now),db.prepare('DELETE FROM authoritative_limits WHERE expires<=?').bind(now),
      db.prepare('INSERT INTO authoritative_worlds(id,nonce,world,updated,expires) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM authoritative_worlds)<200').bind(newId,nonce,world,now,now+TTL*1000)]);
    if(created[2].meta.changes!==1)return json({error:'Sunucu dünyası kapasitesi dolu. Cihazdaki çiftliğinle oynayabilirsin.'},503,{'Retry-After':'3600'});
    return json({state:JSON.parse(world).state,nonce,seq:0,commandSeq:0},201,{'Set-Cookie':sessionCookie(secret)});
  }
  if(!row)return json({error:'Sunucu oturumu sona erdi. Başlangıç ekranından yeniden bağlan.'},401);
  if(input.op!=='pulse'||Object.keys(input).length!==2||!validPulse(input.pulse))return json({error:'Komut geçersiz.'},400);
  const pulse=input.pulse,nonce=request.headers.get('X-Roamcroft-Nonce'),digest=await hash(raw!);
  if(pulse.seq===row.seq&&nonce===row.previous_nonce&&digest===row.digest)return json(packet(row));
  if(nonce!==row.nonce)return json({error:'İstek anahtarı geçersiz.'},403);
  if(pulse.seq!==row.seq+1)return json({error:'İstek sırası değişti. Yeniden bağlan.'},409);
  if(!await allowed(db,'session:'+id,now,180,60000))return json({error:'İstek sınırı aşıldı.'},429,{'Retry-After':'60'});
  let commandSeq=row.command_seq;
  for(const command of pulse.commands){if(command.seq!==commandSeq+1)return json({error:'Komut sırası geçersiz.'},409);commandSeq=command.seq;}
  const record=JSON.parse(row.world) as WorldRecord;
  const before=captureState(record.state);
  const result=advanceWorld(record,pulse.pose,pulse.commands,Math.min(1,(now-row.updated)/1000),pulse.paused||!row.active);
  const encoded=JSON.stringify(result.record);
  if(new TextEncoder().encode(encoded).length>1800000)return json({error:'Sunucu dünyasının kayıt sınırına ulaşıldı.'},409);
  const nextNonce=token();
  // Aynı anda gelen iki istekten yalnızca biri dünyayı güncelleyebilir.
  const updated=await db.prepare('UPDATE authoritative_worlds SET world=?,nonce=?,previous_nonce=?,digest=?,seq=?,command_seq=?,updated=?,active=?,expires=? WHERE id=? AND seq=? AND nonce=?').bind(encoded,nextNonce,row.nonce,digest,pulse.seq,commandSeq,now,pulse.paused?0:1,now+TTL*1000,id,row.seq,row.nonce).run();
  if(updated.meta.changes!==1)return json({error:'Dünya başka istekte güncellendi. Yeniden dene.'},409);
  return json({delta:makeDelta(before,result.record.state,row.seq),events:result.events,nonce:nextNonce,seq:pulse.seq,commandSeq},200,{'Set-Cookie':sessionCookie(rawCookie)});
}
