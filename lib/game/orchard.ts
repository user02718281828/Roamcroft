import { sourceText } from '../i18n/source.ts';
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
  const label = remaining > 0 ? sourceText("m_8b75c56a10", { p0: remaining })
    : !inSeason ? sourceText("m_509b960bcf", { p0: definition.seasons.map(i => SEASONS[i]).join(' / ') })
    : ready ? sourceText("m_0026de1ca3", { p0: 2 + b.level }) : sourceText("m_32b6c9b868");
  return { age, remaining, inSeason, ready, stage, label, fruit: definition.fruit, yield: 2 + b.level };
}
