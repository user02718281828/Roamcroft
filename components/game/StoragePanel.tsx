'use client';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import type {Engine} from '@/lib/game/model';
import {ITEMS} from '@/lib/game/data';
import {inventoryCapacity,inventoryUsed} from '@/lib/game/progression';
import GameIcon from './GameIcon';
export default function StoragePanel({engine}:{engine:Engine}) {
  useLocale();
 const s=engine.s,capacity=engine.storageCapacity(),used=Object.values(s.storage).reduce((n,v)=>n+v,0);
 const items=Object.keys(ITEMS).filter(k=>(s.storage[k]||0)+(s.inventory[k]||0)>0);
 return <section className="storage-section"><h3>{translate("m_27cc26bde0")}{used}/{capacity}</h3><p>{translate("m_850a6e4dba")}</p><button className="primary-button" disabled={!capacity||used>=capacity} onClick={()=>engine.depositMaterials()}>{translate("m_0e2c3d25b4")}</button><div className="storage-list">{items.map(id=>{const deposit=Math.min(s.inventory[id]||0,capacity-used),withdraw=Math.min(s.storage[id]||0,inventoryCapacity(s)-inventoryUsed(s));return <div key={id}><GameIcon id={id}/><span>{localize(ITEMS[id].name)}<small>{translate("m_761ebe0a42")}{s.inventory[id]||0} {translate("m_acdce8ae9e")}{s.storage[id]||0}</small></span><button disabled={deposit<=0} onClick={()=>engine.transferStorage(id,deposit,true)}>{translate("m_4c3e0cb11c")}{localize(deposit||'')}</button><button disabled={withdraw<=0} onClick={()=>engine.transferStorage(id,withdraw,false)}>{translate("m_57e0f3dc39")}{localize(withdraw||'')}</button></div>;})}</div></section>;
}
