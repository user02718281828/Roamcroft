import { CircleHelp } from 'lucide-react';
import type { CSSProperties } from 'react';
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
export default function GameIcon({
  id,
  className = '',
}: {
  id: string;
  className?: string;
}) {
  const base = id.replace(/[123]$/, '');
  const normalized = base.endsWith('seed') ? 'seed' : (aliases[base] ?? base);
  const entry = art.get(normalized);
  if (!entry)
    return (
      <CircleHelp className={`game-icon ${className}`} aria-hidden="true" />
    );
  const style: CSSProperties = {
    backgroundImage: `url(/art/farm-icons-${entry.sheet + 1}.webp)`,
    backgroundPosition: `${((entry.index % 4) * 100) / 3}% ${(Math.floor(entry.index / 4) * 100) / 3}%`,
  };
  return (
    <span
      className={`game-icon game-icon-art ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
