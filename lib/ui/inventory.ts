import { ITEMS, CROPS, type Bag } from '../game/data.ts';
import { sourceText } from '../i18n/source.ts';
import { localizeText } from '../i18n/core.ts';
import type { Locale } from '../i18n/locale.ts';

export type BagFilter = 'all' | 'food' | 'seeds' | 'resources';
export type BagSort = 'name' | 'quantity';
export type BagEntry = { id: string; count: number; name: string };
const categories = {food: 'm_6f185074f6', seeds: 'm_eaf3725fa6', resources: 'm_2f0db590c3'} as const;

/** Sort a fresh view; never sort, cap, split or rewrite the authoritative bag. */
export function inventoryView(bag: Bag, filter: BagFilter, sort: BagSort, locale: Locale): BagEntry[] {
  const collator = new Intl.Collator(locale, {numeric: true, sensitivity: 'base'});
  return Object.entries(bag)
    .filter(([id, count]) => count > 0 && (filter === 'all' || ITEMS[id]?.category === sourceText(categories[filter])))
    .map(([id, count]) => ({id, count, name: ITEMS[id] ? localizeText(ITEMS[id].name, locale) : id}))
    .sort((a, b) => (sort === 'quantity' ? b.count - a.count : 0) || collator.compare(a.name, b.name) || a.id.localeCompare(b.id));
}

export type ItemAction = {kind: 'eat'; id: string} | {kind: 'plant'; crop: string} | {kind: 'build'; type: string} | {kind: 'fertilize'} | {kind: 'none'};
export function inventoryAction(id: string): ItemAction {
  const item = ITEMS[id];
  if (!item) return {kind: 'none'};
  if (item.food || item.energy || item.heal) return {kind: 'eat', id};
  const crop = Object.keys(CROPS).find(key => CROPS[key].seed === id);
  if (crop) return {kind: 'plant', crop};
  if (id === 'applesapling' || id === 'pearsapling') return {kind: 'build', type: id === 'applesapling' ? 'appletree' : 'peartree'};
  if (id === 'sprinkler') return {kind: 'build', type: 'sprinkler'};
  if (id === 'fertilizer') return {kind: 'fertilize'};
  return {kind: 'none'};
}
