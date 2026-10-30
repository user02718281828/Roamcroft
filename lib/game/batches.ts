import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Slot = {
  bucket: Bucket;
  index: number;
  drawIndex: number;
  chunk: string;
  matrix: T.Matrix4;
  color: T.Color;
  bounds: T.Box3;
};
type Bucket = {
  mesh: T.InstancedMesh;
  slots: Slot[];
  visible: Slot[];
  dirty: boolean;
  first: number;
  end: number;
};
const color = new T.Color();

// A material's color belongs to the instance, so differently colored trees,
// crops and rocks share draw calls across every streamed region.
export class WorldBatches {
  buckets = new Map<string, Bucket>();
  chunks = new Map<string, Slot[]>();
  private chunkBounds=new Map<string,T.Box3>();
  private chunkVisibility=new Map<string,number>();
  root: T.Group;
  visibleChunks: Set<string> | null = null;
  view: T.Frustum | null = null;
  private viewKey = '';
  setView(view: T.Frustum, key: string) {
    if (key === this.viewKey) return false;
    this.viewKey = key;
    this.view = this.view?this.view.copy(view):view.clone();
    return this.refresh();
  }
  setVisibleChunks(keys: Set<string>) {
    if (
      this.visibleChunks &&
      keys.size === this.visibleChunks.size &&
      [...keys].every((key) => this.visibleChunks!.has(key))
    )
      return false;
    this.visibleChunks = keys;
    this.refresh();
    return true;
  }
  private write(slot: Slot, index: number) {
    const b = slot.bucket;
    slot.drawIndex = index;
    b.mesh.setMatrixAt(index, slot.matrix);
    b.mesh.setColorAt(index, slot.color);
    b.dirty = true;
    b.first = Math.min(b.first, index);
    b.end = Math.max(b.end, index + 1);
  }
  private hide(slot: Slot) {
    if (slot.drawIndex < 0) return;
    const b = slot.bucket,
      index = slot.drawIndex,
      last = b.visible.pop()!;
    if (last !== slot) {
      b.visible[index] = last;
      this.write(last, index);
    }
    slot.drawIndex = -1;
    b.dirty = true;
  }
  private refresh() {
    let changed = false;
    // Reject/accept whole chunks first. Fully inside/outside chunks need no
    // per-instance work until their classification or membership changes.
    for(const [key,slots]of this.chunks){
      let classification=1;
      if(this.visibleChunks&&!this.visibleChunks.has(key))classification=-1;
      else if(this.view){
        const box=this.chunkBounds.get(key)!;
        for(const plane of this.view.planes){
          const n=plane.normal,min=box.min,max=box.max;
          const far=n.x*(n.x>=0?max.x:min.x)+n.y*(n.y>=0?max.y:min.y)+n.z*(n.z>=0?max.z:min.z)+plane.constant;
          if(far<0){classification=-1;break;}
          const near=n.x*(n.x>=0?min.x:max.x)+n.y*(n.y>=0?min.y:max.y)+n.z*(n.z>=0?min.z:max.z)+plane.constant;
          if(near<0)classification=0;
        }
      }
      if(classification!==0&&this.chunkVisibility.get(key)===classification)continue;
      this.chunkVisibility.set(key,classification);
      for(const slot of slots){
        const visible=classification===1||(classification===0&&this.view!.intersectsBox(slot.bounds));
        if (!visible) this.hide(slot);
        else if (slot.drawIndex < 0) {
          const b=slot.bucket;
          const index = b.visible.length;
          b.visible.push(slot);
          this.write(slot, index);
        }
      }
    }
    for (const b of this.buckets.values()) {
      if (!b.dirty) continue;
      changed = true;
      const mesh = b.mesh;
      mesh.count = b.visible.length;
      if (b.end > b.first) {
        // Keep pending ranges until Three uploads them; several chunks can change
        // before one rendered frame. Only newly visible/swapped slots are written.
        mesh.instanceMatrix.addUpdateRange(
          b.first * 16,
          (b.end - b.first) * 16,
        );
        mesh.instanceMatrix.needsUpdate = true;
        mesh.instanceColor!.addUpdateRange(b.first * 3, (b.end - b.first) * 3);
        mesh.instanceColor!.needsUpdate = true;
      }
      b.dirty = false;
      b.first = Infinity;
      b.end = 0;
    }
    return changed;
  }
  constructor(root: T.Group) {
    this.root = root;
  }
  removeMany(keys: string[]) {
    for (const key of keys) this.remove(key, false);
    if (keys.length) this.refresh();
  }
  remove(key: string, refresh = true) {
    for (const slot of this.chunks.get(key) ?? []) {
      this.hide(slot);
      const { bucket, index } = slot;
      const last = bucket.slots.pop()!;
      if (last !== slot) {
        last.index = index;
        bucket.slots[index] = last;
      }
    }
    this.chunks.delete(key);
    this.chunkBounds.delete(key);this.chunkVisibility.delete(key);
    if (refresh) this.refresh();
  }
  replace(key: string, objects: T.Mesh[]) {
    this.remove(key, false);
    const slots: Slot[] = [];
    const partBounds = new T.Box3();
    for (const object of objects) {
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      partBounds
        .copy(object.geometry.boundingBox!)
        .applyMatrix4(object.matrixWorld);
      const source = object.material as T.MeshStandardMaterial;
      const materialKey = `${object.geometry.uuid}:${source.map?.uuid ?? ''}:${source.emissive.getHex()}`;
      let bucket = this.buckets.get(materialKey);
      if (!bucket) {
        const material = source.clone();
        material.color.set(0xffffff);
        const mesh = new T.InstancedMesh(object.geometry, material, 1024);
        mesh.count = 0;
        mesh.setColorAt(0, color);
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        mesh.castShadow = mesh.receiveShadow = true;
        // setView compacts visible instances while preserving the source slots.
        mesh.frustumCulled = false;
        this.root.add(mesh);
        bucket = {
          mesh,
          slots: [],
          visible: [],
          dirty: false,
          first: Infinity,
          end: 0,
        };
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
        replacement.count = previous.count;
        replacement.instanceMatrix.setUsage(T.DynamicDrawUsage);
        replacement.castShadow = replacement.receiveShadow = true;
        replacement.frustumCulled = false;
        this.root.remove(previous);
        previous.dispose();
        this.root.add(replacement);
        bucket.mesh = replacement;
      }
      const slot = {
        bucket,
        index: bucket.slots.length,
        drawIndex: -1,
        chunk: key,
        matrix: object.matrixWorld.clone(),
        color: source.color.clone(),
        bounds: partBounds.clone().expandByScalar(2),
      };
      bucket.slots.push(slot);
      slots.push(slot);
    }
    this.chunks.set(key, slots);
    const bounds=new T.Box3();for(const slot of slots)bounds.union(slot.bounds);
    this.chunkBounds.set(key,bounds);
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
    this.chunkBounds.clear();this.chunkVisibility.clear();
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
