import { sourceText } from '../i18n/source.ts';
import type { Tile } from './model.ts';

export const MINE_ENTRANCE = { x: 7, z: 5 };
export const MINE_LIFT = { x: 18, z: 27 };
export const MINE_STAIRS = { x: 18, z: 8 };
export const MINE_FLOORS = 5;
export const FLOOR_NAMES = [
  sourceText("m_1895e00c3f"),
  sourceText("m_1671ac6014"),
  sourceText("m_ec2b12a6ca"),
  sourceText("m_9027d1cf86"),
  sourceText("m_0e7fdc83f5"),
];
export const ENEMIES = {
  wolf: {
    name: sourceText("m_8f6b082242"),
    hp: 42,
    speed: 1.5,
    damage: 8,
    range: 1.6,
    radius: 1.6,
    windup: 0.3,
    interval: 1.4,
    gold: 15,
    xp: 22,
  },
  slime: {
    name: sourceText("m_5d578214dd"),
    hp: 55,
    speed: 0.8,
    damage: 10,
    range: 1.8,
    radius: 1.5,
    windup: 0.55,
    interval: 1.8,
    gold: 12,
    xp: 25,
  },
  shaman: {
    name: sourceText("m_67d5abe9ce"),
    hp: 60,
    speed: 1,
    damage: 16,
    range: 5.5,
    radius: 1.2,
    windup: 1.1,
    interval: 2.6,
    gold: 25,
    xp: 38,
  },
  golem: {
    name: sourceText("m_3c71bc7bc2"),
    hp: 125,
    speed: 0.65,
    damage: 23,
    range: 2.2,
    radius: 2,
    windup: 1,
    interval: 2.4,
    gold: 35,
    xp: 55,
  },
  guardian: {
    name: sourceText("m_b618bf4107"),
    hp: 460,
    speed: 0.85,
    damage: 30,
    range: 4.5,
    radius: 2.3,
    windup: 1.2,
    interval: 2.8,
    gold: 260,
    xp: 300,
  },
} as const;
export type EnemyKind = keyof typeof ENEMIES;

// The central gallery and cross passages are always clear. Side veins cannot seal the route.
export function mineTiles(seed: number, floor: number, size = 36): Tile[] {
  const random = (x: number, z: number) => {
    let n =
      Math.imul(x + seed, 374761393) ^ Math.imul(z + floor * 7919, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  return Array.from({ length: size * size }, (_, i) => {
    const x = i % size,
      z = Math.floor(i / size);
    const passage =
      Math.abs(x - 18) <= 1 ||
      [10, 17, 24, 27].some((v) => Math.abs(z - v) <= 1);
    const wall =
      x < 6 ||
      x > 29 ||
      z < 6 ||
      z > 29 ||
      (!passage && x % 7 === 0 && z % 4 !== 0);
    const n = random(x, z);
    const resource =
      !wall && !passage && n < 0.32
        ? floor >= 4 && n < 0.12
          ? 'crystal'
          : floor >= 2 && n < 0.2
            ? 'iron'
            : n < 0.25
              ? 'copper'
              : 'stone'
        : null;
    return {
      x,
      z,
      terrain: wall ? 'wall' : 'path',
      height: wall ? 1.1 : 0,
      resource,
      source: null,
      amount: resource ? 2 + (floor >= 3 ? 1 : 0) : 0,
      respawn: 0,
      tilled: false,
      water: 0,
      crop: null,
      growth: 0,
      fertilized: false,
      seen: Math.hypot(x - MINE_LIFT.x, z - MINE_LIFT.z) < 7,
    };
  });
}
