import { sourceText } from '../i18n/source.ts';
import type { Engine, State, Event } from '../game/model.ts';
import type { Command, Peer } from '../coop/protocol.ts';
import { applySharedState } from '../coop/authority.ts';
import { validServerCommand } from './protocol.ts';
import { applyDelta, type WorldDelta } from './delta.ts';
import { SHARED_PROTOCOL } from './shared-protocol.ts';
import { RealtimeClient } from '../coop/realtime-client.ts';
import {frameProfile} from '../game/profile.ts';
import type { SleepStatus } from '../game/rest.ts';

type Packet = {
  sleep?: SleepStatus | null;
  realtime?: boolean;
  protocolVersion?: number;
  state?: State;
  delta?: WorldDelta;
  patches?: WorldDelta[];
  revision?: number;
  you?: Peer;
  bag?: Pick<State, 'inventory' | 'overflow'>;
  peers?: Peer[];
  host?: boolean;
  room?: string;
  nonce: string;
  seq: number;
  commandSeq: number;
  events?: Event[];
  error?: string;
};
const SHARED_FLAG = 'roamcroft-shared-active';
export class ServerWorldClient {
  connected = false;
  shared = false;
  status = sourceText("m_8ee7c652b8");
  latencyMs = 0;
  private lastPulseAt = 0;
  private nonce = '';
  private seq = 0;
  private revision = 0;
  private commandSeq = 0;
  private queue: Command[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;
  private switching = false;
  private incompatible = false;
  private retryAt = 0;
  private pending: { body: string; nonce: string } | null = null;
  private flight: Promise<void> | null = null;
  private lastPaused = false;
  private peers: Peer[] = [];
  realtime: RealtimeClient | null = null;
  sleep: SleepStatus | null = null;
  private realtimeAvailable=false;
  private selfId = '';
  private state: State | null = null;
  private fetcher: typeof fetch;
  private engine: () => Engine | null;
  private paused: () => boolean;
  private changed: () => void;
  constructor(
    engine: () => Engine | null,
    paused: () => boolean,
    changed: () => void,
    fetcher: typeof fetch = (input, init) => fetch(input, init),
  ) {
    this.engine = engine;
    this.paused = paused;
    this.changed = changed;
    this.fetcher = fetcher;
  }
  private accept(packet: Packet) {
    this.sleep=packet.sleep||null;
    this.realtimeAvailable=packet.realtime===true;
    if (packet.state) this.state = packet.state;
    else if (packet.patches && this.state) {
      let state = this.state,
        revision = this.revision;
      try {
        for (const patch of packet.patches) {
          state = applyDelta(state, patch, revision++);
        }
        if (revision !== packet.revision) throw Error('Revision mismatch');
      } catch {
        throw Object.assign(Error(sourceText("m_cf4a39ea2d")), {
          status: 409,
        });
      }
      this.state = state;
      this.revision = revision;
    } else if (packet.delta && this.state)
      this.state = applyDelta(this.state, packet.delta, this.seq);
    else throw Object.assign(Error(sourceText("m_1cbd423178")), { status: 409 });
    if (packet.revision !== undefined) this.revision = packet.revision;
    this.selfId = packet.you?.id || '';
    if(!this.realtime?.ready)this.peers = (packet.peers || []).filter((p) => p.id !== this.selfId);
    const state = structuredClone(this.state);
    if (packet.you) state.player = { ...packet.you.player };
    if (packet.bag) {
      state.inventory = structuredClone(packet.bag.inventory);
      state.overflow = structuredClone(packet.bag.overflow);
    }
    return state;
  }
  private async request(
    body: string,
    nonce = '',
    path = this.shared ? '/api/shared' : '/api/world',
  ) {
    const started = performance.now();
    const response = await this.fetcher(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(path === '/api/shared'
          ? { 'X-Roamcroft-Protocol': String(SHARED_PROTOCOL) }
          : {}),
        ...(nonce ? { 'X-Roamcroft-Nonce': nonce } : {}),
      },
      body,
      signal: AbortSignal.timeout(12000),
    });
    const packet = (await response.json()) as Packet;
    this.latencyMs = Math.round(performance.now() - started);
    if (!response.ok) {
      if (response.status === 429) {
        this.connected = false;
        const seconds = Number(response.headers.get('Retry-After') || '2');
        this.retryAt =
          Date.now() +
          Math.min(60, Math.max(2, Number.isFinite(seconds) ? seconds : 2)) *
            1000;
      }
      if (response.status === 426) {
        this.incompatible = true;
        this.connected = false;
      }
      throw Object.assign(Error(packet.error || sourceText("m_4af2285e3e")), {
        status: response.status,
      });
    }
    if (path === '/api/shared' && packet.protocolVersion !== SHARED_PROTOCOL) {
      this.incompatible = true;
      this.connected = false;
      throw Object.assign(Error(sourceText("m_e00926e69e")), {
        status: 426,
      });
    }
    return packet;
  }
  private flag(value: boolean) {
    try {
      if (value) localStorage.setItem(SHARED_FLAG, '1');
      else localStorage.removeItem(SHARED_FLAG);
    } catch {}
  }
  private acknowledge(packet: Packet) {
    this.nonce = packet.nonce;
    this.seq = packet.seq;
    this.commandSeq = packet.commandSeq;
    this.queue = [];
    this.pending = null;
    this.connected = true;
    this.retryAt = 0;
  }
  private label() {
    if(this.realtime){
      const m=this.realtime.metrics;
      this.status=this.realtime.ready
        ? sourceText("m_0385c5e30b", { p0: this.peers.length+1, p1: Math.round(m.rtt), p2: Math.round(m.arrivalJitter), p3: Math.round(m.buffer) })
        : sourceText("m_2d079a7b65");
      return;
    }
    this.status = this.shared
      ? sourceText("m_3cfeec12f7", { p0: this.peers.length + 1, p1: this.latencyMs })
      : sourceText("m_45239a25c3");
  }
  async start() {
    let packet = await this.request(
      JSON.stringify({ op: 'session' }),
      '',
      '/api/world',
    );
    let resume = false;
    try {
      resume = localStorage.getItem(SHARED_FLAG) === '1';
    } catch {}
    if (resume) {
      try {
        packet = await this.request(
          JSON.stringify({ op: 'connect' }),
          '',
          '/api/shared',
        );
        this.shared = true;
      } catch (error) {
        if ([401, 410, 423].includes((error as { status: number }).status))
          this.flag(false);
        else throw error;
      }
    }
    this.acknowledge(packet);
    const state = this.accept(packet);
    this.label();
    this.schedule();
    return state;
  }
  bind(engine: Engine) {
    engine.network = {
      guest: true,
      server: true,
      shared: this.shared,
      sleep:this.sleep,
      motion: this.realtime || undefined,
      peers: this.peers,
      send: (method, args) => this.send(method, args),
      enterShared: () => this.enterShared(),
      leaveShared: () => this.leaveShared(),
    };
    if(this.shared&&this.realtimeAvailable&&!this.realtime&&typeof window!=='undefined'){
      this.realtime=new RealtimeClient(this.engine,peers=>{
        this.peers=peers;const e=this.engine();if(e?.network)e.network.peers=peers;
      },()=>{this.label();this.changed();});
      engine.network.motion=this.realtime;this.realtime.start();
    }
  }
  private apply(packet: Packet, reset = false, sentPose?: {x:number;z:number}) {
    const started=frameProfile.begin();
    const state = this.accept(packet),
      current = this.engine();
    if (current) {
      // HTTP carries world/economic updates. Only the realtime input ACK is
      // allowed to reconcile a realtime actor's position.
      if(this.realtime?.ready)state.player={...current.s.player};
      applySharedState(
        current,
        state,
        reset
          ? undefined
          : this.realtime?.ready ? {id:this.selfId,name:sourceText("m_768201cbf7"),player:state.player} : packet.you || { id: 'self', name: sourceText("m_768201cbf7"), player: state.player },
        this.realtime?.ready ? undefined : sentPose,
      );
      this.bind(current);
      for (const event of packet.events || []) current.events.push(event);
    }
    frameProfile.end('networkApplyCpu',started);
  }
  async enterShared() {
    if (this.shared || this.switching) return;
    await this.flush();
    this.switching = true;
    if (this.timer) clearTimeout(this.timer);
    try {
      const packet = await this.request(
        JSON.stringify({ op: 'connect' }),
        '',
        '/api/shared',
      );
      this.shared = true;
      this.acknowledge(packet);
      this.apply(packet, true);
      this.flag(true);
      this.label();
    } finally {
      this.switching = false;
      this.schedule();
      this.changed();
    }
  }
  async leaveShared() {
    if (!this.shared || this.switching) return;
    // Explicit exit must remain available while the host is offline. Any committed
    // work already lives in D1; removing membership fences out late requests.
    try {
      await this.flush();
    } catch {}
    if (!this.shared) return;
    this.switching = true;
    if (this.timer) clearTimeout(this.timer);
    try {
      await this.request(JSON.stringify({ op: 'leave' }), '', '/api/lobby');
      await this.returnPersonal();
    } finally {
      this.switching = false;
      this.schedule();
      this.changed();
    }
  }
  private async returnPersonal() {
    this.realtime?.dispose();this.realtime=null;
    const packet = await this.request(
      JSON.stringify({ op: 'session' }),
      '',
      '/api/world',
    );
    this.shared = false;
    this.incompatible = false;
    this.acknowledge(packet);
    this.apply(packet, true);
    this.flag(false);
    this.label();
    this.engine()?.emit(
      sourceText("m_1306d5c37a"),
      'info',
    );
  }
  send(method: string, args: unknown[]) {
    const command = { seq: this.commandSeq + 1, method, args };
    if (
      !this.connected ||
      this.stopped ||
      this.incompatible ||
      this.switching ||
      this.queue.length >= 16 ||
      !validServerCommand(command)
    ) {
      this.engine()?.emit(sourceText("m_497e43ec30"), 'bad');
      return false;
    }
    this.commandSeq++;
    this.queue.push(command);
    this.status = sourceText("m_ab131fe43d");
    this.changed();
    return true;
  }
  private pump() {
    if (!this.flight)
      this.flight = this.pulse().finally(() => {
        this.flight = null;
        this.schedule();
      });
    return this.flight;
  }
  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    if (!this.stopped && !this.switching && !this.incompatible)
      this.timer = setTimeout(
        () => {
          void this.pump();
        },
        Math.max(this.connected ? Math.max(25, (this.realtime ? 1000 : 500) - (performance.now() - this.lastPulseAt)) : 2000, this.retryAt - Date.now()),
      );
  }
  private async pulse() {
    this.lastPulseAt = performance.now();
    const engine = this.engine();
    if (
      !engine ||
      this.stopped ||
      this.switching ||
      this.incompatible ||
      Date.now() < this.retryAt
    )
      return;
    if (
      !this.shared &&
      this.connected &&
      this.paused() &&
      this.lastPaused &&
      !this.pending &&
      !this.queue.length
    )
      return;
    if (!this.pending) {
      const p = engine.s.player;
      this.pending = {
        nonce: this.nonce,
        body: JSON.stringify({
          op: 'pulse',
          ...(this.shared ? { revision: this.revision } : {}),
          pulse: {
            seq: this.seq + 1,
            paused: this.paused(),
            pose: {
              x: p.x,
              z: p.z,
              facing: p.facing,
              sprinting: engine.sprinting,
            },
            commands: this.queue.slice(0, 8),
          },
        }),
      };
    }
    try {
      const packet = await this.request(this.pending.body, this.pending.nonce);
      if (this.stopped) return;
      this.apply(packet, false, JSON.parse(this.pending.body).pulse.pose);
      this.lastPaused = JSON.parse(this.pending.body).pulse.paused;
      this.seq = packet.seq;
      this.nonce = packet.nonce;
      this.queue = this.queue.filter((c) => c.seq > packet.commandSeq);
      this.pending = null;
      this.connected = true;
      this.label();
      if (this.queue.length) this.status = sourceText("m_ab131fe43d");
    } catch (error) {
      this.connected = false;
      this.status =
        error instanceof Error ? error.message : sourceText("m_0a3d617fb5");
      const status = (error as { status: number }).status;
      if (this.shared && status === 410) {
        try {
          await this.returnPersonal();
        } catch {}
      } else if ([403, 409].includes(status)) {
        try {
          const packet = await this.request(
            JSON.stringify({ op: this.shared ? 'connect' : 'session' }),
          );
          if (this.stopped) return;
          this.acknowledge(packet);
          this.apply(packet, true);
          this.engine()?.emit(
            sourceText("m_ae5b31ecab"),
            'info',
          );
          this.label();
        } catch {}
      }
    }
    this.changed();
  }
  async flush() {
    if (this.stopped) throw Error(sourceText("m_e71cac949d"));
    await this.flight;
    if (this.timer) clearTimeout(this.timer);
    do {
      await this.pump();
      if (this.timer) clearTimeout(this.timer);
    } while (
      !this.stopped &&
      !this.incompatible &&
      Date.now() >= this.retryAt &&
      this.connected &&
      (this.queue.length > 0 || this.pending)
    );
    this.schedule();
    if (!this.connected || this.pending || this.queue.length) throw Error(this.status || sourceText("m_fe37989ef5"));
  }
  async exitToMenu() {
    await this.flush();
    this.switching=true;
    if(this.timer)clearTimeout(this.timer);
    try {
      if(this.shared)await this.request(JSON.stringify({op:'leave'}),'','/api/lobby');
      this.flag(false);this.dispose();
    } catch(error){this.switching=false;this.schedule();throw error;}
  }
  dispose() {
    this.realtime?.dispose();this.realtime=null;
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }
}
