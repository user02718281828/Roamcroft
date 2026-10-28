import { sourceText } from '../i18n/source.ts';
import {serialize,deserialize} from '../game/save.ts';
import type {State} from '../game/model.ts';
import type {Peer} from './protocol.ts';
import {validPose} from './protocol.ts';
export type WorldPacket={state:State;peers:Peer[]};
export async function encodeWorld(packet:WorldPacket) {
  const bytes=new TextEncoder().encode(JSON.stringify({save:serialize(packet.state),peers:packet.peers}));
  if(bytes.length>32000000) throw Error(sourceText("m_b72d7fd9a3"));
  const compressed=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  let binary='';for(let i=0;i<compressed.length;i+=16384) binary+=String.fromCharCode(...compressed.subarray(i,i+16384));
  const encoded=btoa(binary);
  if(encoded.length>800000) throw Error(sourceText("m_f62f67e8ce"));
  return encoded;
}
export async function decodeWorld(encoded:string):Promise<WorldPacket> {
  if(encoded.length>800000) throw Error(sourceText("m_591cbfaf7d"));
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const chunks:Uint8Array[]=[];let size=0;
  for(;;) {const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>32000000){await reader.cancel();throw Error(sourceText("m_f929a3e5f2"));}chunks.push(value);}
  const joined=new Uint8Array(size);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}
  const packet=JSON.parse(new TextDecoder().decode(joined));
  const state=deserialize(packet.save);
  if(!Array.isArray(packet.peers) || packet.peers.length>4 || !packet.peers.every((p:Peer)=>typeof p.id==='string' && p.id.length<=64 && typeof p.name==='string' && p.name.length<=32 && validPose(p.player) && ['health','hunger','energy'].every(k=>Number.isFinite(p.player[k as keyof typeof p.player]) && p.player[k as keyof typeof p.player]>=0 && p.player[k as keyof typeof p.player]<=100))) throw Error(sourceText("m_b5cb3c4c6c"));
  return {state,peers:packet.peers};
}
