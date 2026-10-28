import { sourceText } from '../i18n/source.ts';
import {
  ANIMALS,
  BUILDINGS,
  CROPS,
  ITEMS,
  QUESTS,
  RECIPES,
  TALENTS,
} from './data.ts';
import { createState, SAVE_VERSION, SIZE } from './model.ts';
import type { State } from './model.ts';
import {
  tileIndex,
  tileKey,
  generatedTile,
  hasBaseline,
  WINDOW,
} from './world.ts';
import { ENEMIES } from './expedition.ts';
import { MILESTONES } from './settlement.ts';
import { BUNDLES } from './progression.ts';
import { machineRecipes } from './production.ts';
export const SAVE_KEY = 'ocak-vadisi.save.v1',
  BACKUP_KEY = SAVE_KEY + '.backup';
const own = (o: object, k: string) => Object.hasOwn(o, k);
function assert(
  test: unknown,
  message = sourceText("m_8c74ffdbb5"),
): asserts test {
  if (!test) throw new Error(message);
}
const number = (n: unknown, min: number, max: number, integer = false) =>
  typeof n === 'number' &&
  Number.isFinite(n) &&
  n >= min &&
  n <= max &&
  (!integer || Number.isInteger(n));
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
function checksum(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}
export function serialize(state: State) {
  const payload = JSON.stringify(state);
  return JSON.stringify({
    format: 'ocak-vadisi',
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    checksum: checksum(payload),
    payload: state,
  });
}
export function deserialize(text: string): State {
  assert(text.length < 32_000_000, sourceText("m_0806e1acd3"));
  let envelope: unknown;
  try {
    envelope = JSON.parse(text);
  } catch {
    throw new Error(sourceText("m_6042946e34"));
  }
  assert(
    object(envelope) &&
      envelope.format === 'ocak-vadisi' &&
      envelope.version === SAVE_VERSION,
    sourceText("m_bd81d6a7db"),
  );
  const s = envelope.payload;
  assert(object(s));
  assert(
    envelope.checksum === checksum(JSON.stringify(s)),
    sourceText("m_af1f09e46f"),
  );
  assert(s.version === SAVE_VERSION);
  if (s.settlement === undefined)
    s.settlement = { name: sourceText("m_a1d6250bee"), milestones: [] };
  assert(object(s.settlement) && typeof s.settlement.name === 'string');
  assert(
    s.settlement.name.trim().length > 0 &&
      s.settlement.name.length <= 32 &&
      !Array.from(s.settlement.name).some(
        (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127,
      ),
  );
  assert(
    Array.isArray(s.settlement.milestones) &&
      s.settlement.milestones.length <= MILESTONES.length,
  );
  assert(
    s.settlement.milestones.every((id, index) => id === MILESTONES[index].id),
  );
  if (s.world === undefined) s.world = { x: 0, z: 0, edits: {} };
  assert(
    object(s.world) &&
      number(s.world.x, -1e9, 1e9, true) &&
      number(s.world.z, -1e9, 1e9, true),
  );
  assert((s.world.x as number) % 12 === 0 && (s.world.z as number) % 12 === 0);
  assert(object(s.world.edits) && Object.keys(s.world.edits).length <= 100000);
  if (s.world.generation !== undefined)
    assert(number(s.world.generation, 1, 2, true));
  if (s.mine === undefined) s.mine = null;
  if (s.mine !== null) {
    assert(
      object(s.mine) &&
        number(s.mine.floor, 1, 5, true) &&
        number(s.mine.mined, 0, 10000, true),
    );
    assert(object(s.mine.surface));
    assert(
      number(s.mine.surface.x, -1e9, 1e9) &&
        number(s.mine.surface.z, -1e9, 1e9),
    );
  }
  for (const [key, min, max, int] of [
    ['seed', 0, 4294967295, true],
    ['rng', 0, 4294967295, true],
    ['level', 1, 30, true],
    ['xp', 0, 1e12, false],
    ['gold', 0, 1e12, true],
    ['day', 1, 1000000, true],
    ['time', 0, 1, false],
    ['nextId', 4, 1e9, true],
    ['raidDay', 0, 1000000, true],
  ] as const)
    assert(number(s[key], min, max, int), sourceText("m_0a00af5339", { p0: key }));
  assert(['sun', 'rain'].includes(String(s.weather)));
  assert(typeof s.won === 'boolean');
  assert(object(s.player));
  for (const k of ['x', 'z']) assert(number(s.player[k], -1e9, 1e9));
  for (const k of ['health', 'hunger', 'energy'])
    assert(number(s.player[k], 0, 100));
  assert(number(s.player.facing, -100, 100));
  assert(object(s.inventory));
  if (s.overflow === undefined) s.overflow = {};
  if (s.storage === undefined) s.storage = {};
  assert(object(s.storage));
  for(const [key,value] of Object.entries(s.storage))assert(own(ITEMS,key)&&number(value,0,10000000,true));
  if (s.talks === undefined) s.talks = {};
  if (s.bundles === undefined) s.bundles = { donations: {}, completed: [] };
  assert(object(s.overflow) && object(s.talks) && object(s.bundles));
  for (const [key, value] of Object.entries(s.overflow))
    assert(own(ITEMS, key) && number(value, 0, 10000000, true));
  for (const [key, value] of Object.entries(s.talks))
    assert(
      ['narin', 'lale', 'torin'].includes(key) &&
        number(value, 1, s.day as number, true),
    );
  assert(object(s.bundles.donations) && Array.isArray(s.bundles.completed));
  assert(new Set(s.bundles.completed).size === s.bundles.completed.length);
  for (const [id, bag] of Object.entries(s.bundles.donations)) {
    assert(own(BUNDLES, id) && object(bag));
    for (const [key, value] of Object.entries(bag))
      assert(
        own(BUNDLES[id].items, key) &&
          number(value, 0, BUNDLES[id].items[key], true),
      );
  }
  for (const id of s.bundles.completed) {
    assert(typeof id === 'string' && own(BUNDLES, id));
    const bag = s.bundles.donations[id];
    assert(
      object(bag) &&
        Object.entries(BUNDLES[id].items).every(
          ([key, amount]) => bag[key] === amount,
        ),
    );
  }
  for (const [k, v] of Object.entries(s.inventory))
    assert(own(ITEMS, k) && number(v, 0, 10000000, true), sourceText("m_5519b1404a"));
  for (const key of ['talents', 'friendship', 'contracts', 'gifts'])
    if (s[key] === undefined) s[key] = {};
  for (const key of ['discoveries', 'achievements'])
    if (s[key] === undefined) s[key] = [];
  for (const k of [
    'skills',
    'stats',
    'upgrades',
    'talents',
    'friendship',
    'contracts',
    'gifts',
  ]) {
    assert(object(s[k]));
    for (const [key, val] of Object.entries(s[k]))
      assert(
        /^[a-z]+$/.test(key) &&
          key !== 'constructor' &&
          key !== 'prototype' &&
          number(val, 0, 1e12),
        sourceText("m_5c43f6ab65"),
      );
  }
  for (const [key, value] of Object.entries(
    s.talents as Record<string, unknown>,
  ))
    assert(own(TALENTS, key) && number(value, 0, 5, true));
  assert(
    Object.values(s.talents as Record<string, number>).reduce(
      (a, b) => a + b,
      0,
    ) <=
      (s.level as number) - 1,
  );
  for (const key of ['discoveries', 'achievements']) {
    assert(Array.isArray(s[key]) && s[key].length <= 100);
    assert(s[key].every((v) => typeof v === 'string' && /^[a-z_]+$/.test(v)));
  }
  for (const k of ['axe', 'pickaxe', 'sword', 'armor'])
    assert(number((s.upgrades as Record<string, unknown>)[k], 0, 3, true));
  assert(Array.isArray(s.claimed) && s.claimed.length <= QUESTS.length);
  assert(new Set(s.claimed).size === s.claimed.length);
  for (const q of s.claimed) assert(QUESTS.some((x) => x.id === q));
  const resources = [
    'tree',
    'stone',
    'copper',
    'iron',
    'crystal',
    'bush',
    'mushroom',
  ];
  assert(
    Array.isArray(s.tiles) &&
      (s.tiles.length === SIZE * SIZE ||
        (!s.mine && s.tiles.length === WINDOW * WINDOW)),
  );
  const width = Math.sqrt(s.tiles.length);
  const validateTile = (t: unknown) => {
    assert(object(t));
    assert(number(t.x, -1e9, 1e9, true) && number(t.z, -1e9, 1e9, true));
    assert(
      ['grass', 'sand', 'water', 'path', 'wall'].includes(String(t.terrain)),
    );
    assert(t.resource === null || resources.includes(String(t.resource)));
    assert(t.source === null || resources.includes(String(t.source)));
    assert(
      t.crop === null || (typeof t.crop === 'string' && own(CROPS, t.crop)),
    );
    for (const k of ['tilled', 'fertilized', 'seen'])
      assert(typeof t[k] === 'boolean');
    assert(number(t.amount, 0, 100, true));
    if (t.resource) assert((t.amount as number) > 0);
    assert(number(t.respawn, 0, 1000010, true));
    assert(number(t.height, -1, 2));
    assert(number(t.water, 0, 100));
    assert(number(t.growth, 0, 100000));
    if (t.crop)
      assert(
        t.tilled &&
          !t.resource &&
          t.terrain !== 'water' &&
          (t.growth as number) <= CROPS[String(t.crop)].grow,
      );
  };
  const offset = s.mine ? { x: 0, z: 0 } : s.world;
  s.tiles.forEach((t: unknown, index: number) => {
    validateTile(t);
    assert(object(t));
    assert(
      t.x === (offset.x as number) + (index % width) &&
        t.z === (offset.z as number) + Math.floor(index / width),
    );
  });
  for (const [key, tile] of Object.entries(s.world.edits)) {
    validateTile(tile);
    assert(object(tile));
    assert(key === tileKey(tile.x as number, tile.z as number));
  }
  if (!hasBaseline(s.seed as number)) createState(s.seed as number);
  assert(Array.isArray(s.jobs) && s.jobs.length <= 3);
  for (const j of s.jobs) {
    assert(object(j) && typeof j.recipe === 'string' && own(RECIPES, j.recipe));
    assert(number(j.total, 1, 30) && number(j.remaining, 0, j.total as number));
  }
  const ids = new Set<number>(),
    positions = new Set<string>();
  const validateEntity: (e: unknown) => asserts e is Record<string, unknown> = (
    e,
  ) => {
    assert(object(e));
    assert(number(e.id, 1, (s.nextId as number) - 1, true));
    assert(!ids.has(e.id as number));
    ids.add(e.id as number);
    assert(number(e.x, -1e9, 1e9) && number(e.z, -1e9, 1e9));
  };
  assert(Array.isArray(s.buildings) && s.buildings.length <= SIZE * SIZE);
  for (const b of s.buildings) {
    validateEntity(b);
    assert(typeof b.type === 'string' && own(BUILDINGS, b.type));
    assert(number(b.level, 1, 3, true));
    if (b.rotation !== undefined) assert(number(b.rotation, 0, 3, true));
    if (b.corner !== undefined) assert(typeof b.corner === 'boolean');
    assert(number(b.hp, 0, BUILDINGS[b.type].hp * (b.level as number)));
    assert(number(b.timer, -10, 10000));
    assert(typeof b.enabled === 'boolean');
    if (b.recipe !== undefined || b.processing !== undefined || b.repeat !== undefined) {
      const recipe = machineRecipes(b.type).find(r => r.id === (b.recipe ?? 'default'));
      assert(recipe);
      if (b.recipe !== undefined) assert(typeof b.recipe === 'string');
      if (b.processing !== undefined) assert(typeof b.processing === 'boolean');
      if (b.repeat !== undefined) assert(typeof b.repeat === 'boolean');
      assert(number(b.timer, 0, recipe.time));
    }
    if (BUILDINGS[b.type].orchard) {
      assert(number(b.plantedDay, 1, s.day as number, true));
      assert(number(b.harvestDay, 0, s.day as number, true));
      assert((b.harvestDay as number) === 0 || (b.harvestDay as number) >= (b.plantedDay as number) + BUILDINGS[b.type].orchard!.matureDays);
    }
    const key = `${b.x},${b.z}`;
    assert(!positions.has(key));
    positions.add(key);
    assert(number(b.x, -1e9, 1e9, true) && number(b.z, -1e9, 1e9, true));
    const index = tileIndex(
      s as unknown as State,
      b.x as number,
      b.z as number,
    );
    const t =
      index >= 0
        ? s.tiles[index]
        : (s.world.edits[tileKey(b.x as number, b.z as number)] ??
          generatedTile(
            s.seed as number,
            b.x as number,
            b.z as number,
            s.world.generation as number | undefined,
          ));
    assert(object(t) && t.terrain !== 'water' && !t.resource && !t.crop);
  }
  for (const kind of ['home', 'market', 'beacon'])
    assert(s.buildings.filter((b) => b.type === kind).length <= 1);
  assert(Array.isArray(s.animals) && s.animals.length <= 200);
  for (const a of s.animals) {
    validateEntity(a);
    assert(typeof a.type === 'string' && own(ANIMALS, a.type));
    assert(number(a.home, 1, (s.nextId as number) - 1, true));
    assert(number(a.timer, 0, 10000) && typeof a.fed === 'boolean');
    if (a.ready !== undefined) assert(number(a.ready, 0, 12, true));
    for (const key of ['fedDay', 'producedDay'])
      if (a[key] !== undefined)
        assert(number(a[key], 1, s.day as number, true));
    if (a.name !== undefined)
      assert(typeof a.name === 'string' && a.name.length <= 24);
    if (a.bond !== undefined) assert(number(a.bond, 0, 100));
    if(a.parent!==undefined)assert(number(a.parent,1,1e9,true));
    for (const key of ['pettedDay', 'bornDay', 'breedDay'])
      if (a[key] !== undefined)
        assert(number(a[key], 0, s.day as number, true));
  }
  assert(Array.isArray(s.enemies) && s.enemies.length <= 32);
  for (const e of s.enemies) {
    validateEntity(e);
    if (e.kind !== undefined)
      assert(typeof e.kind === 'string' && own(ENEMIES, e.kind));
    if (e.windup !== undefined) {
      assert(number(e.windup, 0, 3));
      assert(number(e.aimX, -1e9, 1e9) && number(e.aimZ, -1e9, 1e9));
    }
    assert(
      number(e.maxHp, 1, 1000) &&
        number(e.hp, 0, e.maxHp as number) &&
        number(e.cooldown, -10000, 10),
    );
  }
  const result = JSON.parse(JSON.stringify(s)) as State;
  const pTile =
    result.tiles[tileIndex(result, result.player.x, result.player.z)];
  assert(
    pTile &&
      pTile.terrain !== 'water' &&
      pTile.terrain !== 'wall' &&
      !pTile.resource &&
      !positions.has(
        `${Math.round(result.player.x)},${Math.round(result.player.z)}`,
      ),
    sourceText("m_9abfc8517b"),
  );
  if (result.mine) {
    const surface = result.mine.surface;
    const validated = deserialize(
      serialize({
        ...result,
        mine: null,
        tiles: surface.tiles,
        buildings: surface.buildings,
        animals: surface.animals,
        enemies: [],
        player: { ...result.player, x: surface.x, z: surface.z },
      }),
    );
    result.mine.surface = {
      tiles: validated.tiles,
      buildings: validated.buildings,
      animals: validated.animals,
      x: validated.player.x,
      z: validated.player.z,
    };
    assert(result.buildings.length === 0 && result.animals.length === 0);
  }
  return result;
}
let validatedPrevious: string | null = null;
export function saveLocal(s: State): boolean {
  try {
    const current = localStorage.getItem(SAVE_KEY);
    if (current) {
      try {
        if (current !== validatedPrevious) deserialize(current);
        localStorage.setItem(BACKUP_KEY, current);
      } catch {}
    }
    const text = serialize(s);
    localStorage.setItem(SAVE_KEY, text);
    validatedPrevious = text;
    return true;
  } catch {
    return false;
  }
}
export function loadLocal(): { state: State; message: string } {
  try {
    const primary = localStorage.getItem(SAVE_KEY);
    if (primary) {
      try {
        return {
          state: deserialize(primary),
          message: sourceText("m_4486e9e448"),
        };
      } catch {
        const backup = localStorage.getItem(BACKUP_KEY);
        if (backup) {
          try {
            return {
              state: deserialize(backup),
              message: sourceText("m_50737c4b4f"),
            };
          } catch {}
        }
        return {
          state: createState(),
          message:
            sourceText("m_1490453db4"),
        };
      }
    }
  } catch {
    return {
      state: createState(),
      message: sourceText("m_f5ae9dfa31"),
    };
  }
  return {
    state: createState(),
    message:
      sourceText("m_e5f8e03bd0"),
  };
}
