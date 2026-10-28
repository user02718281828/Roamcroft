'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import GameIcon from './GameIcon';
import MaterialNeeds from './MaterialNeeds';
import { ITEMS, type Bag } from '@/lib/game/data';
import { dailyOrders } from '@/lib/game/orders';
import { bagValue } from '@/lib/game/economy';
import { canAfford, type Engine } from '@/lib/game/model';

function OrderItems({items,inventory}:{items:Bag;inventory?:Bag}) {
  useLocale();
  return <div className="planning-items">{Object.entries(items).map(([id,n])=><span key={id}>
    <GameIcon id={id}/>{localize(ITEMS[id].name)}: {localize(inventory?`${inventory[id]||0} / ${n}`:n)}
  </span>)}</div>;
}
export default function DailyOrders({engine,npc}:{engine:Engine;npc:string}) {
  useLocale();
  const s=engine.s,orders=dailyOrders(s,npc),done=s.contracts[npc]===s.day,tomorrow=dailyOrders(s,npc,s.day+1);
  return <section className="daily-orders" aria-label={translate("m_9d1c29e829")}>
    <h3>{translate('orders.today', {day: s.day})}</h3>
    <p>{translate("m_848462c822")}</p>
    {done?<p className="order-completed" role="status">{translate("m_5ac99f093e")}</p>:<div className="planning-grid">{orders.map((order,index)=>{
      const locked=s.level<order.level;
      return <article className="planning-card" key={order.token}>
        <header><GameIcon id={Object.keys(order.input)[0]}/><h4>{localize(order.name)}</h4></header>
        <b>{localize(index===0?sourceText("m_7be7504058"):sourceText("m_946f89dc2c"))}</b>
        <p>{localize(order.description)}</p><OrderItems items={order.input} inventory={s.inventory}/>
        <MaterialNeeds engine={engine} cost={order.input} kind="order" target={npc} token={order.token}/>
        <p>{translate("m_444b3500f3")}{order.gold} {translate("m_53daaed3fa")}{order.xp} {translate("m_9a2d61f5c0")}</p>
        {order.supplies&&<OrderItems items={order.supplies}/>}<p>{translate("m_91c5c2b0a1")}{order.value} {translate("m_6307543bf5")}{order.gold+bagValue(order.supplies||{})-order.value} {translate("m_ce0e1502e0")}</p>
        <button className="primary-button" disabled={locked||!canAfford(s,order.input)} onClick={()=>engine.completeContract(npc,order.token)}>
          {localize(locked?sourceText("m_dc073e5534", { p0: order.level }):sourceText("m_94c82ae056", { p0: order.name }))}
        </button>
      </article>;
    })}</div>}
    <details className="farm-planner order-preview"><summary>{translate("m_ca3cb62f5d")}<small>{translate('orders.tomorrow', {day: s.day+1})}</small></summary>
      {tomorrow.map(order=><div className="order-next" key={order.token}><b>{localize(order.name)}{localize(s.level<order.level?sourceText("m_4d9da67f1b", { p0: order.level }):'')}</b><OrderItems items={order.input}/></div>)}
      <p>{translate("m_7ab6ec5eb2")}</p>
    </details>
  </section>;
}
