import { sourceText } from '../i18n/source.ts';
import type { State } from './model.ts';
import type { Bag } from './data.ts';

export type Milestone = {
  id: string;
  name: string;
  next: string;
  requirements: {
    label: string;
    target: number;
    value: (s: State) => number;
  }[];
  reward: Bag;
};
const stat = (key: string) => (s: State) => s.stats[key] || 0;
export const MILESTONES: Milestone[] = [
  {
    id: 'roots',
    name: sourceText("m_67b5f3e602"),
    next: sourceText("m_473d8b25c2"),
    requirements: [
      { label: sourceText("m_7e9b02ff71"), target: 8, value: stat('harvest') },
      { label: sourceText("m_737d1b72e4"), target: 100, value: stat('sell') },
    ],
    reward: { wood: 30, stone: 25, copper: 8 },
  },
  {
    id: 'workshop',
    name: sourceText("m_a96e09ad72"),
    next: sourceText("m_0971855a10"),
    requirements: [
      { label: sourceText("m_e194b3ffbc"), target: 3, value: stat('build') },
      { label: sourceText("m_3de43d181c"), target: 5, value: stat('craft') },
    ],
    reward: { sprinkler: 1, feed: 20, bar: 3 },
  },
  {
    id: 'ranch',
    name: sourceText("m_c6868cad8d"),
    next: sourceText("m_ffdfccbb56"),
    requirements: [
      { label: sourceText("m_896d2f2ced"), target: 3, value: stat('animals') },
      {
        label: sourceText("m_2615104bdc"),
        target: 10,
        value: stat('animalharvest'),
      },
    ],
    reward: { milk: 8, berry: 20, copperbar: 8 },
  },
  {
    id: 'guild',
    name: sourceText("m_fa4224d065"),
    next: sourceText("m_b10256927a"),
    requirements: [
      { label: sourceText("m_9e4f241ca0"), target: 30, value: stat('production') },
      {
        label: sourceText("m_69d7f6a7eb"),
        target: 2,
        value: (s) => s.bundles.completed.length,
      },
    ],
    reward: { bar: 12, crystal: 6, soup: 5 },
  },
  {
    id: 'legacy',
    name: sourceText("m_ac023e5d5a"),
    next: sourceText("m_7bbb088508"),
    requirements: [
      {
        label: sourceText("m_dd56a446f2"),
        target: 1,
        value: stat('minecomplete'),
      },
      {
        label: sourceText("m_141d3db86c"),
        target: 10,
        value: stat('upgrade'),
      },
      {
        label: sourceText("m_69d7f6a7eb"),
        target: 4,
        value: (s) => s.bundles.completed.length,
      },
    ],
    reward: { sprinkler: 4, crystal: 20, wood: 100, stone: 100 },
  },
];
export const milestoneReady = (s: State, m: Milestone) =>
  m.requirements.every((r) => r.value(s) >= r.target);
export const nextMilestone = (s: State) =>
  MILESTONES.find((m) => !s.settlement.milestones.includes(m.id));
export const settlementRank = (s: State) =>
  [
    sourceText("m_2e53daab83"),
    sourceText("m_67b5f3e602"),
    sourceText("m_a96e09ad72"),
    sourceText("m_c6868cad8d"),
    sourceText("m_fa4224d065"),
    sourceText("m_4c74c09aac"),
  ][s.settlement.milestones.length] || sourceText("m_4c74c09aac");
