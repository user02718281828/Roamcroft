import {allowed,readBody,worldIdentity} from './api.ts';
const TTL=5*60_000,PRESENCE=90_000;
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const initialized=new WeakMap<D1Database,Promise<unknown>>();
export async function initLobby(db:D1Database){let pending=initialized.get(db);if(!pending){pending=db.batch([
  db.prepare('CREATE TABLE IF NOT EXISTS friend_lobbies (code TEXT PRIMARY KEY, owner TEXT UNIQUE NOT NULL, expires INTEGER NOT NULL)'),
  db.prepare('CREATE TABLE IF NOT EXISTS friend_members (user TEXT PRIMARY KEY, room TEXT NOT NULL, name TEXT NOT NULL, seen INTEGER NOT NULL)'),
  db.prepare('CREATE INDEX IF NOT EXISTS friend_room ON friend_members(room)'),
]);initialized.set(db,pending);pending.catch(()=>initialized.delete(db));}await pending;}
type Room={code:string;owner:string;expires:number};
export async function handleLobby(request:Request,db:D1Database,now=Date.now()){
  if(request.method!=='POST')return json({error:'POST gerekli.'},405);
  if(request.headers.get('Origin')!==new URL(request.url).origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Kaynak doğrulanamadı.'},403);
  if(request.headers.get('Content-Type')?.split(';')[0].trim()!=='application/json')return json({error:'JSON gerekli.'},415);
  let body:Record<string,unknown>;
  try{const raw=await readBody(request);if(raw.length>1024)return json({error:'İstek fazla büyük.'},413);body=JSON.parse(raw);}catch{return json({error:'İstek okunamadı.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||!['create','join','status','leave'].includes(String(body.op)))return json({error:'Geçersiz işlem.'},400);
  const keys=body.op==='create'?['op','name']:body.op==='join'?['op','name','code']:['op'];
  if(Object.keys(body).some(k=>!keys.includes(k)))return json({error:'Geçersiz alan.'},400);
  const identity=await worldIdentity(request,db,now);if(!identity)return json({error:'Önce başlangıç ekranından sunucu dünyasına bağlan.'},401);
  if(!await allowed(db,'lobby:'+identity.id,now,30,60_000))return json({error:'Biraz bekleyip yeniden dene.'},429);
  await initLobby(db);
  await db.batch([
    db.prepare('DELETE FROM friend_members WHERE room IN (SELECT code FROM friend_lobbies WHERE expires<=?)').bind(now),
    db.prepare('DELETE FROM friend_lobbies WHERE expires<=?').bind(now),
    db.prepare('DELETE FROM friend_members WHERE seen<? AND user NOT IN (SELECT owner FROM friend_lobbies)').bind(now-PRESENCE),
  ]);
  let room=await db.prepare('SELECT r.* FROM friend_lobbies r JOIN friend_members m ON m.room=r.code WHERE m.user=?').bind(identity.id).first<Room>();
  if(body.op==='leave'){
    if(room){if(room.owner===identity.id)await db.batch([db.prepare('DELETE FROM friend_members WHERE room=?').bind(room.code),db.prepare('DELETE FROM friend_lobbies WHERE code=? AND owner=?').bind(room.code,identity.id)]);
    else await db.prepare('DELETE FROM friend_members WHERE user=?').bind(identity.id).run();}
    return json({room:null});
  }
  if(body.op==='create'||body.op==='join'){
    if(typeof body.name!=='string'||!body.name.trim()||body.name.length>24||body.name.split('').some(c=>c.charCodeAt(0)<32||c.charCodeAt(0)===127))return json({error:'1–24 karakterlik bir ad gir.'},400);
    if(room&&!(body.op==='create'&&room.owner===identity.id)&&!(body.op==='join'&&room.code===body.code))return json({error:'Önce mevcut lobiden ayrıl.'},409);
    if(!room){
      if(body.op==='create'){
        const code=Array.from(crypto.getRandomValues(new Uint8Array(12)),n=>n.toString(16).padStart(2,'0')).join('');
        const results=await db.batch([
          db.prepare('INSERT OR IGNORE INTO friend_lobbies(code,owner,expires) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM friend_lobbies)<200 AND NOT EXISTS (SELECT 1 FROM friend_members WHERE user=?)').bind(code,identity.id,now+TTL,identity.id),
          db.prepare('INSERT OR IGNORE INTO friend_members(user,room,name,seen) SELECT ?,code,?,? FROM friend_lobbies WHERE owner=?').bind(identity.id,body.name.trim(),now,identity.id),
        ]);
        if(!results[1].meta.changes)return json({error:'Lobi açılamadı; tekrar bağlan.'},409);
      }else{
        if(typeof body.code!=='string'||!/^[a-f0-9]{24}$/.test(body.code))return json({error:'Davet kodunu kontrol et.'},400);
        const result=await db.prepare('INSERT OR IGNORE INTO friend_members(user,room,name,seen) SELECT ?,code,?,? FROM friend_lobbies WHERE code=? AND expires>? AND (SELECT COUNT(*) FROM friend_members WHERE room=?)<4').bind(identity.id,body.name.trim(),now,body.code,now,body.code).run();
        if(!result.meta.changes)return json({error:'Lobi dolu, kapanmış veya kod geçersiz.'},409);
      }
      room=await db.prepare('SELECT r.* FROM friend_lobbies r JOIN friend_members m ON m.room=r.code WHERE m.user=?').bind(identity.id).first<Room>();
    }
  }
  if(!room)return json({room:null});
  await db.prepare('UPDATE friend_members SET seen=? WHERE user=? AND room=?').bind(now,identity.id,room.code).run();
  if(room.owner===identity.id)await db.prepare('UPDATE friend_lobbies SET expires=? WHERE code=? AND owner=?').bind(now+TTL,room.code,identity.id).run();
  const members=await db.prepare('SELECT user,name,seen FROM friend_members WHERE room=? ORDER BY seen,user').bind(room.code).all<{user:string;name:string;seen:number}>();
  return json({room:{code:room.code,host:room.owner===identity.id,members:members.results.map(m=>({name:m.name,you:m.user===identity.id,host:m.user===room!.owner,online:m.seen>=now-PRESENCE})),sharedWorld:true}});
}

