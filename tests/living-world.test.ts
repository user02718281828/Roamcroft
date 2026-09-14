import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine, createState, tileAt, walkable} from '../lib/game/model.ts';
import {cleanLevels} from '../lib/game/audio.ts';
import {WATER_SURFACE_Y, WORLD_BASE_TOP} from '../lib/game/visuals.ts';
import * as T from 'three';
import {ValleyScene} from '../lib/game/scene.ts';
import {compactModel,releaseModel} from '../lib/game/batches.ts';
import {humanPose} from '../lib/game/living.ts';
import {spatialAmbience} from '../lib/game/ambience.ts';

test('small vegetation is passable but trunks and water block travel',()=>{
 const e=new Engine(createState());e.s.buildings=[];
 for(const tile of e.s.tiles){tile.terrain='grass';tile.resource=null;}
 const tile=tileAt(e.s,10,10)!;
 for(const plant of ['bush','mushroom'] as const){tile.resource=plant;assert.ok(walkable(e.s,10,10));}
 tile.resource='tree';assert.equal(walkable(e.s,10,10),false);assert.ok(walkable(e.s,10.4,10.4));
 tile.terrain='water';assert.equal(walkable(e.s,10.4,10.4),false);
});
test('harvesting emits a material-specific sound only after a successful action',()=>{
 const e=new Engine(createState());e.s.player.x=10;e.s.player.z=10;e.s.buildings=[];
 const tile=tileAt(e.s,10,10)!;tile.terrain='grass';tile.resource='tree';tile.amount=5;
 e.act(10,10,'axe','');assert.ok(e.events.some(event=>event.sound==='axe'));
});
test('water clears the opaque world base and restored volume settings are bounded',()=>{
 assert.ok(WATER_SURFACE_Y>WORLD_BASE_TOP);
 assert.deepEqual(cleanLevels({music:10,ambience:-1,effects:NaN}),{music:1,ambience:0,effects:.65});
});
test('animal rigs keep their heads and species-specific leg counts after batching',()=>{
 const view=Object.create(ValleyScene.prototype) as ValleyScene;Object.assign(view,{materials:new Map(),geometries:new Map(),textures:{}});
 for(const type of ['chicken','cow','sheep']){
  const group=new T.Group();view.animal({type} as any,group);compactModel(group);
  assert.ok(group.getObjectByName('animal-head'));assert.equal(group.children.filter(child=>child.name.startsWith('leg-')).length,type==='chicken'?2:4);
  const bounds=new T.Box3().setFromObject(group);assert.ok(Number.isFinite(bounds.max.y));assert.ok(bounds.max.y>bounds.min.y);releaseModel(group);
 }
 for(const material of view.materials.values())material.dispose();for(const geometry of view.geometries.values())geometry.dispose();
});
test('human actions blend into their poses instead of snapping on the first frame',()=>{
 const view=Object.create(ValleyScene.prototype) as ValleyScene,group=new T.Group(),arm=new T.Object3D();arm.name='rightArm';group.add(arm);
 const target=humanPose('eating',.5).rightArm;view.animateHuman(group,'eating',.5,1/60);assert.ok(arm.rotation.x<0&&arm.rotation.x>target);
 for(let i=0;i<120;i++)view.animateHuman(group,'eating',.5,1/60);assert.ok(Math.abs(arm.rotation.x-target)<.001);
});
test('night insects follow nearby trees while daytime birds are silent at night',()=>{
 const s=createState();s.time=.9;s.weather='clear';const camera={x:10,z:10,angle:0,zoom:17};tileAt(s,10,10)!.resource='tree';
 const mix=spatialAmbience(s,camera);assert.equal(mix.birds.gain,0);assert.ok(mix.insects.gain>0);
 s.weather='rain';assert.equal(spatialAmbience(s,camera).insects.gain,0);
});
