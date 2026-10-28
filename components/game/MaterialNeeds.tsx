'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import type { Engine } from '@/lib/game/model';
import { ITEMS, type Bag } from '@/lib/game/data';
import { materialCost, materialPlan, materialSource, type MaterialTarget } from '@/lib/game/materials';

export default function MaterialNeeds({engine,cost,kind,target,token}:{engine:Engine;cost:Bag;kind:MaterialTarget;target:string|number;token?:string}) {
  useLocale();
  const plan=materialPlan(engine.s,cost);
  if(!plan.missing.length)return null;
  const allowed=!!materialCost(engine.s,kind,target,token);
  return <details className="material-needs">
    <summary>{translate("m_0dc75c86a1")}{plan.total} {translate("m_462fdded69")}{localize(allowed&&plan.ready?sourceText("m_74442da8e2"):'')}</summary>
    <ul>{plan.missing.map(item=><li key={item.id}>
      <b>{localize(ITEMS[item.id].name)}: {item.amount} {translate("m_5dfe9bf3dd")}</b>
      <span>{translate("m_b6742dc8b8")}{item.stored} {translate("m_974dff4739")}{item.delivery}</span>
      <small>{localize(item.delivery>=item.amount?sourceText("m_3ed363982c"):materialSource(item.id))}</small>
    </li>)}</ul>
    {allowed&&<><button className="secondary-button" disabled={!plan.ready} onClick={()=>engine.prepareMaterials(kind,target,token)}>{translate("m_f30a44ac2a")}{plan.total}</button>
      <p>{localize(plan.reason||sourceText("m_4ea0f453be"))}</p></>}
  </details>;
}
