import { sourceText } from '../i18n/source.ts';
import {validCommand,validPose} from './protocol.ts';
type Room={id:string;owner:string;name:string;host:string;snapshot:string;revision:number;ack:number;updated:number};
type Member={id:string;room:string;user:string;secret:string;name:string;pose:string;seen:number;last_seq:number};
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const random=(bytes=16)=>Array.from(crypto.getRandomValues(new Uint8Array(bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const validName=(name:unknown)=>typeof name==='string' && name.trim().length>0 && name.length<=32;
export async function handleCoop(request:Request,db:D1Database,now=Date.now()):Promise<Response> {
  const user=request.headers.get('oai-authenticated-user-id');
  if(!user) return reply({error:sourceText("m_26c5060176")},401);
  if(request.method!=='POST' || request.headers.get('x-roamcroft')!=='1') return reply({error:sourceText("m_805fb11525")},400);
  const origin=request.headers.get('origin');
  if(origin && origin!==new URL(request.url).origin) return reply({error:sourceText("m_56223966a8")},403);
  const raw=await request.text();
  if(raw.length>900000) return reply({error:sourceText("m_8d3fd1da57")},413);
  let body:Record<string,unknown>;
  try {body=JSON.parse(raw); if(!body || typeof body!=='object') throw Error();} catch {return reply({error:sourceText("m_49b8e07264")},400);}
  if(body.op==='list') {
    const rows=await db.prepare('SELECT id,name,updated FROM coop_rooms WHERE owner=? ORDER BY updated DESC LIMIT 8').bind(user).all<{id:string;name:string;updated:number}>();
    return reply({rooms:rows.results.map(r=>({...r,online:r.updated>now-20000}))});
  }
  if(['create','join','resume'].includes(String(body.op))) {
    if(!validName(body.name)) return reply({error:sourceText("m_782a944514")},400);
    const member=random(),token=random(24),secret=await hash(token);
    let room:Room|null=null;
    if(body.op==='create') {
      const total=await db.prepare('SELECT count(*) AS n FROM coop_rooms WHERE owner=?').bind(user).first<{n:number}>();
      if((total?.n || 0)>=8) return reply({error:sourceText("m_51e714cdee")},409);
      const roomId=random(12);
      await db.batch([
        db.prepare('INSERT INTO coop_rooms (id,owner,name,host,updated,created) VALUES (?,?,?,?,?,?)').bind(roomId,user,String(body.worldName || sourceText("m_5c542e1398")).slice(0,32),member,now,now),
        db.prepare('INSERT INTO coop_members (id,room,user,secret,name,seen) VALUES (?,?,?,?,?,?)').bind(member,roomId,user,secret,String(body.name).trim(),now),
      ]);
      return reply({room:roomId,member,token,role:'host',revision:0});
    }
    if(typeof body.room!=='string' || !/^[a-f0-9]{24}$/.test(body.room)) return reply({error:sourceText("m_33a9452447")},400);
    room=await db.prepare('SELECT * FROM coop_rooms WHERE id=?').bind(body.room).first<Room>();
    if(!room) return reply({error:sourceText("m_730b8d09e8")},404);
    if(body.op==='resume') {
      if(room.owner!==user) return reply({error:sourceText("m_0c4b7fe6f0")},403);
      if(room.updated>now-20000 && room.host) return reply({error:sourceText("m_371c6aa712")},409);
      const result=await db.batch([
        db.prepare('UPDATE coop_rooms SET host=?,updated=? WHERE id=? AND (updated<=? OR host=?)').bind(member,now,room.id,now-20000,''),
        db.prepare('INSERT INTO coop_members (id,room,user,secret,name,seen) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM coop_rooms WHERE id=? AND host=?)').bind(member,room.id,user,secret,String(body.name).trim(),now,room.id,member),
      ]);
      if(!result[0].meta.changes) return reply({error:sourceText("m_d3d3d17bf2")},409);
      return reply({room:room.id,member,token,role:'host',revision:room.revision,snapshot:room.snapshot,ack:room.ack});
    }
    if(room.updated<now-20000 || !room.host) return reply({error:sourceText("m_59088b8a06")},409);
    if(!room.snapshot) return reply({error:sourceText("m_6678b4e549")},409);
    await db.prepare('DELETE FROM coop_members WHERE room=? AND seen<? AND id<>?').bind(room.id,now-30000,room.host).run();
    const result=await db.prepare('INSERT INTO coop_members (id,room,user,secret,name,seen) SELECT ?,?,?,?,?,? WHERE (SELECT count(*) FROM coop_members WHERE room=?)<4').bind(member,room.id,user,secret,String(body.name).trim(),now,room.id).run();
    if(!result.meta.changes) return reply({error:sourceText("m_de9f2300e3")},409);
    return reply({room:room.id,member,token,role:'guest',revision:room.revision,snapshot:room.snapshot});
  }
  if(typeof body.member!=='string') return reply({error:sourceText("m_b8dd5f6d64")},401);
  const token=request.headers.get('authorization')?.replace(/^Bearer /,'') || '';
  const member=await db.prepare('SELECT * FROM coop_members WHERE id=?').bind(body.member).first<Member>();
  if(!member || member.user!==user || !token || member.secret!==await hash(token)) return reply({error:sourceText("m_d00066adae")},401);
  const room=await db.prepare('SELECT * FROM coop_rooms WHERE id=?').bind(member.room).first<Room>();
  if(!room) return reply({error:sourceText("m_730b8d09e8")},404);
  const host=room.host===member.id;
  if(body.op==='leave') {
    await db.batch([
      db.prepare('DELETE FROM coop_members WHERE id=?').bind(member.id),
      db.prepare('UPDATE coop_rooms SET host=?,updated=? WHERE id=? AND host=?').bind('',now-21000,room.id,member.id),
    ]);
    return reply({ok:true});
  }
  if(body.op==='publish') {
    if(!host) return reply({error:sourceText("m_916f6d438a")},403);
    if(typeof body.snapshot!=='string' || body.snapshot.length>800000 || !/^[A-Za-z0-9+/=]+$/.test(body.snapshot) || !Number.isSafeInteger(body.revision) || Number(body.revision)<1 || !Number.isSafeInteger(body.ack) || Number(body.ack)<0) return reply({error:sourceText("m_e634682cff")},400);
    const written=await db.batch([
      db.prepare('UPDATE coop_rooms SET snapshot=?,revision=?,ack=?,updated=? WHERE id=? AND host=? AND revision<?').bind(body.snapshot,body.revision,body.ack,now,room.id,member.id,body.revision),
      db.prepare('DELETE FROM coop_commands WHERE room=? AND id<=? AND EXISTS (SELECT 1 FROM coop_rooms WHERE id=? AND revision=? AND ack=?)').bind(room.id,body.ack,room.id,body.revision,body.ack),
      db.prepare('UPDATE coop_members SET seen=? WHERE id=?').bind(now,member.id),
    ]);
    if(!written[0].meta.changes)return reply({error:sourceText("m_9509c3a961"),revision:room.revision},409);
    return reply({ok:true});
  }
  if(body.op!=='pulse') return reply({error:sourceText("m_1e3326c63a")},400);
  if(body.pose!==undefined && !validPose(body.pose)) return reply({error:sourceText("m_84afdebcb6")},400);
  const commands=body.commands ?? [];
  if(!Array.isArray(commands) || commands.length>8 || !commands.every(validCommand) || commands.some((c,i)=>i>0&&c.seq<=commands[i-1].seq)) return reply({error:sourceText("m_203f03ac32")},400);
  const statements=[db.prepare('UPDATE coop_members SET seen=?,pose=? WHERE id=?').bind(now,JSON.stringify(body.pose || {}),member.id)];
  if(!host) for(const c of commands) statements.push(db.prepare('INSERT OR IGNORE INTO coop_commands (room,member,seq,payload) SELECT ?,?,?,? WHERE (SELECT count(*) FROM coop_commands WHERE member=?)<32 AND ?>(SELECT last_seq FROM coop_members WHERE id=?)').bind(room.id,member.id,c.seq,JSON.stringify(c),member.id,c.seq,member.id));
  statements.push(db.prepare('UPDATE coop_members SET last_seq=MAX(last_seq,COALESCE((SELECT MAX(seq) FROM coop_commands WHERE member=?),0)) WHERE id=?').bind(member.id,member.id));
  await db.batch(statements);
  if(host) {
    const [peers,pending]=await Promise.all([
      db.prepare('SELECT id,name,pose,seen FROM coop_members WHERE room=? AND seen>?').bind(room.id,now-20000).all(),
      db.prepare('SELECT id,member,payload FROM coop_commands WHERE room=? AND id>? ORDER BY id LIMIT 128').bind(room.id,room.ack).all(),
    ]);
    return reply({members:peers.results,commands:pending.results});
  }
  const accepted=await db.prepare('SELECT last_seq FROM coop_members WHERE id=?').bind(member.id).first<{last_seq:number}>();
  return reply({acceptedSeq:accepted?.last_seq||0,online:!!room.host && room.updated>now-20000,revision:room.revision,snapshot:Number(body.revision)===room.revision ? null : room.snapshot});
}
