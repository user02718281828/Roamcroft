'use client';
import type {Engine} from '@/lib/game/model';
import {ITEMS} from '@/lib/game/data';
import {inventoryCapacity,inventoryUsed} from '@/lib/game/progression';
import GameIcon from './GameIcon';
export default function StoragePanel({engine}:{engine:Engine}) {
 const s=engine.s,capacity=engine.storageCapacity(),used=Object.values(s.storage).reduce((n,v)=>n+v,0);
 const items=Object.keys(ITEMS).filter(k=>(s.storage[k]||0)+(s.inventory[k]||0)>0);
 return <section className="storage-section"><h3>Ortak depo · {used}/{capacity}</h3><p>Bütün depo sandıkları aynı stokları açar. Fazla hasat otomatik depolanır; tarifler için ihtiyacını çantana al.</p><button className="primary-button" disabled={!capacity||used>=capacity} onClick={()=>engine.depositMaterials()}>Malzemeleri tek tıkla depola</button><div className="storage-list">{items.map(id=>{const deposit=Math.min(s.inventory[id]||0,capacity-used),withdraw=Math.min(s.storage[id]||0,inventoryCapacity(s)-inventoryUsed(s));return <div key={id}><GameIcon id={id}/><span>{ITEMS[id].name}<small>Çanta {s.inventory[id]||0} · Depo {s.storage[id]||0}</small></span><button disabled={deposit<=0} onClick={()=>engine.transferStorage(id,deposit,true)}>Koy {deposit||''}</button><button disabled={withdraw<=0} onClick={()=>engine.transferStorage(id,withdraw,false)}>Al {withdraw||''}</button></div>;})}</div></section>;
}
