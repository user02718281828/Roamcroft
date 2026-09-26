import type { Pose } from './protocol.ts';

type Sample = Pose & { at: number };
const angle = (a: number, b: number, t: number) =>
  a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;

// Render a short history instead of chasing each half-second network update.
// Timestamps from the server reject duplicates; local arrival time avoids clock skew.
export class RemoteMotion {
  private samples: Sample[] = [];
  private stamp = -Infinity;
  private displayed: Pose | null = null;
  push(pose: Pose, stamp: number, received: number) {
    if (stamp <= this.stamp) return;
    this.stamp = stamp;
    this.samples.push({ ...pose, at: received });
    if (this.samples.length > 12) this.samples.shift();
    this.displayed ??= { ...pose };
  }
  sample(now: number, dt: number): Pose | null {
    if (!this.displayed || !this.samples.length) return null;
    const target = now - 650;
    while (this.samples.length > 2 && this.samples[1].at <= target)
      this.samples.shift();
    const a = this.samples[0], b = this.samples[1];
    let desired: Pose = a;
    if (b) {
      const span = Math.max(1, b.at - a.at);
      const t = Math.max(0, Math.min(1, (target - a.at) / span));
      desired = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t,
        facing: angle(a.facing, b.facing, t) };
      if (target > b.at) {
        const distance = Math.hypot(b.x - a.x, b.z - a.z);
        const extra = Math.min(200, target - b.at) / 1000;
        const speed = Math.min(6, distance / (span / 1000));
        desired.x += (b.x - a.x) / (distance || 1) * speed * extra;
        desired.z += (b.z - a.z) / (distance || 1) * speed * extra;
      }
    }
    // A late packet or reconnect never snaps the existing mesh across the map.
    const p = this.displayed, dx = desired.x - p.x, dz = desired.z - p.z;
    const distance = Math.hypot(dx, dz), step = Math.min(distance, 8 * Math.min(.08, Math.max(0, dt)));
    p.x += dx / (distance || 1) * step;
    p.z += dz / (distance || 1) * step;
    p.facing = angle(p.facing, desired.facing, 1 - Math.exp(-12 * dt));
    return { ...p };
  }
}

export function withinSharedRange(from: Pick<Pose,'x'|'z'>, to: Pick<Pose,'x'|'z'>, anchors: Pick<Pose,'x'|'z'>[]) {
  return anchors.every(a => {
    const before = Math.hypot(from.x-a.x,from.z-a.z);
    return Math.hypot(to.x-a.x,to.z-a.z) <= Math.max(20,before);
  });
}
