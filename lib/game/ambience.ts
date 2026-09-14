import type { State } from './model.ts';
export type AcousticCamera = {
  x: number;
  z: number;
  angle: number;
  zoom: number;
};
export function spatialAmbience(s: State, camera: AcousticCamera) {
  const nearest = (kind: 'water' | 'tree') => {
    let distance = 18,
      x = camera.x,
      z = camera.z;
    for (const t of s.tiles) {
      if (kind === 'water' ? t.terrain !== 'water' : t.resource !== 'tree')
        continue;
      const d = Math.hypot(t.x - camera.x, t.z - camera.z);
      if (d < distance) {
        distance = d;
        x = t.x;
        z = t.z;
      }
    }
    const pan = Math.max(
      -1,
      Math.min(
        1,
        ((x - camera.x) * Math.cos(camera.angle) -
          (z - camera.z) * Math.sin(camera.angle)) /
          10,
      ),
    );
    return {
      gain:
        Math.pow(Math.max(0, 1 - distance / 18), 2) *
        Math.min(1, 17 / camera.zoom),
      pan,
    };
  };
  const river = nearest('water'),
    birds = nearest('tree');
  const insects={...birds,gain:!s.mine&&(s.time<.24||s.time>.77)&&s.weather!=='rain'?birds.gain:0};
  if (s.mine) river.gain = 0;
  if (s.mine || s.time < 0.24 || s.time > 0.77 || s.weather === 'rain')
    birds.gain = 0;
  if (s.weather === 'rain') river.gain *= 0.6;
  return { river, birds, insects };
}
