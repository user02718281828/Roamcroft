import type { State } from '../game/model.ts';
import { integrateInput } from '../game/network-movement.ts';
import type { Input } from './realtime-protocol.ts';
export class Prediction {
  pending: Input[] = [];
  seq = 0;
  ack = 0;
  corrections: number[] = [];
  state: () => State;
  anchors: () => { x: number; z: number }[];
  constructor(state: () => State, anchors: () => { x: number; z: number }[]) {
    this.state = state;
    this.anchors = anchors;
  }
  reset(player: State['player']) {
    this.pending = [];
    this.seq = 0;
    this.ack = 0;
    this.state().player = { ...player };
  }
  input(dx: number, dz: number, sprint: boolean) {
    if (this.pending.length >= 120) return null;
    const strength = Math.max(1, Math.hypot(dx, dz));
    const frame = {
      seq: ++this.seq,
      dx: dx / strength,
      dz: dz / strength,
      sprint,
    };
    this.pending.push(frame);
    integrateInput(this.state(), this.state().player, frame, this.anchors());
    return frame;
  }
  reconcile(ack: number, player: State['player']) {
    if (ack < this.ack || ack > this.seq) return { x: 0, z: 0 };
    const before = { ...this.state().player };
    this.ack = ack;
    this.pending = this.pending.filter((p) => p.seq > ack);
    this.state().player = { ...player };
    for (const input of this.pending)
      integrateInput(this.state(), this.state().player, input, this.anchors());
    const correction = {
      x: before.x - this.state().player.x,
      z: before.z - this.state().player.z,
    };
    this.corrections.push(Math.hypot(correction.x, correction.z));
    if (this.corrections.length > 600) this.corrections.shift();
    return correction;
  }
}
