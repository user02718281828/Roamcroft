import type { AnimalAction } from './living.ts';

// Visual-only following of authoritative, infrequent world snapshots.
// Never extrapolate or modify the animal used by gameplay/save validation.
export class AnimalPresentation {
  x: number;
  z: number;
  facing = 0;
  moving = false;
  mood: AnimalAction = 'grazing';
  constructor(p: { x: number; z: number }) {
    this.x = p.x;
    this.z = p.z;
  }
  sample(target: { x: number; z: number }, dt: number, night: boolean) {
    const elapsed = Math.min(0.1, Math.max(0, dt));
    const dx = target.x - this.x,
      dz = target.z - this.z,
      distance = Math.hypot(dx, dz);
    const step = Math.min(distance * (1 - Math.exp(-elapsed * 8)), 3 * elapsed);
    this.moving = elapsed > 0 && step / elapsed > 0.03;
    if (this.moving) this.facing = Math.atan2(dx, dz);
    this.x += (dx / (distance || 1)) * step;
    this.z += (dz / (distance || 1)) * step;
    this.mood = this.moving ? 'walking' : night ? 'sleeping' : 'grazing';
    return this;
  }
}
