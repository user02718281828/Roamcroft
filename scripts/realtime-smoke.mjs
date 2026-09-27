import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { performance } from 'node:perf_hooks';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const percentile = (values, p) =>
  values.slice().sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * p))
  ] || 0;

// Uses the four authenticated, local-only players created by check-http.
export async function verifyRealtime(base, players, call) {
  assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname),
  );
  const start = performance.now(),
    clients = [],
    rtts = [],
    intervals = [],
    bytes = [];
  const timers = new Set();
  let faults = null,
    ordinal = 0,
    dropped = 0,
    stale = 0,
    gaps = 0;
  const deliver = (run) => {
    if (!faults) {
      run();
      return;
    }
    const n = ++ordinal;
    if (faults.impaired && n % 17 === 0) {
      dropped++;
      return;
    }
    const delay = Math.max(
      0,
      faults.rtt / 2 +
        (faults.impaired ? ((n * 31) % 91) - 45 + (n % 13 === 0 ? 180 : 0) : 0),
    );
    const schedule = (ms) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        run();
      }, ms);
      timers.add(timer);
    };
    schedule(delay);
    if (faults.impaired && n % 19 === 0) schedule(delay + 70);
  };
  const send = (client, wire) =>
    deliver(() => {
      if (client.ws.readyState === WebSocket.OPEN) client.ws.send(wire);
    });
  async function connect(player) {
    const url = new URL('/api/realtime?v=1', base);
    url.protocol = 'ws:';
    const ws = new WebSocket(url, {
      headers: { Cookie: player.cookie, Origin: new URL(base).origin },
    });
    const client = {
      ws,
      hello: null,
      snapshots: [],
      seq: 0,
      ack: 0,
      frames: [],
      last: 0,
      closed: false,
    };
    clients.push(client);
    const receive = (data) => {
      const packet = JSON.parse(String(data));
      if (packet.type === 'hello') client.hello = packet;
      if (packet.type === 'pong') rtts.push(performance.now() - packet.sent);
      if (packet.type === 'snapshot') {
        const previous = client.snapshots.at(-1);
        if (previous && packet.tick <= previous.tick) {
          stale++;
          return;
        }
        if (previous)
          gaps += Math.max(0, (packet.tick - previous.tick) / 2 - 1);
        if (client.last) intervals.push(performance.now() - client.last);
        client.last = performance.now();
        bytes.push(data.length);
        assert.equal(packet.epoch, client.hello.epoch);
        if (client.snapshots.length)
          assert.ok(packet.tick > client.snapshots.at(-1).tick);
        client.snapshots.push(packet);
        const self = packet.peers.find((p) => p.id === client.hello.self);
        if (self) {
          client.ack = self.ack;
          client.frames = client.frames.filter((f) => f.seq > self.ack);
        }
      }
    };
    ws.on('message', (data) => {
      if (JSON.parse(String(data)).type === 'hello') receive(data);
      else deliver(() => receive(data));
    });
    ws.on('error', () => {
      client.closed = true;
    });
    for (let i = 0; !client.hello && i < 100; i++) await wait(20);
    assert.ok(client.hello, 'WebSocket hello arrived');
    return client;
  }
  try {
    for (const p of players) await connect(p);
    for (let step = 0; step < 80; step++) {
      for (const client of clients) {
        client.frames.push({
          seq: ++client.seq,
          dx: step < 50 ? 0.3 : 0,
          dz: 0,
          sprint: false,
        });
        const wire = JSON.stringify({
          type: 'inputs',
          epoch: client.hello.epoch,
          frames: client.frames.slice(0, 16),
        });
        client.ws.send(wire);
        if (step === 20) client.ws.send(wire); // deliberate duplicate input batch
        if (step % 20 === 0)
          client.ws.send(
            JSON.stringify({ type: 'ping', sent: performance.now() }),
          );
      }
      await wait(50);
    }
    await wait(200);
    for (const c of clients) {
      assert.ok(c.ack >= 75, 'inputs are ACKed without an ever-growing queue');
      assert.ok(c.snapshots.length >= 30, '10Hz snapshots reach each player');
      assert.equal(c.snapshots.at(-1).peers.length, 4);
      assert.equal(c.closed, false);
    }
    const report = (label) => {
      const jitter = rtts.slice(1).map((r, i) => Math.abs(r - rtts[i]));
      const mean = intervals.reduce((sum, n) => sum + n, 0) / intervals.length;
      console.info(
        label,
        JSON.stringify({
          clients: 4,
          rttP50Ms: +percentile(rtts, 0.5).toFixed(2),
          rttP95Ms: +percentile(rtts, 0.95).toFixed(2),
          jitterP95Ms: +percentile(jitter, 0.95).toFixed(2),
          snapshotHz: +(1000 / mean).toFixed(2),
          snapshotIntervalP95Ms: +percentile(intervals, 0.95).toFixed(2),
          snapshotBytesP95: percentile(bytes, 0.95),
          injectedApplicationDrops: dropped,
          discardedStale: stale,
          snapshotSequenceGaps: gaps,
        }),
      );
    };
    report('Stage 1 / real local WebSocket baseline:');
    for (const rtt of [50, 100, 200, 300])
      for (const impaired of [false, true]) {
        faults = { rtt, impaired };
        ordinal = 0;
        dropped = 0;
        stale = 0;
        gaps = 0;
        rtts.length = 0;
        intervals.length = 0;
        const initial = clients.map((c) => c.ack);
        for (let step = 0; step < 60; step++) {
          for (const c of clients) {
            c.frames.push({
              seq: ++c.seq,
              dx: step < 30 ? 0.15 : -0.15,
              dz: 0,
              sprint: false,
            });
            send(
              c,
              JSON.stringify({
                type: 'inputs',
                epoch: c.hello.epoch,
                frames: c.frames.slice(0, 16),
              }),
            );
            if (step % 10 === 0)
              send(
                c,
                JSON.stringify({ type: 'ping', sent: performance.now() }),
              );
          }
          await wait(50);
        }
        for (let i = 0; i < clients.length; i++) {
          assert.ok(
            clients[i].ack - initial[i] >= 40,
            'input ACK progresses under faults',
          );
          assert.ok(clients[i].frames.length < 25, 'bounded input backlog');
          assert.equal(clients[i].closed, false);
        }
        assert.ok(rtts.length >= 8, 'measured ping round trips');
        report(`Stage 3 / injected ${rtt} ms RTT, faults=${impaired}:`);
        faults = null;
        await wait(400);
      }
    faults = null;
    clients[0].ws.terminate();
    await wait(16000);
    for (const c of clients.slice(1))
      assert.equal(
        c.snapshots.at(-1).frozen,
        true,
        'host crash freezes authority after grace',
      );
    await call('/api/shared', { op: 'connect' }, players[1].cookie, '', 423);
    const hostRestored = await call(
      '/api/shared',
      { op: 'connect' },
      players[0].cookie,
    );
    assert.equal(hostRestored.you.id, clients[0].hello.self);
    await connect(players[0]);
    console.info(
      'Host abrupt socket termination: room frozen after 15 s grace, guest actions rejected, same host identity restored.',
    );
    const before = clients[1].snapshots
      .at(-1)
      .peers.find((p) => p.id === clients[1].hello.self).player;
    const oldEpoch = clients[1].hello.epoch;
    clients[1].ws.terminate();
    const replacement = await connect(players[1]);
    assert.equal(
      replacement.hello.self,
      clients[1].hello.self,
      'stable player identity',
    );
    assert.notEqual(
      replacement.hello.epoch,
      oldEpoch,
      'old in-flight frames fenced out',
    );
    assert.ok(
      Math.hypot(
        replacement.hello.player.x - before.x,
        replacement.hello.player.z - before.z,
      ) < 0.5,
      'reconnect keeps position',
    );
    if (process.send) {
      const durable = await Promise.all(
        players.map((p) => call('/api/shared', { op: 'connect' }, p.cookie)),
      );
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(Error('Runtime restart timed out')),
          15000,
        );
        process.once('message', (message) => {
          clearTimeout(timeout);
          if (message?.type === 'runtime-restarted') resolve();
          else reject(Error('Runtime restart failed'));
        });
        process.send({ type: 'restart-room-runtime' });
      });
      for (let i = 0; i < players.length; i++) {
        const restored = await call(
          '/api/shared',
          { op: 'connect' },
          players[i].cookie,
        );
        assert.equal(restored.you.id, durable[i].you.id);
        assert.deepEqual(
          restored.bag,
          durable[i].bag,
          'atomic economic checkpoint survives Worker reload',
        );
        const reconnected = await connect(players[i]);
        assert.equal(reconnected.hello.self, durable[i].you.id);
      }
      console.info(
        'Worker runtime restart: 4 stable identities, inventories and WebSocket reconnections passed.',
      );
    }
    const mean = intervals.reduce((sum, n) => sum + n, 0) / intervals.length;
    console.info(
      'Realtime WebSocket measurements:',
      JSON.stringify({
        clients: 4,
        seconds: +((performance.now() - start) / 1000).toFixed(2),
        rttP50Ms: +percentile(rtts, 0.5).toFixed(2),
        rttP95Ms: +percentile(rtts, 0.95).toFixed(2),
        snapshotHz: +(1000 / mean).toFixed(2),
        snapshotIntervalP50Ms: +percentile(intervals, 0.5).toFixed(2),
        snapshotIntervalP95Ms: +percentile(intervals, 0.95).toFixed(2),
        snapshotBytesP95: percentile(bytes, 0.95),
        duplicateAndReconnect: 'passed',
      }),
    );
  } finally {
    for (const timer of timers) clearTimeout(timer);
    for (const c of clients) c.ws.terminate();
  }
}
