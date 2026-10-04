import * as T from 'three';
type Bucket = { mesh: T.InstancedMesh; capacity: number };
type Part = { source: T.Mesh; bucket: Bucket };
// Animal models are identical within each species; only their articulated transforms differ.
// Keep the original hierarchy for animation and interaction, instance its rendered parts.
export class AnimalBatches {
  buckets = new Map<string, Bucket>();
  private registered = new WeakMap<T.Group, Part[]>();
  private sphere = new T.Sphere(new T.Vector3(), 3);
  constructor(readonlyRoot: T.Group) {
    this.root = readonlyRoot;
  }
  private root: T.Group;
  update(animals: { type: string; group: T.Group }[], frustum: T.Frustum) {
    for (const bucket of this.buckets.values()) bucket.mesh.count = 0;
    for (const { type, group } of animals) {
      let parts = this.registered.get(group);
      if (!parts) {
        parts = [];
        let index = 0;
        group.traverse((node) => {
          if (!(node instanceof T.Mesh)) return;
          const key = `${type}:${index++}`;
          let bucket = this.buckets.get(key);
          if (!bucket) {
            const mesh = new T.InstancedMesh(
              node.geometry.clone(),
              (node.material as T.Material).clone(),
              64,
            );
            mesh.count = 0;
            mesh.castShadow = node.castShadow;
            mesh.receiveShadow = node.receiveShadow;
            mesh.frustumCulled = false;
            mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
            this.root.add(mesh);
            bucket = { mesh, capacity: 64 };
            this.buckets.set(key, bucket);
          }
          node.layers.disable(0);
          parts!.push({ source: node, bucket: bucket! });
        });
        this.registered.set(group, parts);
      }
      this.sphere.center.set(
        group.position.x,
        group.position.y + 1,
        group.position.z,
      );
      if (!group.visible || !frustum.intersectsSphere(this.sphere)) continue;
      group.updateMatrixWorld(true);
      for (const { source, bucket } of parts) {
        let visible = true;
        for (
          let node: T.Object3D | null = source;
          node && node !== group;
          node = node.parent
        )
          if (!node.visible) {
            visible = false;
            break;
          }
        if (!visible) continue;
        if (bucket.mesh.count === bucket.capacity) {
          const old = bucket.mesh;
          bucket.capacity *= 2;
          const mesh = new T.InstancedMesh(
            old.geometry,
            old.material,
            bucket.capacity,
          );
          mesh.instanceMatrix.array.set(old.instanceMatrix.array);
          mesh.count = old.count;
          mesh.castShadow = old.castShadow;
          mesh.receiveShadow = old.receiveShadow;
          mesh.frustumCulled = false;
          mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
          this.root.remove(old);
          old.dispose();
          this.root.add(mesh);
          bucket.mesh = mesh;
        }
        bucket.mesh.setMatrixAt(bucket.mesh.count++, source.matrixWorld);
      }
    }
    for (const { mesh } of this.buckets.values()) {
      mesh.instanceMatrix.clearUpdateRanges();
      if (mesh.count) {
        mesh.instanceMatrix.addUpdateRange(0, mesh.count * 16);
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }
  dispose() {
    for (const { mesh } of this.buckets.values()) {
      this.root.remove(mesh);
      mesh.dispose();
      mesh.geometry.dispose();
      (mesh.material as T.Material).dispose();
    }
    this.buckets.clear();
  }
}
