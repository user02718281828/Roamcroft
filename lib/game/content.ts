import { sourceText } from '../i18n/source.ts';
import type { Bag } from './data.ts';
export type NPC = {
  id: string;
  name: string;
  role: string;
  color: number;
  x: number;
  z: number;
  dialogue: Record<string, string[]>;
  gift: string;
};
export type Landmark = {
  id: string;
  name: string;
  description: string;
  x: number;
  z: number;
  reward: { items: Bag; gold: number; xp: number };
};
export const NPCS: NPC[] = [
  {
    id: 'narin',
    name: 'Narin',
    role: sourceText("m_c1cca0adfe"),
    color: 14979479,
    x: 18,
    z: 13,
    dialogue: {
      early: [
        sourceText("m_b9150f33e1"),
        sourceText("m_dab92c859d"),
        sourceText("m_6a5d345558"),
      ],
      growing: [
        sourceText("m_c1d25a9183"),
        sourceText("m_41fd765e7d"),
        sourceText("m_2f60861fbf"),
      ],
      established: [
        sourceText("m_5c806940b0"),
        sourceText("m_6e854ae9ed"),
        sourceText("m_cd6b71b3fa"),
      ],
      beacon: [
        sourceText("m_1acf4e7ced"),
        sourceText("m_4599c27c92"),
        sourceText("m_f2f8f36d16"),
      ],
    },
    gift: 'carrot',
  },
  {
    id: 'torin',
    name: 'Torin',
    role: sourceText("m_c03b6b6887"),
    color: 11176285,
    x: 11,
    z: 16,
    dialogue: {
      early: [
        sourceText("m_b1edc40efe"),
        sourceText("m_3a52022ffb"),
        sourceText("m_30f7fcc6bd"),
      ],
      growing: [
        sourceText("m_08ea4f46bf"),
        sourceText("m_27125fb47e"),
        sourceText("m_dbcc0e3237"),
      ],
      established: [
        sourceText("m_6dad9f2d31"),
        sourceText("m_b01859a238"),
        sourceText("m_e09be88668"),
      ],
      beacon: [
        sourceText("m_72d2e2b428"),
        sourceText("m_c405c3e2a0"),
        sourceText("m_03f39eb8b9"),
      ],
    },
    gift: 'copper',
  },
  {
    id: 'lale',
    name: 'Lale',
    role: sourceText("m_26615b3974"),
    color: 5948067,
    x: 21,
    z: 21,
    dialogue: {
      early: [
        sourceText("m_5a062a6bca"),
        sourceText("m_2a60acc366"),
        sourceText("m_a0b5d7d410"),
      ],
      growing: [
        sourceText("m_5a633bf7ca"),
        sourceText("m_c4dd7bb2cc"),
        sourceText("m_7f15aaa5c2"),
      ],
      established: [
        sourceText("m_df46b7161d"),
        sourceText("m_dd9ae0c998"),
        sourceText("m_5bad6b2fef"),
      ],
      beacon: [
        sourceText("m_6cf257002d"),
        sourceText("m_ac8d135f88"),
        sourceText("m_131c2c555d"),
      ],
    },
    gift: 'grilledfish',
  },
];
export const LANDMARKS: Landmark[] = [
  {
    id: 'grove',
    name: sourceText("m_7c1df0453d"),
    description:
      sourceText("m_865a3b70e4"),
    x: 6,
    z: 28,
    reward: {
      items: {
        berry: 5,
        mushroom: 3,
        honey: 1,
      },
      gold: 100,
      xp: 60,
    },
  },
  {
    id: 'ruins',
    name: sourceText("m_7850ea16ed"),
    description:
      sourceText("m_6395c3bb6b"),
    x: 7,
    z: 5,
    reward: {
      items: {
        crystal: 2,
      },
      gold: 100,
      xp: 80,
    },
  },
  {
    id: 'outlook',
    name: sourceText("m_6efd62ec6d"),
    description:
      sourceText("m_d95c2ac4d9"),
    x: 32,
    z: 8,
    reward: {
      items: {
        bread: 2,
        bandage: 2,
      },
      gold: 100,
      xp: 70,
    },
  },
];
export const ACHIEVEMENTS: {
  id: string;
  name: string;
  description: string;
  stat: string;
  target: number;
  rewardGold: number;
}[] = [
  {
    id: 'woodland_hand',
    name: sourceText("m_c58d3a63c6"),
    description: sourceText("m_b47cc8fff2"),
    stat: 'wood',
    target: 300,
    rewardGold: 250,
  },
  {
    id: 'soil_keeper',
    name: sourceText("m_6ca4c246a8"),
    description: sourceText("m_7f8ca5deff"),
    stat: 'till',
    target: 80,
    rewardGold: 180,
  },
  {
    id: 'seed_of_tomorrow',
    name: sourceText("m_4749632825"),
    description: sourceText("m_4c4f9e8437"),
    stat: 'plant',
    target: 150,
    rewardGold: 220,
  },
  {
    id: 'full_baskets',
    name: sourceText("m_b0be8a5b1d"),
    description: sourceText("m_834e680cf2"),
    stat: 'harvest',
    target: 100,
    rewardGold: 250,
  },
  {
    id: 'valley_builder',
    name: sourceText("m_8e38690d71"),
    description: sourceText("m_1d73fe12f0"),
    stat: 'build',
    target: 25,
    rewardGold: 300,
  },
  {
    id: 'skilled_hands',
    name: sourceText("m_8304cac7dd"),
    description: sourceText("m_b6d4b26c39"),
    stat: 'craft',
    target: 100,
    rewardGold: 250,
  },
  {
    id: 'lake_regular',
    name: sourceText("m_b0614b611b"),
    description: sourceText("m_c9fe45ebfe"),
    stat: 'fish',
    target: 40,
    rewardGold: 220,
  },
  {
    id: 'market_friend',
    name: sourceText("m_68fe1dc867"),
    description: sourceText("m_999f49b846"),
    stat: 'sell',
    target: 3000,
    rewardGold: 250,
  },
  {
    id: 'lively_barn',
    name: sourceText("m_fc38a66838"),
    description: sourceText("m_5867620b28"),
    stat: 'animals',
    target: 8,
    rewardGold: 300,
  },
  {
    id: 'valley_guardian',
    name: sourceText("m_5dcadca907"),
    description: sourceText("m_d2aa1b04e8"),
    stat: 'kills',
    target: 50,
    rewardGold: 350,
  },
  {
    id: 'better_every_day',
    name: sourceText("m_3eff09b946"),
    description: sourceText("m_cc936d9aef"),
    stat: 'upgrade',
    target: 6,
    rewardGold: 300,
  },
  {
    id: 'a_month_at_home',
    name: sourceText("m_616419283f"),
    description: sourceText("m_30d00dfff1"),
    stat: 'days',
    target: 30,
    rewardGold: 400,
  },
];
