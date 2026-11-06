import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine,createState,tileAt} from '../lib/game/model.ts';
import {defaultRoom,validRoom,roomPath,roomWalkable,ROOM_DOOR,ROOM_SPAWN,FURNITURE,validHomeDecor} from '../lib/game/interiors.ts';
import {serialize,deserialize} from '../lib/game/save.ts';
import {deserialize as oldRead,serialize as oldWrite} from './fixtures/save-reader-36b0e16.ts';
import {validServerCommand} from '../lib/server/protocol.ts';
import {MINE_ENTRANCE} from '../lib/game/expedition.ts';
import {gameTools} from '../lib/game/webmcp.ts';
import {RoomCore} from '../lib/server/room-core.ts';
import {ensureSharedPlayer,sharedPacket,type SharedRecord} from '../lib/server/shared-world.ts';

function fixture(){const e=new Engine(createState(42));Object.assign(e.s.player,{x:13,z:16});e.s.inventory={wood:200,stone:100,fiber:40,plank:30,berry:10,copperbar:5};return e;}
function enter(){const e=fixture();assert.equal(e.enterHome(1),true);return e;}
function settle(e:Engine){for(let i=0;i<200&&e.interior?.path.length;i++)e.tick(.1);}
const units=(e:Engine,key:string)=>(e.s.inventory[key]||0)+(e.s.storage[key]||0)+(e.s.overflow[key]||0);

test('read-only game tools distinguish indoor movement from the saved surface checkpoint',()=>{
  const e=enter(),read=gameTools(e,()=>{},()=>false).find(t=>t.name==='read_game_state')!;
  e.goInside(6,5);settle(e);
  const result=read.execute({}) as {interior:{homeId:number;player:{x:number;z:number};pathLength:number};player:{x:number;z:number}};
  assert.equal(result.interior.homeId,1);assert.equal(result.interior.pathLength,0);
  assert.deepEqual([result.interior.player.x,result.interior.player.z],[6,5]);
  assert.deepEqual([result.player.x,result.player.z],[13,16]);
  result.interior.player.x=999;assert.equal(e.interior!.player.x,6);
  e.leaveHome();assert.equal((read.execute({}) as {interior:unknown}).interior,null);
});

test('decorated native farms retain storage, private bags and room data through four-player authority and restart',async()=>{
  const e=enter();assert.equal(e.decorateHome('chest',5,5,0),true);e.leaveHome();
  const decor=structuredClone(e.s.homeDecor),record:SharedRecord={world:{state:e.s},players:{},room:'interior-regression',history:[]};
  for(const id of ['host','guest','third','fourth']){const p=ensureSharedPlayer(record,id,'host',id,1000);p.present=true;p.seen=1000;p.paused=true;}
  const room=new RoomCore(record,'host',0);for(const id of Object.keys(record.players))room.connect(id,id,1000);
  const p=record.players.host;
  const response=await room.pulse('host','host',{op:'pulse',revision:room.revision,pulse:{seq:1,paused:true,pose:{...p.player},commands:[{seq:1,method:'transferStorage',args:['wood',2,true]}]}},p.nonce,1200);
  assert.equal(response.status,200);assert.equal(room.engine.s.storage.wood,2);
  for(const id of Object.keys(record.players)){
    const packet=sharedPacket(room.record,'host',id,room.revision,undefined,1200);
    assert.ok('state' in packet);assert.deepEqual(packet.state.homeDecor,decor);
    if(id!=='host')assert.notDeepEqual(packet.bag.inventory,record.players.host.inventory);
  }
  const restored=new RoomCore(JSON.parse(JSON.stringify(room.record)),'host',room.revision);
  assert.deepEqual(restored.engine.s.homeDecor,decor);assert.equal(restored.engine.storageCapacity(),1200);
  assert.equal(restored.engine.interior,null);assert.equal(restored.engine.s.storage.wood,2);
  assert.deepEqual(deserialize(serialize(restored.engine.s)).homeDecor,decor);
});

test('entering requires a real nearby home, safe surface checkpoint and standalone ownership',()=>{
  const e=fixture(),before=structuredClone(e.s);e.s.player.x=20;
  assert.equal(e.enterHome(1),false);assert.equal(e.s.homeDecor,undefined);
  Object.assign(e.s.player,before.player);e.network={guest:true,send:()=>true,peers:[]};
  assert.equal(e.enterHome(1),false);assert.equal(e.s.homeDecor,undefined);e.network=null;
  assert.equal(e.enterHome(2),false);assert.equal(e.enterHome(999),false);
  assert.equal(e.enterHome(1),true);assert.deepEqual(e.s.player,before.player);
  assert.equal(e.enterHome(1),false);assert.equal(e.roomData()?.items.length,3);
  assert.equal(validHomeDecor(e.s),true);
  assert.equal(validServerCommand({seq:1,method:'enterHome',args:[1]}),false);
  assert.equal(validServerCommand({seq:1,method:'decorateHome',args:['chair',3,5,0]}),false);
});

test('room collision and pathfinding use indoor coordinates; walking through the door exits safely',()=>{
  const e=enter(),surface=structuredClone(e.s.player),time=e.s.time;
  assert.equal(roomWalkable(e.roomData()!,1,1),false);assert.equal(roomWalkable(e.roomData()!,0,4),false);
  assert.equal(e.goInside(1,1),true);settle(e);
  assert.ok(e.interior);assert.ok(roomWalkable(e.roomData()!,e.interior.player.x,e.interior.player.z));
  assert.deepEqual(e.s.player,surface);assert.equal(e.s.time,time);
  assert.equal(e.build('fence',15,20,0),false);assert.equal(e.enterMine(),false);
  assert.equal(e.goInside(ROOM_DOOR.x,ROOM_DOOR.z),true);settle(e);
  assert.equal(e.interior,null);assert.deepEqual(e.s.player,surface);
  assert.ok(e.structureRevision>0);
});

test('purchased furniture costs once, moves and rotates freely, and cannot block a player or exit',()=>{
  const e=enter(),wood=e.s.inventory.wood;
  assert.equal(e.decorateHome('chair',3,5,0),true);const item=e.roomData()!.items.at(-1)!;
  assert.equal(e.s.inventory.wood,wood-4);
  assert.equal(e.decorateHome('chair',6,4,1,item.id),true);assert.equal(e.s.inventory.wood,wood-4);
  const before=structuredClone(e.s);
  assert.equal(e.decorateHome('table',3,5,0),false);assert.deepEqual(e.s,before);
  assert.equal(e.decorateHome('chest',6,4,0),false);assert.deepEqual(e.s,before);
  assert.equal(e.decorateHome('chair',4,7,0),false);assert.deepEqual(e.s,before);
  assert.equal(e.removeDecoration(item.id),true);assert.equal(units(e,'wood'),wood);
  assert.equal(e.removeDecoration(item.id),false);assert.equal(units(e,'wood'),wood);
  assert.equal(e.removeDecoration(3),true);assert.equal(units(e,'wood'),wood,'starter furniture grants no materials');
});

test('insufficient materials, invalid rotations and duplicate callbacks cannot generate furnishings',()=>{
  const e=enter();e.s.inventory={};const before=structuredClone(e.s);
  assert.equal(e.decorateHome('lamp',3,5,0),false);assert.deepEqual(e.s,before);
  assert.equal(e.decorateHome('chair',3,5,NaN),false);assert.deepEqual(e.s,before);
  assert.equal(e.decorateHome('chair',3.2,5,0),false);assert.deepEqual(e.s,before);
  assert.equal(e.decorateHome('chair',3,5,0,999),false);assert.deepEqual(e.s,before);
});

test('interior chest uses real storage and refuses removal that would lose stored items',()=>{
  const e=enter();assert.equal(e.decorateHome('chest',5,5,0),true);const chest=e.roomData()!.items.at(-1)!;
  assert.equal(e.storageCapacity(),1200);assert.equal(e.transferStorage('wood',10,true),true);
  const before=structuredClone(e.s);assert.equal(e.removeDecoration(chest.id),false);assert.deepEqual(e.s,before);
  assert.equal(e.transferStorage('wood',10,false),true);assert.equal(e.removeDecoration(chest.id),true);
  assert.equal(e.storageCapacity(),0);assert.equal(units(e,'wood'),200);assert.equal(units(e,'stone'),100);
});

test('save while inside restores outside, retaining decoration, styles and player upgrades',()=>{
  const e=enter();e.s.upgrades.axe=3;assert.equal(e.decorateHome('chair',3,5,0),true);
  assert.equal(e.styleHome('stone','sage'),true);
  const saved=serialize(e.s),restored=new Engine(deserialize(saved));
  assert.equal(restored.interior,null);assert.deepEqual(restored.s.player,e.s.player);assert.equal(restored.s.upgrades.axe,3);
  assert.equal(restored.enterHome(1),true);assert.equal(restored.roomData()!.floor,'stone');assert.equal(restored.roomData()!.wall,'sage');
  assert.deepEqual(restored.roomData(),e.roomData());
  const rollback=oldRead(saved);assert.deepEqual(rollback,e.s);
  assert.deepEqual(deserialize(oldWrite(rollback)),e.s,'the real 36b0e16 reader retains unknown room data');
  const legacy=createState(42);assert.deepEqual(deserialize(serialize(legacy)),legacy);assert.equal(legacy.homeDecor,undefined);
});

test('malformed, overlapping and exit-blocking room saves are rejected without weakening old validation',()=>{
  const e=enter();
  for(const mutate of [
    (r:ReturnType<typeof defaultRoom>)=>{r.items[0].x=7;},
    (r:ReturnType<typeof defaultRoom>)=>{r.items[1].x=1;},
    (r:ReturnType<typeof defaultRoom>)=>{r.items[2].x=4;r.items[2].z=6;},
    (r:ReturnType<typeof defaultRoom>)=>{r.items[2].id=1;},
    (r:ReturnType<typeof defaultRoom>)=>{r.nextId=1;},
  ]){const s=structuredClone(e.s);mutate(s.homeDecor!['1']);assert.throws(()=>deserialize(serialize(s)));}
  const foreign=structuredClone(e.s);foreign.homeDecor!['999']=defaultRoom();assert.throws(()=>deserialize(serialize(foreign)));
  assert.equal(e.styleHome('invalid','sage'),false);
  const room=defaultRoom();assert.ok(roomPath(room,ROOM_SPAWN,ROOM_DOOR));assert.equal(validRoom(room),true);
});

test('bed interaction uses existing night and threat rules; ordinary indoor movement advances no farm time',()=>{
  const e=enter(),time=e.s.time;
  assert.equal(e.goInside(1,1),true);settle(e);assert.equal(e.s.time,time);assert.equal(e.s.day,1);
  assert.equal(e.interactHome(1),false);assert.equal(e.s.day,1);
  assert.equal(e.homeMessage,e.events.at(-1)!.text);
  e.s.time=.75;assert.equal(e.interactHome(1),true);assert.equal(e.s.day,2);assert.ok(e.interior);
  e.leaveHome();e.s.enemies=[{id:e.s.nextId++,kind:'wolf',x:17,z:16,hp:42,maxHp:42,cooldown:1}];assert.equal(e.enterHome(1),false);
});

test('furnished farmhouses cannot be voluntarily demolished; enemy destruction salvages paid materials and all storage',()=>{
  const e=fixture();e.s.level=3;e.s.inventory={wood:500,stone:200,plank:100};
  for(const t of e.s.tiles)if(t.x>=7&&t.x<=14&&t.z>=23&&t.z<=29)Object.assign(t,{terrain:'grass',height:0,resource:null,source:null,amount:0,crop:null,tilled:false});
  assert.equal(e.build('farmhouse',8,24,0),true);const home=e.s.buildings.at(-1)!;Object.assign(e.s.player,{x:10,z:28});
  assert.equal(e.enterHome(home.id),true);assert.equal(e.decorateHome('chest',5,5,0),true);
  assert.equal(e.transferStorage('wood',40,true),true);e.leaveHome();assert.equal(e.demolish(home.id),false);
  const wood=units(e,'wood')+FURNITURE.chest.cost.wood,stone=units(e,'stone')+FURNITURE.chest.cost.stone;
  home.hp=1;const enemy={id:e.s.nextId++,kind:'wolf' as const,x:7.45,z:25,hp:42,maxHp:42,cooldown:0};e.s.enemies=[enemy];e.enemyPaths.set(enemy.id,{ttl:1,path:[]});
  e.combat(.1);
  assert.ok(!e.s.buildings.some(b=>b.id===home.id));assert.equal(e.s.homeDecor?.[String(home.id)],undefined);
  assert.equal(e.storageCapacity(),0);assert.equal(Object.values(e.s.storage).reduce((n,v)=>n+v,0),0);
  assert.equal(units(e,'wood'),wood);assert.equal(units(e,'stone'),stone);assert.equal(validHomeDecor(e.s),true);
});

test('home decoration remains valid in mine surface saves without changing mine progress',()=>{
  const e=enter();e.styleHome('dark','clay');e.leaveHome();e.s.level=3;
  Object.assign(e.s.player,{x:MINE_ENTRANCE.x,z:MINE_ENTRANCE.z+1});assert.equal(e.enterMine(),true);
  const restored=deserialize(serialize(e.s));assert.equal(restored.homeDecor!['1'].floor,'dark');assert.equal(restored.mine?.floor,1);
});
