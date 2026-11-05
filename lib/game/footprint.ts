import {BUILDINGS} from './data.ts';
import {NPCS, LANDMARKS} from './content.ts';
import {tileIndex} from './world.ts';
import {blocksTile} from './collision.ts';
import type {Building, State} from './model.ts';

export type StructurePose = Pick<Building,'type'|'x'|'z'|'rotation'>;
type Point = {x:number;z:number};
export const largeStructure = (b:Pick<Building,'type'>) => !!BUILDINGS[b.type]?.footprint;

/** Allocation-free hot-path lookup. Legacy structures keep their original one tile. */
export function structureContains(b:StructurePose,x:number,z:number) {
  const size=BUILDINGS[b.type]?.footprint;
  if(!size)return b.x===Math.round(x)&&b.z===Math.round(z);
  const odd=(b.rotation||0)%2, width=size[odd?1:0],depth=size[odd?0:1];
  const ix=Math.round(x)-b.x,iz=Math.round(z)-b.z;
  return ix>=0&&iz>=0&&ix<width&&iz<depth;
}

/** Prototype contract: anchor is the minimum occupied cell; rotation 1 faces west. */
export function structureFootprint(b:StructurePose) {
  const [width,depth]=BUILDINGS[b.type]?.footprint||[1,1],r=b.rotation||0;
  const minX=r===1?-(depth-1):r===2?-(width-1):0;
  const minZ=r===2?-(depth-1):r===3?-(width-1):0;
  const rotate=(x:number,z:number):Point=>{
    const [rx,rz]=r===0?[x,z]:r===1?[-z,x]:r===2?[-x,-z]:[z,-x];
    return {x:b.x+rx-minX,z:b.z+rz-minZ};
  };
  return {cells:Array.from({length:width*depth},(_,i)=>rotate(i%width,Math.floor(i/width))),
    entrance:rotate(Math.floor(width/2),depth),
    center:{x:b.x+((r%2?depth:width)-1)/2,z:b.z+((r%2?width:depth)-1)/2}};
}

export function structureEntrance(b:StructurePose):Point {
  const [w,d]=BUILDINGS[b.type]?.footprint||[1,1],r=b.rotation||0,x=Math.floor(w/2);
  if(r===1)return {x:b.x-1,z:b.z+x};
  if(r===2)return {x:b.x+w-1-x,z:b.z-1};
  if(r===3)return {x:b.x+d,z:b.z+w-1-x};
  return {x:b.x+x,z:b.z+d};
}

export function reservedEntrance(s:Pick<State,'buildings'>,x:number,z:number,ignoreId?:number) {
  return s.buildings.some(b=>{
    if(b.id===ignoreId||!largeStructure(b))return false;
    const door=structureEntrance(b);
    return door.x===Math.round(x)&&door.z===Math.round(z);
  });
}

export function canPlaceLargeStructure(s:State,b:StructurePose,ignoreId?:number,extraOccupants:readonly Point[]=[]) {
  if(!largeStructure(b)||![b.x,b.z,b.rotation??0].every(Number.isSafeInteger)||
    (b.rotation??0)<0||(b.rotation??0)>3)return false;
  const {cells,entrance}=structureFootprint(b),base=s.tiles[tileIndex(s,b.x,b.z)];
  if(!base)return false;
  const others=s.buildings.filter(v=>v.id!==ignoreId);
  for(const p of cells){
    if(Math.abs(p.x)>1e9||Math.abs(p.z)>1e9)return false;
    const t=s.tiles[tileIndex(s,p.x,p.z)];
    if(!t||t.terrain!=='grass'||t.resource||t.crop||Math.abs(t.height-base.height)>.01||
      others.some(v=>structureContains(v,p.x,p.z))||reservedEntrance(s,p.x,p.z,ignoreId)||
      NPCS.some(n=>n.x===p.x&&n.z===p.z)||LANDMARKS.some(n=>Math.hypot(n.x-p.x,n.z-p.z)<1.5))return false;
  }
  const door=s.tiles[tileIndex(s,entrance.x,entrance.z)];
  if(Math.abs(entrance.x)>1e9||Math.abs(entrance.z)>1e9||!door||blocksTile(door)||
    Math.abs(door.height-base.height)>.01||others.some(v=>structureContains(v,entrance.x,entrance.z)))return false;
  return ![s.player,...s.animals,...s.enemies,...extraOccupants].some(p=>structureContains(b,p.x,p.z));
}
