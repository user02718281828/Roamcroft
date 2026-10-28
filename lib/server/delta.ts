import { sourceText } from '../i18n/source.ts';
import type {State} from '../game/model.ts';

export type WorldDelta={baseSeq:number;changes:Partial<State>;tiles?:[number,State['tiles'][number]][]};
// Değişmeyen binlerce arazi karesi her bağlantıda tekrar indirilmez.
export function captureState(state:State){
  return {fields:Object.fromEntries(Object.entries(state).filter(([key])=>key!=='tiles').map(([key,value])=>[key,JSON.stringify(value)])),tiles:state.tiles.map(tile=>JSON.stringify(tile))};
}
export function makeDelta(before:ReturnType<typeof captureState>,state:State,baseSeq:number):WorldDelta{
  const changes:Record<string,unknown>={};
  for(const [key,value] of Object.entries(state))if(key!=='tiles'&&before.fields[key]!==JSON.stringify(value))changes[key]=value;
  if(before.tiles.length!==state.tiles.length){changes.tiles=state.tiles;return {baseSeq,changes};}
  const tiles:WorldDelta['tiles']=[];
  for(let i=0;i<state.tiles.length;i++)if(before.tiles[i]!==JSON.stringify(state.tiles[i]))tiles.push([i,state.tiles[i]]);
  return {baseSeq,changes,...(tiles.length?{tiles}:{})};
}
export function applyDelta(state:State,delta:WorldDelta,seq:number):State{
  if(delta.baseSeq!==seq)throw Error(sourceText("m_47f65f3bf9"));
  const next={...state,...delta.changes,tiles:delta.changes.tiles||state.tiles.slice()};
  for(const [index,tile] of delta.tiles||[])next.tiles[index]=tile;
  return next;
}
