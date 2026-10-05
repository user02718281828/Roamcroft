import * as T from 'three';
import { ValleyScene } from '../lib/game/scene.ts';
import { Engine, createState } from '../lib/game/model.ts';
const view = Object.create(ValleyScene.prototype) as ValleyScene;
Object.assign(view, {
  engine: new Engine(createState(84621)),
  root: new T.Group(),
  tileVisuals: new T.Group(),
  materials: new Map(),
  geometries: new Map(),
  textures: {},
  tiles: new Map(),
  bridge: new T.Group(),
  structures: new Map(),
  creatures: new Map(),
  chunkMeshes: new Map(),
  dirtyChunks: new Set(),
  villagers: [],
  landmarkGroups: [],
  wheels: [],
  pickables: [],
  lastSeason: -1,
  renderer: { shadowMap: { needsUpdate: false } },
});
view.makeTerrain();
view.sync();
while (view.dirtyChunks.size) view.flushChunk();
const batches = view.worldBatches!,
  camera = new T.OrthographicCamera(-12, 12, 8, -8, 0.1, 180),
  frustum = new T.Frustum(),
  matrix = new T.Matrix4();
const frames: T.Frustum[] = [];
for (let i = 0; i < 240; i++) {
  const x = 15 + Math.sin(i / 40) * 14,
    z = 19 + Math.sin(i / 31) * 8;
  camera.position.set(x + 23, 28, z + 25);
  camera.lookAt(x, 0, z);
  camera.updateMatrixWorld(true);
  frustum.setFromProjectionMatrix(
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  );
  frames.push(frustum.clone());
}
for (let i = 0; i < 240; i++) batches.setView(frames[i], `warm${i}`);
let writes = 0,
  updates = 0;
for (const { mesh } of batches.buckets.values()) {
  const original = mesh.setMatrixAt;
  mesh.setMatrixAt = function (i, m) {
    writes++;
    return original.call(this, i, m);
  };
}
const times: number[] = [];
for (let n = 0; n < 5; n++)
  for (let i = 0; i < 240; i++) {
    const start = performance.now();
    if (batches.setView(frames[i], `${n}:${i}`)) updates++;
    times.push(performance.now() - start);
  }
times.sort((a, b) => a - b);
console.log(
  JSON.stringify({
    samples: times.length,
    sourceInstances: [...batches.buckets.values()].reduce(
      (n, b) => n + b.slots.length,
      0,
    ),
    meanMs: times.reduce((a, b) => a + b, 0) / times.length,
    p95Ms: times[Math.ceil(times.length * 0.95) - 1],
    p99Ms: times[Math.ceil(times.length * 0.99) - 1],
    maxMs: times.at(-1),
    matrixWrites: writes,
    shadowInvalidations: updates,
  }),
);
