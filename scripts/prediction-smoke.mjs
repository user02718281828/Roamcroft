import assert from 'node:assert/strict';
import { WebSocket as WireSocket } from 'ws';
import { Engine, walkable } from '../lib/game/model.ts';
import { RealtimeClient } from '../lib/coop/realtime-client.ts';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Executes the actual browser movement client against the production Worker.
// The adapter adds 150 ms in each direction; it does not replace authority.
export async function verifyPrediction(base, players, call) {
  const originalSocket = globalThis.WebSocket,
    originalLocation = globalThis.location;
  const clients = [],
    timers = new Set();
  let cookie = '';
  const defer = (run) => {
    const t = setTimeout(() => {
      timers.delete(t);
      run();
    }, 150);
    timers.add(t);
  };
  class Socket {
    static OPEN = 1;
    static CLOSED = 3;
    constructor(url) {
      this.wire = new WireSocket(url, {
        headers: { Cookie: cookie, Origin: new URL(base).origin },
      });
      this.wire.on('open', () => this.onopen?.({}));
      this.wire.on('message', (data) =>
        defer(() => this.onmessage?.({ data: String(data) })),
      );
      this.wire.on('close', (code) => this.onclose?.({ code }));
      this.wire.on('error', () => this.onerror?.({}));
    }
    get readyState() {
      return this.wire.readyState;
    }
    send(data) {
      defer(() => {
        if (this.wire.readyState === 1) this.wire.send(data);
      });
    }
    close(code, reason) {
      this.wire.close(code, reason);
    }
  }
  try {
    globalThis.WebSocket = Socket;
    globalThis.location = new URL(base);
    for (const p of players) {
      const packet = await call('/api/shared', { op: 'connect' }, p.cookie);
      const e = new Engine(
        {
          ...packet.state,
          player: packet.you.player,
          inventory: packet.bag.inventory,
          overflow: packet.bag.overflow,
        },
        true,
      );
      cookie = p.cookie;
      const client = new RealtimeClient(
        () => e,
        () => {},
        () => {},
      );
      clients.push({ client, e });
      client.start();
    }
    for (let n = 0; n < 100 && !clients.every((c) => c.client.ready); n++)
      await wait(20);
    assert.ok(clients.every((c) => c.client.ready));
    const start = performance.now();
    let previous = start;
    for (const c of clients) {
      c.origin = { ...c.e.s.player };
      c.visualMs = null;
      c.ackMs = null;
      c.direction = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].find(([x, z]) =>
        walkable(c.e.s, c.origin.x + x * 0.3, c.origin.z + z * 0.3),
      );
      assert.ok(c.direction, 'a walkable probe direction exists');
    }
    while (performance.now() - start < 7500) {
      const now = performance.now(),
        dt = (now - previous) / 1000;
      previous = now;
      for (const c of clients) {
        c.client.intent(...(now - start < 120 ? c.direction : [0, 0]));
        c.client.frame(dt);
        const pose = c.client.renderPose();
        if (
          c.visualMs === null &&
          Math.hypot(pose.x - c.origin.x, pose.z - c.origin.z) > 0.002
        )
          c.visualMs = now - start;
        if (c.ackMs === null && c.client.prediction.ack > 0)
          c.ackMs = now - start;
      }
      await wait(16);
    }
    for (const c of clients) {
      assert.ok(
        c.visualMs !== null && c.visualMs < 150,
        'predicted mesh responds before network round trip',
      );
      assert.ok(c.ackMs >= 300, 'ACK traverses the delayed real connection');
      assert.ok(c.client.prediction.pending.length < 20);
      assert.ok(c.client.buffer >= 120 && c.client.buffer < 650);
      assert.ok(
        Math.max(...c.client.prediction.corrections) < 1,
        'bounded reconciliation',
      );
    }
    console.info(
      'Stage 4 / actual RealtimeClient at injected 300 ms:',
      JSON.stringify(
        clients.map((c) => ({
          visualResponseMs: +c.visualMs.toFixed(2),
          firstAckMs: +c.ackMs.toFixed(2),
          rttMs: +c.client.metrics.rtt.toFixed(2),
          jitterMs: +c.client.metrics.jitter.toFixed(2),
          bufferMs: +c.client.buffer.toFixed(2),
          maxCorrectionTiles: +Math.max(
            ...c.client.prediction.corrections,
          ).toFixed(3),
        })),
      ),
    );
  } finally {
    for (const { client } of clients) client.dispose();
    for (const t of timers) clearTimeout(t);
    globalThis.WebSocket = originalSocket;
    if (originalLocation === undefined) delete globalThis.location;
    else globalThis.location = originalLocation;
  }
}
