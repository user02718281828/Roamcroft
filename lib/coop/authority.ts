import {Engine,walkable,tileAt} from '../game/model.ts';
import type {State} from '../game/model.ts';
import {movementSpeed} from '../game/progression.ts';
import {validCommand,validPose} from './protocol.ts';
import type {Peer} from './protocol.ts';
export class CoopAuthority {
  peers=new Map<string,Peer>();
  cooldown=new Map<string,number>();
  resting=new Map<string,boolean>();
  fishing=new Map<string,Engine['fishing']>();
  ack=0;
  update(e:Engine,hostId:string,members:{id:string;name:string;pose:string}[],commands:{id:number;member:string;payload:string}[],dt:number) {
    const active=new Set(members.map(m=>m.id));
    for(const id of this.peers.keys()) if(!active.has(id)) {this.peers.delete(id);this.cooldown.delete(id);this.fishing.delete(id);this.resting.delete(id);}
    for(const m of members) {
      if(m.id===hostId) {this.peers.set(m.id,{id:m.id,name:m.name,player:{...e.s.player}}); continue;}
      let peer=this.peers.get(m.id);
      const spawn=()=>{
        for(let r=1;r<=4;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){
          const point={x:Math.round(e.s.player.x)+dx,z:Math.round(e.s.player.z)+dz};
          if(walkable(e.s,point.x,point.z)&&![...this.peers.values()].some(p=>Math.hypot(p.player.x-point.x,p.player.z-point.z)<.6))return point;
        }
        return e.nearbyFree(e.s.player.x,e.s.player.z)||{...e.s.player};
      };
      if(!peer) {peer={id:m.id,name:m.name,player:{...e.s.player,...spawn()}};this.peers.set(m.id,peer);}
      this.cooldown.set(m.id,Math.max(0,(this.cooldown.get(m.id)||0)-dt));
      if(!walkable(e.s,peer.player.x,peer.player.z) || Math.hypot(peer.player.x-e.s.player.x,peer.player.z-e.s.player.z)>22) Object.assign(peer.player,spawn());
      let desired:unknown;try{desired=JSON.parse(m.pose);}catch{continue;}
      if(!validPose(desired) || Math.hypot(desired.x-e.s.player.x,desired.z-e.s.player.z)>22) continue;
      const dx=desired.x-peer.player.x,dz=desired.z-peer.player.z,distance=Math.hypot(dx,dz);
      const step=Math.min(distance,movementSpeed(peer.player.energy)*(desired.sprinting&&peer.player.energy>20?1.5:1)*Math.min(.75,Math.max(0,dt))+.08);
      for(let moved=0;moved<step;){
        const increment=Math.min(.15,step-moved),x=peer.player.x+dx/(distance||1)*increment,z=peer.player.z+dz/(distance||1)*increment;
        if(!walkable(e.s,x,z)) break;
        peer.player.x=x;peer.player.z=z;moved+=increment;
      }
      if(distance>.1)this.resting.set(m.id,false);
      if(desired.sprinting && distance>.02 && peer.player.energy>20)peer.player.energy=Math.max(0,peer.player.energy-dt*1.8);
      peer.player.hunger=Math.max(0,peer.player.hunger-dt*.06);
      peer.player.energy=Math.min(100,peer.player.energy+(distance<.02?dt*(this.resting.get(m.id)?2:.12):0));
      peer.player.facing=desired.facing;
      if(this.fishing.get(m.id)){
        const originalPlayer=e.s.player,originalFishing=e.fishing;
        e.s.player=peer.player;e.fishing=this.fishing.get(m.id)!;
        if(distance>.1)e.fishing=null;
        e.updateFishing(dt);this.fishing.set(m.id,e.fishing);e.s.player=originalPlayer;e.fishing=originalFishing;
      }
    }
    for(const row of commands) {
      if(row.id<=this.ack) continue;
      this.ack=row.id;
      const peer=this.peers.get(row.member);
      if(!peer || row.member===hostId) continue;
      let command:unknown;try{command=JSON.parse(row.payload);}catch{continue;}
      if(!validCommand(command)) continue;
      if(command.method==='act' && e.isPortal(Number(command.args[0]),Number(command.args[1]))) {
        peer.message='Maden geçişini ev sahibi başlatır.';peer.messageId=row.id;continue;
      }
      const saved={player:e.s.player,path:e.path,pending:e.pending,fishing:e.fishing,cooldown:e.actionCooldown,resting:e.resting,action:e.playerAction};
      e.s.player=peer.player;e.path=[];e.pending=null;e.fishing=this.fishing.get(row.member)||null;e.actionCooldown=this.cooldown.get(row.member)||0;e.networkActor=true;e.resting=this.resting.get(row.member)||false;
      const before=e.events.length;
      try {
        const fn=(e as unknown as Record<string,(...args:unknown[])=>unknown>)[command.method];
        const result=fn.apply(e,command.args);
        peer.message=e.events.slice(before).at(-1)?.text || (result===false ? 'Bu eylem şu anda yapılamıyor.' : 'İşlem ortak dünyaya işlendi.');
        peer.messageId=row.id;
      } finally {
        this.cooldown.set(row.member,e.actionCooldown);
        this.fishing.set(row.member,e.fishing);this.resting.set(row.member,e.resting);
        peer.player=e.s.player;
        e.s.player=saved.player;e.path=saved.path;e.pending=saved.pending;e.fishing=saved.fishing;e.actionCooldown=saved.cooldown;e.resting=saved.resting;e.playerAction=saved.action;e.networkActor=false;
      }
    }
  }
}
export function applySharedState(e:Engine,incoming:State,peer?:Peer) {
  const old=e.s,position={...old.player};
  const sameMap=old.seed===incoming.seed && old.world.x===incoming.world.x && old.world.z===incoming.world.z && old.mine?.floor===incoming.mine?.floor && old.tiles.length===incoming.tiles.length;
  if(sameMap) {
    for(let i=0;i<old.tiles.length;i++) Object.assign(old.tiles[i],incoming.tiles[i]);
    incoming.tiles=old.tiles;
  }
  if(peer) incoming.player={...peer.player};
  if(sameMap && peer && Math.hypot(position.x-peer.player.x,position.z-peer.player.z)<2.5) Object.assign(incoming.player,{x:position.x,z:position.z,facing:position.facing});
  else e.clearMovement();
  e.s=incoming;
  if(!sameMap) e.worldRevision++;
}
