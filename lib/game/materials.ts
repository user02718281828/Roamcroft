import { BUILDINGS, CROPS, RECIPES, type Bag } from './data.ts';
import type { State } from './model.ts';
import { dailyOrders } from './orders.ts';
import { machineRecipe } from './production.ts';
import { inventoryCapacity, inventoryUsed } from './progression.ts';

export type MaterialTarget = 'craft' | 'machine' | 'order';

// Resolve costs from authoritative world data, never from a client-supplied bag.
export function materialCost(s: State, kind: MaterialTarget, id: string | number, token?: string): Bag | undefined {
  if (kind === 'craft' && typeof id === 'string' && Object.hasOwn(RECIPES, id)) {
    const r = RECIPES[id];
    const tier = r.upgrade ? (s.upgrades[r.upgrade] || 0) + s.jobs.filter(j => RECIPES[j.recipe].upgrade === r.upgrade).length : 0;
    if (s.level < r.level || (r.upgrade && tier >= 3)) return;
    return Object.fromEntries(Object.entries(r.input).map(([item, n]) => [item, n * (tier + 1)]));
  }
  if (kind === 'machine' && typeof id === 'number') {
    const b = s.buildings.find(b => b.id === id), r = b && machineRecipe(b);
    if (b && r && r.id === token && !b.processing && b.hp > 0 && s.level >= r.level) return r.input;
  }
  if (kind === 'order' && typeof id === 'string' && s.contracts[id] !== s.day) {
    const r = dailyOrders(s, id).find(r => r.token === token);
    if (r && s.level >= r.level) return r.input;
  }
}

export function materialPlan(s: State, cost: Bag) {
  const missing = Object.entries(cost).flatMap(([id, required]) => {
    const amount = Math.max(0, required - (s.inventory[id] || 0));
    return amount ? [{ id, amount, stored: s.storage[id] || 0, delivery: s.overflow[id] || 0 }] : [];
  });
  const total = missing.reduce((sum, item) => sum + item.amount, 0);
  const buildings = s.mine ? s.mine.surface.buildings : s.buildings;
  const reason = !total ? 'Malzemeler çantanda hazır.'
    : !buildings.some(b => b.type === 'chest') ? 'Önce bir depo sandığı kur.'
    : missing.some(item => item.stored < item.amount) ? 'Ortak depoda bütün eksikleri karşılayacak stok yok.'
    : inventoryCapacity(s) - inventoryUsed(s) < total ? `Çantanda ${total} boş yer gerekli.`
    : undefined;
  return { missing, total, reason, ready: total > 0 && !reason };
}

const sources: Record<string, string> = {
  wood: 'Balta ile ağaç ve kütüklerden topla.', stone: 'Kazma ile kayalardan topla.',
  fiber: 'Çevredeki otları topla.', berry: 'Meyve çalılarından topla.', mushroom: 'Çevredeki mantarları topla.',
  copper: 'Bakır damarlarını kaz.', iron: 'Demir damarlarını kaz.', coal: 'Kömür damarlarını kaz.',
  crystal: 'Madenin derin katlarını keşfet.', fish: 'Kıyıda olta kullan.',
  egg: 'Beslediğin tavuklardan topla.', milk: 'Beslediğin ineklerden topla.', wool: 'Beslediğin koyunlardan topla.',
  apple: 'Olgun elma ağacından topla.', pear: 'Olgun armut ağacından topla.',
};
export function materialSource(id: string): string {
  if (Object.hasOwn(CROPS, id)) return `${CROPS[id].name} ek, sula ve hasat et. Ekim planında mevsimini kontrol et.`;
  const recipe = Object.values(RECIPES).find(r => r.output[id]);
  if (recipe) return `Üretim → ${recipe.name} · Sv. ${recipe.level}${recipe.station ? ` · ${BUILDINGS[recipe.station].name}` : ''}.`;
  const machine = Object.values(BUILDINGS).find(b => b.production?.output[id]);
  if (machine) return `${machine.name} ile üret · Sv. ${machine.level}.`;
  return sources[id] || 'Pazar ve keşif kaynaklarını kontrol et.';
}
