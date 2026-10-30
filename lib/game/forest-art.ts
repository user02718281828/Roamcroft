import * as T from 'three';
import {compactModel,releaseModel} from './batches.ts';
import {forestSample,forestTreeStyle,type ForestDecoration} from './forest-layout.ts';
export type ForestArtist={mesh(p:T.Object3D,k:string,c:number,x:number,y:number,z:number,sx?:number,sy?:number,sz?:number):T.Mesh};

/** Three reusable colored silhouettes per season, rather than 12–18 instances
 * for every tree. Source groups keep their tile identity for interaction. */
export class ForestTrees{
  private models=new Map<string,{group:T.Group;mesh:T.Mesh;height:number}>();
  constructor(privateArtist:ForestArtist){this.artist=privateArtist;}
  private artist:ForestArtist;
  add(parent:T.Group,seed:number,x:number,z:number,season:number){
    const style=forestTreeStyle(seed,x,z,season),key=`${style.kind}:${season}`;
    let model=this.models.get(key);
    if(!model){
      const group=new T.Group();forestTree(this.artist,group,seed,x,z,season);compactModel(group);
      model={group,mesh:group.children[0] as T.Mesh,height:style.height};this.models.set(key,model);
    }
    const mesh=new T.Mesh(model.mesh.geometry,model.mesh.material);
    mesh.scale.y=style.height/model.height;
    mesh.rotation.set(0,style.variant*2.094+style.lean,style.lean*.25);
    mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  }
  dispose(){for(const {group}of this.models.values())releaseModel(group);this.models.clear();}
}

export function forestTree(a:ForestArtist,g:T.Group,seed:number,x:number,z:number,season:number){
  const style=forestTreeStyle(seed,x,z,season),{kind,height:h,palette:c,lean}=style;
  const bark=kind==='birch'?0xd3cdb4:kind==='pine'?0x70513d:0x806044;
  a.mesh(g,'cylinder',bark,lean*.3,h*.27,0,.12,h*.54,.105).rotation.z=-lean;
  for(let i=0;i<3;i++){
    const angle=i*2.094+style.variant;
    a.mesh(g,'box',bark,Math.sin(angle)*.12,.13,Math.cos(angle)*.12,.09,.12,.3).rotation.y=angle;
  }
  if(kind==='pine'){
    // Staggered boughs and layered, offset crowns instead of three identical cones.
    for(let i=0;i<4;i++){
      const angle=i*2.4+lean,r=.67-i*.115,y=h*(.34+i*.17);
      a.mesh(g,'cone',c[i%3],Math.sin(angle)*.06,y,Math.cos(angle)*.06,r,h*.46,r*.88).rotation.y=angle;
      if(i<2)for(const side of [-1,1])a.mesh(g,'canopy',c[(i+1)%3],side*r*.59,y-.14,Math.sin(angle)*.17,r*.49,.13,r*.31).rotation.z=side*.18;
    }
  }else{
    for(let i=0;i<3;i++){
      const angle=i*2.4+.5,branch=a.mesh(g,'twig',bark,Math.sin(angle)*.17,h*.46,Math.cos(angle)*.17,.045,h*.38,.045);
      branch.rotation.set(Math.cos(angle)*.6,0,-Math.sin(angle)*.6);
    }
    for(let i=0;i<6;i++){
      const angle=i*2.4+lean,r=i===5?.12:.34,y=h*(.56+(i%3)*.13),scale=kind==='birch'?.47:.57;
      const crown=a.mesh(g,'canopy',c[i%3],Math.sin(angle)*r,y,Math.cos(angle)*r,scale,scale*(kind==='birch'?1.1:.78),scale*.9);
      crown.rotation.set(i*.19,angle,i*.11);
    }
    if(kind==='birch')for(let i=0;i<4;i++)a.mesh(g,'box',0x6b6c61,.01,h*(.16+i*.08),.105,.17,.026,.018);
  }
}
export function forestPlant(a:ForestArtist,g:T.Group,kind:ForestDecoration,seed:number,x:number,z:number,season:number){
  const n=forestSample(x,z,seed+52),green=season===3?0x9bafa0:season===2?0xa48e54:0x658552;
  if(kind==='fern'||kind==='grass'){
    for(let i=0;i<(kind==='fern'?5:3);i++){
      const angle=i*2.4+n*6,r=kind==='fern'?.12:.06;
      const leaf=a.mesh(g,'canopy',i%2?green:0x8ca363,Math.sin(angle)*r,.23+i*.013,Math.cos(angle)*r,.04,kind==='fern'?.18:.14,.045);
      leaf.rotation.set(Math.cos(angle)*.65,angle,-Math.sin(angle)*.65);
    }
  }else if(kind==='flowers'){
    for(let i=0;i<3;i++){
      const px=Math.sin(i*2.4+n)*.22,pz=Math.cos(i*2.4+n)*.2;
      a.mesh(g,'twig',green,px,.23,pz,.012,.24,.012);
      for(let j=0;j<3;j++)a.mesh(g,'canopy',season===2?0xe9b870:n>.25?0xe2cfaa:0xc895b3,px+Math.sin(j*2.1)*.055,.36,pz+Math.cos(j*2.1)*.055,.065,.025,.065);
      a.mesh(g,'canopy',0xd2a45c,px,.38,pz,.034,.025,.034);
    }
  }else if(kind==='mushrooms'){
    for(let i=0;i<3;i++){
      const px=(i-1)*.13,pz=Math.sin(i*2.4+n)*.12;
      a.mesh(g,'twig',0xdbcca7,px,.19,pz,.025,.15,.025);
      a.mesh(g,'canopy',i%2?0xc08753:0xa86049,px,.27,pz,.1,.055,.095);
      a.mesh(g,'canopy',0xead6b4,px+.03,.32,pz,.023,.008,.022);
    }
  }else if(kind==='shrub'){
    for(let i=0;i<3;i++)a.mesh(g,'canopy',i%2?green:0x7c995e,(i-1)*.14,.25+(i%2)*.08,Math.sin(i*2.4)*.1,.22,.2,.19);
  }else{
    a.mesh(g,'cylinder',0x856348,0,.2,0,.11,.55,.11).rotation.z=Math.PI/2;
    a.mesh(g,'cylinder',0xc3a375,.28,.2,0,.085,.012,.085).rotation.z=Math.PI/2;
    a.mesh(g,'canopy',green,-.1,.29,.03,.16,.03,.09);
  }
}
