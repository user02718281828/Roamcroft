import { CROPS } from './data.ts';
import { DAY_SECONDS, season, skillLevel, type State } from './model.ts';

export function cropGrowthRate(s: State, fertilized = false, greenhouse = false) {
  return 1 + (fertilized ? .3 : 0) + (greenhouse ? .25 : 0) + .02 * (skillLevel(s, 'farming') - 1) + .05 * (s.talents.harvest || 0);
}
export function cropPlan(s: State, id: string) {
  const c = CROPS[id], current = season(s);
  const seconds = Math.ceil(c.grow / cropGrowthRate(s));
  const seasonRemaining = (7 - (s.day - 1) % 7 - s.time) * DAY_SECONDS;
  const growsNow = c.seasons.includes(current);
  return { seconds, seasonRemaining, growsNow,
    willPause: growsNow && seconds > seasonRemaining && !c.seasons.includes((current + 1) % 4),
    regrowSeconds: c.regrow ? Math.ceil(c.regrow / cropGrowthRate(s)) : null };
}
