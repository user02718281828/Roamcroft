import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { Engine, createState, tradeUnitPrice } from '../lib/game/model.ts';
import { RoomCore } from '../lib/server/room-core.ts';
import {
  ensureSharedPlayer,
  type SharedRecord,
} from '../lib/server/shared-world.ts';
import { Prediction } from '../lib/coop/prediction.ts';
import {
  LinkMetrics,
  validInput,
  type Input,
} from '../lib/coop/realtime-protocol.ts';
import { RemoteMotion } from '../lib/coop/motion.ts';

function fixture() {
  const e = new Engine(createState(100));
  e.s.buildings = [];
  e.s.enemies = [];
  for (const t of e.s.tiles) {
    t.resource = null;
    t.terrain = 'grass';
  }
  const record: SharedRecord = {
    world: { state: e.s },
    players: {},
    room: 'test',
    history: [],
  };
  const ids = ['host', 'a', 'b', 'c'];
  for (const id of ids) {
    const p = ensureSharedPlayer(record, id, 'host', id, 1000);
    p.inventory = { wood: 30 };
    p.player.x = 15;
    p.player.z = 19 + ids.indexOf(id);
    p.paused = false;
  }
  record.world.state.player = record.players.host.player;
  record.world.state.inventory = record.players.host.inventory;
  return new RoomCore(record, 'host', 0);
}
const quantile = (a: number[], q: number) =>
  a.slice().sort((x, y) => x - y)[
    Math.min(a.length - 1, Math.floor(a.length * q))
  ] || 0;
void test('HTTP poses cannot move connected or disconnected actors; durable commands still work', async () => {
  for (const connected of [false, true]) {
    const room = fixture();
    if (connected) room.connect('host', 'Host', 1000);
    const p = room.record.players.host,
      before = { ...p.player };
    const response = await room.pulse(
      'host',
      'Host',
      {
        op: 'pulse',
        revision: 0,
        pulse: {
          seq: 1,
          paused: false,
          pose: { ...before, x: before.x + 4, z: before.z + 4 },
          commands: [{ seq: 1, method: 'trade', args: ['wood', 1, false] }],
        },
      },
      p.nonce,
      1500,
    );
    assert.equal(response.status, 200);
    assert.equal(p.player.x, before.x);
    assert.equal(p.player.z, before.z);
    assert.equal(p.inventory.wood, 29);
  }
});
void test('four-client network matrix: latency, jitter, loss, reorder, duplicate and reconciliation', (t) => {
  for (const latency of [50, 100, 200, 300])
    for (const impaired of [false, true]) {
      const room = fixture(),
        ids = ['host', 'a', 'b', 'c'],
        links = ids.map(() => new LinkMetrics()),
        motions = ids.map(() => new RemoteMotion());
      const clients = ids.map(
        () => new Engine(structuredClone(room.record.world.state), true),
      );
      const predictors = clients.map(
        (e) =>
          new Prediction(
            () => e.s,
            () => [],
          ),
      );
      const hellos = ids.map((id, i) => {
        const hello = room.connect(id, id, 1000);
        predictors[i].reset(hello.player);
        return hello;
      });
      type Delivery = { at: number; run: () => void };
      const queue: Delivery[] = [],
        cost: number[] = [],
        errors: number[] = [],
        steps: number[] = [];
      let deliveredAt=0;
      let ordinal = 0,
        lastDisplay: { x: number; z: number } | null = null;
      const enqueue = (now: number, run: () => void) => {
        ordinal++;
        if (impaired && ordinal % 17 === 0) return;
        const jitter = impaired ? ((ordinal * 31) % 91) - 45 : 0;
        const delay =
          latency / 2 + jitter + (impaired && ordinal % 13 === 0 ? 180 : 0);
        queue.push({ at: now + Math.max(0, delay), run });
        if (impaired && ordinal % 19 === 0)
          queue.push({ at: now + Math.max(0, delay) + 70, run });
      };
      for (let elapsed = 0; elapsed <= 20000; elapsed += 10) {
        const now = 1000 + elapsed;
        if (elapsed % 50 === 0) {
          for (let i = 0; i < 4; i++) {
            // Repeated straight stretches, stops and reversals, on collision-free
            // terrain: deviations measure netcode rather than pathfinding.
            const direction =
              elapsed < 5000
                ? 1
                : elapsed < 10000
                  ? -1
                  : elapsed < 14000
                    ? 1
                    : 0;
            predictors[i].input(direction, 0, false);
            const frames = structuredClone(predictors[i].pending.slice(0, 16));
            enqueue(now, () =>
              room.receive(ids[i], hellos[i].epoch, frames, now),
            );
          }
        }
        queue.sort((a, b) => a.at - b.at);
        while (queue[0]?.at <= now) {deliveredAt=now;queue.shift()!.run();}
        if (elapsed % 50 === 0) {
          const started = performance.now();
          room.step(now);
          cost.push(performance.now() - started);
        }
        if (elapsed % 100 === 0)
          for (let i = 0; i < 4; i++) {
            const packet = room.snapshot(ids[i], now);
            enqueue(now, () => {
              if (!links[i].snapshot(packet.tick,deliveredAt)) return;
              const p = packet.peers.find((p) => p.id === hellos[i].self)!;
              const correction = predictors[i].reconcile(p.ack, p.player);
              errors.push(Math.hypot(correction.x, correction.z));
              const peer = packet.peers[(i + 1) % 4];
              motions[i].push(peer.player, packet.tick, deliveredAt);
            });
          }
        if (elapsed % 1000 === 0)
          links.forEach((l) =>
            l.sampleRtt(
              latency + (impaired ? ((elapsed / 1000) * 17) % 80 : 0),
            ),
          );
        const displayed = motions[0].sample(now, 0.01, links[0].buffer);
        if (displayed) {
          if (lastDisplay)
            steps.push(
              Math.hypot(
                displayed.x - lastDisplay.x,
                displayed.z - lastDisplay.z,
              ),
            );
          lastDisplay = displayed;
        }
      }
      for (const p of predictors) {
        assert.ok(p.pending.length < 20);
        assert.ok(p.ack > 370);
      }
      assert.ok(
        Math.max(...steps) <= 0.080001,
        'late/reordered snapshots cannot teleport the mesh',
      );
      assert.ok(
        quantile(errors, 0.95) < 0.6,
        'p95 reconciliation stays below one tile',
      );
      assert.ok(links.every((l) => l.buffer >= 120 && l.buffer <= 650));
      if (impaired) {
        assert.ok(links.some((l) => l.stale > 0));
        assert.ok(links.some((l) => l.gaps > 0));
      }
      t.diagnostic(
        JSON.stringify({
          rtt: latency,
          impaired,
          serverTickP95Ms: +quantile(cost, 0.95).toFixed(3),
          correctionP95Tiles: +quantile(errors, 0.95).toFixed(3),
          correctionMaxTiles: +Math.max(...errors).toFixed(3),
          maxRenderedStep: +Math.max(...steps).toFixed(3),
          bufferMs: Math.round(links[0].buffer),
          snapshotGapPercent: +(links[0].loss * 100).toFixed(1),
        }),
      );
    }
});
void test('input authority rejects invalid/future epochs and flood; duplicate/reordered frames advance only once', () => {
  const room = fixture(),
    hello = room.connect('host', 'Host', 1000);
  const input = (seq: number): Input => ({ seq, dx: 1, dz: 0, sprint: false });
  assert.equal(validInput({ ...input(1), dx: 99 }), false);
  assert.equal(validInput({ ...input(1), dt: 999 }), false);
  assert.equal(room.receive('host', 'old', [input(1)], 1000), false);
  assert.equal(room.receive('host', hello.epoch, [input(999)], 1000), false);
  assert.ok(
    room.receive('host', hello.epoch, [input(2), input(1), input(1)], 1000),
  );
  room.step(1050);
  const x = room.record.players.host.player.x;
  assert.equal(room.streams.get('host')!.ack, 1);
  room.step(1100);
  assert.equal(room.streams.get('host')!.ack, 2);
  assert.ok(room.record.players.host.player.x > x);
  const last = room.record.players.host.player.x;
  room.receive('host', hello.epoch, [input(1), input(2)], 1150);
  room.step(1150);
  assert.equal(room.record.players.host.player.x, last);
  for (let n = 0; n < 40; n++) room.receive('host', hello.epoch, [], 1200);
  assert.equal(room.receive('host', hello.epoch, [], 1200), false);
});
void test('economic idempotency survives room reconstruction and socket reconnect; host crash freezes clock', async () => {
  let room = fixture();
  const hello = room.connect('host', 'Host', 1000);
  const p = room.record.players.host,
    price = tradeUnitPrice(room.record.world.state, 'wood', false),
    gold = room.record.world.state.gold;
  const nonce = p.nonce,
    body = {
      op: 'pulse',
      revision: 0,
      pulse: {
        seq: 1,
        paused: true,
        pose: { ...p.player },
        commands: [{ seq: 1, method: 'trade', args: ['wood', 1, false] }],
      },
    };
  const first = await room.pulse('host', 'Host', body, nonce, 1050);
  assert.equal(first.status, 200);
  const durable = structuredClone(room.record); // mirrors the atomic checkpoint before HTTP ACK
  room = new RoomCore(durable, 'host', room.revision);
  const retry = await room.pulse('host', 'Host', body, nonce, 1100);
  assert.equal(retry.status, 200);
  assert.equal(room.record.world.state.gold, gold + price);
  assert.equal(room.record.players.host.inventory.wood, 29);
  const renewed = room.connect('host', 'Host', 1200);
  assert.notEqual(renewed.epoch, hello.epoch);
  assert.equal(
    room.receive(
      'host',
      hello.epoch,
      [{ seq: 2, dx: 1, dz: 0, sprint: false }],
      1300,
    ),
    false,
  );
  const time = room.record.world.state.time;
  room.step(18000);
  assert.equal(room.record.world.state.time, time);
  assert.equal(room.snapshot('a', 18000).frozen, true);
  assert.ok(
    room
      .snapshot('a', 18000)
      .peers.some((p) => p.id === room.record.players.a.id),
    'idle client still receives its own authority and frozen state',
  );
});
