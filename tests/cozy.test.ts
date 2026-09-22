import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  WorldBatches,
  compactModel,
  releaseModel,
} from '../lib/game/batches.ts';
import { Engine, createState, tileAt, walkable } from '../lib/game/model.ts';
import { BUILDINGS } from '../lib/game/data.ts';
import { ValleyScene } from '../lib/game/scene.ts';
import { deserialize, serialize } from '../lib/game/save.ts';
import { generatedTile } from '../lib/game/world.ts';

test('differently colored regions share draws and slot compaction preserves remaining transforms', () => {
  const pool = new WorldBatches(new T.Group());
  const geometry = new T.BoxGeometry();
  const materials: T.Material[] = [];
  for (let chunk = 0; chunk < 25; chunk++) {
    const meshes: T.Mesh[] = [];
    for (let i = 0; i < 50; i++) {
      const material = new T.MeshStandardMaterial({
        color: new T.Color().setHSL(i / 50, 0.6, 0.5),
      });
      materials.push(material);
      const mesh = new T.Mesh(geometry, material);
      mesh.position.x = chunk * 50 + i;
      mesh.updateMatrixWorld(true);
      meshes.push(mesh);
    }
    pool.replace(String(chunk), meshes);
  }
  assert.equal(pool.buckets.size, 1);
  for (let chunk = 0; chunk < 25; chunk += 2) pool.remove(String(chunk));
  const batch = [...pool.buckets.values()][0].mesh;
  assert.equal(batch.count, 600);
  const positions = new Set<number>();
  const matrix = new T.Matrix4();
  for (let i = 0; i < batch.count; i++) {
    batch.getMatrixAt(i, matrix);
    positions.add(matrix.elements[12]);
  }
  for (let chunk = 1; chunk < 25; chunk += 2)
    for (let i = 0; i < 50; i++) assert.ok(positions.has(chunk * 50 + i));
  pool.dispose();
  geometry.dispose();
  materials.forEach((m) => m.dispose());
});

test('animals walk continuously, explore pasture, respect obstacles and return at night', () => {
  const e = new Engine(createState());
  e.s.gold = 10000;
  for (const tile of e.s.tiles)
    if (Math.hypot(tile.x - 17, tile.z - 20) < 10 && tile.terrain !== 'water') {
      tile.resource = null;
      tile.crop = null;
    }
  assert.equal(e.build('coop', 19, 21), true);
  assert.equal(e.buyAnimal('chicken'), true);
  const a = e.s.animals[0],
    home = e.s.buildings.find((b) => b.id === a.home)!;
  let farthest = 0;
  e.s.time = 0.4;
  for (let i = 0; i < 2400; i++) {
    const x = a.x,
      z = a.z;
    e.wanderAnimals(0.1);
    assert.ok(
      Math.hypot(a.x - x, a.z - z) <= 0.116,
      'animal must not teleport',
    );
    assert.ok(walkable(e.s, a.x, a.z));
    farthest = Math.max(farthest, Math.hypot(a.x - home.x, a.z - home.z));
  }
  assert.ok(farthest > 3, 'animals explore beyond the former small pen');
  e.s.time = 0.9;
  for (let i = 0; i < 1800; i++) e.wanderAnimals(0.1);
  assert.ok(Math.hypot(a.x - home.x, a.z - home.z) < 2.5);
  assert.equal(e.animalMotion.get(a.id)?.mood, 'sleeping');
  assert.equal(e.petAnimal(a.id), true);
  assert.equal(e.animalMotion.get(a.id)?.follow, 18);
  assert.deepEqual(deserialize(serialize(e.s)), e.s);
});

test('new processing buildings consume real inputs and produce supplies that survive saves', () => {
  const e = new Engine(createState());
  e.s.level = 10;
  e.s.inventory = {
    plank: 100,
    stone: 100,
    copperbar: 100,
    brick: 100,
    bar: 100,
    rope: 100,
    wheat: 3,
    fish: 2,
    wood: 1,
    wool: 2,
    fiber: 1,
  };
  for (const [type, x] of [
    ['feedmill', 16],
    ['smokehouse', 18],
    ['loom', 20],
  ] as const) {
    const tile = tileAt(e.s, x, 22)!;
    tile.crop = null;
    tile.resource = null;
    assert.equal(e.build(type, x, 22), true);
  }
  for (let i = 0; i < 140; i++) e.systems(0.5);
  assert.equal(e.s.inventory.feed, 9);
  assert.equal(e.s.inventory.grilledfish, 3);
  assert.equal(e.s.inventory.bandage, 3);
  assert.equal(e.s.inventory.fish, 0);
  assert.equal(e.s.inventory.wool, 0);
  assert.equal(e.s.stats.production, 3);
  assert.deepEqual(deserialize(serialize(e.s)), e.s);
});

test('all building models retain finite selectable geometry after batching', () => {
  const view = Object.create(ValleyScene.prototype) as ValleyScene;
  Object.assign(view, {
    engine: new Engine(createState()),
    materials: new Map(),
    geometries: new Map(),
    textures: {},
    wheels: [],
  });
  for (const type of Object.keys(BUILDINGS)) {
    const group = new T.Group();
    view.building(
      { type, id: 1, x: 0, z: 0, level: 3, hp: 100, enabled: true, timer: 0, plantedDay:1, harvestDay:0 },
      group,
    );
    compactModel(group);
    let draws = 0;
    group.traverse((node) => {
      if (!(node instanceof T.Mesh)) return;
      draws++;
      assert.ok(
        [...node.geometry.getAttribute('position').array].every(
          Number.isFinite,
        ),
      );
    });
    assert.ok(draws > 0 && draws <= 4, `${type}: ${draws} draws`);
    releaseModel(group);
  }
  for (const geometry of view.geometries.values()) geometry.dispose();
  for (const material of view.materials.values()) material.dispose();
});

test('new worlds have crossable rivers while the original generator stays compatible', () => {
  assert.equal(generatedTile(84621, 122, 0, 2).terrain, 'water');
  assert.equal(generatedTile(84621, 122, 0, 1).terrain, 'grass');
  for (let x = 117; x <= 128; x++)
    assert.notEqual(generatedTile(84621, x, 6, 2).terrain, 'water');
});
