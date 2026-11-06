import type {Bag} from './data.ts';
import type {State} from './model.ts';

export const ROOM_SIZE=8;
export const ROOM_DOOR={x:4,z:7};
export const ROOM_SPAWN={x:4,z:6};
export const FURNITURE={
  bed:{width:2,depth:3,cost:{wood:16,fiber:8} as Bag},
  table:{width:2,depth:2,cost:{wood:8,plank:2} as Bag},
  chair:{width:1,depth:1,cost:{wood:4} as Bag},
  chest:{width:2,depth:1,cost:{wood:12,stone:4} as Bag},
  plant:{width:1,depth:1,cost:{wood:2,berry:1} as Bag},
  lamp:{width:1,depth:1,cost:{wood:4,copperbar:1} as Bag},
  rug:{width:2,depth:3,cost:{fiber:6} as Bag},
} as const;
export type FurnitureType=keyof typeof FURNITURE;
export type Furnishing={id:number;type:FurnitureType;x:number;z:number;rotation:number;paid:boolean};
export type HomeRoom={version:1;nextId:number;items:Furnishing[];floor:'oak'|'stone'|'dark';wall:'cream'|'sage'|'clay'};
export type HomeDecor=Record<string,HomeRoom>;
export type InteriorSession={homeId:number;player:{x:number;z:number;facing:number};path:{x:number;z:number}[];pending?:number;storageOpen:boolean};
export function defaultRoom():HomeRoom {
  return {version:1,nextId:4,floor:'oak',wall:'cream',items:[
    {id:1,type:'bed',x:1,z:1,rotation:0,paid:false},
    {id:2,type:'table',x:4,z:2,rotation:0,paid:false},
    {id:3,type:'chair',x:4,z:4,rotation:0,paid:false},
  ]};
}
export function furnitureCells(f:Pick<Furnishing,'type'|'x'|'z'|'rotation'>){
  const d=FURNITURE[f.type],w=f.rotation%2?d.depth:d.width,h=f.rotation%2?d.width:d.depth;
  return Array.from({length:w*h},(_,i)=>({x:f.x+i%w,z:f.z+Math.floor(i/w)}));
}
export function furnitureAt(room:HomeRoom,x:number,z:number,includeRugs=false){
  return room.items.find(f=>(includeRugs||f.type!=='rug')&&furnitureCells(f).some(p=>p.x===Math.round(x)&&p.z===Math.round(z)));
}
export function roomWalkable(room:HomeRoom,x:number,z:number){
  const ix=Math.round(x),iz=Math.round(z);
  return ((ix>=1&&ix<7&&iz>=1&&iz<7)||(ix===ROOM_DOOR.x&&iz===ROOM_DOOR.z))&&!furnitureAt(room,ix,iz);
}
export function roomPath(room:HomeRoom,from:{x:number;z:number},to:{x:number;z:number},adjacent=false){
  const start={x:Math.round(from.x),z:Math.round(from.z)},queue=[start],parents=new Map<string,{x:number;z:number}|null>([[`${start.x},${start.z}`,null]]);
  let found:typeof start|undefined;
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    if(adjacent?Math.hypot(p.x-to.x,p.z-to.z)<=1.1:p.x===to.x&&p.z===to.z){found=p;break;}
    for(const [dx,dz] of [[0,1],[1,0],[0,-1],[-1,0]]){
      const q={x:p.x+dx,z:p.z+dz},key=`${q.x},${q.z}`;
      if(!parents.has(key)&&roomWalkable(room,q.x,q.z)){parents.set(key,p);queue.push(q);}
    }
  }
  if(!found)return null;
  const path:typeof queue=[];let current:typeof start|null=found;
  while(current&&parents.get(`${current.x},${current.z}`)){path.unshift(current);current=parents.get(`${current.x},${current.z}`)!;}
  return path;
}
export function validRoom(value:unknown):value is HomeRoom {
  if(!value||typeof value!=='object')return false;
  const r=value as HomeRoom;
  if(r.version!==1||!Number.isSafeInteger(r.nextId)||r.nextId<1||r.nextId>1e9||
    !['oak','stone','dark'].includes(r.floor)||!['cream','sage','clay'].includes(r.wall)||!Array.isArray(r.items)||r.items.length>64)return false;
  const ids=new Set<number>(),solid=new Set<string>(),rugs=new Set<string>();
  for(const f of r.items){
    if(!f||!Object.hasOwn(FURNITURE,f.type)||!Number.isSafeInteger(f.id)||f.id<1||f.id>=r.nextId||ids.has(f.id)||
      !Number.isSafeInteger(f.x)||!Number.isSafeInteger(f.z)||!Number.isInteger(f.rotation)||f.rotation<0||f.rotation>3||typeof f.paid!=='boolean')return false;
    ids.add(f.id);
    for(const p of furnitureCells(f)){
      if(p.x<1||p.x>6||p.z<1||p.z>6)return false;
      const bucket=f.type==='rug'?rugs:solid,key=`${p.x},${p.z}`;
      if(bucket.has(key))return false;bucket.add(key);
    }
  }
  return roomWalkable(r,ROOM_SPAWN.x,ROOM_SPAWN.z)&&!!roomPath(r,ROOM_SPAWN,ROOM_DOOR);
}
export function validHomeDecor(s:State){
  if(s.homeDecor===undefined)return true;
  if(!s.homeDecor||typeof s.homeDecor!=='object'||Array.isArray(s.homeDecor)||Object.keys(s.homeDecor).length>128)return false;
  const homes=s.mine?s.mine.surface.buildings:s.buildings;
  return Object.entries(s.homeDecor).every(([id,room])=>/^[1-9]\d*$/.test(id)&&homes.some(b=>b.id===Number(id)&&['home','farmhouse'].includes(b.type))&&validRoom(room));
}
export function interiorChests(s:State){
  if(!s.homeDecor)return 0;
  const homes=s.mine?s.mine.surface.buildings:s.buildings;
  return Object.entries(s.homeDecor||{}).reduce((n,[id,r])=>n+(homes.some(b=>b.id===Number(id))?r.items.filter(f=>f.type==='chest').length:0),0);
}
