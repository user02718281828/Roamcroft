import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine,createState,tileAt,buildingAt,walkable,type State} from '../lib/game/model.ts';
import {BUILDINGS} from '../lib/game/data.ts';
import {structureFootprint,structureContains,structureEntrance,canPlaceLargeStructure} from '../lib/game/footprint.ts';
import {findRoute} from '../lib/game/pathfinding.ts';
import {serialize,deserialize} from '../lib/game/save.ts';
import {shiftWindow} from '../lib/game/world.ts';
import {sleepBlockReason} from '../lib/game/rest.ts';
import {MINE_ENTRANCE} from '../lib/game/expedition.ts';
import {RoomCore} from '../lib/server/room-core.ts';
import {ensureSharedPlayer,type SharedRecord} from '../lib/server/shared-world.ts';

function clear(s:State,minX=-11,minZ=-11,maxX=2,maxZ=2){
  for(const t of s.tiles)if(t.x>=minX&&t.x<=maxX&&t.z>=minZ&&t.z<=maxZ)
    Object.assign(t,{terrain:'grass',height:0,resource:null,source:null,amount:0,crop:null,growth:0,water:0,tilled:false,fertilized:false});
}
function fixture(){const e=new Engine(createState(42));clear(e.s);e.s.level=3;e.s.inventory={wood:500,stone:500,plank:200};return e;}
const pose={type:'farmhouse',x:-8,z:-8,rotation:0};

test('5x4 footprint has twenty distinct cells and a matching exterior door in all four rotations',()=>{
  const doors=[{x:-6,z:-4},{x:-9,z:-6},{x:-6,z:-9},{x:-4,z:-6}];
  for(let rotation=0;rotation<4;rotation++){
    const b={...pose,rotation},area=structureFootprint(b);
    assert.equal(new Set(area.cells.map(p=>`${p.x},${p.z}`)).size,20);
    assert.deepEqual(area.entrance,doors[rotation]);assert.deepEqual(structureEntrance(b),area.entrance);
    assert.equal(structureContains(b,area.entrance.x,area.entrance.z),false);
    const xs=area.cells.map(p=>p.x),zs=area.cells.map(p=>p.z);
    assert.equal(Math.min(...xs),b.x);assert.equal(Math.min(...zs),b.z);
    assert.equal(Math.max(...xs)-b.x+1,rotation%2?4:5);
    assert.equal(Math.max(...zs)-b.z+1,rotation%2?5:4);
    for(const p of area.cells)assert.equal(structureContains(b,p.x,p.z),true);
    assert.equal(structureContains(b,b.x-.51,b.z),false);
  }
});

test('real Engine construction charges once and blocks every tile; A* routes to the door without crossing the house',()=>{
  for(let rotation=0;rotation<4;rotation++){
    const e=fixture(),before=structuredClone(e.s.inventory),b={...pose,rotation};
    assert.equal(e.build('farmhouse',b.x,b.z,rotation),true);
    const built=e.s.buildings.at(-1)!;
    for(const [id,n] of Object.entries(BUILDINGS.farmhouse.cost))assert.equal(e.s.inventory[id],before[id]-n);
    for(const p of structureFootprint(b).cells){assert.equal(buildingAt(e.s,p.x,p.z)?.id,built.id);assert.equal(walkable(e.s,p.x,p.z),false);}
    const door=structureEntrance(b);assert.equal(walkable(e.s,door.x,door.z),true);
    const route=findRoute(e.s,door,{x:-10,z:-10});assert.ok(route);
    assert.ok(route.every(p=>!structureContains(b,p.x,p.z)));
    const inventory=structuredClone(e.s.inventory);
    assert.equal(e.build('farmhouse',b.x,b.z,rotation),false);assert.deepEqual(e.s.inventory,inventory);
    assert.equal(e.build('fence',door.x,door.z,0),false);assert.deepEqual(e.s.inventory,inventory);
  }
});

test('every occupied cell, door, terrain height and actor participates in placement validation before spending',()=>{
  for(const p of structureFootprint(pose).cells){
    const e=fixture(),t=tileAt(e.s,p.x,p.z)!;t.resource='stone';t.source='stone';t.amount=3;
    const before=structuredClone(e.s);
    assert.equal(e.build('farmhouse',pose.x,pose.z,0),false);assert.deepEqual(e.s,before);
  }
  for(const terrain of ['water','wall','path'] as const){
    const e=fixture();tileAt(e.s,-4,-5)!.terrain=terrain;
    assert.equal(e.build('farmhouse',pose.x,pose.z,0),false);
  }
  const e=fixture();tileAt(e.s,-4,-5)!.height=.5;assert.equal(e.build('farmhouse',-8,-8,0),false);
  const door=structureEntrance(pose),blocked=fixture();tileAt(blocked.s,door.x,door.z)!.terrain='water';
  assert.equal(blocked.build('farmhouse',-8,-8,0),false);
  const actor=fixture();actor.sharedAnchors=[{x:-4,z:-5}];assert.equal(actor.build('farmhouse',-8,-8,0),false);
  actor.sharedAnchors=[];actor.s.player.x=-4;actor.s.player.z=-5;assert.equal(actor.build('farmhouse',-8,-8,0),false);
  assert.equal(canPlaceLargeStructure(fixture().s,{...pose,rotation:NaN}),false);
  assert.equal(e.build('farmhouse',-.5,-8,0),false);
  assert.equal(e.build('farmhouse',1e9,1e9,0),false);
});

test('rotating a real house validates the new cells and entrance; blocked rotations leave it unchanged',()=>{
  const e=fixture();assert.equal(e.build('farmhouse',-8,-8,0),true);const b=e.s.buildings.at(-1)!;
  assert.equal(e.build('fence',-8,-4,0),true); // Only the rotated 4x5 footprint covers this cell.
  const revision=e.structureRevision;
  assert.equal(e.rotateBuilding(b.id),false);assert.equal(b.rotation,0);
  assert.equal(e.structureRevision,revision);
  e.demolish(e.s.buildings.at(-1)!.id);
  for(let i=1;i<=4;i++){assert.equal(e.rotateBuilding(b.id),true);assert.equal(b.rotation,i%4);}
  e.sharedAnchors=[{x:-8,z:-4}];assert.equal(e.rotateBuilding(b.id),false);assert.equal(b.rotation,0);
  assert.equal(Object.hasOwn(e.s,'structureRevision'),false);
});

test('new house survives save, distant streaming and return; old buildings retain one-cell footprints',()=>{
  const e=fixture();e.s.upgrades.axe=3;
  assert.equal(e.build('farmhouse',-8,-8,1),true);
  const originalHome=e.s.buildings.find(b=>b.type==='home')!;
  assert.equal(structureFootprint(originalHome).cells.length,1);
  const saved=deserialize(serialize(e.s));assert.equal(saved.upgrades.axe,3);assert.equal(saved.version,1);
  shiftWindow(saved,90,90);
  const spot=saved.tiles.find(t=>walkable(saved,t.x,t.z))!;Object.assign(saved.player,{x:spot.x,z:spot.z});
  const distant=deserialize(serialize(saved));shiftWindow(distant,-6,-6);
  assert.equal(buildingAt(distant,-5,-4)?.type,'farmhouse');assert.equal(walkable(distant,-5,-4),false);
  const malformed=structuredClone(e.s);
  malformed.buildings.push({...originalHome,id:malformed.nextId++,type:'fence',x:-5,z:-4,hp:100});
  assert.throws(()=>deserialize(serialize(malformed)));
  const doorBlocked=structuredClone(e.s),door=structureEntrance(e.s.buildings.at(-1)!);
  doorBlocked.buildings.push({...originalHome,id:doorBlocked.nextId++,type:'fence',...door,hp:100});
  assert.throws(()=>deserialize(serialize(doorBlocked)));
  const unevenDoor=structuredClone(e.s);tileAt(unevenDoor,door.x,door.z)!.height=.5;
  assert.throws(()=>deserialize(serialize(unevenDoor)));
  const legacy=createState(42);assert.deepEqual(deserialize(serialize(legacy)),legacy);
});

test('a mine save preserves the new surface footprint and restores it without rebuilding the farm',()=>{
  const e=fixture();assert.equal(e.build('farmhouse',-8,-8,2),true);
  const id=e.s.buildings.at(-1)!.id;
  Object.assign(e.s.player,{x:MINE_ENTRANCE.x,z:MINE_ENTRANCE.z+1});
  assert.equal(e.enterMine(),true);
  const restored=new Engine(deserialize(serialize(e.s)));
  assert.ok(restored.s.mine?.surface.buildings.some(b=>b.id===id&&b.type==='farmhouse'));
  assert.equal(restored.leaveMine(),true);
  assert.equal(buildingAt(restored.s,-4,-5)?.id,id);
});

test('sleep uses the new door and preserves legacy home range, time and danger rules',()=>{
  const e=fixture();assert.equal(e.build('farmhouse',-8,-8,0),true);
  e.s.time=.75;Object.assign(e.s.player,structureEntrance(e.s.buildings.at(-1)!));
  assert.equal(sleepBlockReason(e.s),undefined);assert.equal(e.sleep(),true);assert.equal(e.s.day,2);
  e.s.time=.75;e.s.player.x=-10;e.s.player.z=-10;assert.ok(sleepBlockReason(e.s));
});

test('shared authority blocks construction over a remote player and replay never doubles cost',async()=>{
  const e=fixture();Object.assign(e.s.player,{x:-9,z:-8});
  const record:SharedRecord={world:{state:e.s},players:{},room:'large',history:[]};
  for(const id of ['host','guest','third','fourth']){const p=ensureSharedPlayer(record,id,'host',id,1000);p.present=true;p.seen=1000;p.paused=true;}
  Object.assign(record.players.host.player,{x:-9,z:-8});Object.assign(record.players.guest.player,{x:-4,z:-5});
  Object.assign(record.players.third.player,{x:-10,z:-7});Object.assign(record.players.fourth.player,{x:-10,z:-8});
  record.players.host.inventory={wood:500,stone:500,plank:200};
  const room=new RoomCore(record,'host',0);for(const id of Object.keys(record.players))room.connect(id,id,1000);
  async function command(seq:number){
    const p=room.record.players.host,request={op:'pulse',revision:room.revision,pulse:{seq,paused:true,pose:{...p.player},commands:[{seq,method:'build',args:['farmhouse',-8,-8,0,false]}]}};
    const nonce=p.nonce,response=await room.pulse('host','host',request,nonce,1200+seq);
    assert.equal(response.status,200);return {request,nonce};
  }
  await command(1);assert.equal(room.record.world.state.buildings.some(b=>b.type==='farmhouse'),false);
  assert.equal(room.record.players.host.inventory.wood,500);
  Object.assign(room.record.players.guest.player,{x:-10,z:-5});
  const accepted=await command(2);assert.equal(room.record.world.state.buildings.filter(b=>b.type==='farmhouse').length,1);
  assert.equal(room.record.players.host.inventory.wood,380);
  assert.equal((await room.pulse('host','host',accepted.request,accepted.nonce,1300)).status,200);
  assert.equal(room.record.players.host.inventory.wood,380);
});
