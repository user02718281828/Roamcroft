import {Engine,createState,type State} from '../game/model.ts';
import type {Command,Pose} from '../coop/protocol.ts';
import {validServerCommand} from './protocol.ts';

export type Runtime={cooldown:number;clock:number;resting:boolean;fishing:Engine['fishing'];animals:unknown[];npcs:unknown[]};
export type WorldRecord={state:State;runtime?:Runtime};
export function freshWorld():WorldRecord {
  const seed=crypto.getRandomValues(new Uint32Array(1))[0]%2147483647;
  return {state:new Engine(createState(seed)).s};
}
export function advanceWorld(record:WorldRecord,pose:Pose,commands:Command[],elapsed:number,paused:boolean){
  const engine=new Engine(record.state),runtime=record.runtime;
  if(runtime){engine.actionCooldown=runtime.cooldown;engine.systemClock=runtime.clock;engine.resting=runtime.resting;engine.fishing=runtime.fishing;
    engine.animalMotion=new Map(runtime.animals as [number,any][]);engine.npcMotion=new Map(runtime.npcs as [string,any][]);}
  // İstemci zamanı göndermez. Kopuk bağlantı çevrimdışı kazanç ya da hız biriktirmez.
  let remaining=paused?0:Math.max(0,Math.min(1,elapsed));
  engine.sprinting=pose.sprinting===true;
  while(remaining>1e-8){
    const dt=Math.min(.05,remaining),dx=pose.x-engine.s.player.x,dz=pose.z-engine.s.player.z,distance=Math.hypot(dx,dz);
    if(distance>.001)engine.move(dx,dz,Math.min(dt,distance/engine.travelSpeed()));
    engine.tick(dt);remaining-=dt;
  }
  for(const command of commands){
    if(!validServerCommand(command))throw Error('Geçersiz komut.');
    const method=(engine as unknown as Record<string,(...args:unknown[])=>unknown>)[command.method];
    method.apply(engine,command.args);
  }
  record.state=engine.s;
  record.runtime={cooldown:engine.actionCooldown,clock:engine.systemClock,resting:engine.resting,fishing:engine.fishing,
    animals:[...engine.animalMotion],npcs:[...engine.npcMotion]};
  return {record,events:engine.events};
}
