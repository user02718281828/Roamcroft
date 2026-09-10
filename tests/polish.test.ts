import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine,createState,walkable,tileAt} from '../lib/game/model.ts';
import {PointerDrag,FrameBudget} from '../lib/game/interaction.ts';
import {sunlight,humanPose,animalPose,schedule} from '../lib/game/living.ts';
import type {HumanAction,AnimalAction} from '../lib/game/living.ts';
import {serialize,deserialize} from '../lib/game/save.ts';
import {inventoryCapacity} from '../lib/game/progression.ts';
import {NPCS} from '../lib/game/content.ts';

test('pointer cancellation and released buttons cannot drift the camera',()=>{
 const drag=new PointerDrag();assert.equal(drag.move(1,100,100,0),null);
 assert.ok(drag.begin(1,10,10,0));assert.equal(drag.move(1,13,12,1),null);
 assert.equal(drag.begin(2,30,30,0),false);assert.equal(drag.move(2,80,80,1),null);
 assert.deepEqual(drag.move(1,20,10,1),{dx:10,dy:0});assert.equal(drag.end(2),false);
 assert.equal(drag.move(1,30,10,0),null);assert.equal(drag.move(1,90,90,0),null);assert.equal(drag.end(1),false);
 drag.begin(1,0,0,0);assert.equal(drag.end(1),true);drag.begin(1,0,0,0);drag.cancel();assert.equal(drag.end(1),false);
});
test('frame budget sheds expensive detail under sustained load and recovers conservatively',()=>{
 const budget=new FrameBudget();for(let i=0;i<200;i++)budget.sample(40);assert.equal(budget.tier,4);assert.equal(budget.scale,.45);
 const before=budget.average;budget.sample(10000);assert.equal(budget.average,before);
 for(let i=0;i<4000;i++)budget.sample(16);assert.equal(budget.tier,0);assert.equal(budget.scale,1);
});

test('00:43 is moonlit, noon is bright and sun travels east to west',()=>{
 const midnight=sunlight(43/1440),noon=sunlight(.5);
 assert.equal(midnight.daylight,0);assert.ok(midnight.ambient<noon.ambient/5);
 assert.ok(sunlight(8/24).x>0);assert.ok(sunlight(17/24).x<0);assert.equal(sunlight(23/24).night,true);
});
test('animation rigs distinguish player, NPC and animal actions with finite transforms',()=>{
 const humans:HumanAction[]=['idle','walking','running','working','harvesting','eating','fishing','sitting','sleeping','talking','greeting'];
 const animals:AnimalAction[]=['walking','running','grazing','lying','sleeping','happy','fleeing'];
 for(const action of humans)for(const n of Object.values(humanPose(action,.73)))assert.ok(Number.isFinite(n));
 assert.equal(new Set(humans.map(a=>JSON.stringify(humanPose(a,.73)))).size,humans.length);
 assert.equal(new Set(animals.map(a=>JSON.stringify(animalPose(a,.73)))).size,animals.length);
 assert.equal(schedule(0,.02,NPCS[0]).action,'sleeping');assert.equal(schedule(0,.4,NPCS[0]).action,'working');
});
test('A star takes diagonals but cannot cut tree and wall corners',()=>{
 const e=new Engine(createState());for(const t of e.s.tiles){t.terrain='grass';t.resource=null;}e.s.buildings=[];e.s.player.x=0;e.s.player.z=0;
 const direct=e.findPath(5,5)!;assert.equal(direct.length,5);
 tileAt(e.s,1,0)!.resource='tree';tileAt(e.s,0,1)!.terrain='wall';
 const route=e.findPath(5,5)!;assert.ok(route.length>5);assert.notDeepEqual(route[0],{x:1,z:1});
 let previous={x:0,z:0};for(const point of route){assert.ok(walkable(e.s,point.x,point.z));if(point.x!==previous.x&&point.z!==previous.z){assert.ok(walkable(e.s,point.x,previous.z));assert.ok(walkable(e.s,previous.x,point.z));}previous=point;}
});
test('storage transfers are atomic, survive saves and keep overflow resources',()=>{
 const e=new Engine(createState());assert.ok(e.build('chest',14,20));
 const wood=e.s.inventory.wood;assert.ok(e.transferStorage('wood',wood,true));assert.equal(e.s.inventory.wood,0);assert.equal(e.s.storage.wood,wood);
 assert.equal(e.transferStorage('wood',-1,false),false);assert.equal(e.transferStorage('wood',wood+1,false),false);
 e.s.inventory={stone:inventoryCapacity(e.s)};assert.equal(e.transferStorage('wood',1,false),false);
 e.add({wood:1300});assert.equal(e.s.storage.wood,1200);assert.equal(e.s.overflow.wood,wood+100);
 const saved=deserialize(serialize(e.s));assert.equal(saved.storage.wood,1200);assert.equal(saved.overflow.wood,wood+100);
});
test('all placed structures rotate and corner segments retain orientation in saves',()=>{
 const e=new Engine(createState());assert.ok(e.build('fence',14,20,2,true));const b=e.s.buildings.at(-1)!;
 assert.equal(b.rotation,2);assert.equal(b.corner,true);e.rotateBuilding(b.id);assert.equal(b.rotation,3);e.rotateBuilding(b.id);assert.equal(b.rotation,0);
 assert.equal(deserialize(serialize(e.s)).buildings.at(-1)!.corner,true);assert.equal(e.build('fence',13,20,99,false),false);
});
test('villagers move continuously on walkable daily routes and stop to greet',()=>{
 const e=new Engine(createState());e.s.time=13/24;e.updateVillagers(.1);
 const start={...e.npcMotion.get('narin')!};for(let i=0;i<200;i++)e.updateVillagers(.1);
 const end=e.npcMotion.get('narin')!;assert.ok(Math.hypot(end.x-start.x,end.z-start.z)>.5);assert.ok(walkable(e.s,end.x,end.z));
 e.talk('narin');assert.equal(end.action,'greeting');e.updateVillagers(.1);assert.equal(end.action,'greeting');
});
