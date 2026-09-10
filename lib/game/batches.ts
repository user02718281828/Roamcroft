import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Slot = { bucket: Bucket; index: number };
type Bucket = { mesh: T.InstancedMesh; slots: Slot[] };
const color = new T.Color();

// A material's color belongs to the instance, so differently colored trees,
// crops and rocks share draw calls across every streamed region.
export class WorldBatches {
  buckets = new Map<string, Bucket>();
  chunks = new Map<string, Slot[]>();
  root: T.Group;
  constructor(root: T.Group) {
    this.root = root;
  }
  remove(key: string) {
    for (const slot of this.chunks.get(key) ?? []) {
      const { bucket, index } = slot;
      const last = bucket.slots.pop()!;
      if (last !== slot) {
        const matrix = new T.Matrix4();
        bucket.mesh.getMatrixAt(last.index, matrix);
        bucket.mesh.getColorAt(last.index, color);
        bucket.mesh.setMatrixAt(index, matrix);
        bucket.mesh.setColorAt(index, color);
        last.index = index;
        bucket.slots[index] = last;
      }
      bucket.mesh.count = bucket.slots.length;
      bucket.mesh.instanceMatrix.needsUpdate = true;
      if (bucket.mesh.instanceColor)
        bucket.mesh.instanceColor.needsUpdate = true;
    }
    this.chunks.delete(key);
  }
  replace(key: string, objects: T.Mesh[]) {
    this.remove(key);
    const slots: Slot[] = [];
    for (const object of objects) {
      const source = object.material as T.MeshStandardMaterial;
      const key = `${object.geometry.uuid}:${source.map?.uuid ?? ''}:${source.emissive.getHex()}`;
      let bucket = this.buckets.get(key);
      if (!bucket) {
        const material = source.clone();
        material.color.set(0xffffff);
        const mesh = new T.InstancedMesh(object.geometry, material, 1024);
        mesh.count = 0;
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        mesh.castShadow = mesh.receiveShadow = true;
        // The active world is bounded. Avoid recomputing an O(n) sphere on
        // every crop change; the renderer clips the individual triangles.
        mesh.frustumCulled = false;
        this.root.add(mesh);
        bucket = { mesh, slots: [] };
        this.buckets.set(key, bucket);
      }
      if (bucket.slots.length === bucket.mesh.instanceMatrix.count) {
        const previous = bucket.mesh;
        const replacement = new T.InstancedMesh(
          previous.geometry,
          previous.material,
          previous.instanceMatrix.count * 2,
        );
        replacement.instanceMatrix.array.set(previous.instanceMatrix.array);
        replacement.setColorAt(0, color);
        replacement.instanceColor!.array.set(previous.instanceColor!.array);
        replacement.instanceMatrix.setUsage(T.DynamicDrawUsage);
        replacement.castShadow = replacement.receiveShadow = true;
        replacement.frustumCulled = false;
        this.root.remove(previous);
        previous.dispose();
        this.root.add(replacement);
        bucket.mesh = replacement;
      }
      const slot = { bucket, index: bucket.slots.length };
      bucket.slots.push(slot);
      slots.push(slot);
      bucket.mesh.setMatrixAt(slot.index, object.matrixWorld);
      bucket.mesh.setColorAt(slot.index, source.color);
      bucket.mesh.count = bucket.slots.length;
      bucket.mesh.instanceMatrix.needsUpdate = true;
      bucket.mesh.instanceColor!.needsUpdate = true;
    }
    this.chunks.set(key, slots);
  }
  dispose() {
    for (const { mesh } of this.buckets.values()) {
      this.root.remove(mesh);
      mesh.dispose();
      (mesh.material as T.Material).dispose();
    }
    this.buckets.clear();
    this.chunks.clear();
  }
}

// Bake colors into static model vertices once, leaving named moving parts,
// lights and labels intact. A detailed barn is a handful of draws, not 50.
export function compactModel(group: T.Group) {
  const meshes: T.Mesh[] = [];
  const collect = (node: T.Object3D) => {
    if ((node !== group && node.userData.animated) || node.userData.compact)
      return;
    if (
      node instanceof T.Mesh &&
      node.material instanceof T.MeshStandardMaterial &&
      !node.material.transparent
    )
      meshes.push(node);
    else for (const child of node.children) collect(child);
  };
  group.updateMatrixWorld(true);
  collect(group);
  const inverse = group.matrixWorld.clone().invert();
  const buckets = new Map<
    string,
    { source: T.MeshStandardMaterial; geometries: T.BufferGeometry[] }
  >();
  for (const mesh of meshes) {
    const source = mesh.material as T.MeshStandardMaterial;
    const key = `${source.map?.uuid ?? ''}:${source.emissive.getHex()}`;
    const geo = mesh.geometry.index
      ? mesh.geometry.toNonIndexed()
      : mesh.geometry.clone();
    geo.applyMatrix4(
      new T.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld),
    );
    const colors = new Float32Array(geo.getAttribute('position').count * 3);
    for (let i = 0; i < colors.length; i += 3) source.color.toArray(colors, i);
    geo.setAttribute('color', new T.BufferAttribute(colors, 3));
    if (!buckets.has(key)) buckets.set(key, { source, geometries: [] });
    buckets.get(key)!.geometries.push(geo);
    mesh.removeFromParent();
  }
  for (const { source, geometries } of buckets.values()) {
    const merged = mergeGeometries(geometries, false);
    for (const geo of geometries) geo.dispose();
    if (!merged) throw new Error('Model geometry attributes disagree');
    const material = source.clone();
    material.color.set(0xffffff);
    material.vertexColors = true;
    const mesh = new T.Mesh(merged, material);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.compact = true;
    group.add(mesh);
  }
}

export function releaseModel(group: T.Group) {
  group.traverse((object) => {
    if (object instanceof T.Mesh && object.userData.compact) {
      object.geometry.dispose();
      (object.material as T.Material).dispose();
    }
  });
}
