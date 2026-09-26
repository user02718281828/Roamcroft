import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine,createState} from '../lib/game/model.ts';
import {shiftWindow} from '../lib/game/world.ts';
import {applySharedState} from '../lib/coop/authority.ts';
import {RemoteMotion,withinSharedRange} from '../lib/coop/motion.ts';

void test('crossing streaming boundaries preserves scene generation, predicted position and click route',()=>{
  const e=new Engine(createState(31)), original=e.s.tiles;
  e.path=[{x:25,z:19}];
  const incoming=structuredClone(e.s);
  shiftWindow(incoming,24,19);
  incoming.player.x=24;
  e.s.player.x=24.2;
  applySharedState(e,incoming,{id:'me',name:'Me',player:incoming.player});
  assert.equal(e.worldRevision,0,'window changes must not trigger Game loading/remount');
  assert.notEqual(e.s.tiles,original,'terrain array tells the existing scene to stream');
  assert.equal(e.s.player.x,24.2);
  assert.equal(e.path.length,1);
  const streamed=e.s.tiles;
  const next=structuredClone(e.s);
  next.tiles[0].water=42;
  applySharedState(e,next,{id:'me',name:'Me',player:next.player});
  assert.equal(e.s.tiles,streamed,'ordinary pulses keep terrain buffers');
  assert.equal(e.s.tiles[0].water,42);
  const other=structuredClone(e.s);other.seed++;
  applySharedState(e,other);
  assert.equal(e.worldRevision,1,'real world changes still rebuild');
});

void test('late acknowledgement preserves movement after the sent pose, but rejects invalid movement',()=>{
  const e=new Engine(createState(2));
  e.s.player.x=18;
  const incoming=structuredClone(e.s);incoming.player.x=15;
  applySharedState(e,incoming,{id:'me',name:'Me',player:incoming.player},{x:15,z:incoming.player.z});
  assert.equal(e.s.player.x,18,'3 tiles traveled during request are not undone');
  const blocked=structuredClone(e.s);blocked.player.x=14;
  applySharedState(e,blocked,{id:'me',name:'Me',player:blocked.player},{x:18,z:blocked.player.z});
  assert.equal(e.s.player.x,14,'server collision correction remains authoritative');
});

void test('remote motion stays bounded through 300ms latency, loss, duplicate samples and a long correction',()=>{
  const m=new RemoteMotion();let last={x:0,z:0},maxStep=0;
  for(let now=0;now<=6000;now+=1000/60){
    const tick=Math.floor(now/500);
    // Deliver at +300ms; lose the fourth update, repeat unchanged server samples.
    if(now%500>=300 && tick!==3){
      m.push({x:Math.min(tick,8)*1.5,z:0,facing:0},tick*500,now);
    }
    const p=m.sample(now,1/60);
    if(p){if(last.x)maxStep=Math.max(maxStep,Math.hypot(p.x-last.x,p.z-last.z));last=p;}
  }
  assert.ok(maxStep<=8/60+1e-6,'no packet causes a visual teleport');
  assert.ok(last.x>=11.9 && last.x<=12.61,'stopped peer settles without unbounded prediction');
  m.push({x:-50,z:0,facing:Math.PI},6500,6500);
  const before=m.sample(7150,1/60)!;
  const after=m.sample(7167,1/60)!;
  assert.ok(Math.abs(after.x-before.x)<=8/60+1e-6);
  m.push({x:999,z:0,facing:0},6000,7170);
  assert.ok(m.sample(7200,1/60)!.x<20,'old/out-of-order sample ignored');
});

void test('shared boundary blocks separation while allowing a separated player to return',()=>{
  assert.equal(withinSharedRange({x:20,z:0},{x:20.1,z:0},[{x:0,z:0}]),false);
  assert.equal(withinSharedRange({x:22,z:0},{x:21.9,z:0},[{x:0,z:0}]),true);
  const e=new Engine(createState(1));
  for(const t of e.s.tiles){t.resource=null;t.terrain='grass';}
  e.s.buildings=[];e.s.player.x=20;e.s.player.z=19;
  e.sharedAnchors=[{x:0,z:19}];
  e.move(1,0,.08);
  assert.equal(e.s.player.x,20);
  e.path=[{x:21,z:19}];e.tick(.08);
  assert.equal(e.s.player.x,20,'click movement uses the same boundary');
  e.move(-1,0,.08);
  assert.ok(e.s.player.x<20);
});
