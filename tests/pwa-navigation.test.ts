import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('offline guide navigation preserves the launcher cache and never caches game APIs',async()=>{
  const listeners=new Map<string,(e:any)=>void>(),stored=new Map<string,Response>();
  const cache={async put(key:string,response:Response){stored.set(key,response);},async match(key:string){return stored.get(key)?.clone();}};
  let online=true;
  const origin='https://roamcroft.com';
  runInNewContext(readFileSync('public/sw.js','utf8'),{
    self:{location:{origin},addEventListener:(name:string,fn:(e:any)=>void)=>listeners.set(name,fn)},
    caches:{open:async()=>cache,match:cache.match},URL,Response,
    fetch:async(request:Request)=>{if(!online)throw Error('offline');return new Response(new URL(request.url).pathname);},
  });
  async function visit(path:string){
    let response:Promise<Response>|undefined;const waits:Promise<unknown>[]=[];
    listeners.get('fetch')!({request:{method:'GET',url:origin+path,mode:'navigate'},respondWith:(r:Promise<Response>)=>response=r,waitUntil:(p:Promise<unknown>)=>waits.push(p)});
    const result=await response;await Promise.all(waits);return result;
  }
  await visit('/');await visit('/how-to-play');online=false;
  assert.equal(await (await visit('/'))!.text(),'/');
  assert.equal(await (await visit('/how-to-play'))!.text(),'/how-to-play');
  assert.equal((await visit('/not-cached'))!.type,'error');
  assert.equal(await visit('/api/world'),undefined);
  assert.equal(await visit('/?_rsc=test'),undefined);
});
