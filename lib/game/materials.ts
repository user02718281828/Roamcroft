import { sourceText } from '../i18n/source.ts';
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
  const reason = !total ? sourceText("m_f6218bbc05")
    : !buildings.some(b => b.type === 'chest') ? sourceText("m_8718d13952")
    : missing.some(item => item.stored < item.amount) ? sourceText("m_bd4b3ff63e")
    : inventoryCapacity(s) - inventoryUsed(s) < total ? sourceText("m_02f5001216", { p0: total })
    : undefined;
  return { missing, total, reason, ready: total > 0 && !reason };
}

const sources: Record<string, string> = {
  wood: sourceText("m_a3dcfc9f98"), stone: sourceText("m_e59899fbf3"),
  fiber: sourceText("m_4fd0681932"), berry: sourceText("m_6a3f3769ac"), mushroom: sourceText("m_6a2df5d975"),
  copper: sourceText("m_75206df5da"), iron: sourceText("m_ca4f615dc9"), coal: sourceText("m_12993fddc6"),
  crystal: sourceText("m_0ec4fb69da"), fish: sourceText("m_b0515fffb1"),
  egg: sourceText("m_cb7c85b8e0"), milk: sourceText("m_914d7d744c"), wool: sourceText("m_db338f3410"),
  apple: sourceText("m_e85c0cd6ce"), pear: sourceText("m_63bab3d0e0"),
};
export function materialSource(id: string): string {
  if (Object.hasOwn(CROPS, id)) return sourceText("m_39da090a04", { p0: CROPS[id].name });
  const recipe = Object.values(RECIPES).find(r => r.output[id]);
  if (recipe) return sourceText("m_bd23d529fd", { p0: recipe.name, p1: recipe.level, p2: recipe.station ? sourceText("m_04420b9dfe", { p0: BUILDINGS[recipe.station].name }) : '' });
  const machine = Object.values(BUILDINGS).find(b => b.production?.output[id]);
  if (machine) return sourceText("m_06e3a0fb5a", { p0: machine.name, p1: machine.level });
  return sources[id] || sourceText("m_5486d99692");
}
