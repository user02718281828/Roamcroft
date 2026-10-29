'use client';
import { Backpack, Hammer, House, Wheat, BookOpen, Users, Gift, Pickaxe, Settings, Wifi, ShoppingBasket, Compass, ChevronDown } from 'lucide-react';
import {useRef, useState} from 'react';
import { campGroups, type Panel, type PanelId } from '@/lib/ui/game-menu';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

const icons = {inventory: Backpack, craft: Hammer, build: House, ranch: Wheat, quests: BookOpen, villagers: Users, bundles: Gift, mine: Pickaxe, settings: Settings, online: Wifi, market: ShoppingBasket, building: House, guide: Compass};
const labels = {inventory: 'm_e18b002e4f', craft: 'm_0d3d1e1ccb', build: 'm_b2817cf111', ranch: 'm_d2684dfcdb', quests: 'm_301ef766a1', villagers: 'm_b2743de707', bundles: 'm_ecb4579f0d', mine: 'm_a8525a6194', settings: 'm_80ad54ad05', online: 'm_0d21bd5202'} as const;
export default function CampNavigation({panel, server, titles, onSelect, building=false}: {panel: Panel; server: boolean; building?:boolean; titles: Record<PanelId, [string, string]>; onSelect: (panel: Panel) => void}) {
  useLocale();
  const [expanded,setExpanded]=useState(false), trigger=useRef<HTMLButtonElement>(null);
  const groups = campGroups(server);
  groups.push({label:'menu.nearby',panels:['market','guide',...(building?['building' as const]:[])]});
  const collapse=() => {setExpanded(false);trigger.current?.focus();};
  return <div className="camp-menu" data-expanded={expanded}>
    <button ref={trigger} type="button" className="camp-menu-toggle" aria-expanded={expanded} aria-controls="camp-sections" onClick={()=>setExpanded(!expanded)}>
      <span>{translate('menu.sections')}</span><b>{panel?localize(titles[panel][0]):''}</b><ChevronDown aria-hidden="true"/>
    </button>
    <nav id="camp-sections" className="camp-navigation" aria-label={translate('menu.sections')} onKeyDown={event=>{if(event.key==='Escape'&&expanded){event.preventDefault();event.stopPropagation();collapse();}}}>
    {groups.map(group => <section key={group.label}>
      <h3>{translate(group.label)}</h3>
      {group.panels.map(id => {
        const Icon = icons[id];
        return <button key={id} type="button" aria-current={panel === id ? 'page' : undefined} onClick={() => {onSelect(id);collapse();}}>
          <Icon aria-hidden="true"/><span>{id in labels ? translate(labels[id as keyof typeof labels]) : localize(titles[id][0])}</span>
        </button>;
      })}
    </section>)}
    </nav>
  </div>;
}
