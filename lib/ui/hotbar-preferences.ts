'use client';
import {useEffect,useSyncExternalStore} from 'react';
import {HOTBAR_KEY,DEFAULT_HOTBAR,readHotbar,bindHotbarSlot,type HotbarBinding,type HotbarLayout} from './hotbar';
let current=DEFAULT_HOTBAR,initialized=false;
const listeners=new Set<()=>void>();
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
function publish(next:HotbarLayout){current=next;listeners.forEach(fn=>fn());}
export function assignHotbar(index:number,value:HotbarBinding){
  const next=bindHotbarSlot(current,index,value);if(next===current)return;
  try{window.localStorage.setItem(HOTBAR_KEY,JSON.stringify({version:1,slots:next}));}catch{/* Keep session bindings if storage is blocked. */}
  publish(next);
}
export function useHotbar(){
  const layout=useSyncExternalStore(subscribe,()=>current,()=>DEFAULT_HOTBAR);
  useEffect(()=>{
    if(!initialized){initialized=true;try{publish(readHotbar(window.localStorage.getItem(HOTBAR_KEY)));}catch{publish(DEFAULT_HOTBAR);}}
    const update=(e:StorageEvent)=>{if(e.key===HOTBAR_KEY||e.key===null)publish(readHotbar(e.newValue));};
    window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update);
  },[]);
  return layout;
}
