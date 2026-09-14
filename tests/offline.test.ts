import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('offline navigation restores the shell but API requests never enter the cache',async()=>{
 const handlers:Record<string,(event:any)=>void>={};
 const shell=new Response('<h1>Roamcroft</h1>');
 runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{
  URL,Response,self:{location:{origin:'https://farm.test'},addEventListener:(name:string,fn:(event:any)=>void)=>handlers[name]=fn},
  caches:{match:async(key:string)=>key==='/'?shell:undefined},fetch:async()=>{throw Error('offline');},
 });
 let response:Promise<Response>|undefined;
 handlers.fetch({request:{url:'https://farm.test/',method:'GET',mode:'navigate'},respondWith:(value:Promise<Response>)=>response=value,waitUntil:()=>{}});
 assert.match(await (await response!).text(),/Roamcroft/);
 response=undefined;
 handlers.fetch({request:{url:'https://farm.test/api/coop',method:'POST'},respondWith:(value:Promise<Response>)=>response=value});
 assert.equal(response,undefined);
});
