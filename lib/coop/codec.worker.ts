import { sourceText } from '../i18n/source.ts';
import {encodeWorld,decodeWorld} from './codec';
import type {WorldPacket} from './codec';
self.onmessage=async(event:MessageEvent<{id:number;op:'encode'|'decode';packet?:WorldPacket;encoded?:string}>)=>{
  const {id,op,packet,encoded}=event.data;
  try {self.postMessage({id,value:op==='encode' ? await encodeWorld(packet!) : await decodeWorld(encoded!)});}
  catch(error) {self.postMessage({id,error:error instanceof Error ? error.message : sourceText("m_b114365dfd")});}
};
