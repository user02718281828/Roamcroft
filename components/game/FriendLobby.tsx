'use client';
import {useEffect,useRef,useState} from 'react';
type Room={code:string;host:boolean;members:{name:string;you:boolean;host:boolean;online:boolean}[];sharedWorld:false};
export default function FriendLobby(){
  const [room,setRoom]=useState<Room|null>(null),[name,setName]=useState('Gezgin'),[code,setCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[copied,setCopied]=useState(false);
  const pending=useRef(false),alive=useRef(true);
  async function call(body:Record<string,unknown>){
    if(pending.current)return;pending.current=true;setBusy(true);
    try{const response=await fetch('/api/lobby',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});const data=await response.json() as {room:Room|null;error?:string};if(!response.ok)throw Error(data.error||'Bağlantı kurulamadı.');if(alive.current){setRoom(data.room);setError('');}}
    catch(e){if(alive.current)setError(e instanceof Error?e.message:'Bağlantı kurulamadı.');}
    finally{pending.current=false;if(alive.current)setBusy(false);}
  }
  useEffect(()=>{alive.current=true;const first=setTimeout(()=>void call({op:'status'}),0);const timer=setInterval(()=>{if(!document.hidden)void call({op:'status'});},5000);return()=>{alive.current=false;clearTimeout(first);clearInterval(timer);};},[]);
  return <section className="friend-lobby"><h3>Arkadaş lobisi · Önizleme</h3>
    <p>Bu adımda dört kişiye kadar davet lobisinde buluşabilirsiniz. Ortak haritada oynama henüz açık değil; çiftlikleriniz ayrı kalır.</p>
    {room?<><label>Davet kodu<input readOnly value={room.code} aria-label="Lobi davet kodu"/></label>
      <button className="secondary-button" onClick={()=>void navigator.clipboard.writeText(room.code).then(()=>setCopied(true)).catch(()=>setError('Kodu seçip kopyalayabilirsin.'))}>{copied?'Kopyalandı':'Davet kodunu kopyala'}</button>
      <ul>{room.members.map((m,i)=><li key={i}>{m.name}{m.you?' · Sen':''}{m.host?' · Ev sahibi':''} · {m.online?'Bağlı':'Bağlantı bekleniyor'}</li>)}</ul>
      <p>Lobi {room.members.length}/4. Menü açıkken bağlantı yenilenir. Ev sahibi 5 dakika dönmezse lobi kapanır.</p>
      <button className="secondary-button" disabled={busy} onClick={()=>void call({op:'leave'})}>{room.host?'Lobiyi kapat':'Lobiden ayrıl'}</button>
    </>:<><label>Oyuncu adın<input value={name} maxLength={24} onChange={e=>setName(e.target.value)}/></label>
      <button className="primary-button" disabled={busy||!name.trim()} onClick={()=>void call({op:'create',name})}>Davet lobisi aç</button>
      <form onSubmit={e=>{e.preventDefault();void call({op:'join',name,code:code.trim().toLowerCase()});}}><label>Arkadaşının davet kodu<input value={code} maxLength={24} onChange={e=>setCode(e.target.value)} autoComplete="off" spellCheck={false}/></label><button className="secondary-button" disabled={busy||!name.trim()||code.trim().length!==24}>Lobiye katıl</button></form>
    </>}{error&&<p role="alert" className="inventory-warning">{error}</p>}</section>;
}
