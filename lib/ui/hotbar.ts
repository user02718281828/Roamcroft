import {ITEMS,TOOLS,type Bag} from '../game/data.ts';
import type {Engine} from '../game/model.ts';
import {inventoryAction} from './inventory.ts';

export const HOTBAR_KEY='roamcroft.hotbar.v1';
export const HOTBAR_SIZE=9;
export type HotbarBinding={kind:'tool'|'item';id:string}|null;
export type HotbarLayout=readonly HotbarBinding[];
const tools=new Set(TOOLS.map(t=>t.id));
export const DEFAULT_HOTBAR:HotbarLayout=[...TOOLS.map(t=>({kind:'tool' as const,id:t.id})),null];
function binding(value:unknown):HotbarBinding{
  if(!value||typeof value!=='object')return null;
  const v=value as Record<string,unknown>;
  if(typeof v.id!=='string')return null;
  if(v.kind==='tool'&&tools.has(v.id))return {kind:'tool',id:v.id};
  if(v.kind==='item'&&Object.hasOwn(ITEMS,v.id))return {kind:'item',id:v.id};
  return null;
}
/** References only. No stock, upgrade, tool ownership or save schema is stored here. */
export function readHotbar(raw:string|null):HotbarLayout{
  try{
    if(!raw||raw.length>4096)return DEFAULT_HOTBAR;
    const v=JSON.parse(raw);
    if(v?.version!==1||!Array.isArray(v.slots))return DEFAULT_HOTBAR;
    return Array.from({length:HOTBAR_SIZE},(_,i)=>binding(v.slots[i]));
  }catch{return DEFAULT_HOTBAR;}
}
export function bindHotbarSlot(layout:HotbarLayout,index:number,value:HotbarBinding):HotbarLayout{
  if(!Number.isInteger(index)||index<0||index>=HOTBAR_SIZE)return layout;
  return Array.from({length:HOTBAR_SIZE},(_,i)=>binding(i===index?value:layout[i]));
}
export function hotbarCount(value:HotbarBinding,bag:Bag){
  if(value?.kind!=='item')return 0;
  const n=bag[value.id];return Number.isSafeInteger(n)&&n>0?n:0;
}
export type HotbarIntent={tool:string;item:string|null;seed?:string;build?:string;available:boolean};
export function hotbarIntent(value:HotbarBinding,bag:Bag):HotbarIntent|null{
  const slot=binding(value);if(!slot)return null;
  if(slot.kind==='tool')return {tool:slot.id,item:null,available:true};
  const available=hotbarCount(slot,bag)>0,action=inventoryAction(slot.id);
  if(!available)return {tool:'hand',item:slot.id,available:false};
  if(action.kind==='plant')return {tool:'seed',item:slot.id,seed:action.crop,available:true};
  if(action.kind==='fertilize')return {tool:'fertilize',item:slot.id,available:true};
  if(action.kind==='build')return {tool:'build',item:slot.id,build:action.type,available:true};
  return {tool:'hand',item:slot.id,available:action.kind==='eat'};
}
/** Explicit use delegates to the same validated Engine/authority method as the bag. */
export function eatHotbarItem(engine:Engine,id:string){
  if(!Object.hasOwn(ITEMS,id)||!hotbarCount({kind:'item',id},engine.s.inventory)||inventoryAction(id).kind!=='eat')return false;
  return engine.eat(id);
}
