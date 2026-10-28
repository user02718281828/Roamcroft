import { sourceText } from '../i18n/source.ts';
import type { Engine } from '../game/model.ts';
import type { Peer } from './protocol.ts';
import {
  LinkMetrics,
  REALTIME_VERSION,
  TICK_MS,
  type Hello,
  type Snapshot,
} from './realtime-protocol.ts';
import { Prediction } from './prediction.ts';

export interface MotionControl {
  ready: boolean;
  buffer: number;
  intent(dx: number, dz: number): void;
  frame(dt: number): void;
  renderPose(): { x: number; z: number };
}
export class RealtimeClient implements MotionControl {
  ready = false;
  frozen = false;
  epoch = '';
  metrics = new LinkMetrics();
  private socket: WebSocket | null = null;
  private stopped = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private pingTimer: ReturnType<typeof setInterval> | undefined;
  private reconnects = 0;
  private intentX = 0;
  private intentZ = 0;
  private accumulator = 0;
  private previous: { x: number; z: number } = { x: 0, z: 0 };
  private offset = { x: 0, z: 0 };
  private self = '';
  private pingSent = 0;
  prediction: Prediction;
  engine: () => Engine | null;
  onPeers: (peers: Peer[]) => void;
  changed: () => void;
  constructor(
    engine: () => Engine | null,
    onPeers: (peers: Peer[]) => void,
    changed: () => void,
  ) {
    this.engine = engine;
    this.onPeers = onPeers;
    this.changed = changed;
    this.prediction = new Prediction(
      () => this.engine()!.s,
      () => this.engine()?.network?.peers.map((p) => p.player) || [],
    );
  }
  get buffer() {
    return this.metrics.buffer;
  }
  start() {
    if (this.stopped || this.socket) return;
    const url = new URL('/api/realtime?v=' + REALTIME_VERSION, location.href);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(url);
    this.socket = ws;
    ws.onmessage = (event) => {
      if (
        this.socket !== ws ||
        this.stopped ||
        typeof event.data !== 'string' ||
        event.data.length > 16000
      )
        return;
      try {
        const packet = JSON.parse(event.data) as
          | Hello
          | Snapshot
          | { type: 'pong'; sent: number };
        if (packet.type === 'pong') {
          if (packet.sent === this.pingSent)
            this.metrics.sampleRtt(performance.now() - packet.sent);
          return;
        }
        if (packet.type === 'hello') {
          if (packet.version !== REALTIME_VERSION || !this.engine()) {
            ws.close();
            return;
          }
          this.epoch = packet.epoch;
          this.self = packet.self;
          this.metrics = new LinkMetrics();
          this.prediction.reset(packet.player);
          this.previous = { ...packet.player };
          this.offset = { x: 0, z: 0 };
          this.accumulator = 0;
          this.ready = true;
          this.reconnects = 0;
          this.ping();
          this.changed();
          return;
        }
        if (
          packet.type !== 'snapshot' ||
          packet.epoch !== this.epoch ||
          !this.metrics.snapshot(packet.tick)
        )
          return;
        const self = packet.peers.find((p) => p.id === this.self);
        if (!self) return;
        this.frozen = packet.frozen;
        const old = this.engine()!.s.player;
        const correction = this.prediction.reconcile(self.ack, self.player);
        // Visual-only correction. Gameplay/collision immediately uses authority.
        if (Math.hypot(correction.x, correction.z) < 3) {
          this.offset.x += correction.x;
          this.offset.z += correction.z;
        } else {
          this.offset = { x: 0, z: 0 };
          this.previous = { ...old };
        }
        this.previous.x += this.engine()!.s.player.x - old.x;
        this.previous.z += this.engine()!.s.player.z - old.z;
        const received = Date.now();
        this.onPeers(
          packet.peers
            .filter((p) => p.id !== this.self)
            .map((p) => ({
              id: p.id,
              name: p.name,
              player: p.player,
              sampledAt: received,
            })),
        );
      } catch {
        ws.close(1002, sourceText("m_97ca497084"));
      }
    };
    ws.onopen = () => {
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.pingTimer = setInterval(() => this.ping(), 1000);
    };
    ws.onclose = (event) => {
      if (this.socket !== ws) return;
      this.socket = null;
      this.ready = false;
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.changed();
      if (event.code === 4002) this.stopped = true;
      if (!this.stopped)
        this.reconnectTimer = setTimeout(
          () => this.start(),
          Math.min(5000, 500 * 2 ** Math.min(4, this.reconnects++)),
        );
    };
    ws.onerror = () => {
      if (ws.readyState !== WebSocket.CLOSED) ws.close();
    };
  }
  private ping() {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.pingSent = performance.now();
    this.socket.send(JSON.stringify({ type: 'ping', sent: this.pingSent }));
  }
  intent(dx: number, dz: number) {
    this.intentX = dx;
    this.intentZ = dz;
  }
  frame(dt: number) {
    this.offset.x *= Math.exp(-dt * 12);
    this.offset.z *= Math.exp(-dt * 12);
    if (!this.ready || this.frozen || !this.engine()) {
      this.intentX = 0;
      this.intentZ = 0;
      this.accumulator = 0;
      return;
    }
    this.accumulator += Math.min(0.1, dt);
    while (this.accumulator >= TICK_MS / 1000) {
      this.accumulator -= TICK_MS / 1000;
      this.previous = { ...this.engine()!.s.player };
      this.prediction.input(
        this.intentX,
        this.intentZ,
        this.engine()!.sprinting,
      );
      if (this.socket?.readyState === WebSocket.OPEN)
        this.socket.send(
          JSON.stringify({
            type: 'inputs',
            epoch: this.epoch,
            frames: this.prediction.pending.slice(0, 16),
          }),
        );
    }
    this.intentX = 0;
    this.intentZ = 0;
  }
  renderPose() {
    const p = this.engine()?.s.player || this.previous,
      t = this.accumulator / (TICK_MS / 1000);
    return {
      x: this.previous.x + (p.x - this.previous.x) * t + this.offset.x,
      z: this.previous.z + (p.z - this.previous.z) * t + this.offset.z,
    };
  }
  dispose() {
    this.stopped = true;
    this.ready = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.socket?.close();
    this.socket = null;
  }
}
