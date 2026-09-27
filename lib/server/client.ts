import type { Engine, State, Event } from '../game/model.ts';
import type { Command, Peer } from '../coop/protocol.ts';
import { applySharedState } from '../coop/authority.ts';
import { validServerCommand } from './protocol.ts';
import { applyDelta, type WorldDelta } from './delta.ts';
import { SHARED_PROTOCOL } from './shared-protocol.ts';
import { RealtimeClient } from '../coop/realtime-client.ts';

type Packet = {
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
  status = 'Sunucuya bağlanıyor…';
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
        throw Object.assign(Error('Dünya güncellemesi yeniden eşitleniyor.'), {
          status: 409,
        });
      }
      this.state = state;
      this.revision = revision;
    } else if (packet.delta && this.state)
      this.state = applyDelta(this.state, packet.delta, this.seq);
    else throw Object.assign(Error('Dünya verisi eksik.'), { status: 409 });
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
      throw Object.assign(Error(packet.error || 'Sunucu yanıt vermedi.'), {
        status: response.status,
      });
    }
    if (path === '/api/shared' && packet.protocolVersion !== SHARED_PROTOCOL) {
      this.incompatible = true;
      this.connected = false;
      throw Object.assign(Error('Online sürüm değişti. Sayfayı yenile.'), {
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
        ? `Ortak çiftlik · ${this.peers.length+1}/4 · RTT ${Math.round(m.rtt)} ms · ±${Math.round(m.jitter)} · tampon ${Math.round(m.buffer)} ms`
        : 'Gerçek zamanlı bağlantı yeniden kuruluyor…';
      return;
    }
    this.status = this.shared
      ? `Ortak çiftlik · ${this.peers.length + 1}/4 · ${this.latencyMs} ms · Kaydedildi`
      : 'Sunucu dünyası · kaydedildi';
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
          : this.realtime?.ready ? {id:this.selfId,name:'Gezgin',player:state.player} : packet.you || { id: 'self', name: 'Gezgin', player: state.player },
        this.realtime?.ready ? undefined : sentPose,
      );
      this.bind(current);
      for (const event of packet.events || []) current.events.push(event);
    }
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
      'Ortak oturum kapandı. Kişisel çiftliğine döndün. Ortak kayıt ev sahibinde korunuyor.',
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
      this.engine()?.emit('Bu işlem şu anda sunucuya gönderilemiyor.', 'bad');
      return false;
    }
    this.commandSeq++;
    this.queue.push(command);
    this.status = 'İşlem sunucuya gönderiliyor…';
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
      if (this.queue.length) this.status = 'İşlem sunucuya gönderiliyor…';
    } catch (error) {
      this.connected = false;
      this.status =
        error instanceof Error ? error.message : 'Bağlantı bekleniyor.';
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
            'Dünya sunucuyla eşitlendi. Son işlemini kontrol et.',
            'info',
          );
          this.label();
        } catch {}
      }
    }
    this.changed();
  }
  async flush() {
    if (this.stopped) throw Error('Oturum kapalı.');
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
    if (!this.connected) throw Error(this.status);
  }
  dispose() {
    this.realtime?.dispose();this.realtime=null;
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }
}
