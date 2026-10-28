'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';
import { intlLocale } from '@/lib/i18n/locale';

import {useEffect,useState} from 'react';
import {Input} from '@/components/ui/input';
import type {CoopClient} from '@/lib/coop/client';
import type {RoomInfo} from '@/lib/coop/protocol';
export default function OnlinePanel({client,onClose}:{client:CoopClient;onClose:()=>void}) {
  useLocale();
  const [name,setName]=useState(() => translate("m_768201cbf7")),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[rooms,setRooms]=useState<RoomInfo[]>([]),[copy,setCopy]=useState(false);
  useEffect(()=>{let active=true;void client.list().then(r=>{if(active)setRooms(r.rooms);}).catch(e=>{if(active)setError(e instanceof Error?e.message:sourceText("m_53dd7c7a65"));});return()=>{active=false;};},[client]);
  const run=async(fn:()=>Promise<unknown>,close=true)=>{setBusy(true);setError('');try{await fn();if(close)onClose();}catch(e){setError(e instanceof Error?e.message:sourceText("m_2008fbd8ba"));}finally{setBusy(false);}};
  return <div className="online-panel">
    <p className="panel-note">{translate("m_8a1d50cde2")}</p>
    <p className="panel-note">{translate("m_f9912451dc")}</p>
    {client.active ? <>
      <h3>{localize(client.session?.role==='host' ? sourceText("m_f3fe131c33") : sourceText("m_cecc680749"))}</h3>
      <output>{localize(client.status)}</output>
      <label htmlFor="active-room">{translate("m_b24088e79f")}</label>
      <Input id="active-room" readOnly value={client.session?.room || ''}/>
      <button className="secondary-button" onClick={()=>void navigator.clipboard.writeText(client.session?.room || '').then(()=>setCopy(true)).catch(()=>setError(sourceText("m_d6e63f7b4a")))}>{localize(copy?sourceText("m_4679011bc0"):sourceText("m_5785bcb71e"))}</button>
      <div className="online-players">{client.peers.map(p=><p key={p.id}>{p.name}{localize(p.id===client.session?.member?sourceText("m_f7e84cde04"):'')}</p>)}</div>
      {client.session?.role==='host' && <button className="primary-button" disabled={busy} onClick={()=>void run(()=>client.publish(),false)}>{translate("m_2e5db81c45")}</button>}
      <button className="secondary-button" disabled={busy} onClick={()=>void run(()=>client.leave())}>{translate("m_7b96544c69")}</button>
      {localize(error && <button className="secondary-button" onClick={()=>void run(()=>client.leave(true))}>{translate("m_304c5e19d8")}</button>)}
    </> : <>
      <label htmlFor="online-name">{translate("m_ec0762e936")}</label>
      <Input id="online-name" value={name} maxLength={32} onChange={e=>setName(e.target.value)}/>
      <button className="primary-button full-width" disabled={busy || !name.trim()} onClick={()=>void run(()=>client.start('create',name))}>{translate("m_4b62e05aed")}</button>
      <form onSubmit={e=>{e.preventDefault();void run(()=>client.start('join',name,code.trim().toLowerCase()));}}>
        <label htmlFor="room-code">{translate("m_8a0cd4d69b")}</label>
        <Input id="room-code" value={code} maxLength={24} onChange={e=>setCode(e.target.value)} autoComplete="off" spellCheck={false}/>
        <button className="primary-button full-width" disabled={busy || !name.trim() || code.trim().length!==24}>{translate("m_0b7f66c82f")}</button>
      </form>
      {!!rooms.length && <h3>{translate("m_93eba10bca")}</h3>}
      {rooms.map(room=><article className="catalog-card" key={room.id}><h4>{room.name}</h4><p>{localize(room.online?sourceText("m_83ce9bdd34"):sourceText("m_62bb0ca38a", { p0: new Date(room.updated).toLocaleString(intlLocale()) }))}</p><button className="secondary-button" disabled={busy || room.online || !name.trim()} onClick={()=>void run(()=>client.start('resume',name,room.id))}>{translate("m_43eb6bc6b9")}</button></article>)}
    </>}
    {busy && <output>{translate("m_4969bd47aa")}</output>}
    {localize(error && <p className="inventory-warning" role="alert">{localize(error)}</p>)}
  </div>;
}
