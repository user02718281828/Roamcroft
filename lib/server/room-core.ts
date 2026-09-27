import { Engine } from '../game/model.ts';
import { integrateInput } from '../game/network-movement.ts';
import {
  advanceShared,
  ensureSharedPlayer,
  sharedSpawn,
  sharedPacket,
  sharedToken,
  HOST_GRACE,
  type SharedRecord,
} from './shared-world.ts';
import { captureState, makeDelta } from './delta.ts';
import { validPulse } from './protocol.ts';
import {
  validInput,
  TICK_MS,
  REALTIME_VERSION,
  type Input,
  type Snapshot,
  type Hello,
} from '../coop/realtime-protocol.ts';

type Stream = {
  epoch: string;
  ack: number;
  pending: Map<number, Input>;
  gapTicks: number;
  seen: number;
  messages: number;
  window: number;
};
export class RoomCore {
  record: SharedRecord;
  owner: string;
  revision: number;
  engine: Engine;
  tick = 0;
  streams = new Map<string, Stream>();
  private baseline: ReturnType<typeof captureState>;
  discarded = 0;
  skipped = 0;
  constructor(record: SharedRecord, owner: string, revision: number) {
    this.record = record;
    this.owner = owner;
    this.revision = revision;
    this.engine = this.restore();
    this.baseline = captureState(this.record.world.state);
  }
  private restore() {
    const e = new Engine(this.record.world.state, true),
      r = this.record.world.runtime;
    if (r) {
      e.actionCooldown = r.cooldown;
      e.systemClock = r.clock;
      e.resting = r.resting;
      e.fishing = r.fishing;
      e.animalMotion = new Map(r.animals as [number, never][]);
      e.npcMotion = new Map(r.npcs as [string, never][]);
    }
    e.productionInventory = (id) =>
      Object.entries(this.record.players).find(
        ([key, p]) => key !== this.owner && p.id === id,
      )?.[1];
    return e;
  }
  syncRuntime() {
    const e = this.engine;
    this.record.world = {
      state: e.s,
      runtime: {
        clock: e.systemClock,
        cooldown: e.actionCooldown,
        resting: e.resting,
        fishing: e.fishing,
        animals: [...e.animalMotion],
        npcs: [...e.npcMotion],
      },
    };
  }
  connect(user: string, name: string, now: number): Hello {
    const p = ensureSharedPlayer(this.record, user, this.owner, name, now);
    p.seen = now;
    const stream: Stream = {
      epoch: sharedToken(),
      ack: 0,
      pending: new Map(),
      gapTicks: 0,
      seen: now,
      messages: 0,
      window: now,
    };
    this.streams.set(user, stream);
    return {
      type: 'hello',
      version: REALTIME_VERSION,
      epoch: stream.epoch,
      self: p.id,
      tick: this.tick,
      ack: 0,
      player: { ...p.player },
    };
  }
  disconnect(user: string, epoch: string) {
    if (this.streams.get(user)?.epoch === epoch) this.streams.delete(user);
  }
  receive(user: string, epoch: string, frames: unknown, now: number) {
    const stream = this.streams.get(user);
    if (!stream || stream.epoch !== epoch) return false;
    if (now - stream.window >= 1000) {
      stream.window = now;
      stream.messages = 0;
    }
    if (
      ++stream.messages > 40 ||
      !Array.isArray(frames) ||
      frames.length > 16 ||
      !frames.every(validInput)
    )
      return false;
    for (const input of frames as Input[]) {
      if (input.seq <= stream.ack || stream.pending.has(input.seq)) {
        this.discarded++;
        continue;
      }
      if (input.seq > stream.ack + 128 || stream.pending.size >= 64)
        return false;
      stream.pending.set(input.seq, input);
    }
    stream.seen = now;
    const p = this.record.players[user];
    p.seen = now;
    p.paused = false;
    return true;
  }
  get frozen() {
    const host = this.record.players[this.owner];
    return !host?.present;
  }
  hostReady(now: number) {
    const p = this.record.players[this.owner];
    return !!p?.present && p.seen >= now - HOST_GRACE;
  }
  step(now: number) {
    this.tick++;
    if (!this.hostReady(now)) {
      for (const stream of this.streams.values()) {
        if (stream.pending.size)
          stream.ack = Math.max(stream.ack, ...stream.pending.keys());
        stream.pending.clear();
      }
      return;
    }
    const e = this.engine,
      s = e.s,
      host = this.record.players[this.owner];
    for (const [user, stream] of this.streams) {
      const p = this.record.players[user];
      if (!p?.present || now - stream.seen > 1000) continue;
      let input = stream.pending.get(stream.ack + 1);
      // Never "catch up" by moving faster than one fixed step. Under jitter a
      // backlog is superseded by its newest direction, then reconciled by ACK.
      if (stream.pending.size >= 4) {
        const latest = Math.max(...stream.pending.keys());
        this.skipped += Math.max(0, latest - stream.ack - 1);
        input = stream.pending.get(latest);
        for (const seq of stream.pending.keys())
          if (seq < latest) stream.pending.delete(seq);
      }
      if (!input && stream.pending.size) {
        // A bounded reorder window. Retransmitted unacknowledged frames usually
        // fill it; a permanently lost input cannot stall the whole room.
        if (++stream.gapTicks >= 3) {
          const next = Math.min(...stream.pending.keys());
          this.skipped += next - stream.ack - 1;
          stream.ack = next - 1;
          input = stream.pending.get(next);
        }
      }
      if (!input) continue;
      stream.gapTicks = 0;
      stream.pending.delete(input.seq);
      stream.ack = input.seq;
      const anchors = Object.entries(this.record.players)
        .filter(
          ([id, a]) => id !== user && a.present && a.seen >= now - HOST_GRACE,
        )
        .map(([, a]) => a.player);
      integrateInput(s, p.player, input, anchors);
      if (input.dx || input.dz) {
        p.resting = false;
        p.fishing = null;
        if (user === this.owner) {
          e.resting = false;
          e.fishing = null;
        }
      }
    }
    if (host) {
      s.player = host.player;
      s.inventory = host.inventory;
      s.overflow = host.overflow;
    }
    const active = Object.values(this.record.players).some(
      (p) => p.present && !p.paused && p.seen > now - 1000,
    );
    if (active) {
      const vitals = { ...s.player },
        hostIdle = host?.paused || host?.seen < now - 1000;
      if (hostIdle) {
        s.player = { ...s.player, health: 100, hunger: 100 };
      }
      e.tick(TICK_MS / 1000);
      if (hostIdle) s.player = vitals;
      if (host) {
        host.player = s.player;
        host.inventory = s.inventory;
        host.overflow = s.overflow;
      }
      for (const [id, p] of Object.entries(this.record.players)) {
        if (
          id === this.owner ||
          !this.streams.has(id) ||
          !p.present ||
          p.paused ||
          p.seen < now - 1000
        )
          continue;
        p.cooldown = Math.max(0, p.cooldown - 0.05);
        p.player.hunger = Math.max(0, p.player.hunger - 0.003);
        p.player.energy = Math.min(
          100,
          p.player.energy + (p.resting ? 0.1 : 0.006),
        );
        if (p.player.hunger <= 0)
          p.player.health = Math.max(0, p.player.health - 0.035);
        if (p.fishing) {
          const backup = {
            player: s.player,
            inventory: s.inventory,
            overflow: s.overflow,
            fishing: e.fishing,
          };
          s.player = p.player;
          s.inventory = p.inventory;
          s.overflow = p.overflow;
          e.fishing = p.fishing;
          e.updateFishing(0.05);
          p.fishing = e.fishing;
          Object.assign(s, {
            player: backup.player,
            inventory: backup.inventory,
            overflow: backup.overflow,
          });
          e.fishing = backup.fishing;
        }
        if (p.player.health <= 0) {
          Object.assign(
            p.player,
            sharedSpawn(e, Object.values(this.record.players)),
            { health: 65, hunger: 45, energy: 65 },
          );
          p.fishing = null;
        }
      }
    }
    this.syncRuntime();
  }
  publish(force = false) {
    this.syncRuntime();
    const delta = makeDelta(
      this.baseline,
      this.record.world.state,
      this.revision,
    );
    delete delta.changes.inventory;
    delete delta.changes.overflow;
    if (!force && !Object.keys(delta.changes).length && !delta.tiles?.length)
      return;
    this.revision++;
    this.record.history.push({ revision: this.revision, delta });
    this.record.history = this.record.history.slice(-24);
    if (JSON.stringify(this.record.history).length > 250000)
      this.record.history = [];
    this.baseline = captureState(this.record.world.state);
  }
  snapshot(user: string, now: number): Snapshot {
    return {
      type: 'snapshot',
      epoch: this.streams.get(user)?.epoch || '',
      tick: this.tick,
      time: now,
      frozen: !this.hostReady(now),
      peers: Object.entries(this.record.players)
        .filter(([id, p]) => p.present && (id === user || p.seen > now - 5000))
        .map(([id, p]) => ({
          id: p.id,
          name: p.name,
          player: { ...p.player },
          ack: this.streams.get(id)?.ack || 0,
        })),
    };
  }
  async pulse(
    user: string,
    name: string,
    body: Record<string, unknown>,
    nonce: string,
    now: number,
  ) {
    const connect = body.op === 'connect' && Object.keys(body).length === 1;
    if (
      !connect &&
      !(
        body.op === 'pulse' &&
        Object.keys(body).length === 3 &&
        validPulse(body.pulse) &&
        Number.isSafeInteger(body.revision)
      )
    )
      return { status: 400, data: { error: 'Geçersiz komut.' } };
    if (user !== this.owner && !this.hostReady(now))
      return {
        status: 423,
        data: { error: 'Ev sahibinin bağlantısı bekleniyor.' },
      };
    let p = this.record.players[user];
    if (!p && !connect)
      return { status: 409, data: { error: 'Önce ortak çiftliğe bağlan.' } };
    if (!p && Object.keys(this.record.players).length >= 32)
      return { status: 409, data: { error: 'Kalıcı oyuncu sınırı.' } };
    p = ensureSharedPlayer(this.record, user, this.owner, name, now);
    let events: ReturnType<typeof advanceShared>['events'] = [];
    if (!connect && validPulse(body.pulse)) {
      const pulse = body.pulse;
      const digest = JSON.stringify(pulse);
      if (
        pulse.seq === p.seq &&
        nonce === p.previousNonce &&
        p.digest === digest
      ) {
        this.publish();
        return {
          status: 200,
          data: sharedPacket(
            this.record,
            this.owner,
            user,
            this.revision,
            Number(body.revision),
            now,
          ),
        };
      }
      if (pulse.seq !== p.seq + 1 || nonce !== p.nonce)
        return { status: 409, data: { error: 'Oturum sırası değişti.' } };
      if (pulse.commands.some((c, i) => c.seq !== p.commandSeq + i + 1))
        return { status: 409, data: { error: 'Komut sırası geçersiz.' } };
      this.syncRuntime();
      // HTTP carries durable commands only, including while the socket reconnects.
      // Never revive the old pose-authoritative path for a disconnected actor.
      p.seen = now;
      const result = advanceShared(
        this.record,
        this.owner,
        user,
        { ...p.player },
        pulse.commands,
        pulse.paused,
        0,
        now,
      );
      events = result.events;
      p.seq = pulse.seq;
      p.commandSeq += pulse.commands.length;
      p.previousNonce = p.nonce;
      p.nonce = sharedToken();
      p.digest = digest;
      this.engine = this.restore();
    } else {
      p.seen = now;
      p.paused = true;
    }
    this.publish();
    return {
      status: 200,
      data: sharedPacket(
        this.record,
        this.owner,
        user,
        this.revision,
        connect ? undefined : Number(body.revision),
        now,
        events,
      ),
    };
  }
}
