'use client';
import { Backpack, Hammer, House, Wheat, BookOpen, Users, Gift, Pickaxe, Settings, Wifi, ShoppingBasket, Compass } from 'lucide-react';
import { campGroups, type Panel, type PanelId } from '@/lib/ui/game-menu';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

const icons = {inventory: Backpack, craft: Hammer, build: House, ranch: Wheat, quests: BookOpen, villagers: Users, bundles: Gift, mine: Pickaxe, settings: Settings, online: Wifi, market: ShoppingBasket, building: House, guide: Compass};
const labels = {inventory: 'm_e18b002e4f', craft: 'm_0d3d1e1ccb', build: 'm_b2817cf111', ranch: 'm_d2684dfcdb', quests: 'm_301ef766a1', villagers: 'm_b2743de707', bundles: 'm_ecb4579f0d', mine: 'm_a8525a6194', settings: 'm_80ad54ad05', online: 'm_0d21bd5202'} as const;
export default function CampNavigation({panel, server, titles, onSelect}: {panel: Panel; server: boolean; titles: Record<PanelId, [string, string]>; onSelect: (panel: Panel) => void}) {
  useLocale();
  const groups = campGroups(server);
  if (panel && ['market', 'building', 'guide'].includes(panel)) groups.unshift({label: 'menu.nearby', panels: [panel]});
  return <nav className="camp-navigation" aria-label={translate('menu.sections')}>
    {groups.map(group => <section key={group.label}>
      <h3>{translate(group.label)}</h3>
      {group.panels.map(id => {
        const Icon = icons[id];
        return <button key={id} type="button" aria-current={panel === id ? 'page' : undefined} onClick={() => onSelect(id)}>
          <Icon aria-hidden="true"/><span>{id in labels ? translate(labels[id as keyof typeof labels]) : localize(titles[id][0])}</span>
        </button>;
      })}
    </section>)}
  </nav>;
}
