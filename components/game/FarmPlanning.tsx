'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import GameIcon from './GameIcon';
import MaterialNeeds from './MaterialNeeds';
import { BUILDINGS, CROPS, ITEMS, SEASONS, type Bag } from '@/lib/game/data';
import { canAfford, season, tradeUnitPrice, type Building, type Engine } from '@/lib/game/model';
import { cropPlan } from '@/lib/game/farming';
import { machineRecipe, machineRecipes, productionRate } from '@/lib/game/production';
import { inventoryFits } from '@/lib/game/progression';
import { processingValue } from '@/lib/game/economy';

function Items({ bag }: { bag: Bag }) {
  useLocale();
  return <span className="planning-items">{Object.entries(bag).map(([id,n])=><span key={id}><GameIcon id={id}/>{n} {localize(ITEMS[id].name)}</span>)}</span>;
}
export function CropPlanner({engine,onSeed}:{engine:Engine;onSeed:(id:string)=>void}) {
  useLocale();
  const s=engine.s;
  return <details className="farm-planner">
    <summary>{translate("m_26abfbcc2f")}<small>{translate("m_53704d98e3")}</small></summary>
    <p>{translate('farm.conditions', {season: localize(SEASONS[season(s)]), day: (s.day-1)%7+1})}</p>
    <div className="planning-grid">{Object.entries(CROPS).map(([id,c])=>{
      const plan=cropPlan(s,id),locked=s.level<c.level;
      const uses=Object.keys(BUILDINGS).flatMap(type=>machineRecipes(type).filter(r=>r.input[id]).map(()=>BUILDINGS[type].name));
      return <article className="planning-card" key={id}>
        <header><GameIcon id={id}/><h4>{localize(c.name)}</h4><span>{s.inventory[c.seed]||0} {translate("m_f09c16332a")}</span></header>
        <p>{localize(c.seasons.map(i=>SEASONS[i]).join(' · '))}</p>
        <b>{localize(plan.growsNow?plan.willPause?sourceText("m_b12a2f10f7"):sourceText("m_cd598d5d65"):sourceText("m_bc8fb1c19f"))}</b>
        <p>{translate("m_d1003533c8")}{plan.seconds} {translate("m_84f899765b")}{c.yield} {translate("m_560a7546a6")}{localize(plan.regrowSeconds?sourceText("m_fa9839a7a5", { p0: plan.regrowSeconds }):sourceText("m_1e399555ad"))}</p>
        <p>{translate("m_f67f2a7941")}{c.yield*tradeUnitPrice(s,id,false)} {translate("m_7a0844b848")}{localize(uses.length?sourceText("m_8e2aaf6e22", { p0: [...new Set(uses)].join(', ') }):'')}</p>
        <button className="secondary-button" disabled={locked||!s.inventory[c.seed]} onClick={()=>onSeed(id)}>{localize(locked?sourceText("m_dc073e5534", { p0: c.level }):sourceText("m_82be6426ff", { p0: c.name }))}</button>
      </article>;
    })}</div>
    <p>{translate("m_11f4ac60f3")}</p>
  </details>;
}
export function MachineCard({engine,building:b}:{engine:Engine;building:Building}) {
  useLocale();
  const s=engine.s,r=machineRecipe(b);
  if(!r)return null;
  const economics=processingValue(s,r);
  const blocked=b.processing&&b.timer>=r.time&&!inventoryFits(s,r.output);
  const status=!b.enabled?sourceText("m_49730237c2"):blocked?sourceText("m_2efaf28955"):b.processing?sourceText("m_e6706244af", { p0: Math.ceil((r.time-b.timer)/productionRate(s,b)) }):b.repeat!==false?sourceText("m_8063825f11"):sourceText("m_938058a80f");
  return <article className="planning-card machine-card">
    <header><GameIcon id={b.type}/><h4>{localize(BUILDINGS[b.type].name)}</h4><span>{b.x}, {b.z}</span></header>
    <label>{translate("m_45fcfa8082")}<select aria-label={localize(sourceText("m_0b5f7a5119", { p0: BUILDINGS[b.type].name, p1: b.x, p2: b.z }))} value={r.id} disabled={b.processing} onChange={event=>engine.setMachineRecipe(b.id,event.target.value)}>
      {machineRecipes(b.type).map(option=><option key={option.id} value={option.id} disabled={s.level<option.level}>{localize(Object.keys(option.output).map(id=>ITEMS[id].name).join(' + '))}{localize(s.level<option.level?sourceText("m_4d9da67f1b", { p0: option.level }):'')}</option>)}
    </select></label>
    <div className="machine-flow"><Items bag={r.input}/><span aria-label={translate("m_32fa29a5b6")}>→</span><Items bag={r.output}/></div>
    {!b.processing&&<MaterialNeeds engine={engine} cost={r.input} kind="machine" target={b.id} token={r.id}/>}
    <p>{translate("m_c31a4eb035")}{Math.ceil(r.time/productionRate(s,b))} {translate("m_000135a471")}{Object.entries(r.output).reduce((v,[id,n])=>v+tradeUnitPrice(s,id,false)*n,0)} {translate("m_7a0844b848")}</p>
    <details className="machine-economics"><summary>{translate("m_ff8c1ab9ab")}</summary>
      <p>{translate("m_1a4b364e8d")}{economics.input} {translate("m_ab350dd667")}{economics.output} {translate("m_eaea8b896b")}{localize(economics.added>0?'+':'')}{economics.added} {translate("m_6f8a71cffc")}</p>
      <p>{localize(economics.purchase===null?sourceText("m_034cece69a"):sourceText("m_36508c28ca", { p0: economics.purchase, p1: economics.purchasedMargin!>0?'+':'', p2: economics.purchasedMargin }))}</p>
      <small>{translate("m_9e708ec1b2")}</small>
    </details>
    <progress aria-label={localize(sourceText("m_ac809c28c6", { p0: BUILDINGS[b.type].name }))} max={r.time} value={b.timer}/>
    <p className={blocked?'inventory-warning':''} role={blocked?'status':undefined}>{localize(status)}</p>
    {b.processing&&<small>{translate("m_d1b4a0f457")}</small>}
    <div className="machine-actions">
      {!b.processing?<button className="primary-button" disabled={!canAfford(s,r.input)||b.hp<=0||s.level<r.level} onClick={()=>engine.startProduction(b.id)}>{translate("m_210e5dba7a")}</button>:<button className="secondary-button" onClick={()=>engine.toggleBuilding(b.id)}>{localize(b.enabled?sourceText("m_19b6acde33"):sourceText("m_26183306dc"))}</button>}
      <label><input type="checkbox" checked={b.repeat!==false} onChange={event=>engine.setMachineRepeat(b.id,event.target.checked)}/> {translate("m_0644909989")}</label>
    </div>
  </article>;
}
export function ProductionWorkshop({engine}:{engine:Engine}) {
  useLocale();
  const machines=engine.s.buildings.filter(b=>BUILDINGS[b.type].production);
  return <details className="farm-planner"><summary>{translate("m_3282be26b2")}<small>{machines.length} {translate("m_8ff8e19936")}{machines.filter(b=>b.processing).length} {translate("m_dfe0690366")}</small></summary><p>{translate("m_78f89e3692")}</p>
    {machines.length?<div className="planning-grid">{machines.map(b=><MachineCard key={b.id} engine={engine} building={b}/>)}</div>:<p>{translate("m_d618406f1c")}</p>}
  </details>;
}
