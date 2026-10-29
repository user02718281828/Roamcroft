'use client';
import {useRef, useState} from 'react';
import {localize, translate} from '@/lib/i18n/core';
import {useLocale} from '@/lib/i18n/react';
import type {Engine} from '@/lib/game/model';
import {ITEMS} from '@/lib/game/data';
import {storageQuote} from '@/lib/ui/storage-view';
import GameIcon from './GameIcon';
export default function StoragePanel({engine}:{engine:Engine}) {
  const locale=useLocale(), number=new Intl.NumberFormat(locale);
  const [selected,setSelected]=useState<string|null>(null), [confirm,setConfirm]=useState<ReturnType<typeof storageQuote>|null>(null);
  const [quantity,setQuantity]=useState('1');
  const intent=useRef<typeof confirm>(null), sent=useRef('');
  const s=engine.s,capacity=engine.storageCapacity(),used=Object.values(s.storage).reduce((n,v)=>n+v,0);
  const items=Object.keys(ITEMS).filter(k=>(s.storage[k]||0)+(s.inventory[k]||0)>0);
  const id=selected&&items.includes(selected)?selected:items[0];
  const requested=quantity==='all'?undefined:quantity.trim()?Number(quantity):NaN;
  const deposit=id?storageQuote(engine,id,true,requested):null, withdraw=id?storageQuote(engine,id,false,requested):null;
  const propose=(quote:NonNullable<typeof confirm>)=>{intent.current=quote;setConfirm(quote);};
  const cancel=()=>{intent.current=null;setConfirm(null);};
  const transfer=()=>{
    const quote=intent.current;cancel();if(!quote)return;
    const fresh=storageQuote(engine,quote.id,quote.deposit,requested);
    if(!fresh.amount||fresh.signature!==quote.signature||sent.current===fresh.signature)return;
    if(engine.transferStorage(fresh.id,fresh.amount,fresh.deposit)&&engine.network?.guest)sent.current=fresh.signature;
  };
  return <section className="storage-section">
    <h3>{translate('m_27cc26bde0')}{number.format(used)}/{number.format(capacity)}</h3><p>{translate('storage.choose')}</p>
    <div className="storage-items" role="group" aria-label={translate('m_27cc26bde0')}>
      {items.map(item=><button key={item} type="button" aria-pressed={item===id} onClick={()=>{setSelected(item);cancel();}}>
        <GameIcon id={item}/><span>{localize(ITEMS[item].name)}<small>{translate('storage.counts',{bag:number.format(s.inventory[item]||0),stored:number.format(s.storage[item]||0)})}</small></span>
      </button>)}
    </div>
    {id&&deposit&&withdraw&&<div className="storage-transfer">
      <b>{localize(ITEMS[id].name)}</b>
      <p>{translate('storage.counts',{bag:number.format(s.inventory[id]||0),stored:number.format(s.storage[id]||0)})}</p>
      <fieldset className="storage-quantity"><legend>{translate('storage.quantity')}</legend>
        <div className="storage-presets">{(['1','10','100','all'] as const).map(value=><button key={value} type="button" aria-pressed={quantity===value}
          onClick={()=>{setQuantity(value);cancel();}}>{value==='all'?translate('m_f43a65ad82'):value}</button>)}</div>
        <label>{translate('storage.customQuantity')}<input type="number" inputMode="numeric" min={1} max={Math.max(capacity,900)} step={1}
          value={quantity==='all'?'':quantity} placeholder={quantity==='all'?translate('m_f43a65ad82'):undefined}
          onChange={event=>{setQuantity(event.target.value);cancel();}}/></label>
        {!deposit.amount&&!withdraw.amount&&<p role="status">{translate('storage.noTransfer')}</p>}
      </fieldset>
      <div className="storage-directions">
        <button type="button" className="secondary-button" disabled={!deposit.amount||sent.current===deposit.signature} onClick={()=>propose(deposit)}>{translate('storage.store',{count:number.format(deposit.amount)})}</button>
        <button type="button" className="secondary-button" disabled={!withdraw.amount||sent.current===withdraw.signature} onClick={()=>propose(withdraw)}>{translate('storage.take',{count:number.format(withdraw.amount)})}</button>
      </div>
      {confirm&&<div className="storage-confirm" role="group" aria-label={translate('storage.confirm')}>
        <p>{translate(confirm.deposit?'storage.storeConfirm':'storage.takeConfirm',{name:localize(ITEMS[confirm.id].name),count:number.format(confirm.amount)})}</p>
        <button type="button" className="secondary-button" onClick={cancel}>{translate('storage.cancel')}</button>
        <button type="button" className="primary-button" onClick={transfer}>{translate('storage.confirm')}</button>
      </div>}
      <p>{translate('storage.authority')}</p>
    </div>}
  </section>;
}
