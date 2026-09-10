import type { State, Tile } from './model.ts';

export const CHUNK = 12;
export const WINDOW = 60;
export type World = {
  x: number;
  z: number;
  generation?: number;
  edits: Record<string, Tile>;
};
const baselines = new Map<number, Tile[]>();
export const tileKey = (x: number, z: number) => `${x},${z}`;
export const chunkKey = (x: number, z: number) =>
  `${Math.floor(x / CHUNK)},${Math.floor(z / CHUNK)}`;
export function registerBaseline(seed: number, tiles: Tile[]) {
  if (baselines.has(seed)) return;
  if (baselines.size >= 4) baselines.delete(baselines.keys().next().value!);
  baselines.set(
    seed,
    tiles.map((t) => ({ ...t })),
  );
}
export const hasBaseline = (seed: number) => baselines.has(seed);
export const worldOrigin = (s: State) => (s.mine ? { x: 0, z: 0 } : s.world);
// Accept old 36x36 snapshots and mine floors without changing their coordinates.
export const worldSize = (s: Pick<State, 'tiles'>) => Math.sqrt(s.tiles.length);
export function tileIndex(s: State, x: number, z: number) {
  const o = worldOrigin(s),
    ix = Math.round(x) - o.x,
    iz = Math.round(z) - o.z;
  const width = worldSize(s);
  return ix < 0 || iz < 0 || ix >= width || iz >= width ? -1 : iz * width + ix;
}
function hash(x: number, z: number, seed: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function biomeAt(x: number, z: number, seed: number) {
  if (x >= 0 && x < 36 && z >= 0 && z < 36) return 'Roamcroft';
  const n = hash(Math.floor(x / 48), Math.floor(z / 48), seed);
  return n < 0.28
    ? 'Çam ormanı'
    : n < 0.5
      ? 'Bakır sırtları'
      : n < 0.7
        ? 'Çiçek ovası'
        : n < 0.85
          ? 'Mantar korusu'
          : 'Kristal bozkırı';
}
export function generatedTile(
  seed: number,
  x: number,
  z: number,
  generation = 1,
): Tile {
  const village = baselines.get(seed);
  if (village && x >= 0 && x < 36 && z >= 0 && z < 36)
    return { ...village[z * 36 + x] };
  const n = hash(x, z, seed),
    b = biomeAt(x, z, seed);
  // Every chunk has two open crossing trails; generated woodland never seals exploration.
  const trail = ((x % 12) + 12) % 12 === 6 || ((z % 12) + 12) % 12 === 6;
  const river = Math.floor((x + 22) / 96) * 96 + 26 + Math.sin(z * 0.23) * 2.5;
  const distance = Math.abs(x - river);
  const terrain: Tile['terrain'] =
    generation < 2 || distance >= 2.5
      ? 'grass'
      : ((z % 12) + 12) % 12 === 6
        ? 'path'
        : distance < 1.65
          ? 'water'
          : 'sand';
  const resource =
    trail || terrain !== 'grass'
      ? null
      : b === 'Çam ormanı' && n < 0.32
        ? 'tree'
        : b === 'Mantar korusu' && n < 0.2
          ? 'mushroom'
          : b === 'Kristal bozkırı' && n < 0.13
            ? 'crystal'
            : b === 'Bakır sırtları' && n < 0.2
              ? n < 0.1
                ? 'copper'
                : 'iron'
              : n < 0.13
                ? 'tree'
                : n < 0.18
                  ? 'stone'
                  : n < 0.22
                    ? 'bush'
                    : null;
  return {
    x,
    z,
    terrain,
    height: terrain === 'water' ? -0.3 : 0,
    resource,
    source: resource,
    amount: resource ? (['bush', 'mushroom'].includes(resource) ? 1 : 3) : 0,
    respawn: 0,
    tilled: false,
    water: 0,
    crop: null,
    growth: 0,
    fertilized: false,
    seen: false,
  };
}
const fields: (keyof Tile)[] = [
  'terrain',
  'height',
  'resource',
  'source',
  'amount',
  'respawn',
  'tilled',
  'water',
  'crop',
  'growth',
  'fertilized',
];
export function rememberTiles(s: State) {
  if (s.mine) return;
  for (const tile of s.tiles) {
    const baseline = generatedTile(s.seed, tile.x, tile.z, s.world.generation),
      key = tileKey(tile.x, tile.z);
    if (fields.some((k) => tile[k] !== baseline[k]))
      s.world.edits[key] = { ...tile };
    else delete s.world.edits[key];
  }
}
export function shiftWindow(
  s: State,
  x = s.player.x,
  z = s.player.z,
  force = false,
) {
  if (s.mine) return false;
  const ox = Math.floor(x / CHUNK) * CHUNK - 2 * CHUNK,
    oz = Math.floor(z / CHUNK) * CHUNK - 2 * CHUNK;
  if (
    !force &&
    s.tiles.length === WINDOW * WINDOW &&
    ox === s.world.x &&
    oz === s.world.z
  )
    return false;
  rememberTiles(s);
  const old = new Map(s.tiles.map((t) => [tileKey(t.x, t.z), t]));
  s.world.x = ox;
  s.world.z = oz;
  s.tiles = Array.from({ length: WINDOW * WINDOW }, (_, i) => {
    const tx = ox + (i % WINDOW),
      tz = oz + Math.floor(i / WINDOW),
      key = tileKey(tx, tz);
    return (
      old.get(key) ??
      (s.world.edits[key]
        ? { ...s.world.edits[key] }
        : generatedTile(s.seed, tx, tz, s.world.generation))
    );
  });
  return true;
}
