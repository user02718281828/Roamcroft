import { BUILDINGS, SEASONS } from './data.ts';
import type { Building, State } from './model.ts';

export function orchardStatus(b: Building, s: Pick<State, 'day'>) {
  const definition = BUILDINGS[b.type]?.orchard;
  if (!definition) return null;
  const age = Math.max(0, s.day - (b.plantedDay ?? s.day));
  const remaining = Math.max(0, definition.matureDays - age);
  const inSeason = definition.seasons.includes(Math.floor((s.day - 1) / 7) % 4);
  const ready = remaining === 0 && inSeason && b.harvestDay !== s.day;
  const stage = remaining > 0 ? Math.min(2, Math.floor(age * 3 / definition.matureDays)) : 3;
  const label = remaining > 0 ? `${remaining} gün sonra yetişkin ağaç`
    : !inSeason ? `${definition.seasons.map(i => SEASONS[i]).join(' / ')} mevsiminde meyve verir`
    : ready ? `${2 + b.level} meyve toplanabilir` : 'Bugünün hasadı toplandı · yarın yeniden';
  return { age, remaining, inSeason, ready, stage, label, fruit: definition.fruit, yield: 2 + b.level };
}
