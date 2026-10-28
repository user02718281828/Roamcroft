import assert from 'node:assert/strict';
import {BASE_HEADERS} from '../worker/security.mjs';
import english from '../lib/i18n/en.json' with {type:'json'};

const base=process.argv[2]||'http://127.0.0.1:3000';
// Miniflare may reset a cold proxy connection while probing a rejected request.
// Retry only explicitly read-only, unauthenticated probes, only on localhost,
// and only its exact transport error; never retry writes or application 5xx here.
async function get(path,options,probe=false){
  const local=['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname);
  for(let attempt=0;;attempt++){
    const response=await fetch(new URL(path,base),{...options,signal:AbortSignal.timeout(15000)});
    if(!probe||!local||attempt>=2||response.status!==500||!response.headers.get('Content-Type')?.startsWith('text/plain'))return response;
    const detail=await response.clone().text();
    if(!detail.startsWith('Error: Network connection lost.')||!detail.includes('miniflare/'))return response;
    await response.arrayBuffer();
    console.info('Local Miniflare transport probe reset; bounded retry:',path,attempt+1);
    await new Promise(resolve=>setTimeout(resolve,200));
  }
}

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
assert.ok(html.includes(english.m_77b3894fa1)&&html.includes(english.m_c3d8677045),'Hafif İngilizce başlangıç ekranı bulunamadı');
assert.match(html,/<html\b[^>]*lang="en"/,'SSR varsayılan dili İngilizce olmalı');
assert.match(html,/<option\b[^>]*value="tr"[^>]*>Türkçe<\/option>/,'Türkçe seçeneği eksik');
assert.match(html,/<option\b[^>]*value="en"[^>]*>English<\/option>/,'İngilizce seçeneği eksik');
assert.ok(!/<(?:script|link)\b[^>]*(?:Game-|scene-|three-core|three-renderer)/i.test(html),'3D motor başlangıçta yükleniyor');
assert.ok(scripts.length>0);
for(const [,attributes] of scripts)assert.ok(attributes.includes(`nonce="${nonce}"`),'Script nonce başlıkla eşleşmiyor');
const second=await get('/');assert.notEqual(second.headers.get('Content-Security-Policy'),policy);await second.body?.cancel();
for(const path of ['/manifest.json','/manifest.tr.json','/sw.js','/art/farm-icons-1.webp','/olmayan-sayfa']){
  const response=await get(path);headers(response);
  assert.equal(response.status,path==='/olmayan-sayfa'?404:200);
  if(path==='/sw.js'||path.startsWith('/manifest.'))assert.equal(response.headers.get('Cache-Control'),'no-cache');
  if(path.startsWith('/manifest.')){const manifest=await response.json();assert.equal(manifest.lang,path==='/manifest.tr.json'?'tr':'en');assert.equal(manifest.id,'/');}
  else await response.arrayBuffer();
}
for(const method of ['POST','OPTIONS']){
  const response=await get('/api/coop',{method,headers:{Origin:'https://untrusted.example','Access-Control-Request-Method':'POST'}});
  headers(response);assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
  if(method==='POST')assert.equal(response.status,404);
  await response.arrayBuffer();
}
for(const [origin,body,status] of [['https://untrusted.example',{op:'session'},403],[new URL(base).origin,{op:'pulse',pulse:{}},401]]){
  const response=await get('/api/world',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Roamcroft-Protocol':'2'},body:JSON.stringify(body)},true);
  await expectStatus(response,status,`${response.url}: ${body.op} HTTP status`);headers(response);assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);assert.equal(response.headers.get('Cache-Control'),'no-store');await response.arrayBuffer();
}
for(const [origin,status] of [['https://untrusted.example',403],[new URL(base).origin,401]]){
  const response=await get('/api/lobby',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Roamcroft-Protocol':'2'},body:JSON.stringify({op:'status'})},true);
  await expectStatus(response,status,'Lobi yetkilendirmesi');headers(response);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);await response.arrayBuffer();
  const shared=await get('/api/shared',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Roamcroft-Protocol':'2'},body:JSON.stringify({op:'connect'})},true);
  await expectStatus(shared,status,'Ortak dünya yetkilendirmesi');headers(shared);assert.equal(shared.headers.get('Cache-Control'),'no-store');assert.equal(shared.headers.get('Access-Control-Allow-Origin'),null);await shared.arrayBuffer();
}
console.info('HTTP doğrulaması başarılı: hafif açılış, HTML nonce, güvenlik başlıkları, statik dosyalar, 404, service worker, API oturumu ve CORS.');

// Explicit local-only mode exercises a real, initially empty D1 database in CI.
if(process.argv.includes('--session-smoke')){
  assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'Session smoke is local-only');
  const origin=new URL(base).origin;
  const session=await get('/api/world',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Roamcroft-Protocol':'2'},body:JSON.stringify({op:'session'})});
  await expectStatus(session,201,'Cold D1 session creation');headers(session);
  const cookie=session.headers.get('Set-Cookie')?.split(';')[0];assert.ok(cookie);
  const packet=await session.json();assert.ok(packet.nonce&&packet.state);
  const {x,z,facing}=packet.state.player;
  const pulse=await get('/api/world',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,'X-Roamcroft-Nonce':packet.nonce},body:JSON.stringify({op:'pulse',pulse:{seq:1,pose:{x,z,facing},commands:[],paused:true}})});
  await expectStatus(pulse,200,'Authenticated world pulse');headers(pulse);assert.equal((await pulse.json()).seq,1);
  let simulatedRtt=0;
  async function call(path,body,sessionCookie=cookie,requestNonce='',status=200){
    if(simulatedRtt)await new Promise(resolve=>setTimeout(resolve,simulatedRtt/2));
    const response=await get(path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:sessionCookie,'X-Roamcroft-Nonce':requestNonce,'X-Roamcroft-Protocol':'2'},body:JSON.stringify(body)});
    await expectStatus(response,status,`${path} ${body.op}`);headers(response);const data=await response.json();
    if(simulatedRtt)await new Promise(resolve=>setTimeout(resolve,simulatedRtt/2));return data;
  }
  const secondSession=await get('/api/world',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Roamcroft-Protocol':'2'},body:JSON.stringify({op:'session'})});
  await expectStatus(secondSession,201,'Second independent player');
  const guestCookie=secondSession.headers.get('Set-Cookie')?.split(';')[0];assert.ok(guestCookie);
  const privateGuest=await secondSession.json();
  const lobby=await call('/api/lobby',{op:'create',name:'CI host'});assert.equal(lobby.room.members.length,1);
  await call('/api/lobby',{op:'join',name:'CI guest',code:lobby.room.code},guestCookie);
  await call('/api/shared',{op:'connect'},guestCookie,'',423);
  const host=await call('/api/shared',{op:'connect'}),guest=await call('/api/shared',{op:'connect'},guestCookie);
  assert.equal(guest.peers.length,2);assert.notEqual(guest.you.id,host.you.id);assert.deepEqual(guest.bag.inventory,{});
  const action={op:'pulse',revision:guest.revision,pulse:{seq:1,pose:guest.you.player,commands:[{seq:1,method:'trade',args:['wood',1,true]}],paused:true}};
  const bought=await call('/api/shared',action,guestCookie,guest.nonce);assert.equal(bought.bag.inventory.wood,1);
  const retry=await call('/api/shared',action,guestCookie,guest.nonce);assert.equal(retry.bag.inventory.wood,1);assert.equal(retry.revision,bought.revision);
  const synced=await call('/api/shared',{op:'pulse',revision:host.revision,pulse:{seq:1,pose:host.you.player,commands:[],paused:true}},cookie,host.nonce);
  assert.equal(synced.bag.inventory.wood,host.bag.inventory.wood);assert.equal(synced.peers.length,2);assert.ok(synced.patches.length);
  const players=[{cookie,packet:synced},{cookie:guestCookie,packet:retry}];
  for(const name of ['CI third','CI fourth']){
    const response=await get('/api/world',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({op:'session'})});await expectStatus(response,201,'Independent player '+name);
    const playerCookie=response.headers.get('Set-Cookie')?.split(';')[0];assert.ok(playerCookie);await response.arrayBuffer();
    await call('/api/lobby',{op:'join',name,code:lobby.room.code},playerCookie);
    players.push({cookie:playerCookie,packet:await call('/api/shared',{op:'connect'},playerCookie)});
  }
  simulatedRtt=300;
  const actions=players.map(p=>({op:'pulse',revision:p.packet.revision,pulse:{seq:p.packet.seq+1,pose:p.packet.you.player,commands:[{seq:p.packet.commandSeq+1,method:'trade',args:['wood',1,true]}],paused:true}}));
  const parallel=await Promise.allSettled(players.map(async(p,i)=>{
    const result=await call('/api/shared',actions[i],p.cookie,p.packet.nonce);
    if(i===2)throw Error('Simulated response loss after commit');return result;
  }));
  assert.equal(parallel.filter(r=>r.status==='rejected').length,1);assert.equal(parallel[2].status,'rejected');
  const replayed=await Promise.all(players.map((p,i)=>call('/api/shared',actions[i],p.cookie,p.packet.nonce)));
  for(let i=0;i<players.length;i++)assert.equal(replayed[i].bag.inventory.wood,(players[i].packet.bag.inventory.wood||0)+1);
  const snapshots=await Promise.all(players.map(p=>call('/api/shared',{op:'connect'},p.cookie)));
  assert.equal(new Set(snapshots.map(p=>p.you.id)).size,4);
  for(const snapshot of snapshots){assert.equal(snapshot.peers.length,4);assert.equal(snapshot.state.gold,snapshots[0].state.gold);assert.equal(snapshot.state.time,snapshots[0].state.time);}
  simulatedRtt=0;
  // Prepare from the same shared stock concurrently, then replay the exact
  // requests (as if their acknowledgements were lost). No fixture-only APIs.
  for(let i=0;i<players.length;i++)players[i].packet=snapshots[i];
  async function durableCommands(player,commands){
    const p=player.packet;
    const body={op:'pulse',revision:p.revision,pulse:{seq:p.seq+1,pose:p.you.player,paused:true,commands:commands.map((c,i)=>({seq:p.commandSeq+i+1,...c}))}};
    player.packet=await call('/api/shared',body,player.cookie,p.nonce);
    return {body,nonce:p.nonce};
  }
  await durableCommands(players[0],[{method:'build',args:['chest',14,20,0,false]},{method:'transferStorage',args:['wood',3,true]}]);
  const stocked=await call('/api/shared',{op:'connect'},cookie);
  assert.equal(stocked.state.storage.wood,3);players[0].packet=stocked;
  const totalBefore=players.reduce((n,p)=>n+(p.packet.bag.inventory.wood||0),0)+3;
  simulatedRtt=300;
  const preparations=await Promise.all(players.map(p=>durableCommands(p,[{method:'prepareMaterials',args:['craft','plank']}])));
  const prepared=players.map(p=>p.packet.bag.inventory.wood||0);
  await Promise.all(players.map(async(p,i)=>{
    const retried=await call('/api/shared',preparations[i].body,p.cookie,preparations[i].nonce);
    assert.equal(retried.bag.inventory.wood||0,prepared[i]);p.packet=retried;
  }));
  simulatedRtt=0;
  const afterPreparation=await call('/api/shared',{op:'connect'},cookie);players[0].packet=afterPreparation;
  assert.equal(prepared.reduce((a,b)=>a+b,0)+afterPreparation.state.storage.wood,totalBefore);
  assert.ok(prepared.slice(1).some(n=>n===3));
  assert.ok(prepared.slice(1).some(n=>n<3));
  console.info('Shared material preparation: 4 concurrent clients at +300 ms RTT; shortage is atomic, duplicate requests preserve exact stock.');
  const {verifyRealtime}=await import('./realtime-smoke.mjs');
  await verifyRealtime(base,players,call);
  const {verifyPrediction}=await import('./prediction-smoke.mjs');
  await verifyPrediction(base,players,call);
  if(process.send){
    const cloudProbe=type=>new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Cloud conflict probe timed out')),15000);
      process.once('message',message=>{clearTimeout(timer);if(message?.type==='cloud-conflict-ok')resolve();else reject(Error('Cloud conflict probe failed'));});
      process.send({type});
    });
    await cloudProbe('inject-cloud-conflict');
    await new Promise(resolve=>setTimeout(resolve,6000));
    await call('/api/shared',{op:'connect'},cookie,'',503);
    await cloudProbe('verify-cloud-conflict');
    console.info('Concurrent external D1 save: room blocked with 503; external revision and payload preserved.');
  }
  assert.equal((await call('/api/lobby',{op:'leave'})).room,null);
  await call('/api/shared',{op:'connect'},guestCookie,'',410);
  const restored=await call('/api/world',{op:'session'},guestCookie);assert.equal(restored.state.gold,privateGuest.state.gold);assert.deepEqual(restored.state.inventory,privateGuest.state.inventory);
  console.info('Cold D1: four independent players, simultaneous writes at +300 ms RTT, lost-response replay, private bags, shared clock and host close passed.');
}
