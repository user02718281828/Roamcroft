'use client';
import type { Engine } from '@/lib/game/model';
import { ITEMS, type Bag } from '@/lib/game/data';
import { materialCost, materialPlan, materialSource, type MaterialTarget } from '@/lib/game/materials';

export default function MaterialNeeds({engine,cost,kind,target,token}:{engine:Engine;cost:Bag;kind:MaterialTarget;target:string|number;token?:string}) {
  const plan=materialPlan(engine.s,cost);
  if(!plan.missing.length)return null;
  const allowed=!!materialCost(engine.s,kind,target,token);
  return <details className="material-needs">
    <summary>Eksik malzemeler · {plan.total} adet{allowed&&plan.ready?' · Depoda hazır':''}</summary>
    <ul>{plan.missing.map(item=><li key={item.id}>
      <b>{ITEMS[item.id].name}: {item.amount} eksik</b>
      <span>Depo {item.stored} · Teslimat sandığı {item.delivery}</span>
      <small>{item.delivery>=item.amount?'Çanta → Teslimat sandığından alabilirsin.':materialSource(item.id)}</small>
    </li>)}</ul>
    {allowed&&<><button className="secondary-button" disabled={!plan.ready} onClick={()=>engine.prepareMaterials(kind,target,token)}>Eksikleri depodan al · {plan.total}</button>
      <p>{plan.reason||'Yalnızca eksik miktar ortak depodan çantana alınır; üretim veya teslimat otomatik başlamaz.'}</p></>}
  </details>;
}
