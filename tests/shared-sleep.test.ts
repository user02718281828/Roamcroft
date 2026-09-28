import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../lib/game/model.ts';
import { RoomCore } from '../lib/server/room-core.ts';
import { ensureSharedPlayer, type SharedRecord } from '../lib/server/shared-world.ts';
import { serialize, deserialize } from '../lib/game/save.ts';

const ids=['host','a','b','c'];
function fixture() {
  const s=createState(5);s.time=.75;s.enemies=[];
  const record:SharedRecord={world:{state:s},players:{},room:'sleep',history:[]};
  for(const [i,id] of ids.entries()){
    const p=ensureSharedPlayer(record,id,'host',id,1000);
    Object.assign(p.player,{x:12+i%2*2,z:14+Math.floor(i/2)*2,health:50,energy:30,hunger:80});
    p.inventory={wood:i+1};p.paused=true;
  }
  s.player=record.players.host.player;s.inventory=record.players.host.inventory;
  const room=new RoomCore(record,'host',0);
  for(const id of ids)room.connect(id,id,1000);
  return room;
}
async function command(room:RoomCore,id:string,method='sleep',now=1200) {
  const p=room.record.players[id];
  const request={op:'pulse',revision:room.revision,pulse:{seq:p.seq+1,paused:true,pose:{...p.player},commands:[{seq:p.commandSeq+1,method,args:[]}]}};
  const nonce=p.nonce,response=await room.pulse(id,id,request,nonce,now);
  assert.equal(response.status,200);
  return {request,nonce,response};
}
void test('four players must agree; midnight, production, vitals and save advance exactly once with duplicate ACK loss',async()=>{
  const room=fixture(),s=room.record.world.state;
  s.jobs=[{recipe:'plank',remaining:7,total:7,recipient:room.record.players.a.id}];
  for(const id of ids.slice(0,3)){await command(room,id);assert.equal(room.record.world.state.day,1);}
  assert.equal(room.record.sleep?.votes.length,3);
  const last=await command(room,'c');
  assert.equal(room.record.world.state.day,2);assert.equal(room.record.world.state.time,.28);
  assert.equal(room.record.sleep,undefined);assert.equal(room.record.players.a.inventory.plank,2);
  assert.equal(room.record.players.host.inventory.plank||0,0);
  for(const [i,id] of ids.entries()){
    assert.equal(room.record.players[id].player.energy,100);assert.equal(room.record.players[id].player.health,100);
    assert.equal(room.record.players[id].player.hunger,70);assert.equal(room.record.players[id].inventory.wood,i+1);
  }
  assert.equal((await room.pulse('c','c',last.request,last.nonce,1300)).status,200);
  assert.equal(room.record.world.state.day,2);assert.equal(room.record.players.a.inventory.plank,2);
  const restored=new RoomCore(JSON.parse(JSON.stringify(room.record)),'host',room.revision);
  assert.equal(restored.record.world.state.day,2);
  assert.equal(deserialize(serialize(restored.record.world.state)).time,.28);
});
void test('daylight, distance and raid danger reject sleep; walking away, cancel, timeout and restart clear consent',async()=>{
  for(const mutate of [
    (r:RoomCore)=>{r.record.world.state.time=.5;},
    (r:RoomCore)=>{r.record.players.host.player.x=22;},
    (r:RoomCore)=>{r.record.world.state.day=3;},
  ]){const room=fixture();mutate(room);await command(room,'host');assert.equal(room.record.sleep,undefined);}
  for(const action of ['walk','cancel','timeout','restart']){
    let room=fixture();await command(room,'host');assert.ok(room.record.sleep);
    if(action==='walk'){room.record.players.host.player.x=22;room.step(1300);}
    if(action==='cancel')await command(room,'a','cancelSleep');
    if(action==='timeout')room.step(92000);
    if(action==='restart')room=new RoomCore(JSON.parse(JSON.stringify(room.record)),'host',room.revision);
    assert.equal(room.record.sleep,undefined);assert.equal(room.record.world.state.day,1);
  }
});
void test('disconnect never completes a partial vote, reconnect and membership changes require fresh consent',async()=>{
  const room=fixture();for(const id of ids.slice(0,3))await command(room,id);
  room.disconnect('c',room.streams.get('c')!.epoch);
  assert.equal(room.record.sleep,undefined);assert.equal(room.record.world.state.day,1);
  room.connect('c','c',1400);await command(room,'c','sleep',1500);
  assert.deepEqual((room.record as SharedRecord).sleep?.votes,['c']);
  room.record.players.a.present=false;room.step(1550);
  assert.equal(room.record.sleep,undefined);assert.equal(room.record.world.state.day,1);
});
