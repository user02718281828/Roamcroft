import * as T from 'three';
import {compactModel} from './batches.ts';
import type {Building} from './model.ts';
import type {ValleyScene} from './scene.ts';

type Motion='saw'|'bellows'|'wheel'|'sway'|'shuttle'|'churn'|'lid'|'bees'|'bucket'|'spray';
type Rig={part:T.Group;motion:Motion;clock:number};
export function addWorkshopArt(b:Building,g:T.Group,mesh:ValleyScene['mesh']) {
  const kinds:Record<string,Motion>={workshop:'saw',furnace:'bellows',feedmill:'wheel',smokehouse:'sway',loom:'shuttle',dairy:'churn',kitchen:'lid',apiary:'bees',well:'bucket',sprinkler:'spray'};
  const motion=kinds[b.type];if(!motion)return;
  const part=new T.Group();part.name=`motion-${motion}`;part.userData.animated=true;
  part.position.set(0,.48,.77);g.add(part);
  const m=(parent:T.Group,shape:string,color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>mesh(parent,shape,color,x,y,z,sx,sy,sz);
  const box=(parent:T.Group,color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>m(parent,'box',color,x,y,z,sx,sy,sz);
  const wood=0xb78c59,metal=0xa9b9b1,cream=0xe3d2a0;
  if(motion==='saw'){
    box(g,wood,0,.32,.77,.82,.09,.32);box(part,metal,0,.06,0,.65,.11,.025);
    for(let i=0;i<7;i++)m(part,'cone',metal,-.27+i*.09,-.015,0,.045,.08,.02).rotation.z=Math.PI;
    m(g,'cylinder',0x916b43,.05,.41,.8,.1,.78,.1).rotation.z=Math.PI/2;
  }else if(motion==='bellows'){
    part.position.x=.56;box(part,0x74513d,0,0,0,.31,.2,.35);
    for(let i=0;i<4;i++)box(part,cream,0,-.07+i*.05,0,.33,.018,.37);
    m(g,'cone',metal,.55,.48,.56,.12,.32,.12).rotation.x=Math.PI/2;
  }else if(motion==='wheel'){
    part.position.set(.5,.8,.69);m(part,'cylinder',wood,0,0,0,.26,.07,.26).rotation.x=Math.PI/2;
    for(let i=0;i<4;i++){const spoke=box(part,cream,0,0,.05,.035,.53,.025);spoke.rotation.z=i*Math.PI/4;}
    box(g,0xc9b58c,-.35,.45,.75,.32,.4,.25);
  }else if(motion==='sway'){
    part.position.y=1;box(g,wood,0,1.07,.77,.83,.06,.06);
    for(const x of [-.24,0,.24]){box(part,cream,x,-.12,0,.016,.25,.016);m(part,'sphere',0xb8a287,x,-.29,0,.07,.17,.05);m(part,'cone',0x8c947d,x,-.45,0,.085,.1,.035);}
  }else if(motion==='shuttle'){
    box(g,wood,0,.56,.8,.85,.07,.3);
    for(let i=0;i<9;i++)box(g,i%2?0xcab49d:0x8eaf9b,-.32+i*.08,.58,.78,.024,.016,.45);
    m(part,'sphere',cream,0,.18,.08,.14,.05,.05);
  }else if(motion==='churn'){
    m(g,'cylinder',cream,0,.4,.8,.22,.48,.22);
    box(part,wood,0,.33,0,.035,.58,.035);box(part,wood,0,.6,0,.22,.045,.045);
  }else if(motion==='lid'){
    m(g,'cylinder',0x82998b,0,.44,.82,.23,.27,.23);
    m(part,'cylinder',metal,0,.13,.05,.24,.035,.24);m(part,'sphere',wood,0,.18,.05,.045,.035,.045);
  }else if(motion==='bees'){
    part.position.set(0,1.12,0);
    for(const x of [-.47,.47]){m(part,'sphere',0xd8ad52,x,0,.25,.06,.045,.09);m(part,'sphere',cream,x,.04,.25,.09,.02,.06);}
  }else if(motion==='bucket'){
    part.position.set(.25,.62,.48);m(part,'cylinder',wood,0,0,0,.15,.2,.15);box(part,metal,0,.22,0,.025,.32,.025);
  }else if(motion==='spray'){
    part.position.set(0,.69,0);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;m(part,'sphere',0x99ced4,Math.cos(a)*.65,-.13,Math.sin(a)*.65,.035,.065,.035);}
  }
  compactModel(part);
  g.userData.workshopRig={part,motion,clock:0} satisfies Rig;
}
export function animateWorkshop(g:T.Group,b:Building,dt:number,detail:boolean){
  const rig=g.userData.workshopRig as Rig|undefined;if(!rig)return;
  const active=b.enabled&&b.hp>0&&(b.processing===true||['well','sprinkler'].includes(b.type));
  rig.part.visible=rig.motion==='bees'||rig.motion==='spray'?detail&&active:true;
  if(!active||!detail)return;
  rig.clock+=Math.min(.1,dt);const t=rig.clock,w=Math.sin(t*5);
  switch(rig.motion){
    case 'saw':rig.part.position.x=w*.15;break;
    case 'bellows':rig.part.scale.y=.75+w*.2;break;
    case 'wheel':rig.part.rotation.z=t*2;break;
    case 'sway':rig.part.rotation.z=Math.sin(t*1.8)*.09;break;
    case 'shuttle':rig.part.position.x=w*.3;break;
    case 'churn':rig.part.position.y=.48+w*.08;break;
    case 'lid':rig.part.position.y=.48+Math.max(0,w)*.035;rig.part.rotation.z=w*.03;break;
    case 'bees':rig.part.rotation.y=t*1.4;rig.part.position.y=1.12+Math.sin(t*3)*.12;break;
    case 'bucket':rig.part.position.y=.62+Math.sin(t*.7)*.13;break;
    case 'spray':rig.part.rotation.y=t*1.3;rig.part.scale.setScalar(.8+Math.sin(t*4)*.18);break;
  }
}
