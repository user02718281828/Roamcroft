import { sourceText } from '../i18n/source.ts';
export type Bag = Record<string, number>;
export type Item = {
  name: string;
  icon: string;
  price: number;
  food?: number;
  energy?: number;
  heal?: number;
  category: string;
};
const resource = (name: string, icon: string, price: number): Item => ({
  name,
  icon,
  price,
  category: sourceText("m_2f0db590c3"),
});
const food = (
  name: string,
  icon: string,
  price: number,
  hunger: number,
  energy: number,
  heal = 0,
): Item => ({
  name,
  icon,
  price,
  food: hunger,
  energy,
  heal,
  category: sourceText("m_6f185074f6"),
});
const product = (name: string, icon: string, price: number): Item => ({
  name,
  icon,
  price,
  category: sourceText("m_32b7325228"),
});
export const ITEMS: Record<string, Item> = {
  apple: food(sourceText("m_e775b380b3"), 'apple', 28, 18, 14),
  pear: food(sourceText("m_beb5da0a8a"), 'pear', 36, 22, 18),
  applesapling: { ...product(sourceText("m_3ea6b36737"), 'appletree', 65), category: sourceText("m_e24bfc1261") },
  pearsapling: { ...product(sourceText("m_b7e8bda176"), 'peartree', 90), category: sourceText("m_e24bfc1261") },
  applejam: food(sourceText("m_2f4d236db9"), 'applejam', 105, 35, 32),
  peartart: food(sourceText("m_76d29eb5e1"), 'peartart', 165, 65, 55, 15),
  sprinkler: product(sourceText("m_f608638869"), 'water', 80),
  wood: resource(sourceText("m_e767fa35aa"), '🪵', 3),
  stone: resource(sourceText("m_3fd8a7db4c"), '🪨', 4),
  fiber: resource(sourceText("m_f83426204b"), '🌿', 2),
  coal: resource(sourceText("m_586cb38cbc"), '◼', 8),
  copper: resource(sourceText("m_9f0da5d49a"), '🔶', 12),
  iron: resource(sourceText("m_c854b7166e"), '⛏', 18),
  crystal: resource(sourceText("m_ff5675eb85"), '💎', 70),
  plank: product(sourceText("m_3982055d83"), '🪵', 10),
  brick: product(sourceText("m_1743fabd1d"), '🧱', 14),
  bar: product(sourceText("m_709925f3b3"), '🔩', 55),
  copperbar: product(sourceText("m_205eccc446"), '🔶', 32),
  rope: product(sourceText("m_5148081c61"), '🪢', 12),
  wheat: product(sourceText("m_2e3b58c1bb"), '🌾', 12),
  carrot: food(sourceText("m_3a8274cc23"), '🥕', 20, 12, 8),
  tomato: food(sourceText("m_dc2a1cbafc"), '🍅', 30, 15, 10),
  pumpkin: food(sourceText("m_c78f014774"), '🎃', 60, 24, 15),
  corn: food(sourceText("m_5d642ef019"), '🌽', 28, 15, 10),
  potato: food(sourceText("m_098f684b2b"), '🥔', 25, 12, 10),
  berry: food(sourceText("m_1858348e6e"), '🫐', 6, 10, 7),
  mushroom: food(sourceText("m_4d04550421"), '🍄', 9, 8, 5),
  fish: product(sourceText("m_73465e0fc0"), '🐟', 24),
  egg: food(sourceText("m_0f9e361415"), '🥚', 20, 12, 10),
  milk: food(sourceText("m_3531588ff8"), '🥛', 35, 18, 15),
  wool: product(sourceText("m_e18a695ad0"), '🧶', 32),
  honey: food(sourceText("m_c7e9047dca"), '🍯', 42, 20, 20),
  flour: product(sourceText("m_d32a504100"), '🌾', 32),
  bread: food(sourceText("m_2c338b6b0b"), '🍞', 45, 40, 35, 8),
  soup: food(sourceText("m_ab454f15fb"), '🍲', 65, 60, 45, 20),
  grilledfish: food(sourceText("m_d918b28628"), '🍢', 55, 45, 30, 12),
  cheese: food(sourceText("m_83b760932e"), '🧀', 90, 35, 30),
  jam: food(sourceText("m_d89e2fec0d"), '🫙', 60, 30, 25),
  feed: product(sourceText("m_bdb062b002"), '🌾', 10),
  bandage: food(sourceText("m_2bfbd83913"), '🩹', 25, 0, 0, 40),
  fertilizer: product(sourceText("m_08026178a9"), '🍂', 18),
  wheatseed: { ...product(sourceText("m_0b3212e2e3"), '🌾', 4), category: sourceText("m_eaf3725fa6") },
  carrotseed: { ...product(sourceText("m_d9dd51626e"), '🥕', 7), category: sourceText("m_eaf3725fa6") },
  tomatoseed: { ...product(sourceText("m_84117d94ba"), '🍅', 12), category: sourceText("m_eaf3725fa6") },
  pumpkinseed: { ...product(sourceText("m_607196713e"), '🎃', 22), category: sourceText("m_eaf3725fa6") },
  cornseed: { ...product(sourceText("m_f92ded3693"), '🌽', 10), category: sourceText("m_eaf3725fa6") },
  potatoseed: { ...product(sourceText("m_22a5420e6b"), '🥔', 9), category: sourceText("m_eaf3725fa6") },
};
export const CROPS: Record<
  string,
  {
    name: string;
    seed: string;
    grow: number;
    regrow?: number;
    yield: number;
    level: number;
    seasons: number[];
    color: number;
  }
> = {
  wheat: {
    name: sourceText("m_2e3b58c1bb"),
    seed: 'wheatseed',
    grow: 65,
    yield: 3,
    level: 1,
    seasons: [0, 1, 2, 3],
    color: 0xe9bd4c,
  },
  carrot: {
    name: sourceText("m_3a8274cc23"),
    seed: 'carrotseed',
    grow: 95,
    yield: 3,
    level: 1,
    seasons: [0, 2],
    color: 0xec8d38,
  },
  potato: {
    name: sourceText("m_098f684b2b"),
    seed: 'potatoseed',
    grow: 120,
    yield: 3,
    level: 3,
    seasons: [0, 2, 3],
    color: 0xcab575,
  },
  tomato: {
    name: sourceText("m_dc2a1cbafc"),
    seed: 'tomatoseed',
    grow: 150,
    regrow: 100,
    yield: 4,
    level: 4,
    seasons: [0, 1],
    color: 0xdf5147,
  },
  corn: {
    name: sourceText("m_5d642ef019"),
    seed: 'cornseed',
    grow: 180,
    regrow: 120,
    yield: 4,
    level: 5,
    seasons: [1, 2],
    color: 0xe6c448,
  },
  pumpkin: {
    name: sourceText("m_c78f014774"),
    seed: 'pumpkinseed',
    grow: 240,
    yield: 3,
    level: 7,
    seasons: [2],
    color: 0xe88c35,
  },
};
export type BuildingDef = {
  name: string;
  icon: string;
  desc: string;
  cost: Bag;
  level: number;
  hp: number;
  category: string;
  color: number;
  production?: { input: Bag; output: Bag; time: number };
  orchard?: { fruit: string; matureDays: number; seasons: number[] };
  unique?: boolean;
};
export const BUILDINGS: Record<string, BuildingDef> = {
  appletree: { name: sourceText("m_76f9251510"), icon: 'appletree', desc: sourceText("m_bb0a50c612"), cost: { applesapling: 1, wood: 4 }, level: 1, hp: 120, category: sourceText("m_58b7a69368"), color: 0xb74c37, orchard: { fruit: 'apple', matureDays: 2, seasons: [0, 2] } },
  peartree: { name: sourceText("m_6880c4678f"), icon: 'peartree', desc: sourceText("m_ae799096df"), cost: { pearsapling: 1, wood: 4 }, level: 2, hp: 140, category: sourceText("m_58b7a69368"), color: 0xd4b34a, orchard: { fruit: 'pear', matureDays: 3, seasons: [1, 2] } },
  wall: {name:sourceText("m_510dae27f6"), icon:'stone', desc:sourceText("m_c67da0a884"), cost:{stone:5}, level:2, hp:240, category:sourceText("m_28925851ca"), color:0x8b998a},
  sprinkler: {
    name: sourceText("m_f608638869"),
    icon: 'water',
    desc: sourceText("m_46d754b41d"),
    cost: { sprinkler: 1 },
    level: 2,
    hp: 90,
    category: sourceText("m_aeb79ca9a6"),
    color: 0xa78b61,
  },
  feedmill: {
    name: sourceText("m_79906228fd"),
    icon: 'feed',
    desc: sourceText("m_e0c6687659"),
    cost: { plank: 18, stone: 25, copperbar: 4 },
    level: 4,
    hp: 180,
    category: sourceText("m_0d3d1e1ccb"),
    color: 0xc5a45c,
    production: { input: { wheat: 3 }, output: { feed: 9 }, time: 55 },
  },
  smokehouse: {
    name: sourceText("m_852dac492b"),
    icon: 'grilledfish',
    desc: sourceText("m_f51b17594d"),
    cost: { plank: 16, brick: 12, bar: 3 },
    level: 5,
    hp: 190,
    category: sourceText("m_0d3d1e1ccb"),
    color: 0x9c7154,
    production: {
      input: { fish: 2, wood: 1 },
      output: { grilledfish: 3 },
      time: 60,
    },
  },
  loom: {
    name: sourceText("m_d65f0a94f7"),
    icon: 'wool',
    desc: sourceText("m_56072bcf0f"),
    cost: { plank: 22, rope: 8, copperbar: 4 },
    level: 6,
    hp: 170,
    category: sourceText("m_0d3d1e1ccb"),
    color: 0xbb977e,
    production: {
      input: { wool: 2, fiber: 1 },
      output: { bandage: 3 },
      time: 65,
    },
  },
  home: {
    name: sourceText("m_85e6a48c12"),
    icon: '🏡',
    desc: sourceText("m_667ee8ad49"),
    cost: { wood: 60, stone: 35 },
    level: 1,
    hp: 300,
    category: sourceText("m_aeb79ca9a6"),
    color: 0xb96348,
    unique: true,
  },
  workshop: {
    name: sourceText("m_e71bdecdfc"),
    icon: '🪚',
    desc: sourceText("m_c678dff1a1"),
    cost: { wood: 25, stone: 10 },
    level: 1,
    hp: 150,
    category: sourceText("m_0d3d1e1ccb"),
    color: 0x7b9270,
    production: { input: { wood: 3 }, output: { plank: 2 }, time: 35 },
  },
  campfire: {
    name: sourceText("m_43a01c7261"),
    icon: '🔥',
    desc: sourceText("m_ac3fbb0590"),
    cost: { wood: 12, stone: 8 },
    level: 1,
    hp: 80,
    category: sourceText("m_aeb79ca9a6"),
    color: 0xe69542,
  },
  well: {
    name: sourceText("m_d14b26cca1"),
    icon: '🪣',
    desc: sourceText("m_b7ce3f2343"),
    cost: { stone: 30, wood: 15 },
    level: 2,
    hp: 170,
    category: sourceText("m_aeb79ca9a6"),
    color: 0x8796a5,
  },
  coop: {
    name: sourceText("m_4eafecf67a"),
    icon: '🐔',
    desc: sourceText("m_4086deeb5a"),
    cost: { wood: 25, stone: 12 },
    level: 1,
    hp: 150,
    category: sourceText("m_aeb79ca9a6"),
    color: 0xca8b55,
  },
  furnace: {
    name: sourceText("m_72e487dc7f"),
    icon: '♨',
    desc: sourceText("m_db6f4e7db2"),
    cost: { stone: 35, wood: 15 },
    level: 3,
    hp: 200,
    category: sourceText("m_0d3d1e1ccb"),
    color: 0x8d9a9c,
    production: { input: { stone: 4 }, output: { brick: 2 }, time: 50 },
  },
  mill: {
    name: sourceText("m_1b251c536b"),
    icon: '🌬',
    desc: sourceText("m_e65e3837cf"),
    cost: { wood: 45, stone: 25, plank: 10 },
    level: 3,
    hp: 200,
    category: sourceText("m_0d3d1e1ccb"),
    color: 0xe5ca92,
    production: { input: { wheat: 3 }, output: { flour: 2 }, time: 45 },
  },
  chest: {name:sourceText("m_eb491a156d"),icon:'',desc:sourceText("m_26c669bb10"),cost:{wood:12,stone:4},level:1,hp:160,category:sourceText("m_aeb79ca9a6"),color:0xb27b43},
  fence: {
    name: sourceText("m_dac24c5b57"),
    icon: '🪵',
    desc: sourceText("m_9ffa0a8928"),
    cost: { wood: 6 },
    level: 1,
    hp: 140,
    category: sourceText("m_28925851ca"),
    color: 0x916a45,
  },
  tower: {
    name: sourceText("m_3177364adc"),
    icon: '🏹',
    desc: sourceText("m_1f63c8dcfe"),
    cost: { wood: 40, stone: 30, plank: 8 },
    level: 3,
    hp: 230,
    category: sourceText("m_28925851ca"),
    color: 0x8e705a,
  },
  barn: {
    name: sourceText("m_958891e9d5"),
    icon: '🐄',
    desc: sourceText("m_89c9a0546a"),
    cost: { wood: 70, stone: 35, plank: 12 },
    level: 3,
    hp: 250,
    category: sourceText("m_aeb79ca9a6"),
    color: 0xba5e4f,
  },
  apiary: {
    name: sourceText("m_cd22aa1454"),
    icon: '🐝',
    desc: sourceText("m_564a984c4a"),
    cost: { wood: 45, plank: 10, fiber: 15 },
    level: 5,
    hp: 120,
    category: sourceText("m_0d3d1e1ccb"),
    color: 0xd2a75a,
    production: { input: {}, output: { honey: 2 }, time: 150 },
  },
  dairy: {
    name: sourceText("m_3c1072624a"),
    icon: '🧀',
    desc: sourceText("m_7ab06ae5be"),
    cost: { stone: 45, plank: 20, brick: 10 },
    level: 6,
    hp: 200,
    category: sourceText("m_0d3d1e1ccb"),
    color: 0x9cbbbc,
    production: { input: { milk: 2 }, output: { cheese: 1 }, time: 80 },
  },
  kitchen: {
    name: sourceText("m_dc49709457"),
    icon: '🍲',
    desc: sourceText("m_c3e8c010c1"),
    cost: { stone: 35, plank: 15, brick: 8 },
    level: 4,
    hp: 180,
    category: sourceText("m_0d3d1e1ccb"),
    color: 0x879869,
    production: { input: { berry: 4 }, output: { jam: 2 }, time: 70 },
  },
  greenhouse: {
    name: sourceText("m_641135c745"),
    icon: '🌱',
    desc: sourceText("m_728c575ec8"),
    cost: { plank: 30, bar: 10, crystal: 3 },
    level: 8,
    hp: 240,
    category: sourceText("m_aeb79ca9a6"),
    color: 0x8cb9ac,
  },
  beacon: {
    name: sourceText("m_80a04ccbbc"),
    icon: '🔮',
    desc: sourceText("m_30edd441ad"),
    cost: { stone: 100, bar: 25, crystal: 12, plank: 30 },
    level: 10,
    hp: 500,
    category: sourceText("m_aeb79ca9a6"),
    color: 0x9b8cc8,
    unique: true,
  },
  market: {
    name: sourceText("m_c8dc3a5f90"),
    icon: '⚖',
    desc: sourceText("m_2a13ec2f43"),
    cost: { wood: 30, plank: 8 },
    level: 2,
    hp: 160,
    category: sourceText("m_aeb79ca9a6"),
    color: 0xe1aa58,
    unique: true,
  },
};
export const RECIPES: Record<
  string,
  {
    name: string;
    icon: string;
    input: Bag;
    output: Bag;
    level: number;
    station?: string;
    upgrade?: string;
  }
> = {
  applejam: { name: sourceText("m_8db2ebcce0"), icon: 'applejam', input: { apple: 3, honey: 1 }, output: { applejam: 2 }, level: 4, station: 'kitchen' },
  peartart: { name: sourceText("m_61b59549ae"), icon: 'peartart', input: { pear: 2, flour: 1, egg: 1 }, output: { peartart: 1 }, level: 4, station: 'kitchen' },
  sprinkler: {
    name: sourceText("m_f608638869"),
    icon: 'water',
    input: { stone: 5, copperbar: 2, iron: 2 },
    output: { sprinkler: 1 },
    level: 2,
  },
  plank: {
    name: sourceText("m_05919d7dc7"),
    icon: '🪵',
    input: { wood: 3 },
    output: { plank: 2 },
    level: 1,
  },
  rope: {
    name: sourceText("m_ae5c5862da"),
    icon: '🪢',
    input: { fiber: 4 },
    output: { rope: 2 },
    level: 1,
  },
  feed: {
    name: sourceText("m_29764c6e7c"),
    icon: '🌾',
    input: { wheat: 2 },
    output: { feed: 6 },
    level: 1,
  },
  bandage: {
    name: sourceText("m_2bfbd83913"),
    icon: '🩹',
    input: { fiber: 5, berry: 2 },
    output: { bandage: 1 },
    level: 1,
  },
  fertilizer: {
    name: sourceText("m_bf86b86c4a"),
    icon: '🍂',
    input: { fiber: 3, mushroom: 1 },
    output: { fertilizer: 3 },
    level: 2,
  },
  flour: {
    name: sourceText("m_130bd638f6"),
    icon: '🌾',
    input: { wheat: 3 },
    output: { flour: 2 },
    level: 2,
  },
  bread: {
    name: sourceText("m_2c338b6b0b"),
    icon: '🍞',
    input: { flour: 2, wood: 1 },
    output: { bread: 2 },
    level: 2,
    station: 'campfire',
  },
  grilledfish: {
    name: sourceText("m_167b25f3bb"),
    icon: '🍢',
    input: { fish: 1, wood: 1 },
    output: { grilledfish: 1 },
    level: 1,
    station: 'campfire',
  },
  soup: {
    name: sourceText("m_ab454f15fb"),
    icon: '🍲',
    input: { carrot: 2, mushroom: 2, wood: 1 },
    output: { soup: 2 },
    level: 3,
    station: 'campfire',
  },
  copperbar: {
    name: sourceText("m_006324b409"),
    icon: '🔶',
    input: { copper: 3, coal: 1 },
    output: { copperbar: 1 },
    level: 3,
    station: 'furnace',
  },
  bar: {
    name: sourceText("m_2b29263727"),
    icon: '🔩',
    input: { iron: 3, coal: 2 },
    output: { bar: 1 },
    level: 4,
    station: 'furnace',
  },
  brick: {
    name: sourceText("m_bf7095ae37"),
    icon: '🧱',
    input: { stone: 4, coal: 1 },
    output: { brick: 3 },
    level: 3,
    station: 'furnace',
  },
  axe: {
    name: sourceText("m_9582b429fd"),
    icon: '🪓',
    input: { wood: 15, copperbar: 3 },
    output: {},
    level: 3,
    upgrade: 'axe',
  },
  pickaxe: {
    name: sourceText("m_dd69ce6071"),
    icon: '⛏',
    input: { wood: 15, bar: 3 },
    output: {},
    level: 4,
    upgrade: 'pickaxe',
  },
  sword: {
    name: sourceText("m_4d59fa15df"),
    icon: '⚔',
    input: { bar: 5, plank: 5 },
    output: {},
    level: 4,
    upgrade: 'sword',
  },
  armor: {
    name: sourceText("m_cb1cad72de"),
    icon: '🛡',
    input: { bar: 8, wool: 5 },
    output: {},
    level: 6,
    upgrade: 'armor',
  },
};
export const QUESTS: {
  id: string;
  name: string;
  desc: string;
  stat: string;
  target: number;
  reward: { gold: number; xp: number; items: Bag };
}[] = [
  {
    id: 'gather',
    name: sourceText("m_45791a92b7"),
    desc: sourceText("m_7f18b21998"),
    stat: 'wood',
    target: 12,
    reward: { gold: 40, xp: 35, items: { carrotseed: 6 } },
  },
  {
    id: 'till',
    name: sourceText("m_ce98e4a4a6"),
    desc: sourceText("m_0787a572b2"),
    stat: 'till',
    target: 4,
    reward: { gold: 30, xp: 35, items: { wheatseed: 8 } },
  },
  {
    id: 'plant',
    name: sourceText("m_6c932fa21e"),
    desc: sourceText("m_db89b6ada8"),
    stat: 'plant',
    target: 6,
    reward: { gold: 50, xp: 45, items: { bread: 2 } },
  },
  {
    id: 'harvest',
    name: sourceText("m_05cd8d5fbe"),
    desc: sourceText("m_decfccf5c2"),
    stat: 'harvest',
    target: 6,
    reward: { gold: 80, xp: 70, items: { tomatoseed: 5 } },
  },
  {
    id: 'orchard', name: sourceText("m_2d98f516db"), desc: sourceText("m_a4866dbd25"), stat: 'orchard', target: 1, reward: { gold: 45, xp: 35, items: { honey: 2 } },
  },
  { id: 'fruit', name: sourceText("m_669f13dc90"), desc: sourceText("m_f6e74ac141"), stat: 'fruit', target: 6, reward: { gold: 120, xp: 65, items: { pearsapling: 1, flour: 2 } } },
  {
    id: 'build',
    name: sourceText("m_7f433ff63b"),
    desc: sourceText("m_103e58d0e9"),
    stat: 'build',
    target: 3,
    reward: { gold: 100, xp: 90, items: { plank: 10 } },
  },
  {
    id: 'craft',
    name: sourceText("m_645c2a169e"),
    desc: sourceText("m_67186c2983"),
    stat: 'craft',
    target: 8,
    reward: { gold: 100, xp: 100, items: { copper: 12 } },
  },
  {
    id: 'fish',
    name: sourceText("m_a3a7ad7ff9"),
    desc: sourceText("m_873c1ecb0b"),
    stat: 'fish',
    target: 5,
    reward: { gold: 100, xp: 80, items: { bread: 3 } },
  },
  {
    id: 'sell',
    name: sourceText("m_67430ae1bd"),
    desc: sourceText("m_d2544c809d"),
    stat: 'sell',
    target: 300,
    reward: { gold: 150, xp: 100, items: { iron: 15 } },
  },
  {
    id: 'animals',
    name: sourceText("m_03163a7f71"),
    desc: sourceText("m_80dc2c6967"),
    stat: 'animals',
    target: 3,
    reward: { gold: 100, xp: 120, items: { feed: 30 } },
  },
  {
    id: 'combat',
    name: sourceText("m_5b68b9fb8e"),
    desc: sourceText("m_b99552324d"),
    stat: 'kills',
    target: 10,
    reward: { gold: 200, xp: 160, items: { crystal: 3 } },
  },
  {
    id: 'upgrade',
    name: sourceText("m_ef44b74a91"),
    desc: sourceText("m_c3e45992c4"),
    stat: 'upgrade',
    target: 5,
    reward: { gold: 250, xp: 180, items: { bar: 5 } },
  },
  {
    id: 'survive',
    name: sourceText("m_cc35f016c0"),
    desc: sourceText("m_33da3a326c"),
    stat: 'days',
    target: 14,
    reward: { gold: 400, xp: 250, items: { crystal: 5 } },
  },
  {
    id: 'beacon',
    name: sourceText("m_e25d390d2e"),
    desc: sourceText("m_840507cfc4"),
    stat: 'beacon',
    target: 3,
    reward: { gold: 1000, xp: 1000, items: { crystal: 20 } },
  },
  {
    id: 'ranchbirth',
    name: sourceText("m_2e40386d4c"),
    desc: sourceText("m_a0f69299a1"),
    stat: 'births',
    target: 1,
    reward: { gold: 120, xp: 90, items: { feed: 15 } },
  },
  {
    id: 'animalcare',
    name: sourceText("m_e43e4dc8cb"),
    desc: sourceText("m_e3b002ac83"),
    stat: 'care',
    target: 6,
    reward: { gold: 180, xp: 100, items: { wheatseed: 12 } },
  },
  {
    id: 'production',
    name: sourceText("m_e97ac54593"),
    desc: sourceText("m_ba8539d061"),
    stat: 'production',
    target: 40,
    reward: { gold: 300, xp: 180, items: { bar: 6 } },
  },
  {
    id: 'riverlife',
    name: sourceText("m_64a978acf1"),
    desc: sourceText("m_2202ae9582"),
    stat: 'fish',
    target: 25,
    reward: { gold: 250, xp: 160, items: { crystal: 3 } },
  },
  {
    id: 'depths',
    name: sourceText("m_42d17cf688"),
    desc: sourceText("m_02bda517fc"),
    stat: 'minecomplete',
    target: 1,
    reward: { gold: 500, xp: 300, items: { bandage: 8 } },
  },
];
export const SEASONS = [sourceText("m_3a54370b42"), sourceText("m_4a2884827a"), sourceText("m_ab78e37b66"), sourceText("m_dd5ebfdada")];
export const TOOLS = [
  { id: 'hand', name: sourceText("m_45d0d89ac9"), icon: '✋', key: '1' },
  { id: 'axe', name: sourceText("m_6742b79054"), icon: '🪓', key: '2' },
  { id: 'pickaxe', name: sourceText("m_354957eaa7"), icon: '⛏', key: '3' },
  { id: 'hoe', name: sourceText("m_04999e5d6a"), icon: '⚒', key: '4' },
  { id: 'seed', name: sourceText("m_eaf3725fa6"), icon: '🌱', key: '5' },
  { id: 'water', name: sourceText("m_14dd0abec2"), icon: '💧', key: '6' },
  { id: 'sword', name: sourceText("m_1996d1f050"), icon: '⚔', key: '7' },
  { id: 'fish', name: sourceText("m_b40bd2d9f9"), icon: '🎣', key: '8' },
];
export const ANIMALS: Record<
  string,
  {
    name: string;
    icon: string;
    cost: number;
    home: string;
    product: string;
    time: number;
  }
> = {
  chicken: {
    name: sourceText("m_2042998213"),
    icon: '🐔',
    cost: 65,
    home: 'coop',
    product: 'egg',
    time: 100,
  },
  cow: {
    name: sourceText("m_63a10d463e"),
    icon: '🐄',
    cost: 180,
    home: 'barn',
    product: 'milk',
    time: 140,
  },
  sheep: {
    name: sourceText("m_487a14cf2d"),
    icon: '🐑',
    cost: 150,
    home: 'barn',
    product: 'wool',
    time: 180,
  },
};
export const TALENTS: Record<
  string,
  { name: string; icon: string; desc: string }
> = {
  harvest: {
    name: sourceText("m_e371a6cea9"),
    icon: '🌾',
    desc: sourceText("m_a5c9b1f9c0"),
  },
  forage: {
    name: sourceText("m_7820d4840e"),
    icon: '🌲',
    desc: sourceText("m_0e852aac09"),
  },
  artisan: {
    name: sourceText("m_e7b3b6a7a7"),
    icon: '⚒',
    desc: sourceText("m_11c2c44fe4"),
  },
  defender: {
    name: sourceText("m_e25c8e602d"),
    icon: '🛡',
    desc: sourceText("m_bbe72ef6d6"),
  },
  vigor: {
    name: sourceText("m_293026fcd8"),
    icon: '⚡',
    desc: sourceText("m_ff5dacd9ac"),
  },
  angler: {
    name: sourceText("m_20f0714916"),
    icon: '🎣',
    desc: sourceText("m_244a1a62d5"),
  },
};
