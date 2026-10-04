import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Slot = { bucket: Bucket; index: number; chunk:string; matrix:T.Matrix4; color:T.Color; bounds:T.Box3 };
type Bucket = { mesh: T.InstancedMesh; slots: Slot[] };
const color = new T.Color();

// A material's color belongs to the instance, so differently colored trees,
// crops and rocks share draw calls across every streamed region.
export class WorldBatches {
  buckets = new Map<string, Bucket>();
  chunks = new Map<string, Slot[]>();
  root: T.Group;
  visibleChunks: Set<string> | null = null;
  view:T.Frustum|null=null;
  private viewKey='';
  setView(view:T.Frustum,key:string){
    if(key===this.viewKey)return false;
    this.viewKey=key;this.view=view.clone();this.refresh();return true;
  }
  setVisibleChunks(keys:Set<string>) {
    if(this.visibleChunks&&keys.size===this.visibleChunks.size&&[...keys].every(key=>this.visibleChunks!.has(key)))return false;
    this.visibleChunks=keys;this.refresh();return true;
  }
  private refresh() {
    for(const {mesh,slots} of this.buckets.values()){
      let count=0;
      for(const slot of slots)if((!this.visibleChunks||this.visibleChunks.has(slot.chunk))&&(!this.view||this.view.intersectsBox(slot.bounds))){
        mesh.setMatrixAt(count,slot.matrix);mesh.setColorAt(count++,slot.color);
      }
      mesh.count=count;mesh.instanceMatrix.needsUpdate=true;
      mesh.instanceMatrix.clearUpdateRanges();
      if(count)mesh.instanceMatrix.addUpdateRange(0,count*16);
      if(mesh.instanceColor){
        mesh.instanceColor.clearUpdateRanges();
        if(count)mesh.instanceColor.addUpdateRange(0,count*3);
        mesh.instanceColor.needsUpdate=true;
      }
    }
  }
  constructor(root: T.Group) {
    this.root = root;
  }
  removeMany(keys:string[]){for(const key of keys)this.remove(key,false);if(keys.length)this.refresh();}
  remove(key: string, refresh=true) {
    for (const slot of this.chunks.get(key) ?? []) {
      const { bucket, index } = slot;
      const last = bucket.slots.pop()!;
      if (last !== slot) {
        last.index = index;
        bucket.slots[index] = last;
      }
      bucket.mesh.count = bucket.slots.length;
      bucket.mesh.instanceMatrix.needsUpdate = true;
      if (bucket.mesh.instanceColor)
        bucket.mesh.instanceColor.needsUpdate = true;
    }
    this.chunks.delete(key);
    if(refresh)this.refresh();
  }
  replace(key: string, objects: T.Mesh[]) {
    this.remove(key,false);
    const slots: Slot[] = [];
    const partBounds=new T.Box3();
    for (const object of objects) {
      if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
      partBounds.copy(object.geometry.boundingBox!).applyMatrix4(object.matrixWorld);
      const source = object.material as T.MeshStandardMaterial;
      const materialKey = `${object.geometry.uuid}:${source.map?.uuid ?? ''}:${source.emissive.getHex()}`;
      let bucket = this.buckets.get(materialKey);
      if (!bucket) {
        const material = source.clone();
        material.color.set(0xffffff);
        const mesh = new T.InstancedMesh(object.geometry, material, 1024);
        mesh.count = 0;
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        mesh.castShadow = mesh.receiveShadow = true;
        // setView compacts visible instances while preserving the source slots.
        mesh.frustumCulled = false;
        this.root.add(mesh);
        bucket = { mesh, slots: [] };
        this.buckets.set(materialKey, bucket);
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
      const slot = { bucket, index: bucket.slots.length, chunk:key, matrix:object.matrixWorld.clone(), color:source.color.clone(), bounds:partBounds.clone().expandByScalar(2) };
      bucket.slots.push(slot);
      slots.push(slot);
      bucket.mesh.setMatrixAt(slot.index, object.matrixWorld);
      bucket.mesh.setColorAt(slot.index, source.color);
      bucket.mesh.count = bucket.slots.length;
      bucket.mesh.instanceMatrix.needsUpdate = true;
      bucket.mesh.instanceColor!.needsUpdate = true;
    }
    this.chunks.set(key, slots);
    this.refresh();
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
