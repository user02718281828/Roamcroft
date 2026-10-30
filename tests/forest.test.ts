import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Engine,createState,tileAt} from '../lib/game/model.ts';
import {serialize,deserialize} from '../lib/game/save.ts';
import {shiftWindow,tileKey} from '../lib/game/world.ts';
import {forestReserved,forestWalkable,forestDecoration,forestSpots,forestActor,stepForestActor,forestTreeStyle} from '../lib/game/forest-layout.ts';
import {ForestTrees,forestTree,forestPlant,type ForestArtist} from '../lib/game/forest-art.ts';
import {ForestLife} from '../lib/game/forest-life.ts';

test('forest presentation preserves old saves, resources and deterministic negative streamed cells',()=>{
  const s=new Engine(deserialize(serialize(createState(84621)))).s;
  for(const [x,z]of [[15,19],[-120,-120],[156,-108]]){
    shiftWindow(s,x,z);Object.assign(s.player,{x,z});
    const before=structuredClone(s),reserved=forestReserved(s),spots=forestSpots(s,reserved);
    assert.deepEqual(forestSpots(s,reserved),spots);assert.ok(spots.length<=8);
    for(const kind of ['rabbit','bird'])assert.ok(spots.filter(a=>a.kind===kind).length<=4);
    for(const t of s.tiles){const d=forestDecoration(s,t,reserved);if(d)assert.ok(forestWalkable(s,t.x,t.z,reserved));}
    assert.deepEqual(s,before);assert.deepEqual(deserialize(serialize(s)),before);
    for(const spot of spots)assert.ok(forestWalkable(s,spot.x,spot.z,reserved));
  }
});

test('forest dressing and wildlife exclude construction approaches, crops, paths, water and harvested trunks',()=>{
  const s=new Engine(createState(84621)).s,reserved=forestReserved(s);
  const spot=forestSpots(s,reserved)[0];assert.ok(spot,'normal starting region has wildlife habitat');
  const t=tileAt(s,spot.x,spot.z)!;
  for(const change of [{terrain:'path'},{terrain:'water'},{tilled:true},{crop:'wheat'},{resource:'tree'},{source:'tree'}]){
    const old={...t};Object.assign(t,change);
    assert.equal(forestWalkable(s,t.x,t.z,reserved),false);assert.equal(forestDecoration(s,t,reserved),null);
    Object.assign(t,old);
  }
  s.buildings.push({...s.buildings[0],id:9999,x:t.x+1,z:t.z});
  const blocked=forestReserved(s);assert.ok(blocked.has(tileKey(t.x,t.z)));
  assert.equal(forestDecoration(s,t,blocked),null);assert.ok(!forestSpots(s,blocked).some(a=>a.id===spot.id));
});

test('visual wildlife wanders, flees real player positions and never steps through a new obstacle or changes the economy',()=>{
  const s=new Engine(createState(84621)).s,reserved=forestReserved(s),spot=forestSpots(s,reserved)[0],a=forestActor(spot);
  const before=structuredClone(s);
  stepForestActor(a,s,reserved,.08,0,[{x:a.x-.7,z:a.z}]);
  assert.equal(a.alert,1);assert.ok(a.x>spot.x,'moves away from nearby player');assert.ok(a.moving);
  const positions=new Set<string>();
  for(let i=0;i<600;i++){stepForestActor(a,s,reserved,1/30,i/30,[]);assert.ok(forestWalkable(s,a.x,a.z,reserved));positions.add(`${a.x.toFixed(2)},${a.z.toFixed(2)}`);}
  assert.ok(positions.size>5);assert.equal(a.alert,0);assert.deepEqual(s,before);
  const bird=forestActor({...spot,kind:'bird'});
  stepForestActor(bird,s,reserved,.08,0,[{x:bird.x-.5,z:bird.z}]);
  assert.ok(bird.lift>0&&bird.lift<1.45,'bird takes off smoothly instead of teleporting');
  for(let i=0;i<200;i++)stepForestActor(bird,s,reserved,.05,i*.05,[]);
  assert.ok(bird.lift<.01,'bird lands after the threat leaves');
  const prior={x:a.x,z:a.z};
  const blocked=new Set(s.tiles.map(t=>tileKey(t.x,t.z)));
  stepForestActor(a,s,blocked,.08,3,[{x:a.x-.2,z:a.z}]);assert.deepEqual({x:a.x,z:a.z},prior);
});

function artist(){
  const geometries=new Map<string,T.BufferGeometry>(),material=new T.MeshStandardMaterial();
  const a:ForestArtist={mesh(p,k,c,x,y,z,sx=1,sy=1,sz=1){
    if(!geometries.has(k))geometries.set(k,k==='sphere'?new T.IcosahedronGeometry(1,1):k==='canopy'?new T.IcosahedronGeometry(1,0):k==='cone'?new T.ConeGeometry(1,1,7):k==='cylinder'||k==='twig'?new T.CylinderGeometry(1,1,1,k==='twig'?4:8):new T.BoxGeometry(1,1,1));
    const m=new T.Mesh(geometries.get(k)!,material.clone());m.material.color.setHex(c);m.position.set(x,y,z);m.scale.set(sx,sy,sz);p.add(m);return m;
  }};return a;
}
test('three original tree silhouettes and six ground models stay finite and within small render footprints',()=>{
  const a=artist(),kinds=new Set<string>();
  for(let x=-12;x<12;x++){
    const style=forestTreeStyle(84621,x,9,0),g=new T.Group();kinds.add(style.kind);
    forestTree(a,g,84621,x,9,0);g.updateMatrixWorld(true);
    const b=new T.Box3().setFromObject(g);assert.ok(b.min.x> -1.1&&b.max.x<1.1&&b.max.y<3.8);
    assert.ok(Number.isFinite(b.max.y));assert.ok(g.children.length<=20);
    const triangles=g.children.reduce((sum,o)=>sum+(o instanceof T.Mesh?(o.geometry.index?.count||o.geometry.attributes.position.count)/3:0),0);
    assert.ok(triangles<=310,'tree must fit the mobile geometry budget');
  }
  assert.equal(kinds.size,3);
  for(const kind of ['fern','flowers','mushrooms','shrub','log','grass'] as const){
    const g=new T.Group();forestPlant(a,g,kind,84621,2,3,0);g.updateMatrixWorld(true);
    const b=new T.Box3().setFromObject(g);assert.ok(b.min.x>-.5&&b.max.x<.5&&b.max.y<.6);
  }
});

test('actual forest actor batches are bounded, rebuild safely and release all rendered meshes',()=>{
  const s=new Engine(createState(84621)).s,root=new T.Group(),life=new ForestLife(artist(),root),reserved=forestReserved(s);
  const before=structuredClone(s),view=new T.Frustum();
  life.update(s,reserved,.6,1,view,[s.player]);assert.ok(life.count>0&&life.count<=8);
  assert.ok(root.children.length<=6);assert.ok(root.children.every(n=>n instanceof T.InstancedMesh));
  life.update(s,reserved,.1,1.1,view,[s.player]);assert.deepEqual(s,before);
  shiftWindow(s,-120,-120);Object.assign(s.player,{x:-120,z:-120});
  life.update(s,forestReserved(s),.6,2,view,[s.player]);assert.ok(life.count<=8);
  life.dispose();assert.equal(root.children.length,0);
});

test('rendered trees share three colored models while keeping tile transforms and releasing prototypes once',()=>{
  const s=new Engine(createState()).s,before=structuredClone(s),cache=new ForestTrees(artist()),geometries=new Set<T.BufferGeometry>();
  for(const t of s.tiles.filter(t=>t.resource==='tree')){
    const g=new T.Group();g.position.set(t.x,t.height,t.z);cache.add(g,s.seed,t.x,t.z,0);
    assert.equal(g.children.length,1);const mesh=g.children[0] as T.Mesh;
    assert.ok((mesh.material as T.MeshStandardMaterial).vertexColors);
    geometries.add(mesh.geometry);g.updateMatrixWorld(true);
    const b=new T.Box3().setFromObject(g);assert.ok(b.max.y-t.height<4.1);
    assert.equal(g.position.x,t.x);assert.equal(g.position.z,t.z);
  }
  assert.equal(geometries.size,3);let disposed=0;
  for(const geometry of geometries)geometry.addEventListener('dispose',()=>disposed++);
  cache.dispose();cache.dispose();assert.equal(disposed,3);assert.deepEqual(s,before);
});

test('forest composition leaves clear ground between patches without removing any gameplay resource',()=>{
  const s=new Engine(createState()).s,before=structuredClone(s),reserved=forestReserved(s),kinds=new Set<string>();
  let decorated=0,clear=0;
  for(const t of s.tiles){const value=forestDecoration(s,t,reserved);if(value){decorated++;kinds.add(value);}else if(forestWalkable(s,t.x,t.z,reserved))clear++;}
  assert.equal(kinds.size,6);assert.ok(decorated>30&&clear>decorated*2);
  assert.deepEqual(s,before);
});
