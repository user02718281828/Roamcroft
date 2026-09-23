import { ITEMS, type Bag } from './data.ts';
import type { State } from './model.ts';

const unavailable = new Set(['crystal', 'bar', 'copperbar', 'brick', 'wool', 'cheese', 'jam']);
export function marketSells(id: string) {
  return Object.hasOwn(ITEMS, id) && !unavailable.has(id);
}
export function tradeUnitPrice(s: Pick<State, 'friendship'>, id: string, buy: boolean) {
  return Math.ceil(ITEMS[id].price * (buy ? 1.55 * (1 - .001 * (s.friendship.narin || 0)) : 1));
}
export function bagValue(bag: Bag) {
  return Object.entries(bag).reduce((total, [id, n]) => total + ITEMS[id].price * n, 0);
}
export function processingValue(s: Pick<State, 'friendship'>, recipe: {input: Bag; output: Bag}) {
  const input = bagValue(recipe.input), output = bagValue(recipe.output);
  const purchase = Object.keys(recipe.input).every(marketSells)
    ? Object.entries(recipe.input).reduce((total, [id, n]) => total + tradeUnitPrice(s, id, true) * n, 0)
    : null;
  return {input, output, added: output - input, purchase, purchasedMargin: purchase === null ? null : output - purchase};
}
