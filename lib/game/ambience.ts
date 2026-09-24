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

export type NatureAnchor={x:number;z:number;phase:number};
const sample=(x:number,z:number,seed:number)=>{const v=Math.sin(x*127.1+z*311.7+seed*.013)*43758.5453;return v-Math.floor(v);};
// The camera selects cells; it never contributes to a particle's position or phase.
export function natureAnchors(x:number,z:number,seed:number):NatureAnchor[]{
  const anchors:NatureAnchor[]=[];
  for(let cx=Math.floor(x/8)-2;cx<=Math.floor(x/8)+2;cx++)for(let cz=Math.floor(z/8)-2;cz<=Math.floor(z/8)+2;cz++)
    anchors.push({x:cx*8+2+sample(cx,cz,seed)*4,z:cz*8+2+sample(cx,cz,seed+1)*4,phase:sample(cx,cz,seed+2)*Math.PI*2});
  return anchors;
}
export function naturePosition(a:NatureAnchor,time:number){
  return {x:a.x+Math.sin(time*.24+a.phase)*.65,z:a.z+Math.cos(time*.2+a.phase)*.65,y:.65+Math.sin(time*2+a.phase)*.12};
}
export function weatherDrop(x:number,z:number,seed:number,time:number,snow:boolean){
  const phase=sample(x,z,seed),cycle=(time*(snow?1.15:8)+phase*12)%12;
  return {x:x*3+sample(x,z,seed+1)*2+(snow?Math.sin(time*.7+phase*6)*.35:0),z:z*3+sample(x,z,seed+2)*2,y:12-cycle};
}
