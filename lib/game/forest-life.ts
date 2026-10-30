import * as T from 'three';
import type {State} from './model.ts';
import {tileAt} from './model.ts';
import {AnimalBatches} from './actor-batches.ts';
import {compactModel,releaseModel} from './batches.ts';
import type {ForestArtist} from './forest-art.ts';
import {forestSpots,forestActor,forestWalkable,stepForestActor,type ForestActor} from './forest-layout.ts';

function model(a:ForestArtist,kind:ForestActor['kind']){
  const g=new T.Group(),rabbit=kind==='rabbit';
  const fur=rabbit?0xb69a77:0x678e91,cream=rabbit?0xe7d5b3:0xe2c78f;
  a.mesh(g,'sphere',fur,0,rabbit?.27:.24,0,rabbit?.2:.13,rabbit?.18:.13,rabbit?.3:.19);
  a.mesh(g,'sphere',cream,0,.23,.13,.13,.1,.16);
  a.mesh(g,'sphere',fur,0,.4,.2,rabbit?.14:.105,.13,.13);
  if(rabbit){
    a.mesh(g,'sphere',0xf0e5cb,0,.27,-.28,.09,.09,.09);
    for(const side of [-1,1]){
      a.mesh(g,'sphere',fur,side*.16,.16,-.13,.095,.1,.14);
      a.mesh(g,'sphere',0x79674f,side*.09,.1,.21,.045,.045,.1);
    }
    a.mesh(g,'sphere',0xd49b8f,0,.38,.33,.035,.025,.02);
  }else{
    a.mesh(g,'cone',0xdca856,0,.39,.34,.045,.12,.045).rotation.x=Math.PI/2;
    a.mesh(g,'sphere',0x4c6e75,0,.24,-.2,.075,.05,.15).rotation.x=-.4;
    for(const side of [-1,1])a.mesh(g,'cylinder',0x8b6c46,side*.05,.1,.02,.012,.13,.012);
  }
  for(const side of [-1,1])a.mesh(g,'sphere',0x393a31,side*(rabbit?.09:.075),.44,.285,.024,.027,.018);
  for(const side of [-1,1]){
    const part=new T.Group();part.name=side<0?'left':'right';part.userData.animated=true;
    part.position.set(side*(rabbit?.065:.12),rabbit?.49:.29,rabbit?.19:0);g.add(part);
    if(rabbit){
      a.mesh(part,'sphere',fur,0,.14,-.015,.05,.19,.045).rotation.x=-.14;
      a.mesh(part,'sphere',0xc99787,0,.16,.025,.024,.12,.012).rotation.x=-.14;
    }else a.mesh(part,'sphere',0x4e707a,side*.07,0,-.025,.13,.035,.18);
    compactModel(part);
  }
  compactModel(g);return g;
}
/** Bounded, visual-only actors: no engine commands, hits, rewards or State writes. */
export class ForestLife{
  private actors=new Map<string,{actor:ForestActor;group:T.Group}>();
  private batches:AnimalBatches;
  private clock=2;
  private tiles?:State['tiles'];
  private cellX=Infinity;
  private cellZ=Infinity;
  private visible:{type:string;group:T.Group}[]=[];
  private artist:ForestArtist;
  constructor(artist:ForestArtist,root:T.Group){this.artist=artist;this.batches=new AnimalBatches(root);}
  get count(){return this.actors.size;}
  update(s:State,reserved:Set<string>,dt:number,time:number,view:T.Frustum,players:readonly{x:number;z:number}[]){
    this.clock+=dt;
    const cellX=Math.floor(s.player.x/4),cellZ=Math.floor(s.player.z/4);
    if(this.clock>=2||this.tiles!==s.tiles||cellX!==this.cellX||cellZ!==this.cellZ){
      this.tiles=s.tiles;this.cellX=cellX;this.cellZ=cellZ;
      this.clock=0;const spots=forestSpots(s,reserved),ids=new Set(spots.map(p=>p.id));
      for(const [id,entry]of this.actors)if(!ids.has(id)){releaseModel(entry.group);this.actors.delete(id);}
      for(const spot of spots)if(!this.actors.has(spot.id))this.actors.set(spot.id,{actor:forestActor(spot),group:model(this.artist,spot.kind)});
    }
    this.visible.length=0;
    for(const {actor:a,group:g}of this.actors.values()){
      // Hide immediately when construction/crops/mine/streaming invalidate a spot.
      if(s.mine||!forestWalkable(s,a.x,a.z,reserved)){g.visible=false;continue;}
      stepForestActor(a,s,reserved,dt,time,players);g.visible=true;
      const rabbit=a.kind==='rabbit',hop=a.moving?Math.abs(Math.sin(time*(a.alert>0?15:9)+a.phase))*.11:0;
      g.position.set(a.x,(tileAt(s,a.x,a.z)?.height||0)+.04+(rabbit?hop:a.lift+Math.sin(time*3+a.phase)*.025),a.z);
      g.rotation.y=a.facing;g.rotation.x=rabbit&&a.moving?Math.sin(time*9+a.phase)*.06:0;
      for(const [side,name]of [[-1,'left'],[1,'right']] as const){
        const part=g.getObjectByName(name)!;
        part.rotation.z=rabbit?side*(.13+Math.sin(time*1.7+a.phase)*.12):side*(a.alert>0?.2+Math.sin(time*18+a.phase)*.9:.12);
      }
      this.visible.push({type:'forest-'+a.kind,group:g});
    }
    this.batches.update(this.visible,view);
  }
  dispose(){this.batches.dispose();for(const e of this.actors.values())releaseModel(e.group);this.actors.clear();}
}
