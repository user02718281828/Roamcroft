import assert from 'node:assert/strict';
import {BASE_HEADERS} from '../worker/security.mjs';

const base=process.argv[2]||'http://127.0.0.1:3000';
async function get(path,options){return fetch(new URL(path,base),{...options,signal:AbortSignal.timeout(15000)});}
function headers(response){
  for(const [key,value] of Object.entries(BASE_HEADERS))assert.equal(response.headers.get(key),value,`${response.url}: ${key}`);
  assert.match(response.headers.get('Content-Security-Policy')||'',/frame-ancestors 'none'/);
}
const page=await get('/');assert.equal(page.status,200);headers(page);
const policy=page.headers.get('Content-Security-Policy'),nonce=policy.match(/'nonce-([a-f0-9]{32})'/)?.[1];
assert.ok(nonce,'HTML nonce eksik');
const html=await page.text(),scripts=[...html.matchAll(/<script\b([^>]*)>/g)];
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
console.info('HTTP doğrulaması başarılı: HTML nonce, altı başlık, statik dosyalar, 404, service worker ve kapalı API/CORS.');
