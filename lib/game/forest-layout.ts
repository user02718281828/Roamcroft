import type {State,Tile} from './model.ts';
import {tileAt} from './model.ts';
import {tileKey,chunkKey} from './world.ts';

/** Presentation only: never generates terrain, resources, rewards or saved actors. */
export function forestSample(x:number,z:number,seed:number){
  let h=Math.imul(x,374761393)^Math.imul(z,668265263)^seed;
  h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;
}
export function forestTreeStyle(seed:number,x:number,z:number,season:number){
  const n=forestSample(x,z,seed+391),v=forestSample(x,z,seed+977);
  const kind=n<.38?'pine':n<.8?'oak':'birch';
  const palette=kind==='pine'?[0x366b57,0x508261,0x719666]:season===2?
    [0xb77a41,0xd6a455,0xe7bf73]:season===3?[0x839f92,0xa8b8a0,0xc4cdb5]:
    kind==='birch'?[0x719a65,0x98b77c,0xb9c98b]:[0x4f8057,0x77a35e,0x9ab574];
  return {kind,palette,height:2.2+v*.8,lean:(n-.5)*.14,variant:Math.floor(v*3)} as const;
}
export function forestReserved(s:State){
  const keys=new Set<string>();
  for(const b of s.buildings)for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)keys.add(tileKey(b.x+dx,b.z+dz));
  return keys;
}
export function forestWalkable(s:State,x:number,z:number,reserved:Set<string>){
  const t=tileAt(s,x,z);
  return !!t&&t.terrain==='grass'&&!t.resource&&!t.crop&&!t.tilled&&t.source!=='tree'&&!reserved.has(tileKey(t.x,t.z));
}
const neighbours=[[-1,0],[1,0],[0,-1],[0,1],[-2,0],[2,0],[0,-2],[0,2]];
export function nearForest(s:State,t:Tile){return neighbours.some(([dx,dz])=>tileAt(s,t.x+dx,t.z+dz)?.resource==='tree');}
export type ForestDecoration='fern'|'flowers'|'mushrooms'|'shrub'|'log'|'grass';
export function forestDecoration(s:State,t:Tile,reserved:Set<string>):ForestDecoration|null{
  if(s.mine||!forestWalkable(s,t.x,t.z,reserved)||!nearForest(s,t))return null;
  // Small woodland patches separated by readable ground, not a uniform carpet.
  if(forestSample(Math.floor(t.x/3),Math.floor(t.z/3),s.seed+617)>.55)return null;
  const n=forestSample(t.x,t.z,s.seed+857);if(n>.36)return null;
  return (['fern','flowers','mushrooms','shrub','log','grass'] as const)[Math.min(5,Math.floor(n/.06))];
}
export type ForestSpot={id:string;kind:'rabbit'|'bird';x:number;z:number;phase:number};
export function forestSpots(s:State,reserved=forestReserved(s)){
  if(s.mine)return [];
  const local:Tile[]=[];
  for(let z=Math.floor(s.player.z)-15;z<=Math.ceil(s.player.z)+15;z++)for(let x=Math.floor(s.player.x)-15;x<=Math.ceil(s.player.x)+15;x++){
    const t=tileAt(s,x,z);if(t&&(x-s.player.x)**2+(z-s.player.z)**2<256)local.push(t);
  }
  const candidates=local.filter(t=>forestWalkable(s,t.x,t.z,reserved)&&nearForest(s,t))
    .map(t=>({t,score:forestSample(t.x,t.z,s.seed+197)})).sort((a,b)=>a.score-b.score);
  const spots:ForestSpot[]=[],chunks=new Map<string,number>();
  for(const {t,score}of candidates){
    const chunk=chunkKey(t.x,t.z);if((chunks.get(chunk)||0)>=2)continue;
    const kind=forestSample(t.x,t.z,s.seed+293)<.5?'rabbit':'bird';
    if(spots.filter(p=>p.kind===kind).length>=4)continue;
    // Stable species per world cell, at most four of each and eight in total.
    spots.push({id:tileKey(t.x,t.z),kind,x:t.x,z:t.z,phase:score*Math.PI*2});
    chunks.set(chunk,(chunks.get(chunk)||0)+1);if(spots.length===8)break;
  }
  return spots;
}
export type ForestActor=ForestSpot&{homeX:number;homeZ:number;facing:number;alert:number;lift:number;moving:boolean};
export function forestActor(spot:ForestSpot):ForestActor{return {...spot,homeX:spot.x,homeZ:spot.z,facing:spot.phase,alert:0,lift:0,moving:false};}
export function stepForestActor(a:ForestActor,s:State,reserved:Set<string>,dt:number,time:number,players:readonly{x:number;z:number}[]){
  const step=Math.max(0,Math.min(.08,dt));
  const nearest=players.reduce<{x:number;z:number;d:number}|null>((best,p)=>{const d=Math.hypot(a.x-p.x,a.z-p.z);return !best||d<best.d?{...p,d}:best;},null);
  const scared=!!nearest&&nearest.d<3;
  a.alert=scared?1:Math.max(0,a.alert-step*.8);
  a.lift+=((a.kind==='bird'?a.alert*1.45:0)-a.lift)*(1-Math.exp(-step*5));
  const tx=scared?a.x+(nearest!.d<.01?Math.sin(a.phase):a.x-nearest!.x):a.homeX+Math.sin(time*.38+a.phase)*.72;
  const tz=scared?a.z+(nearest!.d<.01?Math.cos(a.phase):a.z-nearest!.z):a.homeZ+Math.cos(time*.31+a.phase)*.72;
  const dx=tx-a.x,dz=tz-a.z,d=Math.hypot(dx,dz),speed=scared?1.8:a.kind==='bird'?.28:.38;
  const distance=Math.min(d,speed*step),x=a.x+dx/(d||1)*distance,z=a.z+dz/(d||1)*distance;
  a.moving=false;
  // Local motion respects current tiles, new buildings and a small home radius.
  if(d>.05&&Math.hypot(x-a.homeX,z-a.homeZ)<=4.2&&forestWalkable(s,x,z,reserved)){
    a.x=x;a.z=z;a.facing=Math.atan2(dx,dz);a.moving=true;
  }
}
