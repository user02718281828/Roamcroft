import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { WorldBatches } from '../lib/game/batches.ts';

test('unchanged visibility does not upload matrices or invalidate shadows', () => {
  const pool = new WorldBatches(new T.Group()),
    geometry = new T.BoxGeometry(),
    material = new T.MeshStandardMaterial();
  const object = new T.Mesh(geometry, material);
  object.updateMatrixWorld(true);
  pool.replace('home', [object]);
  const camera = new T.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
  camera.position.z = 20;
  camera.updateMatrixWorld(true);
  const frustum = new T.Frustum().setFromProjectionMatrix(
    new T.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    ),
  );
  pool.setView(frustum, 'a');
  const bucket = [...pool.buckets.values()][0],
    version = bucket.mesh.instanceMatrix.version;
  bucket.mesh.instanceMatrix.clearUpdateRanges();
  bucket.mesh.instanceColor!.clearUpdateRanges();
  assert.equal(pool.setView(frustum, 'b'), false);
  assert.equal(bucket.mesh.instanceMatrix.version, version);
  assert.equal(bucket.mesh.instanceMatrix.updateRanges.length, 0);
  pool.dispose();
  geometry.dispose();
  material.dispose();
});

test('incremental visible slots preserve transforms and colors through repeated culling and edits', () => {
  const pool = new WorldBatches(new T.Group()),
    geometry = new T.BoxGeometry(),
    material = new T.MeshStandardMaterial({ color: 0x83b256 });
  const make = (x: number) => {
    const object = new T.Mesh(geometry, material);
    object.position.x = x;
    object.updateMatrixWorld(true);
    return object;
  };
  const camera = new T.OrthographicCamera(-5, 5, 5, -5, 0.1, 100),
    frustum = new T.Frustum(),
    matrix = new T.Matrix4(),
    color = new T.Color();
  for (let i = 0; i < 12; i++) pool.replace(String(i), [make(i * 3)]);
  for (let step = 0; step < 60; step++) {
    const x = (step % 20) * 2;
    camera.position.set(x, 0, 20);
    camera.lookAt(x, 0, 0);
    camera.updateMatrixWorld(true);
    frustum.setFromProjectionMatrix(
      matrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      ),
    );
    pool.setView(frustum, String(step));
    if (step % 7 === 0) pool.replace('edit', [make(x + 1)]);
    if (step % 11 === 0) pool.remove('edit');
    const bucket = [...pool.buckets.values()][0],
      expected = bucket.slots
        .filter((s) => frustum.intersectsBox(s.bounds))
        .map((s) => s.matrix.elements[12])
        .sort((a, b) => a - b);
    const actual: number[] = [];
    for (let i = 0; i < bucket.mesh.count; i++) {
      bucket.mesh.getMatrixAt(i, matrix);
      actual.push(matrix.elements[12]);
      bucket.mesh.getColorAt(i, color);
      assert.equal(color.getHex(), 0x83b256);
    }
    assert.deepEqual(
      actual.sort((a, b) => a - b),
      expected,
    );
    // Emulate completed renderer uploads; repeated edits above share a frame.
    bucket.mesh.instanceMatrix.clearUpdateRanges();
    bucket.mesh.instanceColor!.clearUpdateRanges();
  }
  pool.dispose();
  geometry.dispose();
  material.dispose();
});
