'use client';
import GameIcon from './GameIcon';
import MaterialNeeds from './MaterialNeeds';
import { ITEMS, type Bag } from '@/lib/game/data';
import { dailyOrders } from '@/lib/game/orders';
import { bagValue } from '@/lib/game/economy';
import { canAfford, type Engine } from '@/lib/game/model';

function OrderItems({items,inventory}:{items:Bag;inventory?:Bag}) {
  return <div className="planning-items">{Object.entries(items).map(([id,n])=><span key={id}>
    <GameIcon id={id}/>{ITEMS[id].name}: {inventory?`${inventory[id]||0} / ${n}`:n}
  </span>)}</div>;
}
export default function DailyOrders({engine,npc}:{engine:Engine;npc:string}) {
  const s=engine.s,orders=dailyOrders(s,npc),done=s.contracts[npc]===s.day,tomorrow=dailyOrders(s,npc,s.day+1);
  return <section className="daily-orders" aria-label="Günlük sipariş seçenekleri">
    <h3>Bugünün işi · {s.day}. gün</h3>
    <p>İki yoldan birini seç. Kişi başına günde bir teslimat; gece yenilenir. Yetiştiremezsen ceza yok.</p>
    {done?<p className="order-completed" role="status">Bugünün teslimatı tamamlandı. Yarının ihtiyaçlarını aşağıdan görebilirsin.</p>:<div className="planning-grid">{orders.map((order,index)=>{
      const locked=s.level<order.level;
      return <article className="planning-card" key={order.token}>
        <header><GameIcon id={Object.keys(order.input)[0]}/><h4>{order.name}</h4></header>
        <b>{index===0?'Doğrudan teslim · Altın':'İşlenmiş teslim · Altın ve malzeme'}</b>
        <p>{order.description}</p><OrderItems items={order.input} inventory={s.inventory}/>
        <MaterialNeeds engine={engine} cost={order.input} kind="order" target={npc} token={order.token}/>
        <p>Karşılık: {order.gold} altın · {order.xp} DP · Dostluk +8</p>
        {order.supplies&&<OrderItems items={order.supplies}/>}<p>Normal satış: {order.value} altın. Sipariş avantajı: +{order.gold+bagValue(order.supplies||{})-order.value} altın değerinde.</p>
        <button className="primary-button" disabled={locked||!canAfford(s,order.input)} onClick={()=>engine.completeContract(npc,order.token)}>
          {locked?`Seviye ${order.level} gerekli`:`${order.name} · Teslim et`}
        </button>
      </article>;
    })}</div>}
    <details className="farm-planner order-preview"><summary>Yarına hazırlan <small>{s.day+1}. günün iki seçeneği</small></summary>
      {tomorrow.map(order=><div className="order-next" key={order.token}><b>{order.name}{s.level<order.level?` · Sv. ${order.level}`:''}</b><OrderItems items={order.input}/></div>)}
      <p>Malzemeyi çantanda veya depoda biriktir; teslim ederken çantana al. Ödül malzemesi çantaya sığmazsa depoya veya teslimat sandığına gönderilir.</p>
    </details>
  </section>;
}
