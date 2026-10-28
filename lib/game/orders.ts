import { sourceText } from '../i18n/source.ts';
import { type Bag } from './data.ts';
import { bagValue } from './economy.ts';
import type { State } from './model.ts';

type OrderDefinition = {id: string; name: string; description: string; input: Bag; level: number; supplies?: Bag; seasons?: number[]};
export type DailyOrder = OrderDefinition & {token: string; day: number; gold: number; xp: number; value: number};
const stock: Record<string, {fresh: OrderDefinition[]; prepared: OrderDefinition[]}> = {
  narin: {
    fresh: [
      {id:'supper',name:sourceText("m_5688cf17f9"),description:sourceText("m_966b2ba482"),input:{carrot:6},level:1,seasons:[0,2]},
      {id:'grain',name:sourceText("m_a0da77559a"),description:sourceText("m_c4ee4be145"),input:{wheat:9},level:1},
    ],
    prepared: [
      {id:'soup',name:sourceText("m_3cfda54396"),description:sourceText("m_dd7016395f"),input:{soup:2},supplies:{fertilizer:2},level:4},
      {id:'jam',name:sourceText("m_6d4449565b"),description:sourceText("m_e85349dad8"),input:{applejam:2},supplies:{fertilizer:3},level:4},
      {id:'cheese',name:sourceText("m_521f819163"),description:sourceText("m_d012435508"),input:{cheese:2},supplies:{feed:4},level:6},
    ],
  },
  torin: {
    fresh: [
      {id:'repair',name:sourceText("m_80289445c8"),description:sourceText("m_13a7a462e8"),input:{stone:8,wood:4},level:1},
      {id:'fiber',name:sourceText("m_1340a7d3cf"),description:sourceText("m_bbc4171f42"),input:{fiber:12,wood:8},level:1},
    ],
    prepared: [
      {id:'planks',name:sourceText("m_bd719214df"),description:sourceText("m_a2b745e3a8"),input:{plank:8},supplies:{rope:2},level:2},
      {id:'bricks',name:sourceText("m_d419475872"),description:sourceText("m_35eaf59324"),input:{brick:6},supplies:{plank:2},level:3},
      {id:'rope',name:sourceText("m_692cd06c16"),description:sourceText("m_e3c3dac276"),input:{rope:8},supplies:{plank:3},level:3},
    ],
  },
  lale: {
    fresh: [
      {id:'catch',name:sourceText("m_15ba1ffcec"),description:sourceText("m_12e68954b8"),input:{fish:3},level:1},
      {id:'rivermeal',name:sourceText("m_9341fe5193"),description:sourceText("m_2037c254b7"),input:{fish:2,berry:4},level:1},
    ],
    prepared: [
      {id:'packedfish',name:sourceText("m_bb8f17f776"),description:sourceText("m_b3bce054e4"),input:{grilledfish:3},supplies:{bandage:1},level:2},
      {id:'bread',name:sourceText("m_ea60537eb9"),description:sourceText("m_85b9e13af5"),input:{bread:3},supplies:{bandage:1},level:2},
    ],
  },
};

// Offers depend only on world seed and game day, never inventory, XP or render timing.
export function dailyOrders(s: Pick<State,'day'|'seed'>, npc: string, day = s.day): DailyOrder[] {
  if (!Object.hasOwn(stock, npc) || !Number.isSafeInteger(day) || day < 1 || day > 1_000_000) return [];
  const season = Math.floor((day - 1) / 7) % 4, entries = stock[npc];
  const offset = (s.seed >>> 0) + day - 1;
  return [entries.fresh.filter(o => !o.seasons || o.seasons.includes(season)), entries.prepared].map(pool => {
    const order = pool[offset % pool.length], value = bagValue(order.input);
    return {...order,token:`${day}:${npc}:${order.id}`,day,value,gold:Math.ceil(value * 1.25) - bagValue(order.supplies || {}),xp:40};
  });
}
export function validOrderToken(npc: string, token: unknown) {
  if (typeof token !== 'string' || token.length > 60 || !Object.hasOwn(stock, npc)) return false;
  const parts = token.split(':');
  return parts.length === 3 && /^[1-9]\d{0,6}$/.test(parts[0]) && Number(parts[0]) <= 1_000_000 && parts[1] === npc
    && [...stock[npc].fresh,...stock[npc].prepared].some(o => o.id === parts[2]);
}
