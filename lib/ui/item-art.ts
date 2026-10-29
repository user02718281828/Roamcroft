const sheets = [
  [
    'axe',
    'pickaxe',
    'hoe',
    'water',
    'sword',
    'rod',
    'wood',
    'stone',
    'copper',
    'bar',
    'crystal',
    'coal',
    'wheat',
    'carrot',
    'tomato',
    'pumpkin',
  ],
  [
    'chicken',
    'cow',
    'sheep',
    'egg',
    'milk',
    'wool',
    'cheese',
    'honey',
    'seed',
    'feed',
    'bread',
    'soup',
    'home',
    'barn',
    'mill',
    'gold',
  ],
  [
    'fiber',
    'iron',
    'plank',
    'brick',
    'copperbar',
    'rope',
    'corn',
    'potato',
    'berry',
    'mushroom',
    'fish',
    'flour',
    'grilledfish',
    'jam',
    'bandage',
    'fertilizer',
  ],
  [
    'workshop',
    'furnace',
    'campfire',
    'well',
    'coop',
    'apiary',
    'dairy',
    'kitchen',
    'greenhouse',
    'beacon',
    'tower',
    'fence',
    'armor',
    'bag',
    'hand',
    'heart',
  ],
];
const aliases: Record<string, string> = {
  chest:'bag',wall:'brick',
  sprinkler: 'water',
  harvest: 'wheat',
  forage: 'wood',
  artisan: 'workshop',
  build: 'workshop',
  defender: 'armor',
  vigor: 'heart',
  angler: 'rod',
  animal: 'chicken',
  market: 'gold',
  day: 'beacon',
  feedmill: 'feed',
  smokehouse: 'grilledfish',
  loom: 'wool',
};
const art = new Map(
  sheets.flatMap((ids, sheet) =>
    ids.map((id, index) => [id, { sheet, index }] as const),
  ),
);

export const ORCHARD_ART = ['apple','pear','applesapling','pearsapling','appletree','peartree','applejam','peartart'];
/** Existing 768px atlases. Trim only neighbour fragments, never stretch a cell. */
export function itemArt(id: string) {
  const base=id.replace(/[123]$/, '');
  const normalized=base.endsWith('seed')?'seed':(aliases[base]??base);
  const entry=art.get(normalized);
  if(!entry)return null;
  const x=entry.index%4*192,y=Math.floor(entry.index/4)*192;
  const height=['seed','feed','bread'].includes(normalized)?160:normalized==='potato'?180:192;
  return {sheet:entry.sheet+1,x,y,width:192,height};
}
