'use client';
import {useEffect,useState} from 'react';
import {Input} from '@/components/ui/input';
import type {CoopClient} from '@/lib/coop/client';
import type {RoomInfo} from '@/lib/coop/protocol';
export default function OnlinePanel({client,onClose}:{client:CoopClient;onClose:()=>void}) {
  const [name,setName]=useState('Gezgin'),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[rooms,setRooms]=useState<RoomInfo[]>([]),[copy,setCopy]=useState(false);
  useEffect(()=>{let active=true;void client.list().then(r=>{if(active)setRooms(r.rooms);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Odalar yüklenemedi.');});return()=>{active=false;};},[client]);
  const run=async(fn:()=>Promise<unknown>,close=true)=>{setBusy(true);setError('');try{await fn();if(close)onClose();}catch(e){setError(e instanceof Error?e.message:'Bağlantı kurulamadı.');}finally{setBusy(false);}};
  return <div className="online-panel">
    <p className="panel-note">Dört kişiye kadar ortak çiftçilik. Çanta, yapılar ve köy ilerlemesi paylaşılır. Ev sahibi açık kaldığı sürece dünya ilerler; son oda kaydı sunucuda saklanır. Katılmak tek oyunculu kaydını değiştirmez.</p>
    <p className="panel-note">Arkadaşına önce sitenin paylaşım ayarlarından erişim ver, ardından oda kodunu ilet. Birlikte keşifte ev sahibinin çevresindeki 22 karelik alan paylaşılır. Maden geçişlerini ve yeni güne başlamayı ev sahibi yönetir.</p>
    {client.active ? <>
      <h3>{client.session?.role==='host' ? 'Sen ev sahibisin' : 'Ortak dünyadasın'}</h3>
      <output>{client.status}</output>
      <label htmlFor="active-room">Oda kodu</label>
      <Input id="active-room" readOnly value={client.session?.room || ''}/>
      <button className="secondary-button" onClick={()=>void navigator.clipboard.writeText(client.session?.room || '').then(()=>setCopy(true)).catch(()=>setError('Oda kodunu seçip kopyalayabilirsin.'))}>{copy?'Kod kopyalandı':'Oda kodunu kopyala'}</button>
      <div className="online-players">{client.peers.map(p=><p key={p.id}>{p.name}{p.id===client.session?.member?' · Sen':''}</p>)}</div>
      {client.session?.role==='host' && <button className="primary-button" disabled={busy} onClick={()=>void run(()=>client.publish(),false)}>Ortak dünyayı kaydet</button>}
      <button className="secondary-button" disabled={busy} onClick={()=>void run(()=>client.leave())}>Odadan ayrıl · Tek oyunculuya dön</button>
      {error && <button className="secondary-button" onClick={()=>void run(()=>client.leave(true))}>Son sunucu kaydını bırakıp tek oyunculuya dön</button>}
    </> : <>
      <label htmlFor="online-name">Oyuncu adın</label>
      <Input id="online-name" value={name} maxLength={32} onChange={e=>setName(e.target.value)}/>
      <button className="primary-button full-width" disabled={busy || !name.trim()} onClick={()=>void run(()=>client.start('create',name))}>Köyümün ortak kopyasını aç</button>
      <form onSubmit={e=>{e.preventDefault();void run(()=>client.start('join',name,code.trim().toLowerCase()));}}>
        <label htmlFor="room-code">Arkadaşının oda kodu</label>
        <Input id="room-code" value={code} maxLength={24} onChange={e=>setCode(e.target.value)} autoComplete="off" spellCheck={false}/>
        <button className="primary-button full-width" disabled={busy || !name.trim() || code.trim().length!==24}>Odaya katıl</button>
      </form>
      {!!rooms.length && <h3>Kayıtlı ortak dünyaların</h3>}
      {rooms.map(room=><article className="catalog-card" key={room.id}><h4>{room.name}</h4><p>{room.online?'Şu anda açık':'Son kayıt · '+new Date(room.updated).toLocaleString('tr-TR')}</p><button className="secondary-button" disabled={busy || room.online || !name.trim()} onClick={()=>void run(()=>client.start('resume',name,room.id))}>Ev sahibi olarak sürdür</button></article>)}
    </>}
    {busy && <output>Bağlanıyor…</output>}
    {error && <p className="inventory-warning" role="alert">{error}</p>}
  </div>;
}
