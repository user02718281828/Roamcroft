import * as T from 'three';
import { orchardStatus } from './orchard.ts';
import type { Building, State } from './model.ts';

// Shared primitives keep these details in the existing static/instance batches.
type Artist = {
  box(p:T.Object3D,c:number,x:number,y:number,z:number,sx:number,sy:number,sz:number):T.Mesh;
  mesh(p:T.Object3D,k:string,c:number,x:number,y:number,z:number,sx?:number,sy?:number,sz?:number):T.Mesh;
};
export function meadowColor(x:number,z:number,season:number) {
  const patch=(Math.sin(x*.37+Math.sin(z*.18)*1.4)+Math.cos(z*.31-x*.12)+2)/4;
  const palette=season===3?[0xb9cdc0,0xe1e8d5]:season===2?[0x889c51,0xb5b05c]:season===1?[0x648d43,0x8dad50]:[0x6b984d,0x9ab961];
  return new T.Color(palette[0]).lerp(new T.Color(palette[1]),patch);
}
export function cottage(a:Artist,g:T.Group,level:number) {
  a.box(g,0xdcc49b,0,.86,0,1.2,1.25,1.12);
  a.box(g,0xb99b70,0,.31,0,1.3,.2,1.22);
  for(const x of [-.59,.59])for(const z of [-.55,.55])a.box(g,0x694832,x,.88,z,.085,1.2,.08);
  a.mesh(g,'roof',0x8f4636,0,1.49,0,1.01,1.12,1.02);
  for(const side of [-1,1])for(let row=0;row<5;row++)for(let col=0;col<6;col++){
    const c=[0xb96446,0xbe6949,0xaf5d41][(row+col)%3];
    a.box(g,c,side*(.09+row*.16),2.18-row*.143,(col-2.5)*.247,.245,.05,.24).rotation.z=-side*.73;
  }
  a.box(g,0x794330,0,2.23,0,.115,.1,1.61);
  // A blue bay window and a small front gable give the house its own silhouette.
  a.box(g,0xf0d7a2,-.31,1.05,.59,.47,.65,.14);
  a.box(g,0x4f7f89,-.31,1.09,.672,.34,.42,.025);
  for(const x of [-.49,-.13])a.box(g,0x779280,x,1.09,.7,.11,.48,.045);
  a.box(g,0xf4ddb0,-.31,1.09,.7,.025,.45,.04);
  a.box(g,0xf4ddb0,-.31,1.09,.7,.35,.025,.04);
  a.box(g,0x764a32,.28,.7,.574,.3,.84,.06);
  for(let i=0;i<4;i++)a.box(g,0xa3744c,.17+i*.075,.7,.612,.012,.77,.022);
  a.mesh(g,'sphere',0xe4b559,.37,.7,.64,.035,.035,.025);
  a.box(g,0xc4a071,.26,.25,.82,.65,.11,.5);
  a.box(g,0xd1b085,.26,.17,1.05,.72,.08,.22);
  a.box(g,0xdec6a0,.28,1.35,.8,.64,.05,.52).rotation.x=.14;
  for(const x of [-.06,.59])a.box(g,0x92704c,x,.81,.98,.045,1.08,.045);
  a.box(g,0x90633f,-.31,.77,.72,.53,.15,.22);
  for(let i=0;i<5;i++){
    a.mesh(g,'sphere',0x60874a,-.52+i*.1,.89,.73,.085,.09,.08);
    a.mesh(g,'sphere',i%2?0xe8b76f:0xd87469,-.52+i*.1,.95,.77,.055,.045,.055);
  }
  a.box(g,0xd0ad8b,.39,1.98,-.34,.23,.78,.25);
  for(let i=0;i<5;i++)a.box(g,0x9b7560,.39,1.64+i*.14,-.205,.24,.025,.02);
  a.box(g,0xedd6b4,.39,2.38,-.34,.3,.1,.32);
  a.box(g,0x423b35,.39,2.438,-.34,.18,.008,.19);
  a.mesh(g,'sphere',0xe7c26d,-.55,1.28,.61,.06,.09,.055);
  if(level>1){a.box(g,0xe3cda7,0,1.86,.25,.35,.35,.36);a.mesh(g,'roof',0xa95a41,0,2.07,.25,.3,.45,.3);a.box(g,0x6298a0,0,1.89,.44,.2,.2,.025);}
}
export function fruitTree(a:Artist,g:T.Group,b:Building,s:State) {
  const status=orchardStatus(b,s)!;
  const grown=status.stage===3, scale=[.32,.5,.72,1][status.stage];
  const tree=new T.Group();tree.scale.setScalar(scale);g.add(tree);
  a.mesh(tree,'cylinder',0x8c5e38,0,.68,0,.115,1.1,.115);
  for(const side of [-1,1])a.mesh(tree,'cylinder',0x8c5e38,side*.16,1.03,0,.055,.65,.055).rotation.z=-side*.6;
  const winter=Math.floor((s.day-1)/7)%4===3;
  if(!winter || !grown)for(let i=0;i<5;i++){
    const angle=i*2.4;
    a.mesh(tree,'sphere',[0x5b853d,0x7d9d43,0x9caf58,0x709443,0x839e49][i],Math.sin(angle)*.3,1.25+(i%3)*.19,Math.cos(angle)*.3,.46,.42,.44);
  }
  if(grown&&status.ready)for(let i=0;i<7;i++){
    const angle=i*2.4,x=Math.sin(angle)*.48,z=Math.cos(angle)*.48,y=1.28+(i%3)*.17;
    a.mesh(tree,'sphere',b.type==='appletree'?0xcf6744:0xdfbc56,x,y,z,.105,b.type==='peartree'?.14:.1,.095);
    a.mesh(tree,'cylinder',0x6f5136,x,y+.1,z,.015,.07,.015);
    if(b.type==='peartree')a.mesh(tree,'sphere',0xdfbc56,x,y+.09,z,.057,.1,.05);
  }else if(grown&&!winter&&status.inSeason)for(let i=0;i<5;i++)a.mesh(tree,'sphere',0xf3d4ba,Math.sin(i*2.4)*.49,1.5,Math.cos(i*2.4)*.49,.06,.035,.06);
  a.mesh(g,'cylinder',0x9a7954,0,.13,0,.38,.04,.38);
  if(!grown){a.box(g,0xb69266,.2,.45,0,.04,.75,.04);a.box(g,0xd2b88d,.1,.5,0,.26,.035,.04);}
}
