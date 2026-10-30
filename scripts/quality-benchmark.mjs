import * as T from 'three';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=resolve(process.argv[2]||'.');
const {ValleyScene}=await import(pathToFileURL(resolve(root,'lib/game/scene.ts')).href);
const {Engine,createState}=await import(pathToFileURL(resolve(root,'lib/game/model.ts')).href);
const s=createState(84621);s.day=4;s.won=true;
const view=Object.create(ValleyScene.prototype);
Object.assign(view,{engine:new Engine(s),root:new T.Group(),tileVisuals:new T.Group(),materials:new Map(),geometries:new Map(),textures:{},tiles:new Map(),bridge:new T.Group(),structures:new Map(),creatures:new Map(),chunkMeshes:new Map(),dirtyChunks:new Set(),villagers:[],landmarkGroups:[],wheels:[],pickables:[],lastSeason:-1,renderer:{shadowMap:{needsUpdate:false}}});
view.makeTerrain();view.sync();const chunks=[];
while(view.dirtyChunks.size){const n=performance.now();view.flushChunk();chunks.push(performance.now()-n);}
const camera=new T.OrthographicCamera(-17*1280/720/2,17*1280/720/2,8.5,-8.5,.1,180),frustum=new T.Frustum(),matrix=new T.Matrix4();
const frame=(i)=>{const x=s.player.x+i*.025,z=s.player.z;camera.position.set(x+Math.sin(.65)*32,28,z+Math.cos(.65)*32);camera.lookAt(x,0,z);camera.updateMatrixWorld();frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));view.worldBatches.setView(frustum,String(i));};
const sample=(run,count)=>{const a=[];for(let i=0;i<count+30;i++){const t=performance.now();run(i);if(i>=30)a.push(performance.now()-t);}a.sort((a,b)=>a-b);return {medianMs:a[Math.floor(a.length*.5)],p95Ms:a[Math.floor(a.length*.95)],maxMs:a.at(-1)};};
const sync=sample(()=>view.sync(),200),culling=sample(i=>frame(i),240);
frame(0);let triangles=0,instances=0,total=0;for(const {mesh,slots}of view.worldBatches.buckets.values()){triangles+=mesh.count*(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;instances+=mesh.count;total+=slots.length;}
console.log(JSON.stringify({scope:'CPU scene preparation/sync/culling, not browser FPS',root,seed:s.seed,tiles:s.tiles.length,quality:'balanced',resolution:[1280,720],zoom:17,angle:.65,chunks, sync,culling,worldTriangles:triangles,visibleInstances:instances,totalInstances:total},null,2));
view.forestTrees?.dispose();view.worldBatches.dispose();for(const g of view.geometries.values())g.dispose();for(const m of view.materials.values())m.dispose();
