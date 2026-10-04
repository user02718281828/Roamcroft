import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { AnimalBatches } from '../lib/game/actor-batches.ts';
test('animal instances retain articulated transforms, visibility and capacity without duplicate draws', () => {
  const root = new T.Group(),
    batch = new AnimalBatches(root),
    camera = new T.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
  camera.position.set(0, 5, 20);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const frustum = new T.Frustum().setFromProjectionMatrix(
    new T.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    ),
  );
  const animals = Array.from({ length: 70 }, (_, i) => {
    const group = new T.Group(),
      joint = new T.Group();
    group.position.set(i % 5, 0, 0);
    joint.position.set(0, 1, 0);
    joint.rotation.y = i * 0.01;
    const mesh = new T.Mesh(
      new T.BoxGeometry(0.2, 0.2, 0.2),
      new T.MeshStandardMaterial({ color: 0xeeccaa }),
    );
    mesh.position.x = 0.3;
    joint.add(mesh);
    group.add(joint);
    root.add(group);
    return { type: 'chicken', group };
  });
  batch.update(animals, frustum);
  const bucket = [...batch.buckets.values()][0];
  assert.equal(bucket.mesh.count, 70);
  assert.equal(batch.buckets.size, 1);
  assert.equal(bucket.capacity, 128);
  const matrix = new T.Matrix4();
  bucket.mesh.getMatrixAt(15, matrix);
  const source = animals[15].group.children[0].children[0] as T.Mesh;
  matrix.elements.forEach((value, i) =>
    assert.ok(Math.abs(value - source.matrixWorld.elements[i]) < 1e-6),
  );
  assert.equal(
    source.layers.test(camera.layers),
    false,
    'sources must not be drawn a second time',
  );
  animals[0].group.children[0].visible = false;
  animals[1].group.position.x = 100;
  batch.update(animals, frustum);
  assert.equal(bucket.mesh.count, 68);
  batch.update([], frustum);
  assert.equal(bucket.mesh.count, 0);
  batch.dispose();
  assert.equal(batch.buckets.size, 0);
});
