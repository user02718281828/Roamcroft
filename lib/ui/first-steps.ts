import { QUESTS } from '../game/data.ts';
import { skillLevel, type State } from '../game/model.ts';

const steps = [
  {id: 'gather', stat: 'wood', target: 12, title: 'steps.gather.title', help: 'steps.gather.help', tool: 'axe'},
  {id: 'till', stat: 'till', target: 4, title: 'steps.till.title', help: 'steps.till.help', tool: 'hoe'},
  {id: 'plant', stat: 'plant', target: 6, title: 'steps.plant.title', help: 'steps.plant.help', tool: 'seed'},
  {id: 'harvest', stat: 'harvest', target: 1, title: 'steps.harvest.title', help: 'steps.harvest.help', tool: 'hand'},
  {id: 'craft', stat: 'craft', target: 1, title: 'steps.craft.title', help: 'steps.craft.help', panel: 'craft'},
  {id: 'sell', stat: 'sell', target: 1, title: 'steps.sell.title', help: 'steps.sell.help', panel: 'market'},
  {id: 'build', stat: 'build', target: 1, title: 'steps.build.title', help: 'steps.build.help', panel: 'build'},
] as const;
export type FirstStepId = (typeof steps)[number]['id'];

/** Read existing progress only; this guide grants nothing and unlocks nothing. */
export function firstSteps(s: Pick<State, 'stats' | 'claimed'>) {
  return steps.map(step => {
    const target = ['gather', 'till', 'plant'].includes(step.id)
      ? QUESTS.find(quest => quest.id === step.id)!.target : step.target;
    const value = s.claimed.includes(step.id) ? target : Math.max(0, Math.min(target, s.stats[step.stat] || 0));
    return {...step, target, value, done: value >= target};
  });
}

/** Descriptive values for the current rules, never an authorization or reward preview. */
export function toolNotes(s: State) {
  const cost = (base: number) => base * (1 - .08 * (s.talents.vigor || 0));
  return [
    {id: 'axe', help: 'tools.axe.help', energy: cost(3), power: 1 + (s.upgrades.axe || 0)},
    {id: 'pickaxe', help: 'tools.pickaxe.help', energy: cost(3), power: 1 + (s.upgrades.pickaxe || 0)},
    {id: 'hoe', help: 'tools.hoe.help', energy: cost(2)},
    {id: 'water', help: 'tools.water.help', energy: cost(1)},
    {id: 'sword', help: 'tools.sword.help', energy: 0, damage: 16 + (s.upgrades.sword || 0) * 10 + skillLevel(s, 'combat') * 2},
    {id: 'fish', help: 'tools.fish.help', energy: cost(3)},
  ] as const;
}
