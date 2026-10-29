'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Footprints } from 'lucide-react';
import type { State } from '@/lib/game/model';
import { TOOLS } from '@/lib/game/data';
import { firstSteps, toolNotes, type FirstStepId } from '@/lib/ui/first-steps';
import { useGuidance } from '@/lib/ui/guidance';
import { translate, localize } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';
import GameIcon from './GameIcon';

export function GuidanceSetting() {
  useLocale();
  const [enabled, setEnabled] = useGuidance();
  return <label className="guidance-setting"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)}/><span>{translate('steps.showHud')}</span></label>;
}

export default function FirstSteps({state, shared, onEquip, onOpen}: {
  state: State; shared: boolean; onEquip: (tool: string) => void;
  onOpen: (panel: 'craft' | 'market' | 'build' | 'quests') => void;
}) {
  const locale = useLocale(), number = new Intl.NumberFormat(locale, {maximumFractionDigits: 2});
  const toolName = (id: string) => id === 'water' ? translate('tools.water.name') : localize(TOOLS.find(tool => tool.id === id)!.name);
  const all = firstSteps(state), next = all.find(step => !step.done);
  const [selected, setSelected] = useState<FirstStepId | null>(null);
  const detailTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => {if (selected) detailTitle.current?.focus();}, [selected]);
  const active = all.find(step => step.id === selected) || next || all[all.length - 1];
  return <section className="first-steps" aria-labelledby="first-steps-title">
    <header><Footprints aria-hidden="true"/><div><h3 id="first-steps-title">{translate('steps.title')}</h3><p>{translate('steps.intro')}</p></div></header>
    <p className="steps-movement">{translate('steps.movement')}</p>
    {shared && <p>{translate('steps.shared')}</p>}
    <GuidanceSetting/>
    <p>{next ? translate('steps.progress', {done: all.filter(step => step.done).length, total: all.length}) : translate('steps.complete')}</p>
    <div className="steps-layout">
      <ol className="steps-list" aria-label={translate('steps.title')}>
        {all.map((step, index) => <li key={step.id}><button type="button" aria-current={step.id === active.id ? 'step' : undefined} onClick={() => setSelected(step.id)}>
          <span aria-hidden="true">{step.done ? <Check/> : index + 1}</span><span>{translate(step.title)}</span><small>{step.done ? translate('steps.done') : `${number.format(step.value)}/${number.format(step.target)}`}</small>
        </button></li>)}
      </ol>
      <article className="step-details" aria-label={translate('steps.details')}>
        <h4 ref={detailTitle} tabIndex={-1}>{translate(active.title)}</h4><p>{translate(active.help)}</p>
        {'tool' in active ? <button type="button" className="primary-button" onClick={() => onEquip(active.tool)}>{translate('steps.equip', {tool: toolName(active.tool)})}</button>
          : <button type="button" className="primary-button" onClick={() => onOpen(active.panel)}>{translate('steps.open', {section: translate(active.panel === 'craft' ? 'm_0d3d1e1ccb' : active.panel === 'build' ? 'm_b2817cf111' : 'steps.market')})}</button>}
        {active.id === 'plant' && <button type="button" className="secondary-button" onClick={() => onEquip('water')}>{translate('steps.equip', {tool: toolName('water')})}</button>}
        <small>{translate('steps.noAutoAction')}</small>
      </article>
    </div>
    <button type="button" className="secondary-button" onClick={() => onOpen('quests')}>{translate('steps.rewards')}</button>
    <details className="tool-notes"><summary>{translate('tools.title')}</summary>
      <p>{translate('tools.scope')}</p>
      {toolNotes(state).map(tool => <article key={tool.id}><GameIcon id={tool.id === 'fish' ? 'rod' : tool.id}/><div>
        <h4>{toolName(tool.id)}</h4><p>{translate(tool.help)}</p>
        <small>{translate(tool.id === 'hoe' ? 'tools.tillEnergy' : 'tools.energy', {energy: number.format(tool.energy)})}</small>
        {'power' in tool && <small>{translate('tools.power', {power: tool.power})}</small>}
        {'damage' in tool && <small>{translate('tools.damage', {damage: tool.damage})}</small>}
      </div></article>)}
    </details>
  </section>;
}
