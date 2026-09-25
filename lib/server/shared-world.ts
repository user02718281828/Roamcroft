import { Engine, walkable, type State, type Event } from '../game/model.ts';
import type { Peer, Pose, Command } from '../coop/protocol.ts';
import { advanceWorld, type WorldRecord } from './world.ts';
import { captureState, makeDelta, type WorldDelta } from './delta.ts';
import { SHARED_PROTOCOL } from './shared-protocol.ts';

export type SharedPlayer = {
  id: string;
  name: string;
  player: State['player'];
  inventory: State['inventory'];
  overflow: State['overflow'];
  present: boolean;
  seen: number;
  paused: boolean;
  seq: number;
  commandSeq: number;
  nonce: string;
  previousNonce: string;
  digest: string;
  cooldown: number;
  resting: boolean;
  fishing: Engine['fishing'];
};
export type SharedRecord = {
  world: WorldRecord;
  players: Record<string, SharedPlayer>;
  room: string;
  history: { revision: number; delta: WorldDelta }[];
};
export const sharedToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)), (n) =>
    n.toString(16).padStart(2, '0'),
  ).join('');
export const HOST_GRACE = 15_000;
export function sharedSpawn(e: Engine, players: SharedPlayer[]) {
  for (let r = 1; r <= 8; r++)
    for (let z = -r; z <= r; z++)
      for (let x = -r; x <= r; x++) {
        const p = {
          x: Math.round(e.s.player.x) + x,
          z: Math.round(e.s.player.z) + z,
        };
        if (
          walkable(e.s, p.x, p.z) &&
          players.every(
            (a) =>
              !a.present ||
              Math.hypot(a.player.x - p.x, a.player.z - p.z) > 0.8,
          )
        )
          return p;
      }
  return (
    e.nearbyFree(e.s.player.x, e.s.player.z) || {
      x: e.s.player.x,
      z: e.s.player.z,
    }
  );
}
export function ensureSharedPlayer(
  record: SharedRecord,
  user: string,
  owner: string,
  name: string,
  now: number,
) {
  let p = record.players[user];
  if (!p) {
    const e = new Engine(record.world.state),
      players = Object.values(record.players);
    p = {
      id: sharedToken().slice(0, 16),
      name,
      player: {
        ...e.s.player,
        ...(user === owner ? {} : sharedSpawn(e, players)),
        energy: 100,
        health: 100,
        hunger: 100,
      },
      inventory: user === owner ? e.s.inventory : {},
      overflow: user === owner ? e.s.overflow : {},
      present: true,
      seen: now,
      paused: true,
      seq: 0,
      commandSeq: 0,
      nonce: sharedToken(),
      previousNonce: '',
      digest: '',
      cooldown: 0,
      resting: false,
      fishing: null,
    };
    if (user === owner) p.player = { ...e.s.player };
    record.players[user] = p;
  }
  p.name = name;
  p.present = true;
  if (
    user !== owner &&
    (!walkable(record.world.state, p.player.x, p.player.z) ||
      Math.hypot(
        p.player.x - record.world.state.player.x,
        p.player.z - record.world.state.player.z,
      ) > 22)
  ) {
    Object.assign(
      p.player,
      sharedSpawn(
        new Engine(record.world.state),
        Object.values(record.players).filter(
          (a) => a.present && a.seen > now - 5000,
        ),
      ),
    );
    p.fishing = null;
  }
  return p;
}
export function advanceShared(
  record: SharedRecord,
  owner: string,
  user: string,
  pose: Pose,
  commands: Command[],
  paused: boolean,
  elapsed: number,
  now: number,
) {
  const p = record.players[user],
    host = record.players[owner];
  const previouslyActive = Object.values(record.players).some(
    (a) => a.present && !a.paused && a.seen > now - 2500,
  );
  const actorDt = Math.min(1, Math.max(0, (now - p.seen) / 1000));
  p.paused = paused;
  p.seen = now;
  const active = Object.values(record.players).some(
    (a) => a.present && !a.paused && a.seen > now - 2500,
  );
  const hostActive = !!host && !host.paused && host.seen > now - 2500;
  const hostVitals = { ...record.world.state.player };
  const before = captureState(record.world.state);
  if (!hostActive) {
    record.world.state.player.health = 100;
    record.world.state.player.hunger = 100;
  }
  const advanced = advanceWorld(
    record.world,
    { ...record.world.state.player },
    [],
    previouslyActive && active ? elapsed : 0,
    !active,
    (engine) => {
      engine.productionInventory = (recipient) =>
        Object.entries(record.players).find(
          ([id, player]) => id !== owner && player.id === recipient,
        )?.[1];
    },
  );
  if (!hostActive) Object.assign(advanced.record.state.player, hostVitals);
  const e = new Engine(advanced.record.state),
    runtime = advanced.record.runtime!;
  e.systemClock = runtime.clock;
  e.animalMotion = new Map(runtime.animals as [number, never][]);
  e.npcMotion = new Map(runtime.npcs as [string, never][]);
  const events: Event[] = [...advanced.events],
    hostPlayer = { ...e.s.player },
    hostInventory = e.s.inventory,
    hostOverflow = e.s.overflow;
  if (user !== owner) {
    e.s.inventory = p.inventory;
    e.s.overflow = p.overflow;
  }
  e.s.player = user === owner ? e.s.player : p.player;
  e.networkActor = user !== owner;
  e.productionRecipient = p.id;
  e.actionCooldown =
    user === owner ? runtime.cooldown : Math.max(0, p.cooldown - actorDt);
  e.resting = user === owner ? runtime.resting : p.resting;
  e.fishing = user === owner ? runtime.fishing : p.fishing;
  e.sprinting = pose.sprinting === true;
  if (!paused) {
    if (
      user === owner ||
      Math.hypot(pose.x - hostPlayer.x, pose.z - hostPlayer.z) <= 20
    ) {
      let remaining = actorDt;
      while (remaining > 1e-8) {
        const dt = Math.min(0.05, remaining),
          dx = pose.x - e.s.player.x,
          dz = pose.z - e.s.player.z,
          d = Math.hypot(dx, dz);
        if (d > 0.001) e.move(dx, dz, Math.min(dt, d / e.travelSpeed()));
        remaining -= dt;
      }
      e.s.player.facing = pose.facing;
    }
    if (user !== owner) {
      e.s.player.hunger = Math.max(0, e.s.player.hunger - actorDt * 0.06);
      e.s.player.energy = Math.min(
        100,
        e.s.player.energy + actorDt * (e.resting ? 2 : 0.12),
      );
      if (e.s.player.hunger <= 0)
        e.s.player.health = Math.max(0, e.s.player.health - actorDt * 0.7);
      e.updateFishing(actorDt);
      if (e.s.player.health <= 0) {
        Object.assign(
          e.s.player,
          sharedSpawn(
            new Engine({ ...e.s, player: hostPlayer }),
            Object.values(record.players),
          ),
          { health: 65, hunger: 45, energy: 65 },
        );
        e.fishing = null;
      }
    }
  }
  for (const c of commands) {
    if (
      ['enterMine', 'descendMine', 'leaveMine', 'sleep'].includes(c.method) ||
      (c.method === 'act' && e.isPortal(Number(c.args[0]), Number(c.args[1])))
    ) {
      e.emit(
        'Bu online sürüm ortak yüzey çiftliğini destekliyor; maden ve gün atlama kapalı.',
        'info',
      );
      continue;
    }
    if (user !== owner && ['demolish', 'renameSettlement'].includes(c.method)) {
      e.emit('Bu işlemi ev sahibi yapabilir.', 'bad');
      continue;
    }
    if (
      c.method === 'build' &&
      (Math.hypot(
        Number(c.args[1]) - e.s.player.x,
        Number(c.args[2]) - e.s.player.z,
      ) > 4 ||
        Object.values(record.players).some(
          (a) =>
            a.present &&
            a.seen > now - 5000 &&
            Math.hypot(
              a.player.x - Number(c.args[1]),
              a.player.z - Number(c.args[2]),
            ) < 0.8,
        ))
    ) {
      e.emit('Yakınında ve oyunculardan uzakta boş bir yer seç.', 'bad');
      continue;
    }
    if (c.method === 'returnHome' && user !== owner) {
      Object.assign(
        e.s.player,
        sharedSpawn(
          new Engine({ ...e.s, player: hostPlayer }),
          Object.values(record.players),
        ),
      );
      e.fishing = null;
      continue;
    }
    const method = (
      e as unknown as Record<string, (...args: unknown[]) => unknown>
    )[c.method];
    method.apply(e, c.args);
  }
  p.player = { ...e.s.player };
  p.inventory = e.s.inventory;
  p.overflow = e.s.overflow;
  p.cooldown = e.actionCooldown;
  p.resting = e.resting;
  p.fishing = e.fishing;
  events.push(...e.events);
  if (user !== owner) {
    e.s.player = hostPlayer;
    e.s.inventory = hostInventory;
    e.s.overflow = hostOverflow;
  } else {
    runtime.cooldown = e.actionCooldown;
    runtime.resting = e.resting;
    runtime.fishing = e.fishing;
  }
  if (host) {
    host.player = { ...e.s.player };
    host.inventory = e.s.inventory;
    host.overflow = e.s.overflow;
  }
  for (const [id, guest] of Object.entries(record.players))
    if (
      id !== owner &&
      guest.present &&
      (!walkable(e.s, guest.player.x, guest.player.z) ||
        Math.hypot(
          guest.player.x - e.s.player.x,
          guest.player.z - e.s.player.z,
        ) > 22)
    ) {
      Object.assign(
        guest.player,
        sharedSpawn(e, Object.values(record.players)),
      );
      guest.fishing = null;
    }
  record.world = { state: e.s, runtime };
  const delta = makeDelta(before, e.s, 0);
  delete delta.changes.inventory;
  delete delta.changes.overflow;
  return { delta, events: events.slice(-12) };
}
export function sharedPacket(
  record: SharedRecord,
  owner: string,
  user: string,
  revision: number,
  base: number | undefined,
  now: number,
  events: Event[] = [],
) {
  const p = record.players[user];
  const patches =
    base === undefined ? [] : record.history.filter((h) => h.revision > base);
  const contiguous =
    base !== undefined &&
    (base === revision ||
      (patches.length > 0 &&
        patches[0].delta.baseSeq === base &&
        patches.at(-1)!.revision === revision));
  const peers: Peer[] = Object.entries(record.players)
    .filter(([, a]) => a.present && a.seen > now - 5000)
    .map(([, a]) => ({ id: a.id, name: a.name, player: a.player }));
  return {
    protocolVersion: SHARED_PROTOCOL,
    revision,
    seq: p.seq,
    commandSeq: p.commandSeq,
    nonce: p.nonce,
    room: record.room,
    host: user === owner,
    you: { id: p.id, name: p.name, player: p.player },
    bag: { inventory: p.inventory, overflow: p.overflow },
    peers,
    events,
    ...(contiguous
      ? { patches: patches.map((h) => h.delta) }
      : { state: { ...record.world.state, inventory: {}, overflow: {} } }),
  };
}
