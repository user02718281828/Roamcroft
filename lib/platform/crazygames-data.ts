import {serialize,deserialize} from '../game/save.ts';
import {createState,type State} from '../game/model.ts';
import {frameProfile} from '../game/profile.ts';
export const DATA_KEY='roamcroft.farm.v1',DATA_LIMIT=1048576;
export type DataModule={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void};
type RecordData={format:'roamcroft.cg.data.v1';current:string;backup:string|null};
async function pack(text:string){
 if(typeof CompressionStream==='undefined')return text;
 const bytes=new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 return 'gzip:'+btoa(binary);
}
async function unpack(text:string){
 if(!text.startsWith('gzip:'))return text;
 const bytes=Uint8Array.from(atob(text.slice(5)),c=>c.charCodeAt(0));
 const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
 const chunks:Uint8Array[]=[];let total=0;
 for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>=32000000){await reader.cancel();throw Error('Save expansion exceeds safe size');}chunks.push(value);}
 return await new Blob(chunks as BlobPart[]).text();
}
export class CrazyGamesDataStore{
 private active=true;private loaded=false;private expected:string|null=null;private current:string|null=null;private writing=false;
 private data:DataModule;private identity:()=>Promise<string>;private owner:string;private problem:(message:string)=>void;
 constructor(data:DataModule,identity:()=>Promise<string>,owner:string,problem:(message:string)=>void){this.data=data;this.identity=identity;this.owner=owner;this.problem=problem;}
 invalidate(){this.active=false;}
 get isNew(){return this.loaded&&this.expected===null;}
 private async check(){if(!this.active||await this.identity()!==this.owner){this.invalidate();throw Error('Account changed. Reload before continuing.');}if(!this.active)throw Error('Account changed');}
 async load(){
  await this.check();const raw=this.data.getItem(DATA_KEY);let state:State;
  if(raw===null)state=createState();else{
   const record=JSON.parse(raw) as RecordData;
   if(record.format!=='roamcroft.cg.data.v1'||typeof record.current!=='string')throw Error('Invalid Data Module save; original retained.');
   state=deserialize(await unpack(record.current));this.current=record.current;
  }
  await this.check();if(this.data.getItem(DATA_KEY)!==raw)throw Error('Save changed while loading. Reload.');
  this.expected=raw;this.loaded=true;return state;
 }
 async save(state:State){
  if(this.writing)return false;this.writing=true;
  try{
   if(!this.loaded)throw Error('Data Module save has not loaded');
   const serializationStarted=frameProfile.begin();
   const snapshot=serialize(state);
   frameProfile.end('saveSerializeCpu',serializationStarted);
   const compressionStarted=frameProfile.begin(),current=await pack(snapshot);
   frameProfile.end('saveCompressionWallTime',compressionStarted);
   const raw=JSON.stringify({format:'roamcroft.cg.data.v1',current,backup:this.current} satisfies RecordData);
   if(new TextEncoder().encode(JSON.stringify({[DATA_KEY]:raw})).length>DATA_LIMIT)throw Error('Data Module 1 MB limit exceeded. Previous save retained; export your farm.');
   await this.check();if(this.data.getItem(DATA_KEY)!==this.expected)throw Error('Cloud save changed. Reload; no overwrite performed.');
   const sdkWriteStarted=frameProfile.begin();
   this.data.setItem(DATA_KEY,raw);
   frameProfile.end('sdkSetItemCpu',sdkWriteStarted);
   if(this.data.getItem(DATA_KEY)!==raw)throw Error('SDK did not accept the save');
   this.expected=raw;this.current=current;this.problem('');return true;
  }catch(error){this.problem(error instanceof Error?error.message:'Data Module unavailable; save not confirmed');return false;}
  finally{this.writing=false;}
 }
}
