'use client';
import {useState} from 'react';
import {Backpack,Archive,ChevronDown} from 'lucide-react';
import type {Engine} from '@/lib/game/model';
import {ITEMS} from '@/lib/game/data';
import {inventoryUsed,inventoryCapacity} from '@/lib/game/progression';
import {inventoryView,inventoryAction,type BagFilter,type BagSort} from '@/lib/ui/inventory';
import {localize,translate} from '@/lib/i18n/core';
import {useLocale} from '@/lib/i18n/react';
import GameIcon from './GameIcon';
import StoragePanel from './StoragePanel';
import HotbarEditor from './HotbarEditor';

export default function InventoryPanel({engine,onSeed,onBuild}:{engine:Engine;onSeed:(id:string)=>void;onBuild:(id:string)=>void}){
  const locale=useLocale();
  const [view,setView]=useState<'bag'|'storage'>('bag'),[detailsOpen,setDetailsOpen]=useState(false);
  const [filter,setFilter]=useState<BagFilter>('all'),[sort,setSort]=useState<BagSort>('name'),[selected,setSelected]=useState<string|null>(null);
  const entries=inventoryView(engine.s.inventory,filter,sort,locale),entry=entries.find(item=>item.id===selected)||entries[0];
  const item=entry?ITEMS[entry.id]:undefined,action=entry?inventoryAction(entry.id):{kind:'none'} as const;
  const used=inventoryUsed(engine.s),capacity=inventoryCapacity(engine.s),number=new Intl.NumberFormat(locale),storage=engine.storageCapacity();
  const runAction=()=>{
    if(!entry||!(engine.s.inventory[entry.id]>0))return;
    if(action.kind==='eat')engine.eat(action.id);
    else if(action.kind==='plant')onSeed(action.crop);
    else if(action.kind==='build')onBuild(action.type);
    else if(action.kind==='fertilize')onSeed('fertilizer');
  };
  const actionLabel=action.kind==='eat'?'m_90de6b6295':action.kind==='plant'?'m_af50b9285a':action.kind==='fertilize'?'m_0218b7078b':entry?.id==='sprinkler'?'m_05635007d2':'m_a13e68f6c0';
  return <section className="pack-panel" data-view={view}>
    <header className="pack-summary"><Backpack aria-hidden="true"/><div>
      <strong>{translate('bag.capacity',{used:number.format(used),capacity:number.format(capacity)})}</strong>
      <meter min={0} max={capacity} value={Math.min(used,capacity)} aria-label={translate('bag.capacity',{used,capacity})}/>
    </div></header>
    <div className="pack-destinations" role="group" aria-label={translate('bag.locations')}>
      <button type="button" aria-pressed={view==='bag'} onClick={()=>setView('bag')}><Backpack aria-hidden="true"/>{translate('bag.satchel')}</button>
      <button type="button" aria-pressed={view==='storage'} onClick={()=>setView('storage')}><Archive aria-hidden="true"/>{translate('bag.storageTab')}{storage>0&&<small>{number.format(storage)}</small>}</button>
    </div>
    {view==='storage'?(storage>0?<StoragePanel engine={engine}/>:<div className="pack-storage-locked">
      <GameIcon id="chest"/><h3>{translate('bag.storageLocked')}</h3><p>{translate('bag.storageHelp')}</p>
      <button type="button" className="primary-button" onClick={()=>onBuild('chest')}>{translate('bag.buildChest')}</button>
    </div>):<>
    {used>=capacity&&<p className="inventory-warning" role="alert">{translate('m_6839d924fc')}</p>}
    <div className="pack-controls">
      <div className="pack-filters" role="group" aria-label={translate('bag.contents')}>
        {([['all','m_f43a65ad82'],['food','m_6f185074f6'],['seeds','m_eaf3725fa6'],['resources','m_2f0db590c3']] as const).map(([id,key])=>
          <button type="button" key={id} aria-pressed={filter===id} onClick={()=>{setFilter(id);setSelected(null);}}>{translate(key)}</button>)}
      </div>
      <label className="pack-sort"><span>{translate('bag.sort')}</span><select value={sort} onChange={event=>setSort(event.target.value as BagSort)}>
        <option value="name">{translate('bag.byName')}</option><option value="quantity">{translate('bag.byQuantity')}</option>
      </select></label>
    </div>
    <div className="pack-layout"><div className="pack-pockets">
      {!entries.length&&<p className="pack-empty" role="status">{translate('bag.empty')}</p>}
      <ul className="pack-slots" aria-label={translate('bag.contents')}>
        {entries.map(value=><li key={value.id}><button type="button" className="pack-slot" aria-pressed={entry?.id===value.id}
          aria-label={translate('bag.slot',{name:value.name,count:number.format(value.count)})} title={value.name}
          onClick={()=>setSelected(value.id)}><GameIcon id={value.id}/><span className="pack-count" aria-hidden="true">{number.format(value.count)}</span>
        </button></li>)}
      </ul>
    </div>
    <aside className="pack-details" data-open={detailsOpen} aria-label={translate('bag.selected')}>
      <div className="pack-selection">{entry&&<GameIcon id={entry.id}/>}<div><h3>{entry?.name||translate('bag.pick')}</h3>
        {entry&&<p>{translate('bag.count',{count:number.format(entry.count)})}</p>}</div></div>
      {entry&&action.kind!=='none'&&<button type="button" className="primary-button pack-use" onClick={runAction}>{translate(actionLabel)}</button>}
      <button type="button" className="pack-detail-toggle" aria-expanded={detailsOpen} aria-controls="pack-detail-body" onClick={()=>setDetailsOpen(!detailsOpen)}>
        <span>{translate('bag.details')}</span><ChevronDown aria-hidden="true"/>
      </button>
      <div id="pack-detail-body" className="pack-detail-body">
        {entry?(item?<>
          <p>{localize(item.category)}</p><dl className="pack-stats">
            {!!item.food&&<div><dt>{translate('m_65edabcfc1')}</dt><dd>+{item.food}</dd></div>}
            {!!item.energy&&<div><dt>{translate('m_2cfd3126aa')}</dt><dd>+{item.energy}</dd></div>}
            {!!item.heal&&<div><dt>{translate('m_5aed93824f')}</dt><dd>+{item.heal}</dd></div>}
          </dl><p>{translate('bag.baseValue',{value:number.format(item.price)})}</p>
          {action.kind==='none'&&<p>{translate('bag.noAction')}</p>}
        </>:<p>{translate('bag.legacyHelp')}</p>):<p>{translate('bag.pickHelp')}</p>}
      </div>
      <HotbarEditor itemId={entry?.id}/>
    </aside></div>
    </>}
  </section>;
}
