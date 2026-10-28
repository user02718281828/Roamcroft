import { sourceText } from '../i18n/source.ts';
import { BUILDINGS, type Bag } from './data.ts';
import type { Building, State } from './model.ts';

export type MachineRecipe = { id: string; name: string; input: Bag; output: Bag; time: number; level: number };
const alternatives: Record<string, MachineRecipe[]> = {
  mill: [{ id: 'feed', name: sourceText("m_342f005287"), input: { wheat: 3 }, output: { feed: 8 }, time: 45, level: 3 }],
  furnace: [
    { id: 'copperbar', name: sourceText("m_006324b409"), input: { copper: 3, coal: 1 }, output: { copperbar: 1 }, time: 45, level: 3 },
    { id: 'bar', name: sourceText("m_2b29263727"), input: { iron: 3, coal: 2 }, output: { bar: 1 }, time: 65, level: 4 },
  ],
  kitchen: [
    { id: 'applejam', name: sourceText("m_2f4d236db9"), input: { apple: 3, honey: 1 }, output: { applejam: 2 }, time: 80, level: 4 },
    { id: 'peartart', name: sourceText("m_0864e5def2"), input: { pear: 2, flour: 1, egg: 1 }, output: { peartart: 1 }, time: 85, level: 4 },
    { id: 'bread', name: sourceText("m_a7c63406d1"), input: { flour: 2, wood: 1 }, output: { bread: 2 }, time: 55, level: 4 },
    { id: 'soup', name: sourceText("m_ab454f15fb"), input: { carrot: 2, mushroom: 2, wood: 1 }, output: { soup: 2 }, time: 65, level: 4 },
  ],
  loom: [{ id: 'rope', name: sourceText("m_ae5c5862da"), input: { fiber: 4 }, output: { rope: 2 }, time: 35, level: 6 }],
};
const catalog = Object.fromEntries(Object.entries(BUILDINGS).filter(([,d])=>d.production).map(([type,d])=>[
  type, [{ id: 'default', name: sourceText("m_1a848ef9f3"), ...d.production!, level: d.level }, ...(alternatives[type] || [])],
]));
const empty: MachineRecipe[] = [];
export function machineRecipes(type: string): readonly MachineRecipe[] {
  return Object.hasOwn(catalog,type) ? catalog[type] : empty;
}
export function machineRecipe(b: Building) {
  return machineRecipes(b.type).find(r => r.id === (b.recipe ?? 'default'));
}
export function productionRate(s: State, b: Building) {
  return b.level * (1 + .12 * (s.talents.artisan || 0)) * (s.bundles.completed.includes('artisan') ? 1.15 : 1);
}
