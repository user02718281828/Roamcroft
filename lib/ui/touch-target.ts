import type {State} from '../game/model.ts';
/** Reachable UI suggestion, never an authority bypass. act rechecks tool/range. */
export function nearbyToolTile(s: State, tool: string) {
  return s.tiles.filter(t => Math.hypot(t.x-s.player.x,t.z-s.player.z)<1.8 && (
    tool==='axe'?t.resource==='tree':tool==='pickaxe'?['stone','iron','copper','crystal'].includes(t.resource||''):tool==='fish'?t.terrain==='water':false
  )).sort((a,b)=>Math.hypot(a.x-s.player.x,a.z-s.player.z)-Math.hypot(b.x-s.player.x,b.z-s.player.z))[0];
}
