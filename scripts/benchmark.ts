import {performance} from 'node:perf_hooks';
import {Engine,createState,walkable} from '../lib/game/model.ts';
import {sunlight,humanPose,animalPose} from '../lib/game/living.ts';
const engine=new Engine(createState());
engine.s.won=true;engine.s.day=4;
for(let i=0;i<24;i++){
 const home={id:engine.s.nextId++,type:'coop',x:9+i%8,z:24+Math.floor(i/8),level:3,hp:200,timer:0,enabled:true};
 engine.s.buildings.push(home);
 const spot=engine.nearbyFree(home.x,home.z);
 if(spot)for(let j=0;j<3;j++)engine.s.animals.push({id:engine.s.nextId++,type:'chicken',home:home.id,...spot,timer:0,fed:true});
}
const summary=(times:number[])=>{times.sort((a,b)=>a-b);return {medianMs:+times[Math.floor(times.length*.5)].toFixed(3),p95Ms:+times[Math.floor(times.length*.95)].toFixed(3),maxMs:+times.at(-1)!.toFixed(3)};};
const frames:number[]=[],routes:number[]=[];
for(let i=0;i<3600;i++){
 const started=performance.now();engine.tick(1/60);sunlight(engine.s.time);humanPose('running',i/60);
 for(const a of engine.s.animals)animalPose(engine.animalMotion.get(a.id)?.mood||'grazing',i/60);
 if(i>120)frames.push(performance.now()-started);
}
for(const target of engine.s.tiles.filter(t=>walkable(engine.s,t.x,t.z)).filter((_,i)=>i%5===0)){
 const started=performance.now();engine.findPath(target.x,target.z);routes.push(performance.now()-started);
}
console.info(JSON.stringify({scope:'CPU simulation and pose calculations; not browser GPU FPS',activeTiles:engine.s.tiles.length,animals:engine.s.animals.length,simulation:summary(frames),aStar:summary(routes)},null,2));
