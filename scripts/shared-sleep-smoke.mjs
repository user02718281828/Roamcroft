import assert from 'node:assert/strict';
import { createTestHarness } from 'wrangler';
import { WebSocket } from 'ws';

export async function verifySharedSleep() {
  const server=createTestHarness({workers:[{configPath:'dist/server/wrangler.json'}]});
  const sockets=[];
  try {
    const {url}=await server.listen(),origin=new URL(url).origin;
    const call=async(player,path,body,nonce='')=>{
      const r=await fetch(new URL(path,url),{method:'POST',headers:{Origin:origin,Cookie:player.cookie||'','Content-Type':'application/json','X-Roamcroft-Protocol':'2','X-Roamcroft-Nonce':nonce},body:JSON.stringify(body)});
      assert.ok(r.ok,`${path}: ${r.status}`);
      if(r.headers.has('set-cookie'))player.cookie=r.headers.get('set-cookie').split(';')[0];
      return r.json();
    };
    const players=[];
    for(let i=0;i<4;i++){const p={cookie:'',packet:null};p.packet=await call(p,'/api/world',{op:'session'});players.push(p);}
    // Seed only this isolated harness's D1 before a room exists. There is no
    // debug endpoint or time/position override in the production worker.
    const {DB}=await server.getWorker().getEnv();
    const row=await DB.prepare('SELECT id,world FROM authoritative_worlds WHERE nonce=?').bind(players[0].packet.nonce).first();
    assert.ok(row);
    const world=JSON.parse(row.world);world.state.time=.75;world.state.enemies=[];
    Object.assign(world.state.player,{x:12,z:14,energy:30,health:70});
    for(const tile of world.state.tiles)if(Math.abs(tile.x-13)<=4&&Math.abs(tile.z-15)<=4){tile.terrain='grass';tile.resource=null;}
    await DB.prepare('UPDATE authoritative_worlds SET world=? WHERE id=?').bind(JSON.stringify(world),row.id).run();
    const lobby=await call(players[0],'/api/lobby',{op:'create',name:'Uyku host'});
    for(const [i,p] of players.entries())if(i)await call(p,'/api/lobby',{op:'join',name:`Uyku ${i}`,code:lobby.room.code});
    for(const p of players)p.packet=await call(p,'/api/shared',{op:'connect'});
    async function connect(p){
      const wsURL=new URL('/api/realtime?v=1',url);wsURL.protocol='ws:';
      const ws=new WebSocket(wsURL,{headers:{Cookie:p.cookie,Origin:origin}});sockets.push(ws);
      await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(Error('Sleep WS handshake timeout')),5000);
        ws.once('error',error=>{clearTimeout(timer);reject(error);});
        ws.on('message',data=>{if(JSON.parse(String(data)).type==='hello'){clearTimeout(timer);resolve();}});
      });
      return ws;
    }
    for(const p of players)await connect(p);
    async function vote(p){
      const packet=p.packet,nonce=packet.nonce;
      const body={op:'pulse',revision:packet.revision,pulse:{seq:packet.seq+1,pose:packet.you.player,paused:true,commands:[{seq:packet.commandSeq+1,method:'sleep',args:[]}]}};
      p.packet=await call(p,'/api/shared',body,nonce);return {body,nonce};
    }
    await vote(players[0]);await vote(players[1]);
    assert.equal(players[1].packet.sleep.ready.length,2);
    await new Promise(resolve=>{sockets[3].once('close',resolve);sockets[3].close();});
    // Poll the authoritative HTTP packet until the actual WS close is observed.
    for(let i=0;i<20;i++){
      players[0].packet=await call(players[0],'/api/shared',{op:'connect'});
      if(!players[0].packet.sleep)break;
      await new Promise(resolve=>setTimeout(resolve,25));
    }
    assert.equal(players[0].packet.sleep,null);assert.equal(players[0].packet.state.day,1);
    await connect(players[3]);
    for(const p of players)p.packet=await call(p,'/api/shared',{op:'connect'});
    for(const p of players.slice(0,3))await vote(p);
    assert.equal(players[2].packet.sleep.ready.length,3);
    const start=performance.now(),last=await vote(players[3]),elapsed=performance.now()-start;
    const retry=await call(players[3],'/api/shared',last.body,last.nonce);
    assert.equal(retry.seq,players[3].packet.seq);assert.equal(retry.sleep,null);
    for(const p of players){
      p.packet=await call(p,'/api/shared',{op:'connect'});
      assert.equal(p.packet.state.day,2);assert.equal(p.packet.state.time,.28);assert.equal(p.packet.you.player.energy,100);
    }
    console.info(`Shared sleep real Worker: 4 authenticated WebSockets, disconnect cancels consensus, reconnect needs fresh votes, one dawn after replay. Final vote ACK ${elapsed.toFixed(2)} ms.`);
  } finally {
    for(const ws of sockets)ws.terminate();
    await server.close();
  }
}
