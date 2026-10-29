import { pathToFileURL } from 'node:url';
import { Engine, createState, buildingAt, type State } from '../lib/game/model.ts';
import { BUILDINGS, RECIPES, QUESTS, type Bag } from '../lib/game/data.ts';
import { bagValue } from '../lib/game/economy.ts';

// Experiment-only. This module is not imported by the game or server.
export const PROPOSAL = {id: 'sparse-proposal-v1', gold: 60, inventory: {wood: 8, stone: 6, fiber: 4, wheatseed: 6, carrotseed: 4, berry: 4, bread: 2}} as const;
export function scenarioState(seed: number, profile: 'current' | 'proposal') {
  const state = createState(seed);
  if (profile === 'proposal') {state.gold = PROPOSAL.gold; state.inventory = {...PROPOSAL.inventory};}
  return state;
}
function affordable(bag: Bag, cost: Bag) {return Object.entries(cost).every(([id, count]) => (bag[id] || 0) >= count);}
export function startingOptions(state: State) {
  return {gold: state.gold, units: Object.values(state.inventory).reduce((sum, n) => sum + n, 0), itemValue: bagValue(state.inventory),
    recipes: Object.keys(RECIPES).filter(id => {const r = RECIPES[id]; return r.level <= state.level && (!r.station || state.buildings.some(b => b.type === r.station)) && affordable(state.inventory, r.input);}),
    buildings: Object.keys(BUILDINGS).filter(id => {const d = BUILDINGS[id]; return d.level <= state.level && !(d.unique && state.buildings.some(b => b.type === id)) && affordable(state.inventory, d.cost);})};
}

export function simulateFirstLoop(seed: number, profile: 'current' | 'proposal') {
  const engine = new Engine(scenarioState(seed, profile)), state = engine.s;
  const start = startingOptions(state);
  let seconds = 0, hits = 0;
  const marks: Record<string, number> = {};
  function until(done: () => boolean, budget = 30) {
    const end = seconds + budget;
    while (!done() && seconds < end) {engine.tick(.1); seconds += .1;}
    if (!done()) throw Error(`Scenario stalled at ${seconds.toFixed(1)} seconds (${profile})`);
  }
  function act(x: number, z: number, tool: string, done: () => boolean) {
    until(() => engine.actionCooldown <= 0);
    engine.go(x, z, tool, 'wheat'); until(done);
  }
  function claimReady() {for (const q of QUESTS) if (!state.claimed.includes(q.id) && (state.stats[q.stat] || 0) >= q.target) engine.claim(q.id);}
  function gather(resource: 'tree' | 'stone') {
    const tile = state.tiles.filter(t => t.resource === resource && engine.findPath(t.x, t.z, true))
      .sort((a,b) => Math.hypot(a.x-state.player.x,a.z-state.player.z)-Math.hypot(b.x-state.player.x,b.z-state.player.z))[0];
    if (!tile) throw Error('No reachable scenario resource');
    const before = tile.amount;
    act(tile.x, tile.z, resource === 'tree' ? 'axe' : 'pickaxe', () => tile.amount < before); hits++;
  }
  while ((state.stats.wood || 0) < 12) gather('tree');
  claimReady(); marks.gather = seconds;
  for (let n=0;n<4;n++) {
    const tile = state.tiles.filter(t => t.terrain === 'grass' && !t.tilled && !t.resource && !t.crop && !buildingAt(state,t.x,t.z) && Math.hypot(t.x-state.player.x,t.z-state.player.z)<8 && engine.findPath(t.x,t.z,true))
      .sort((a,b) => Math.hypot(a.x-state.player.x,a.z-state.player.z)-Math.hypot(b.x-state.player.x,b.z-state.player.z))[0];
    if (!tile) throw Error('No free scenario soil');
    act(tile.x,tile.z,'hoe',()=>tile.tilled);
  }
  claimReady(); marks.till = seconds;
  for (const tile of state.tiles.filter(t=>t.tilled&&!t.crop&&!buildingAt(state,t.x,t.z)).slice(0,6)) {
    act(tile.x,tile.z,'seed',()=>tile.crop==='wheat');
    act(tile.x,tile.z,'water',()=>tile.water>90);
  }
  claimReady(); marks.plant = seconds;
  const ripe = state.tiles.find(t=>t.crop==='wheat'&&t.growth>=65)!;
  act(ripe.x,ripe.z,'hand',()=>!!state.stats.harvest); marks.harvest = seconds;
  if (!engine.craft('plank')) throw Error('Craft scenario rejected');
  until(()=>!!state.stats.craft); marks.craft = seconds;
  const market=state.buildings.find(b=>b.type==='market')!;
  engine.go(market.x,market.z); until(()=>!engine.path.length&&!engine.pending);
  if (!engine.trade('plank',1,false)) throw Error('Sale scenario rejected'); marks.sell = seconds;
  while ((state.inventory.wood || 0)<25) gather('tree');
  while ((state.inventory.stone || 0)<10) gather('stone');
  const site=state.tiles.find(t=>t.terrain==='grass'&&!t.resource&&!t.crop&&!buildingAt(state,t.x,t.z)&&Math.hypot(t.x-state.player.x,t.z-state.player.z)>1&&Math.hypot(t.x-15,t.z-17)<4);
  if (!site || !engine.build('workshop',site.x,site.z)) throw Error('Build scenario rejected'); marks.build = seconds;
  return {profile, seed, start, marks: Object.fromEntries(Object.entries(marks).map(([id,t])=>[id,Number(t.toFixed(1))])), seconds: Number(seconds.toFixed(1)), hits, gold: state.gold, energy: Number(state.player.energy.toFixed(2)), claims: [...state.claimed], state};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = [42,84621,20261029].flatMap(seed => (['current','proposal'] as const).map(profile => {
    const {state,...report}=simulateFirstLoop(seed,profile); return report;
  }));
  console.log(JSON.stringify({note:'Deterministic scripted routes, not human times or retention. Proposal is not applied to the game.',proposal:PROPOSAL,results},null,2));
}
