import type { State } from './model.ts';
import type { Bag } from './data.ts';
import { tileIndex } from './world.ts';
export const BUNDLES: Record<
  string,
  { name: string; description: string; items: Bag; reward: string }
> = {
  pantry: {
    name: 'Hasat sandığı',
    description: 'İlk mahsullerini köyün ortak ambarına ayır.',
    items: { wheat: 20, carrot: 12, potato: 8 },
    reward: 'Çanta kapasitesi +300 eşya',
  },
  ranch: {
    name: 'Çiftliğin bereketi',
    description: 'Hayvanların ve arıların ürünlerini bir araya getir.',
    items: { egg: 6, milk: 4, wool: 4, honey: 2 },
    reward: 'Hayvan üretimi %20 hızlanır',
  },
  artisan: {
    name: 'Ustaların sofrası',
    description: 'İşlenmiş ürünlerle köy atölyelerini destekle.',
    items: { jam: 4, cheese: 3, bread: 6, soup: 3 },
    reward: 'Tüm işleme makineleri %15 hızlanır',
  },
  irrigation: {
    name: 'Suyun yolu',
    description: 'Yeni sulama sistemini kurmak için malzeme bağışla.',
    items: { copperbar: 6, bar: 4, crystal: 2 },
    reward: 'Fıskiye menzili 1 kareden 2 kareye çıkar',
  },
};
export const inventoryUsed = (s: State) =>
  Object.values(s.inventory).reduce((a, b) => a + b, 0);
export const inventoryCapacity = (s: State) =>
  600 + (s.bundles.completed.includes('pantry') ? 300 : 0);
export const inventoryFits = (s: State, bag: Bag) =>
  inventoryUsed(s) + Object.values(bag).reduce((a, b) => a + b, 0) <=
  inventoryCapacity(s);
export const movementSpeed = (energy: number) =>
  3.5 * (energy >= 20 ? 1 : 0.45 + (Math.max(0, energy) / 20) * 0.55);

// Enumerate each structure's small footprint once, instead of testing every
// tile against every structure as a village grows.
export function farmCoverage(s: State) {
  const watered = new Set<number>(),
    sheltered = new Set<number>();
  for (const b of s.buildings) {
    if (!b.enabled || b.hp <= 0 || tileIndex(s, b.x, b.z) < 0) continue;
    const sprinkler = b.type === 'sprinkler';
    const greenhouse = b.type === 'greenhouse';
    if (!sprinkler && !greenhouse && b.type !== 'well') continue;
    const radius = sprinkler
      ? s.bundles.completed.includes('irrigation')
        ? 2
        : 1
      : greenhouse
        ? 4
        : 2 + b.level;
    const target = greenhouse ? sheltered : watered;
    for (let dz = -radius; dz <= radius; dz++)
      for (let dx = -radius; dx <= radius; dx++) {
        if (!sprinkler && dx * dx + dz * dz > radius * radius) continue;
        const index = tileIndex(s, b.x + dx, b.z + dz);
        if (index >= 0) target.add(index);
      }
  }
  return { watered, sheltered };
}
