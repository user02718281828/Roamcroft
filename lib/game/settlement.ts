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
    name: 'Kök salan çiftlik',
    next: 'Kereste ve taşla ilk işliğini kur; bakırı eriterek sulama hazırlığına başla.',
    requirements: [
      { label: 'Hasat edilen tarla', target: 8, value: stat('harvest') },
      { label: 'Ticaret geliri', target: 100, value: stat('sell') },
    ],
    reward: { wood: 30, stone: 25, copper: 8 },
  },
  {
    id: 'workshop',
    name: 'Çalışan atölye',
    next: 'Fıskiyeyi tarlana yerleştir. Otomasyonun kazandırdığı zamanı hayvanlarına ayır.',
    requirements: [
      { label: 'İnşa edilen yapı', target: 3, value: stat('build') },
      { label: 'Tamamlanan üretim tarifi', target: 5, value: stat('craft') },
    ],
    reward: { sprinkler: 1, feed: 20, bar: 3 },
  },
  {
    id: 'ranch',
    name: 'Bereketli çiftlik',
    next: 'Hayvan ürünlerini işle; süt ve meyveden daha değerli pazar ürünleri üret.',
    requirements: [
      { label: 'Büyütülen sürü', target: 3, value: stat('animals') },
      {
        label: 'Toplanan hayvan ürünü',
        target: 10,
        value: stat('animalharvest'),
      },
    ],
    reward: { milk: 8, berry: 20, copperbar: 8 },
  },
  {
    id: 'guild',
    name: 'Üreticiler köyü',
    next: 'Demir ve kristalle ekipmanını güçlendir; madenin en alt katına hazırlan.',
    requirements: [
      { label: 'Makine üretimi', target: 30, value: stat('production') },
      {
        label: 'Tamamlanan emanet sandığı',
        target: 2,
        value: (s) => s.bundles.completed.length,
      },
    ],
    reward: { bar: 12, crystal: 6, soup: 5 },
  },
  {
    id: 'legacy',
    name: 'Yaşayan bir miras',
    next: 'Bu vadi artık senin eserin. Yeni biyomlarda çiftlikler kurmaya devam et.',
    requirements: [
      {
        label: 'Tamamlanan maden keşfi',
        target: 1,
        value: stat('minecomplete'),
      },
      {
        label: 'Yapı ve ekipman yükseltmesi',
        target: 10,
        value: stat('upgrade'),
      },
      {
        label: 'Tamamlanan emanet sandığı',
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
    'Yeni yuva',
    'Kök salan çiftlik',
    'Çalışan atölye',
    'Bereketli çiftlik',
    'Üreticiler köyü',
    'Yaşayan miras',
  ][s.settlement.milestones.length] || 'Yaşayan miras';
