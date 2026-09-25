import test from 'node:test';
import assert from 'node:assert/strict';
import { testDatabase } from './helpers/d1.ts';
import { handleWorld } from '../lib/server/api.ts';
import { handleLobby } from '../lib/server/lobby.ts';
import { handleShared } from '../lib/server/shared-api.ts';
import { ServerWorldClient } from '../lib/server/client.ts';
import { Engine, createState } from '../lib/game/model.ts';
void test('client halts incompatible protocol and respects server rate-limit backoff', async () => {
  for (const status of [426, 429]) {
    let calls = 0,
      engine: Engine | null = null;
    const fetcher: typeof fetch = async (input) => {
      calls++;
      if (input === '/api/shared')
        return Response.json(
          { error: status === 426 ? 'Sürüm değişti' : 'İstek sınırı' },
          { status, headers: { 'Retry-After': '60' } },
        );
      return Response.json({
        state: createState(1),
        nonce: 'test',
        seq: 0,
        commandSeq: 0,
      });
    };
    const client = new ServerWorldClient(
      () => engine,
      () => true,
      () => {},
      fetcher,
    );
    try {
      engine = new Engine(await client.start(), true);
      client.bind(engine);
      await assert.rejects(client.enterShared());
      assert.equal(client.connected, false);
      assert.equal(client.send('trade', ['wood', 1, false]), false);
      const count = calls;
      await assert.rejects(client.flush());
      assert.equal(
        calls,
        count,
        'No requests while incompatible or waiting for Retry-After',
      );
    } finally {
      client.dispose();
    }
  }
});
void test('default transport calls native fetch without binding it to the client object', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async function (this: unknown) {
    assert.ok(this === undefined || this === globalThis);
    return Response.json({
      state: createState(1),
      nonce: 'test',
      seq: 0,
      commandSeq: 0,
    });
  };
  const client = new ServerWorldClient(
    () => null,
    () => true,
    () => {},
  );
  try {
    await client.start();
    assert.equal(client.connected, true);
  } finally {
    client.dispose();
    globalThis.fetch = original;
  }
});
void test('two real clients share actions, retry a lost response once and return to their private farms', async () => {
  const { db, sqlite } = testDatabase();
  let now = 1_000_000;
  function player() {
    let cookie = '',
      engine: Engine | null = null,
      drop = false;
    const fetcher: typeof fetch = async (input, options) => {
      assert.equal(typeof input, 'string');
      assert.equal(typeof options?.body, 'string');
      const path = input as string;
      const url = 'https://farm.test' + path,
        headers = new Headers(options?.headers);
      headers.set('Origin', 'https://farm.test');
      headers.set('Cookie', cookie);
      const request = new Request(url, { ...options, headers });
      now += 100;
      const handler =
        path === '/api/world'
          ? handleWorld
          : path === '/api/lobby'
            ? handleLobby
            : handleShared;
      const response = await handler(request, db, now);
      const token = response.headers.get('Set-Cookie');
      if (token) cookie = token.split(';')[0];
      if (
        drop &&
        path === '/api/shared' &&
        JSON.parse(options!.body as string).op === 'pulse'
      ) {
        drop = false;
        throw Error('Response lost after commit');
      }
      return response;
    };
    const client = new ServerWorldClient(
      () => engine,
      () => true,
      () => {},
      fetcher,
    );
    return {
      client,
      get engine() {
        return engine!;
      },
      loseResponse() {
        drop = true;
      },
      async start() {
        engine = new Engine(await client.start(), true);
        client.bind(engine);
      },
      async lobby(body: unknown) {
        const r = await fetcher('/api/lobby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        assert.equal(r.status, 200);
        return r.json() as Promise<{ room: { code: string } }>;
      },
    };
  }
  const host = player(),
    guest = player();
  try {
    await host.start();
    await guest.start();
    const privateHostGold = host.engine.s.gold,
      privateGuestGold = guest.engine.s.gold;
    const { room } = await host.lobby({ op: 'create', name: 'Ev sahibi' });
    await guest.lobby({ op: 'join', name: 'Konuk', code: room.code });
    await host.client.enterShared();
    await guest.client.enterShared();
    await host.client.flush();
    assert.equal(host.engine.network?.peers.length, 1);
    assert.equal(guest.engine.network?.peers.length, 1);
    assert.notEqual(
      host.engine.network!.peers[0].id,
      guest.engine.network!.peers[0].id,
    );
    const before = host.engine.s.inventory.wood;
    assert.deepEqual(guest.engine.s.inventory, {});
    assert.ok(guest.client.send('trade', ['wood', 1, true]));
    await guest.client.flush();
    const sharedGold = guest.engine.s.gold;
    assert.ok(guest.client.send('trade', ['wood', 1, false]));
    guest.loseResponse();
    await assert.rejects(guest.client.flush(), /Response lost/);
    await guest.client.flush();
    await host.client.flush();
    assert.equal(host.engine.s.inventory.wood, before);
    assert.equal(guest.engine.s.inventory.wood, 0);
    assert.equal(host.engine.s.gold, guest.engine.s.gold);
    assert.ok(host.engine.s.gold > sharedGold);
    const shifted = {
      ...guest.engine.s,
      player: { ...guest.engine.s.player, x: guest.engine.s.player.x + 13 },
    };
    const remote = new Engine(structuredClone(shifted), true);
    assert.deepEqual(remote.s.world, shifted.world);
    await host.client.leaveShared();
    assert.equal(host.client.shared, false);
    assert.equal(host.engine.s.gold, privateHostGold);
    await guest.client.flush();
    assert.equal(guest.client.shared, false);
    assert.equal(guest.engine.s.gold, privateGuestGold);
    assert.equal(guest.engine.network?.peers.length, 0);
  } finally {
    host.client.dispose();
    guest.client.dispose();
    sqlite.close();
  }
});
