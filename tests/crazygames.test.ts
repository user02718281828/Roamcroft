import test from 'node:test';
import assert from 'node:assert/strict';
import {CrazyGamesBridge,type PortalSDK} from '../lib/platform/crazygames.ts';
test('SDK absence, failed initialization and throwing calls never interrupt gameplay',async()=>{
 const bridge=new CrazyGamesBridge(()=>{});assert.equal(await bridge.initialize(undefined),false);
 const unavailable=()=>{throw Error('must not call game before init');};
 assert.equal(await bridge.initialize({init:async()=>{throw Error('offline');},game:{loadingStart:unavailable,loadingStop:unavailable,gameplayStart:unavailable,gameplayStop:unavailable}}),false);
 bridge.setLoading(false);bridge.setPlaying(true);bridge.dispose();
 const broken=new CrazyGamesBridge(()=>{});
 assert.equal(await broken.initialize({init:async()=>{},game:{loadingStart:unavailable,loadingStop:unavailable,gameplayStart:unavailable,gameplayStop:unavailable}}),false);
 assert.doesNotThrow(()=>{broken.setLoading(false);broken.setPlaying(true);broken.dispose();});
});
test('v3 initializes before events, handles late initialization, deduplicates lifecycle and honors mute',async()=>{
 const events:string[]=[],mutes:boolean[]=[];let listener:((s:{muteAudio?:boolean})=>void)|undefined;
 const bridge=new CrazyGamesBridge(v=>mutes.push(v));
 const sdk:PortalSDK={init:async()=>{events.push('init');},game:{loadingStart:()=>events.push('load'),loadingStop:()=>events.push('loaded'),gameplayStart:()=>events.push('play'),gameplayStop:()=>events.push('stop'),settings:{muteAudio:true},addSettingsChangeListener:fn=>{listener=fn;},removeSettingsChangeListener:fn=>{assert.equal(fn,listener);events.push('removed');}}};
 bridge.setLoading(false);bridge.setPlaying(true);assert.equal(await bridge.initialize(sdk),true);
 assert.deepEqual(events,['init','load','loaded','play']);bridge.setPlaying(true);assert.equal(events.length,4);
 bridge.setPlaying(false);bridge.setPlaying(false);listener?.({muteAudio:false});
 assert.deepEqual(mutes,[true,false]);assert.equal(events.filter(e=>e==='stop').length,1);bridge.dispose();assert.equal(events.at(-1),'removed');
});
