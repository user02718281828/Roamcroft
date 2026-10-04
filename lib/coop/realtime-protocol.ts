import type { State } from '../game/model.ts';
export const REALTIME_VERSION = 1;
export const TICK_MS = 50;
export const SNAPSHOT_TICKS = 2;
export type Input = { seq: number; dx: number; dz: number; sprint: boolean };
export type MotionPeer = {
  id: string;
  name: string;
  player: State['player'];
  ack: number;
};
export type Snapshot = {
  type: 'snapshot';
  epoch: string;
  tick: number;
  time: number;
  peers: MotionPeer[];
  frozen: boolean;
};
export type Hello = {
  type: 'hello';
  version: number;
  epoch: string;
  self: string;
  tick: number;
  ack: number;
  player: State['player'];
};
export function validInput(v: unknown): v is Input {
  if (!v || typeof v !== 'object') return false;
  const p = v as Input;
  return (
    Object.keys(p).every((k) => ['seq', 'dx', 'dz', 'sprint'].includes(k)) &&
    Number.isSafeInteger(p.seq) &&
    p.seq > 0 &&
    p.seq < 2 ** 31 &&
    Number.isFinite(p.dx) &&
    Number.isFinite(p.dz) &&
    Math.hypot(p.dx, p.dz) <= 1.001 &&
    typeof p.sprint === 'boolean'
  );
}

export class LinkMetrics {
  rtt = 0;
  jitter = 0;
  gaps = 0;
  received = 0;
  stale = 0;
  lastTick = -1;
  private lastRtt = 0;
  private interpolation = 650;
  private lastArrival = -1;
  private arrivalWindow: { jitter: number; gaps: number }[] = [];
  arrivalJitter = 0;
  recentLoss = 0;
  sampleRtt(ms: number) {
    if (!Number.isFinite(ms) || ms < 0 || ms > 15000) return;
    this.jitter = this.lastRtt
      ? 0.8 * this.jitter + 0.2 * Math.abs(ms - this.lastRtt)
      : 0;
    this.rtt = this.rtt ? 0.8 * this.rtt + 0.2 * ms : ms;
    this.lastRtt = ms;
  }
  snapshot(tick: number, arrived = performance.now()) {
    if (tick <= this.lastTick) {
      this.stale++;
      return false;
    }
    const elapsed =
      this.lastTick >= 0 ? Math.min(500, (tick - this.lastTick) * TICK_MS) : 0;
    if (this.lastTick >= 0) {
      const span = (tick - this.lastTick) * TICK_MS;
      const gaps = Math.max(
        0,
        Math.round((tick - this.lastTick) / SNAPSHOT_TICKS) - 1,
      );
      this.arrivalWindow.push({
        jitter: Math.abs(arrived - this.lastArrival - span),
        gaps,
      });
      if (this.arrivalWindow.length > 40) this.arrivalWindow.shift();
      const sorted = this.arrivalWindow
        .map((s) => s.jitter)
        .sort((a, b) => a - b);
      this.arrivalJitter = sorted[Math.ceil(sorted.length * 0.95) - 1];
      const missed = this.arrivalWindow.reduce((sum, s) => sum + s.gaps, 0);
      this.recentLoss = missed / (this.arrivalWindow.length + missed);
    }
    this.lastArrival = arrived;
    if (this.lastTick >= 0)
      this.gaps += Math.max(
        0,
        Math.round((tick - this.lastTick) / SNAPSHOT_TICKS) - 1,
      );
    this.lastTick = tick;
    this.received++;
    const target =
      this.received < 12
        ? 650
        : Math.min(
            650,
            Math.max(
              120,
              // Samples use local arrival timestamps: fixed transport delay is
              // already included. Buffer arrival variation, not half the RTT again.
              100 + this.arrivalJitter * 2 + this.recentLoss * 250,
            ),
          );
    this.interpolation += Math.max(
      -elapsed * 0.1,
      Math.min(elapsed * 0.8, target - this.interpolation),
    );
    return true;
  }
  get loss() {
    return this.gaps / Math.max(1, this.received + this.gaps);
  }
  // Keep the proven buffer during warm-up; tighten only after actual samples.
  get buffer() {
    return this.interpolation;
  }
}
