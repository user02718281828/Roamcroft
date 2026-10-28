import type { MessageKey } from '../i18n/source.ts';

export type PanelId = 'online' | 'inventory' | 'craft' | 'build' | 'quests' | 'ranch' | 'villagers' | 'bundles' | 'mine' | 'settings' | 'building' | 'market' | 'guide';
export type Panel = PanelId | null;
export type MenuGroup = { label: MessageKey; panels: PanelId[] };

/** Presentation order only. These ids never enter a game save or economic command. */
export function campGroups(server: boolean): MenuGroup[] {
  return [
    { label: 'menu.farm', panels: ['inventory', 'craft', 'build', 'ranch'] },
    { label: 'menu.valley', panels: ['quests', 'villagers', 'bundles', 'mine'] },
    { label: 'menu.camp', panels: [...(server ? ['online' as const] : []), 'settings'] },
  ];
}
export function nextPanel(current: Panel, direction: -1 | 1, server: boolean): PanelId {
  const entries = campGroups(server).flatMap(group => group.panels);
  const index = Math.max(0, entries.indexOf(current || 'inventory'));
  return entries[(index + direction + entries.length) % entries.length];
}
