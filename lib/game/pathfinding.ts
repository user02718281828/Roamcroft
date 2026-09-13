import {blocksTile} from './collision.ts';
import type {State} from './model.ts';
import {tileIndex,worldOrigin,worldSize} from './world.ts';
type Point={x:number;z:number};
class Heap {
  items:{index:number;cost:number}[]=[];
  push(index:number,cost:number){let i=this.items.length;this.items.push({index,cost});while(i){const p=(i-1)>>1;if(this.items[p].cost<=cost)break;this.items[i]=this.items[p];i=p;}this.items[i]={index,cost};}
  pop(){const root=this.items[0],last=this.items.pop()!;if(this.items.length){let i=0;while(i*2+1<this.items.length){let c=i*2+1;if(c+1<this.items.length && this.items[c+1].cost<this.items[c].cost)c++;if(this.items[c].cost>=last.cost)break;this.items[i]=this.items[c];i=c;}this.items[i]=last;}return root.index;}
}
export function findRoute(s:State,target:Point,origin:Point,adjacent=false,maxNodes=s.tiles.length):Point[]|null {
  const start=tileIndex(s,origin.x,origin.z),size=worldSize(s),offset=worldOrigin(s),count=s.tiles.length;
  if(start<0)return null;
  const blocked=new Uint8Array(count);
  for(let i=0;i<count;i++){const t=s.tiles[i];blocked[i]=+blocksTile(t);}
  for(const b of s.buildings){const i=tileIndex(s,b.x,b.z);if(i>=0)blocked[i]=1;}
  const dist=new Float64Array(count);dist.fill(Infinity);dist[start]=0;
  const parent=new Int32Array(count);parent.fill(-1);
  const closed=new Uint8Array(count),heap=new Heap();heap.push(start,0);
  let found=-1,expanded=0;
  while(heap.items.length && expanded<maxNodes){
    const i=heap.pop();if(closed[i])continue;closed[i]=1;expanded++;
    const x=offset.x+i%size,z=offset.z+Math.floor(i/size),to=Math.hypot(x-target.x,z-target.z);
    if(adjacent?to<=1.5:x===target.x&&z===target.z){found=i;break;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const n=tileIndex(s,x+dx,z+dz);if(n<0 || blocked[n] || closed[n])continue;
      if(dx&&dz&&(blocked[tileIndex(s,x+dx,z)]||blocked[tileIndex(s,x,z+dz)]))continue;
      const next=dist[i]+(dx&&dz?Math.SQRT2:1);if(next>=dist[n])continue;
      dist[n]=next;parent[n]=i;heap.push(n,next+Math.max(0,Math.hypot(x+dx-target.x,z+dz-target.z)-(adjacent?1.5:0)));
    }
  }
  if(found<0)return null;
  const path:Point[]=[];
  while(found!==start){path.push({x:offset.x+found%size,z:offset.z+Math.floor(found/size)});found=parent[found];}
  path.reverse();
  if(!path.length&&adjacent&&Math.hypot(origin.x-target.x,origin.z-target.z)>1.8)path.push({x:s.tiles[start].x,z:s.tiles[start].z});
  return path;
}
