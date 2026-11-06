import * as T from 'three';
import type {Engine} from './model.ts';
import type {ValleyScene} from './scene.ts';
import {FURNITURE,ROOM_SIZE,ROOM_DOOR} from './interiors.ts';
import {compactModel,releaseModel} from './batches.ts';

export class InteriorScene {
  renderer:T.WebGLRenderer;
  scene=new T.Scene();camera=new T.OrthographicCamera(-8,8,8,-8,.1,80);
  decor=new T.Group();player=new T.Group();geometry=new T.BoxGeometry(1,1,1);
  materials=new Map<number,T.MeshStandardMaterial>();revision=-1;
  ray=new T.Raycaster();plane=new T.Plane(new T.Vector3(0,1,0),0);hit=new T.Vector3();
  previous=new T.Vector2();time=0;
  pointers=new Map<number,{x:number;y:number;blocked:boolean}>();
  constructor(readonly engine:Engine,readonly artist:ValleyScene,readonly canvas:HTMLCanvasElement,readonly pick:(x:number,z:number)=>void) {
    this.renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:false});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,artist.highQuality?1.35:1));
    this.renderer.setClearColor(0x1d3530);this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.scene.add(new T.HemisphereLight(0xffebc7,0x536759,2.6));
    const sun=new T.DirectionalLight(0xffdeb3,2);sun.position.set(3,10,5);this.scene.add(sun);
    this.scene.add(this.decor,this.player);artist.makeCharacter(this.player);
    this.camera.position.set(12,13,12);this.camera.lookAt(3.5,0,3.5);
    canvas.addEventListener('pointerdown',this.onDown);canvas.addEventListener('pointerup',this.onPick);canvas.addEventListener('pointercancel',this.onCancel);window.addEventListener('blur',this.clearPointers);this.sync();
  }
  box(parent:T.Object3D,color:number,x:number,y:number,z:number,w:number,h:number,d:number) {
    if(!this.materials.has(color))this.materials.set(color,new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));
    const mesh=new T.Mesh(this.geometry,this.materials.get(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
  }
  sync() {
    const room=this.engine.roomData();if(!room)return;
    releaseModel(this.decor);this.decor.clear();
    const floor={oak:0xb28d61,stone:0x9b9e8c,dark:0x78634e}[room.floor];
    const wall={cream:0xd9c8a3,sage:0xa2b39a,clay:0xc68d77}[room.wall];
    for(let z=0;z<ROOM_SIZE;z++)for(let x=0;x<ROOM_SIZE;x++)
      this.box(this.decor,floor+(x+z)%2*0x040403,x,-.12,z,.98,.2,.98);
    this.box(this.decor,wall,3.5,.95,-.42,8,2,.16);
    this.box(this.decor,wall,-.42,.95,3.5,.16,2,8);
    this.box(this.decor,0x71543d,3.5,.15,-.31,8,.3,.12);
    this.box(this.decor,0x71543d,-.31,.15,3.5,.12,.3,8);
    this.box(this.decor,wall,7.42,.12,3.5,.16,.3,8);
    for(let x=0;x<8;x++)if(x!==ROOM_DOOR.x)this.box(this.decor,wall,x,.12,7.42,1,.3,.16);
    this.box(this.decor,0x967958,ROOM_DOOR.x,-.005,ROOM_DOOR.z,1,.04,1);
    // Windows and a visible threshold keep the cutaway room oriented.
    for(const x of [1.5,5.5]){
      this.box(this.decor,0x71543d,x,1.15,-.29,1.5,1.1,.15);
      this.box(this.decor,0x8db9ba,x,1.15,-.18,1.3,.92,.05);
      this.box(this.decor,0xf1deb7,x,1.15,-.13,.06,.94,.05);
    }
    for(const item of room.items){
      const d=FURNITURE[item.type],w=item.rotation%2?d.depth:d.width,h=item.rotation%2?d.width:d.depth;
      const g=new T.Group();g.position.set(item.x+(w-1)/2,0,item.z+(h-1)/2);g.rotation.y=-item.rotation*Math.PI/2;this.decor.add(g);
      const box=(c:number,x:number,y:number,z:number,a:number,b:number,cross:number)=>this.box(g,c,x,y,z,a,b,cross);
      if(item.type==='bed'){
        box(0x78533b,0,.27,0,1.75,.5,2.75);box(0xeadcc0,0,.6,0,1.65,.22,2.6);
        box(0x789c89,0,.75,.4,1.66,.1,1.8);box(0xf8eccf,0,.77,-.83,1.3,.22,.6);
        box(0x78533b,0,.78,-1.37,1.9,1.5,.14);
      }else if(item.type==='table'){
        box(0xa4774d,0,.88,0,1.75,.17,1.75);
        for(const x of [-.62,.62])for(const z of [-.62,.62])box(0x71513a,x,.4,z,.13,.8,.13);
      }else if(item.type==='chair'){
        box(0xa4774d,0,.49,0,.8,.14,.8);box(0x866044,0,.9,-.35,.8,.9,.12);
        for(const x of [-.29,.29])for(const z of [-.29,.29])box(0x71513a,x,.22,z,.1,.45,.1);
      }else if(item.type==='chest'){
        box(0x9e744b,0,.4,0,1.8,.8,.8);box(0xbaa16a,0,.83,0,1.86,.13,.86);box(0x6d6653,0,.48,.43,.17,.23,.06);
      }else if(item.type==='plant'){
        box(0xb97d5c,0,.25,0,.6,.5,.6);box(0x6e946c,0,.78,0,.8,.8,.7);box(0x85a77d,.1,1.1,0,.45,.5,.5);
      }else if(item.type==='lamp'){
        box(0x75583d,0,.03,0,.6,.06,.6);box(0x9d8556,0,.6,0,.1,1.2,.1);box(0xe5c184,0,1.28,0,.7,.38,.7);
      }else box(0xb77361,0,.005,0,1.85,.03,2.85);
    }
    compactModel(this.decor);this.revision=this.engine.homeRevision;
  }
  clearPointers=()=>{this.pointers.clear();};
  onDown=(event:PointerEvent)=>{if(event.button!==0)return;this.pointers.delete(event.pointerId);const blocked=this.pointers.size>0;for(const p of this.pointers.values())p.blocked=true;this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,blocked});this.canvas.setPointerCapture(event.pointerId);};
  onCancel=(event:PointerEvent)=>{this.pointers.delete(event.pointerId);};
  onPick=(event:PointerEvent)=>{
    const start=this.pointers.get(event.pointerId);this.pointers.delete(event.pointerId);
    if(!start||start.blocked||Math.hypot(event.clientX-start.x,event.clientY-start.y)>8||event.button!==0)return;
    const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2),this.camera);
    let nearest=Infinity,target:{x:number;z:number}|undefined;
    for(const f of this.engine.roomData()?.items||[]){
      if(f.type==='rug')continue;
      const d=FURNITURE[f.type],w=f.rotation%2?d.depth:d.width,h=f.rotation%2?d.width:d.depth;
      const box=new T.Box3(new T.Vector3(f.x-.45,0,f.z-.45),new T.Vector3(f.x+w-.55,f.type==='chest'?1:1.5,f.z+h-.55));
      if(this.ray.ray.intersectBox(box,this.hit)){const distance=this.ray.ray.origin.distanceToSquared(this.hit);if(distance<nearest){nearest=distance;target={x:f.x,z:f.z};}}
    }
    if(target)this.pick(target.x,target.z);
    else if(this.ray.ray.intersectPlane(this.plane,this.hit))this.pick(Math.round(this.hit.x),Math.round(this.hit.z));
  };
  draw(dt:number) {
    const session=this.engine.interior;if(!session)return;
    const r=this.canvas.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
    if(this.canvas.width!==Math.round(w*this.renderer.getPixelRatio())||this.canvas.height!==Math.round(h*this.renderer.getPixelRatio())){
      this.renderer.setSize(w,h,false);const span=Math.max(11,11/(w/h));
      this.camera.left=-span*w/h/2;this.camera.right=span*w/h/2;this.camera.top=span/2;this.camera.bottom=-span/2;this.camera.updateProjectionMatrix();
    }
    if(this.revision!==this.engine.homeRevision)this.sync();
    const p=session.player,moving=Math.hypot(p.x-this.previous.x,p.z-this.previous.y)>.001;this.time+=dt;
    this.player.position.set(p.x,0,p.z);this.player.rotation.y=p.facing;
    this.artist.animateHuman(this.player,moving?'walking':'idle',this.time,dt);this.previous.set(p.x,p.z);
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.canvas.removeEventListener('pointerdown',this.onDown);this.canvas.removeEventListener('pointerup',this.onPick);this.canvas.removeEventListener('pointercancel',this.onCancel);window.removeEventListener('blur',this.clearPointers);this.pointers.clear();releaseModel(this.decor);this.geometry.dispose();for(const m of this.materials.values())m.dispose();this.renderer.dispose();const renderer=this.renderer,canvas=this.canvas;queueMicrotask(()=>{if(!canvas.isConnected)renderer.forceContextLoss();});}
}
