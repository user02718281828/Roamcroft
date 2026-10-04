import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { ValleyScene } from '../lib/game/scene.ts';
import { Engine, createState, tileAt } from '../lib/game/model.ts';
import { shiftWindow } from '../lib/game/world.ts';
import { performance } from 'node:perf_hooks';
test('elevated roof raycasts return the owning building tile', () => {
  const engine = new Engine(createState());
  const view = Object.create(ValleyScene.prototype) as ValleyScene;
  view.engine = engine;
  view.materials = new Map();
  view.geometries = new Map();
  view.textures = {};
  view.wheels = [];
  view.camera = new T.OrthographicCamera(-12, 12, 8, -8, 0.1, 180);
  view.camera.position.set(38, 28, 42);
  view.camera.lookAt(15, 0, 17);
  view.camera.updateProjectionMatrix();
  view.camera.updateMatrixWorld(true);
  view.pointer = new T.Vector2();
  view.ray = new T.Raycaster();
  view.plane = new T.Plane(new T.Vector3(0, 1, 0), -0.08);
  view.canvas = {
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 1200,
      height: 800,
    }),
  } as HTMLCanvasElement;
  const home = engine.s.buildings[0],
    g = new T.Group();
  view.building(home, g);
  g.position.set(home.x, 0, home.z);
  g.userData.tile = { x: home.x, z: home.z };
  g.updateMatrixWorld(true);
  view.pickables = [g];
  view.ground = new T.InstancedMesh(
    new T.BoxGeometry(),
    new T.MeshBasicMaterial(),
    0,
  );
  const projected = new T.Vector3(home.x, 1.8, home.z).project(view.camera);
  const selected = view.pick((projected.x + 1) * 600, (1 - projected.y) * 400);
  assert.deepEqual(selected, { x: home.x, z: home.z });
  for (const geo of view.geometries.values()) geo.dispose();
  for (const mat of view.materials.values()) mat.dispose();
});

test('a crop change rebuilds one chunk; crossing regions keeps geometry bounded', (t) => {
  const e = new Engine(createState());
  const view = Object.create(ValleyScene.prototype) as ValleyScene;
  Object.assign(view, {
    engine: e,
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
  const times: number[] = [];
  while (view.dirtyChunks.size) {
    const start = performance.now();
    view.flushChunk();
    times.push(performance.now() - start);
  }
  assert.equal(view.chunkMeshes.size, 25);
  const original = [...view.chunkMeshes.values()];
  tileAt(e.s, 18, 18)!.water = 0;
  view.sync();
  assert.equal(view.dirtyChunks.size, 1);
  view.flushChunk();
  assert.equal(
    [...view.chunkMeshes.values()].filter((g) => original.includes(g)).length,
    24,
  );
  for (let i = 0; i < 12; i++) {
    shiftWindow(e.s, 30 + i * 12, 18);
    view.sync();
    assert.ok(view.chunkMeshes.size <= 25);
    while (view.dirtyChunks.size) view.flushChunk();
    assert.equal(view.tiles.size, 3600);
    const matrix=new T.Matrix4();
    for(const tile of e.s.tiles){
      const slot=((tile.z%60+60)%60)*60+(tile.x%60+60)%60;
      view.ground.getMatrixAt(slot,matrix);
      assert.equal(matrix.elements[12],tile.x);assert.equal(matrix.elements[14],tile.z);
      assert.ok(view.ground.boundingSphere!.containsPoint(new T.Vector3(tile.x,tile.height,tile.z)));
    }
    assert.equal(view.chunkMeshes.size, 25);
    assert.ok(
      view.worldBatches!.buckets.size < 18,
      `Static world draw calls ${view.worldBatches!.buckets.size}`,
    );
    assert.ok(view.pickables.length < 3605);
  }
  for (let i = 0; i < 8; i++) {
    shiftWindow(e.s, 800 + i * 60, -100);
    view.sync();
  }
  while (view.dirtyChunks.size) view.flushChunk();
  assert.equal(
    view.chunkMeshes.size,
    25,
    'rapid travel must discard obsolete queued chunks',
  );
  assert.equal(view.worldBatches!.chunks.size, 25);
  t.diagnostic(
    `Static world: ${view.worldBatches!.buckets.size} draw calls across 25 chunks`,
  );
  t.diagnostic(
    `Initial chunk geometry preparation: ${times.map((x) => x.toFixed(1)).join(', ')} ms per chunk; one chunk processed per frame`,
  );
  for (const group of view.chunkMeshes.values())
    group.traverse((o) => {
      if (o instanceof T.Mesh) o.geometry.dispose();
    });
  for (const geometry of view.geometries.values()) geometry.dispose();
  for (const material of view.materials.values()) material.dispose();
});

test('quality modes share direct rendering and cap pixel density', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    value: { devicePixelRatio: 3 },
    configurable: true,
  });
  try {
    const view = Object.create(ValleyScene.prototype) as ValleyScene;
    let density = 0,
      sizes = 0;
    Object.assign(view, {
      renderer: {
        shadowMap: { enabled: false },
        setPixelRatio: (n: number) => (density = n),
      },
      canvas: { parentElement: {} },
      flowers: { visible: false },
      resize: () => sizes++,
    });
    view.setQuality(true);
    assert.equal(view.flowers.visible,true);
    assert.equal(view.renderer.shadowMap.enabled, true);
    assert.equal(density, 1.35);
    view.setQuality(false);
    assert.equal(view.renderer.shadowMap.enabled, false);
    assert.equal(density, 1);
    assert.equal(sizes, 2);
    assert.equal('composer' in view, false);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
