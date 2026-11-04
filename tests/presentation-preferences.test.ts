import test from 'node:test';
import assert from 'node:assert/strict';
import {readPresentation,storePresentation} from '../lib/ui/presentation-preferences.ts';
import {readAudioLevels,storeAudioLevels} from '../lib/ui/audio-levels.ts';
test('launcher preferences survive reopening and preserve the existing audio storage key without creating a game save',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),values=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)}});
 try{
  assert.deepEqual(readPresentation(),{quality:false,sound:false});
  storePresentation({quality:true});storePresentation({sound:true});
  assert.deepEqual(readPresentation(),{quality:true,sound:true});
  storeAudioLevels({music:.2,ambience:.4,effects:.6});
  assert.deepEqual(readAudioLevels(),{music:.2,ambience:.4,effects:.6});
  assert.deepEqual([...values.keys()].sort(),['roamcroft.audio.v1','roamcroft.presentation.v1']);
  values.set('roamcroft.presentation.v1','bad');assert.deepEqual(readPresentation(),{quality:false,sound:false});
 }finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');}
});
