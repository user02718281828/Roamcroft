import test from 'node:test';
import assert from 'node:assert/strict';
import { testDatabase } from './helpers/d1.ts';
import { handleWorld } from '../lib/server/api.ts';
import { handleLobby } from '../lib/server/lobby.ts';
import { handleShared } from '../lib/server/shared-api.ts';
import { ServerWorldClient } from '../lib/server/client.ts';
import { Engine, tradeUnitPrice } from '../lib/game/model.ts';
import type { SharedRecord } from '../lib/server/shared-world.ts';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
void test('four clients survive 300 ms RTT, deterministic 20% packet loss, mid-action reconnect and host crash', async (t) => {
  const { db, sqlite } = testDatabase();
  let offset = 0,
    latency = 0,
    loss = false,
    inflight = 0;
  const stats = { pulses: 0, lostBeforeCommit: 0, lostAfterCommit: 0 };
  const row = () => {
    const r = sqlite
      .prepare('SELECT owner,world,revision FROM shared_farms')
      .get() as { owner: string; world: string; revision: number };
    return { ...r, record: JSON.parse(r.world) as SharedRecord };
  };
  async function idle() {
    for (let n = 0; inflight && n < 200; n++) await wait(10);
    assert.equal(inflight, 0);
  }
  function player(name: string) {
    let cookie = '',
      engine: Engine | null = null,
      dropNext = false,
      client: ServerWorldClient;
    const fetcher: typeof fetch = async (input, options) => {
      assert.equal(typeof input, 'string');
      assert.equal(typeof options?.body, 'string');
      const path = input as string,
        body = JSON.parse(options!.body as string),
        isPulse = path === '/api/shared' && body.op === 'pulse';
      const ordinal = isPulse && loss ? ++stats.pulses : 0;
      const drop =
        dropNext && isPulse
          ? 'after'
          : ordinal > 0 && ordinal % 5 === 0
            ? ordinal % 10 === 0
              ? 'after'
              : 'before'
            : '';
      if (dropNext && isPulse) dropNext = false;
      inflight++;
      try {
        await wait(latency / 2);
        if (drop === 'before') {
          stats.lostBeforeCommit++;
          await wait(latency / 2);
          throw Error('Packet lost before server');
        }
        const headers = new Headers(options?.headers);
        headers.set('Cookie', cookie);
        headers.set('Origin', 'https://farm.test');
        const request = new Request('https://farm.test' + path, {
          ...options,
          headers,
        });
        const handler =
          path === '/api/world'
            ? handleWorld
            : path === '/api/lobby'
              ? handleLobby
              : handleShared;
        const response = await handler(request, db, Date.now() + offset);
        const nextCookie = response.headers.get('Set-Cookie');
        if (nextCookie) cookie = nextCookie.split(';')[0];
        await wait(latency / 2);
        if (drop === 'after') {
          stats.lostAfterCommit++;
          throw Error('Packet lost after commit');
        }
        return response;
      } finally {
        inflight--;
      }
    };
    const make = () =>
      new ServerWorldClient(
        () => engine,
        () => true,
        () => {},
        fetcher,
      );
    client = make();
    return {
      name,
      get client() {
        return client;
      },
      get engine() {
        return engine!;
      },
      dropResponse() {
        dropNext = true;
      },
      async start() {
        engine = new Engine(await client.start(), true);
        client.bind(engine);
      },
      async restart() {
        client.dispose();
        await idle();
        client = make();
        engine = new Engine(await client.start(), true);
        client.bind(engine);
      },
      async lobby(body: Record<string, unknown>) {
        const response = await fetcher('/api/lobby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        assert.equal(response.status, 200);
        return response.json() as Promise<{ room: { code: string } }>;
      },
    };
  }
  const players = ['Host', 'Ada', 'Deniz', 'Ekin'].map(player),
    host = players[0];
  async function settle() {
    let pending = players;
    for (let attempt = 0; pending.length && attempt < 12; attempt++) {
      const results = await Promise.allSettled(
        pending.map((p) => p.client.flush()),
      );
      pending = pending.filter((_, i) => results[i].status === 'rejected');
    }
    assert.equal(
      pending.length,
      0,
      'Every client must recover and acknowledge its commands',
    );
  }
  try {
    for (const p of players) await p.start();
    const { room } = await host.lobby({ op: 'create', name: host.name });
    for (const p of players.slice(1))
      await p.lobby({ op: 'join', name: p.name, code: room.code });
    await host.client.enterShared();
    await Promise.all(players.slice(1).map((p) => p.client.enterShared()));
    const fixture = row();
    for (const p of Object.values(fixture.record.players))
      p.inventory = { wood: 20 };
    fixture.record.world.state.inventory = { wood: 20 };
    sqlite
      .prepare('UPDATE shared_farms SET world=?')
      .run(JSON.stringify(fixture.record));
    await settle();
    const ids = Object.values(row().record.players)
        .map((p) => p.id)
        .sort(),
      price = tradeUnitPrice(row().record.world.state, 'wood', false),
      gold = row().record.world.state.gold;
    latency = 300;
    loss = true;
    for (let round = 0; round < 6; round++) {
      for (const p of players) {
        assert.ok(p.client.send('trade', ['wood', 1, false]));
        assert.match(p.client.status, /gönderiliyor/);
      }
      await settle();
    }
    loss = false;
    await settle();
    const saved = row();
    assert.equal(saved.record.world.state.gold, gold + 24 * price);
    assert.deepEqual(
      Object.values(saved.record.players).map((p) => p.inventory.wood),
      [14, 14, 14, 14],
    );
    for (const p of players) {
      assert.equal(p.engine.network?.peers.length, 3);
      assert.equal(p.engine.s.inventory.wood, 14);
      assert.equal(p.engine.s.gold, saved.record.world.state.gold);
      assert.equal(p.engine.s.day, saved.record.world.state.day);
      assert.equal(p.engine.s.time, saved.record.world.state.time);
    }
    assert.ok(stats.lostBeforeCommit > 0 && stats.lostAfterCommit > 0);
    assert.equal(
      stats.lostBeforeCommit + stats.lostAfterCommit,
      Math.floor(stats.pulses / 5),
    );
    t.diagnostic(
      `4 clients; 300 ms simulated RTT; ${stats.pulses} pulse attempts, ${stats.lostBeforeCommit} request losses and ${stats.lostAfterCommit} response losses; 24 economic actions committed exactly once.`,
    );

    // Commit succeeded, response disappeared, then the guest process was destroyed.
    const guest = players[1];
    guest.dropResponse();
    assert.ok(guest.client.send('trade', ['wood', 1, false]));
    await assert.rejects(guest.client.flush(), /Packet lost/);
    await guest.restart();
    await guest.client.enterShared();
    assert.equal(guest.engine.s.inventory.wood, 13);
    assert.equal(row().record.world.state.gold, gold + 25 * price);

    // No unload/leave call: the host process disappears after an unacknowledged commit.
    host.dropResponse();
    assert.ok(host.client.send('trade', ['wood', 1, false]));
    await assert.rejects(host.client.flush(), /Packet lost/);
    host.client.dispose();
    await idle();
    const crashSave = row();
    assert.equal(crashSave.record.world.state.gold, gold + 26 * price);
    offset += 16_000;
    await assert.rejects(guest.client.flush(), /Ev sahibinin bağlantısı/);
    assert.equal(
      row().world,
      crashSave.world,
      'Host crash must freeze world mutations',
    );
    await players[3].client.leaveShared();
    assert.equal(players[3].client.shared, false);
    assert.equal(players[3].engine.s.inventory.wood, 25);
    offset += 301_000;
    for (const p of players.slice(1)) {
      await p.client.flush();
      assert.equal(p.client.shared, false);
      assert.equal(p.engine.s.inventory.wood, 25);
    }
    assert.equal(
      row().world,
      crashSave.world,
      'Returning to personal farms must not overwrite cloud save',
    );
    latency = 0;
    await host.restart();
    const reopened = await host.lobby({ op: 'create', name: host.name });
    assert.notEqual(reopened.room.code, room.code);
    await host.client.enterShared();
    for (const p of players.slice(1)) {
      await p.lobby({ op: 'join', name: p.name, code: reopened.room.code });
      await p.client.enterShared();
    }
    await settle();
    assert.equal(host.engine.s.inventory.wood, 13);
    assert.equal(guest.engine.s.inventory.wood, 13);
    assert.equal(row().record.world.state.gold, gold + 26 * price);
    assert.deepEqual(
      Object.values(row().record.players)
        .map((p) => p.id)
        .sort(),
      ids,
    );
    t.diagnostic(
      'Guest teardown/reconnect and host crash without a leave request preserved committed inventory and currency; 15-second freeze and 5-minute close exercised using the server test clock.',
    );
  } finally {
    for (const p of players) p.client.dispose();
    await idle();
    sqlite.close();
  }
});
