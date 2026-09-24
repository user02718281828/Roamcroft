import assert from 'node:assert/strict';
import {BASE_HEADERS} from '../worker/security.mjs';

const base=process.argv[2]||'http://127.0.0.1:3000';
async function get(path,options){return fetch(new URL(path,base),{...options,signal:AbortSignal.timeout(15000)});}
async function expectStatus(response,status,label){
  if(response.status!==status){
    const detail=response.status>=500?(await response.clone().text()).slice(0,1200):'';
    console.error('HTTP failure:',{url:response.url,expected:status,actual:response.status,contentType:response.headers.get('Content-Type'),detail});
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  assert.equal(response.status,status,label);
}
function headers(response){
  for(const [key,value] of Object.entries(BASE_HEADERS))assert.equal(response.headers.get(key),value,`${response.url}: ${key}`);
  assert.match(response.headers.get('Content-Security-Policy')||'',/frame-ancestors 'none'/);
}
const page=await get('/');assert.equal(page.status,200);headers(page);
const policy=page.headers.get('Content-Security-Policy'),nonce=policy.match(/'nonce-([a-f0-9]{32})'/)?.[1];
assert.ok(nonce,'HTML nonce eksik');
const html=await page.text(),scripts=[...html.matchAll(/<script\b([^>]*)>/g)];
assert.ok(html.includes('Roamcroft başlangıç ekranı')&&html.includes('Sunucu dünyası'),'Hafif başlangıç ekranı bulunamadı');
assert.ok(!/<(?:script|link)\b[^>]*(?:Game-|scene-|three-core|three-renderer)/i.test(html),'3D motor başlangıçta yükleniyor');
assert.ok(scripts.length>0);
for(const [,attributes] of scripts)assert.ok(attributes.includes(`nonce="${nonce}"`),'Script nonce başlıkla eşleşmiyor');
const second=await get('/');assert.notEqual(second.headers.get('Content-Security-Policy'),policy);await second.body?.cancel();
for(const path of ['/manifest.json','/sw.js','/art/farm-icons-1.webp','/olmayan-sayfa']){
  const response=await get(path);headers(response);
  assert.equal(response.status,path==='/olmayan-sayfa'?404:200);
  if(path==='/sw.js'||path==='/manifest.json')assert.equal(response.headers.get('Cache-Control'),'no-cache');
  await response.body?.cancel();
}
for(const method of ['POST','OPTIONS']){
  const response=await get('/api/coop',{method,headers:{Origin:'https://untrusted.example','Access-Control-Request-Method':'POST'}});
  headers(response);assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
  if(method==='POST')assert.equal(response.status,404);
  await response.body?.cancel();
}
for(const [origin,body,status] of [['https://untrusted.example',{op:'session'},403],[new URL(base).origin,{op:'pulse',pulse:{}},401]]){
  const response=await get('/api/world',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  await expectStatus(response,status,`${response.url}: ${body.op} HTTP status`);headers(response);assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);assert.equal(response.headers.get('Cache-Control'),'no-store');await response.body?.cancel();
}
for(const [origin,status] of [['https://untrusted.example',403],[new URL(base).origin,401]]){
  const response=await get('/api/lobby',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'status'})});
  await expectStatus(response,status,'Lobi yetkilendirmesi');headers(response);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);await response.body?.cancel();
}
console.info('HTTP doğrulaması başarılı: hafif açılış, HTML nonce, güvenlik başlıkları, statik dosyalar, 404, service worker, API oturumu ve CORS.');

// Explicit local-only mode exercises a real, initially empty D1 database in CI.
if(process.argv.includes('--session-smoke')){
  assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'Session smoke is local-only');
  const origin=new URL(base).origin;
  const session=await get('/api/world',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'session'})});
  await expectStatus(session,201,'Cold D1 session creation');headers(session);
  const cookie=session.headers.get('Set-Cookie')?.split(';')[0];assert.ok(cookie);
  const packet=await session.json();assert.ok(packet.nonce&&packet.state);
  const {x,z,facing}=packet.state.player;
  const pulse=await get('/api/world',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,'X-Roamcroft-Nonce':packet.nonce},body:JSON.stringify({op:'pulse',pulse:{seq:1,pose:{x,z,facing},commands:[],paused:true}})});
  await expectStatus(pulse,200,'Authenticated world pulse');headers(pulse);assert.equal((await pulse.json()).seq,1);
  for(const op of ['create','leave']){
    const lobby=await get('/api/lobby',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(op==='create'?{op,name:'CI test'}:{op})});
    await expectStatus(lobby,200,'Authenticated lobby '+op);headers(lobby);const data=await lobby.json();if(op==='create')assert.equal(data.room.members.length,1);else assert.equal(data.room,null);
  }
  console.info('Cold D1 session, authenticated pulse and lobby passed.');
}
