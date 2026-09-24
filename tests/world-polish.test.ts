import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Engine,createState,tileAt,type Building} from '../lib/game/model.ts';
import {natureAnchors,naturePosition,weatherDrop} from '../lib/game/ambience.ts';
import {serialize,deserialize} from '../lib/game/save.ts';
import {shiftWindow} from '../lib/game/world.ts';
import {ValleyScene} from '../lib/game/scene.ts';
import {addWorkshopArt,animateWorkshop} from '../lib/game/workshop-art.ts';
import {compactModel,releaseModel} from '../lib/game/batches.ts';

void test('nature stays in world space during movement and cell changes',()=>{
  const first=natureAnchors(7.9,10,8),next=natureAnchors(8.1,10,8);
  assert.deepEqual(natureAnchors(1,10,8),first);
  let overlap=0;for(const a of first){const b=next.find(b=>b.x===a.x&&b.z===a.z);if(b){overlap++;assert.deepEqual(naturePosition(a,40),naturePosition(b,40));}}
  assert.equal(overlap,20);assert.equal(first.length,25);
  assert.deepEqual(weatherDrop(-4,3,8,30,false),weatherDrop(-4,3,8,30,false));
  for(const snow of [true,false])for(const time of [0,1,500]){const drop=weatherDrop(-4,3,8,time,snow);assert.ok(drop.y>=0&&drop.y<=12);assert.ok(drop.x>-13&&drop.x<-9);}
});
void test('old raised farmland becomes flat without losing crops or streamed edits',()=>{
  const e=new Engine(createState(123)),t=tileAt(e.s,5,5)!;
  Object.assign(t,{terrain:'grass',resource:null,source:null,height:.5,tilled:true,crop:'wheat',growth:21,water:55});
  const loaded=new Engine(deserialize(serialize(e.s)));
  assert.equal(tileAt(loaded.s,5,5)!.height,0);assert.equal(tileAt(loaded.s,5,5)!.growth,21);
  shiftWindow(loaded.s,200,200,true);shiftWindow(loaded.s,15,19,true);
  const restored=tileAt(loaded.s,5,5)!;assert.equal(restored.height,0);assert.equal(restored.crop,'wheat');
  assert.ok(createState().tiles.filter(t=>t.terrain!=='water').every(t=>t.height===0));
});
void test('ten workshop rigs survive batching, stop with production and respect detail budget',()=>{
  const view=Object.create(ValleyScene.prototype) as ValleyScene;view.materials=new Map();view.geometries=new Map();view.textures={};
  const motions=new Set<string>();
  for(const type of ['workshop','furnace','feedmill','smokehouse','loom','dairy','kitchen','apiary','well','sprinkler']){
    const b:Building={id:1,type,x:0,z:0,level:1,hp:100,timer:0,enabled:true,processing:true},g=new T.Group();
    addWorkshopArt(b,g,view.mesh.bind(view));compactModel(g);const rig=g.userData.workshopRig;assert.ok(rig.part.parent===g);motions.add(rig.motion);
    animateWorkshop(g,b,.1,true);assert.equal(rig.clock,.1);
    b.enabled=false;animateWorkshop(g,b,.1,true);assert.equal(rig.clock,.1);
    b.enabled=true;animateWorkshop(g,b,.1,false);assert.equal(rig.clock,.1);
    let draws=0;g.traverse(o=>{if(o instanceof T.Mesh)draws++;});assert.ok(draws<=2,`${type}: ${draws} draws`);
    releaseModel(g);
  }
  assert.equal(motions.size,10);
});
