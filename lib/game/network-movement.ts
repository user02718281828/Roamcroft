import { walkable, type State } from './model.ts';
import { movementSpeed } from './progression.ts';
import { withinSharedRange } from '../coop/motion.ts';
import type { Input } from '../coop/realtime-protocol.ts';

// The exact same fixed-duration integrator is used by authority and prediction.
// No client-supplied position, duration or speed is accepted by the server.
export function integrateInput(
  s: State,
  p: State['player'],
  input: Input,
  anchors: { x: number; z: number }[],
  seconds = 0.05,
) {
  const strength = Math.min(1, Math.hypot(input.dx, input.dz));
  if (strength < 0.001) return;
  const dx = input.dx / strength,
    dz = input.dz / strength;
  const distance =
    movementSpeed(p.energy) *
    (input.sprint && p.energy > 20 ? 1.5 : 1) *
    seconds *
    strength;
  const start = { x: p.x, z: p.z };
  const valid = (x: number, z: number) =>
    withinSharedRange(p, { x, z }, anchors) && walkable(s, x, z);
  const x = p.x + dx * distance,
    z = p.z + dz * distance;
  if (valid(x, p.z)) p.x = x;
  if (valid(p.x, z)) p.z = z;
  if (Math.hypot(p.x - start.x, p.z - start.z) < distance * 0.15) {
    for (const angle of [
      Math.PI / 6,
      -Math.PI / 6,
      Math.PI / 3,
      -Math.PI / 3,
    ]) {
      const nx =
          start.x + (dx * Math.cos(angle) - dz * Math.sin(angle)) * distance,
        nz = start.z + (dx * Math.sin(angle) + dz * Math.cos(angle)) * distance;
      if (valid(nx, nz)) {
        p.x = nx;
        p.z = nz;
        break;
      }
    }
  }
  if (input.sprint && p.energy > 20)
    p.energy = Math.max(0, p.energy - seconds * 1.8 * strength);
  p.facing = Math.atan2(dx, dz);
}
