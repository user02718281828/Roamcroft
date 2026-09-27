'use client';
import GameIcon from './GameIcon';
import MaterialNeeds from './MaterialNeeds';
import { BUILDINGS, CROPS, ITEMS, SEASONS, type Bag } from '@/lib/game/data';
import { canAfford, season, tradeUnitPrice, type Building, type Engine } from '@/lib/game/model';
import { cropPlan } from '@/lib/game/farming';
import { machineRecipe, machineRecipes, productionRate } from '@/lib/game/production';
import { inventoryFits } from '@/lib/game/progression';
import { processingValue } from '@/lib/game/economy';

function Items({ bag }: { bag: Bag }) {
  return <span className="planning-items">{Object.entries(bag).map(([id,n])=><span key={id}><GameIcon id={id}/>{n} {ITEMS[id].name}</span>)}</span>;
}
export function CropPlanner({engine,onSeed}:{engine:Engine;onSeed:(id:string)=>void}) {
  const s=engine.s;
  return <details className="farm-planner">
    <summary>Ekim planı <small>Mevsim, süre ve kullanım yolları</small></summary>
    <p>{SEASONS[season(s)]} · {(s.day-1)%7+1}/7. Süreler sulanmış, gübresiz açık tarla içindir; oyun menüde ve kapalıyken durur. Mevsim dışındaki ekin ölmez, büyümeyi bekletir.</p>
    <div className="planning-grid">{Object.entries(CROPS).map(([id,c])=>{
      const plan=cropPlan(s,id),locked=s.level<c.level;
      const uses=Object.keys(BUILDINGS).flatMap(type=>machineRecipes(type).filter(r=>r.input[id]).map(()=>BUILDINGS[type].name));
      return <article className="planning-card" key={id}>
        <header><GameIcon id={id}/><h4>{c.name}</h4><span>{s.inventory[c.seed]||0} tohum</span></header>
        <p>{c.seasons.map(i=>SEASONS[i]).join(' · ')}</p>
        <b>{plan.growsNow?plan.willPause?'Mevsim dönmeden yetişmez':'Şimdi büyür':'Bu mevsimde büyüme durur'}</b>
        <p>İlk hasat ≈{plan.seconds} sn · {c.yield} ürün{plan.regrowSeconds?` · sonra ≈${plan.regrowSeconds} sn arayla yeniden hasat`:' · hasatta 1 tohum geri'}</p>
        <p>Temel hasat satışı: {c.yield*tradeUnitPrice(s,id,false)} altın{uses.length?` · İşleme: ${[...new Set(uses)].join(', ')}`:''}</p>
        <button className="secondary-button" disabled={locked||!s.inventory[c.seed]} onClick={()=>onSeed(id)}>{locked?`Seviye ${c.level} gerekli`:`${c.name} ek`}</button>
      </article>;
    })}</div>
    <p>Domates ve mısır kökte kalır; yeniden hasatta tohum vermez. Yerini değiştirmek için çapa ile ekini sökebilirsin. Gübre ve sera süreyi kısaltır.</p>
  </details>;
}
export function MachineCard({engine,building:b}:{engine:Engine;building:Building}) {
  const s=engine.s,r=machineRecipe(b);
  if(!r)return null;
  const economics=processingValue(s,r);
  const blocked=b.processing&&b.timer>=r.time&&!inventoryFits(s,r.output);
  const status=!b.enabled?'Duraklatıldı':blocked?'ÇANTA DOLU · Bitmiş ürün makinede korunuyor':b.processing?`İşleniyor · ${Math.ceil((r.time-b.timer)/productionRate(s,b))} sn`:b.repeat!==false?'Otomatik · malzeme bekliyor':'Bir parti başlatmanı bekliyor';
  return <article className="planning-card machine-card">
    <header><GameIcon id={b.type}/><h4>{BUILDINGS[b.type].name}</h4><span>{b.x}, {b.z}</span></header>
    <label>Üretilecek tarif<select aria-label={`${BUILDINGS[b.type].name} ${b.x}, ${b.z} tarifi`} value={r.id} disabled={b.processing} onChange={event=>engine.setMachineRecipe(b.id,event.target.value)}>
      {machineRecipes(b.type).map(option=><option key={option.id} value={option.id} disabled={s.level<option.level}>{Object.keys(option.output).map(id=>ITEMS[id].name).join(' + ')}{s.level<option.level?` · Sv. ${option.level}`:''}</option>)}
    </select></label>
    <div className="machine-flow"><Items bag={r.input}/><span aria-label="üretir">→</span><Items bag={r.output}/></div>
    {!b.processing&&<MaterialNeeds engine={engine} cost={r.input} kind="machine" target={b.id} token={r.id}/>}
    <p>Bir parti ≈{Math.ceil(r.time/productionRate(s,b))} sn · Çıktı satışı {Object.entries(r.output).reduce((v,[id,n])=>v+tradeUnitPrice(s,id,false)*n,0)} altın</p>
    <details className="machine-economics"><summary>İşlemeye değer mi?</summary>
      <p>Malzemeyi doğrudan sat: {economics.input} altın. İşleyip sat: {economics.output} altın. Fark: {economics.added>0?'+':''}{economics.added} altın.</p>
      <p>{economics.purchase===null?'Girdilerin tamamı pazarda satılmıyor.':`Malzemeyi pazardan alırsan ${economics.purchase} altın harcarsın; satış sonrası fark ${economics.purchasedMargin!>0?'+':''}${economics.purchasedMargin} altın.`}</p>
      <small>Yapı maliyeti ve zaman dahil değildir. Yemek, yem ve yapı malzemesi olarak kullanmak da bir seçenektir.</small>
    </details>
    <progress aria-label={`${BUILDINGS[b.type].name} üretim ilerlemesi`} max={r.time} value={b.timer}/>
    <p className={blocked?'inventory-warning':''} role={blocked?'status':undefined}>{status}</p>
    {b.processing&&<small>Malzemeler yüklendi. Parti bitene kadar tarif değişmez; duraklatmak malzemeyi kaybettirmez.</small>}
    <div className="machine-actions">
      {!b.processing?<button className="primary-button" disabled={!canAfford(s,r.input)||b.hp<=0||s.level<r.level} onClick={()=>engine.startProduction(b.id)}>Bir parti başlat</button>:<button className="secondary-button" onClick={()=>engine.toggleBuilding(b.id)}>{b.enabled?'Duraklat':'Devam et'}</button>}
      <label><input type="checkbox" checked={b.repeat!==false} onChange={event=>engine.setMachineRepeat(b.id,event.target.checked)}/> Otomatik tekrar</label>
    </div>
  </article>;
}
export function ProductionWorkshop({engine}:{engine:Engine}) {
  const machines=engine.s.buildings.filter(b=>BUILDINGS[b.type].production);
  return <details className="farm-planner"><summary>Makinelerim <small>{machines.length} makine · {machines.filter(b=>b.processing).length} parti yüklü</small></summary><p>Bir partilik üret veya otomatik tekrarı aç. Malzeme her partinin başında çantadan makineye aktarılır. Depodaki malzeme için önce çantana al. Maden ve uzaktaki bölgelerde üretim bekler.</p>
    {machines.length?<div className="planning-grid">{machines.map(b=><MachineCard key={b.id} engine={engine} building={b}/>)}</div>:<p>İnşa → Üretim bölümünden bir makine kur. İlk marangozla odunu keresteye çevirebilirsin.</p>}
  </details>;
}
