import {BUILDINGS,ITEMS,RECIPES,TALENTS,ANIMALS} from '../game/data.ts';
import type {State} from '../game/model.ts';
export type Pose=Pick<State['player'],'x'|'z'|'facing'>;
export type Peer={id:string;name:string;player:State['player'];message?:string;messageId?:number};
export type Command={seq:number;method:string;args:unknown[]};
export type RoomSession={room:string;member:string;token:string;role:'host'|'guest';revision:number};
export type RoomInfo={id:string;name:string;updated:number;online:boolean};
const num=(v:unknown,min=-1e9,max=1e9)=>typeof v==='number' && Number.isFinite(v) && v>=min && v<=max;
const id=(v:unknown)=>num(v,1,1e9) && Number.isInteger(v);
const key=(data:object,v:unknown)=>typeof v==='string' && Object.hasOwn(data,v);
export function validPose(v:unknown): v is Pose {
  if(!v || typeof v!=='object') return false;
  const p=v as Pose; return num(p.x) && num(p.z) && num(p.facing,-100,100);
}
export function validCommand(v:unknown): v is Command {
  if(!v || typeof v!=='object') return false;
  const c=v as Command;
  if(!id(c.seq) || !Array.isArray(c.args)) return false;
  const a=c.args;
  switch(c.method) {
    case 'act': return a.length===4 && num(a[0]) && num(a[1]) && ['hand','axe','pickaxe','hoe','water','seed','fertilize','fish','sword'].includes(String(a[2])) && typeof a[3]==='string' && a[3].length<=32;
    case 'build': return a.length===5 && key(BUILDINGS,a[0]) && num(a[1]) && num(a[2]) && num(a[3],0,3) && Number.isInteger(a[3]) && typeof a[4]==='boolean';
    case 'trade':return a.length===3 && key(ITEMS,a[0]) && id(a[1]) && (a[1] as number)<=9999 && typeof a[2]==='boolean';
    case 'craft':return a.length===1 && key(RECIPES,a[0]);
    case 'eat':return a.length===1 && key(ITEMS,a[0]);
    case 'buyAnimal':return a.length===1 && key(ANIMALS,a[0]);
    case 'unlockTalent':return a.length===1 && key(TALENTS,a[0]);
    case 'rotateBuilding':case 'reshapeBuilding':case 'toggleBuilding':case 'upgrade':case 'repair':case 'demolish':case 'petAnimal':case 'feedAnimal':case 'harvestAnimal':case 'breedAnimal':return a.length===1 && id(a[0]);
    case 'renameAnimal':return a.length===2 && id(a[0]) && typeof a[1]==='string' && a[1].length<=24;
    case 'talk':case 'gift':case 'completeContract':return a.length===1 && ['narin','lale','torin'].includes(String(a[0]));
    case 'claim':case 'claimMilestone':case 'claimAchievement': return a.length===1 && typeof a[0]==='string' && a[0].length<=40;
    case 'donate': return a.length===3 && typeof a[0]==='string' && a[0].length<=32 && key(ITEMS,a[1]) && id(a[2]);
    case 'attack':case 'collectDelivery':return a.length===0;
    default:return false;
  }
}
