import { QUESTS } from './data.ts';
import type { State } from './model.ts';

// A shared recommendation, not a new unlock gate: existing saves may complete
// any quest in any order. Ready rewards always take precedence over new work.
export function visibleQuests(includeNative=true) {
  return includeNative?QUESTS:QUESTS.filter(q=>q.id!=='firstcraft'&&q.id!=='firstsale');
}
export function recommendedQuest(s: Pick<State, 'claimed' | 'stats'>,includeNative=true) {
  const remaining = visibleQuests(includeNative).filter(q => !s.claimed.includes(q.id));
  return remaining.find(q => (s.stats[q.stat] || 0) >= q.target)
    || remaining.find(q => q.id !== 'fruit' || (s.stats.orchard || 0) > 0)
    || remaining[0];
}
