import test from 'node:test';
import assert from 'node:assert/strict';
import { handleWorld } from '../lib/server/api.ts';
import { handleLobby } from '../lib/server/lobby.ts';
import { handleShared } from '../lib/server/shared-api.ts';
import { testDatabase } from './helpers/d1.ts';
import type { SharedRecord } from '../lib/server/shared-world.ts';
import { tileAt, type State } from '../lib/game/model.ts';
import { BUILDINGS } from '../lib/game/data.ts';
import { applyDelta, type WorldDelta } from '../lib/server/delta.ts';
import type { Command, Peer } from '../lib/coop/protocol.ts';
import { guardOnline } from '../lib/server/diagnostics.ts';
type Packet = {
  nonce: string;
  seq: number;
  commandSeq: number;
  revision: number;
  bag: Pick<State, 'inventory' | 'overflow'>;
  state?: State;
  patches?: WorldDelta[];
  you: Peer;
  peers: Peer[];
  room?: { code: string };
  error?: string;
};
function harness() {
  const { db, sqlite, failNextBatchAfter } = testDatabase();
  let now = 1_000_000;
  async function call(
    path: string,
    body: unknown,
    cookie = '',
    nonce = '',
    origin = 'https://farm.test',
    protocol = '1',
  ) {
    const req = new Request('https://farm.test' + path, {
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        Cookie: cookie,
        'X-Roamcroft-Nonce': nonce,
        'X-Roamcroft-Protocol': protocol,
      },
      body: JSON.stringify(body),
    });
    const response = await (
      path === '/api/world'
        ? handleWorld
        : path === '/api/lobby'
          ? handleLobby
          : handleShared
    )(req, db, now);
    return {
      status: response.status,
      data: (await response.json()) as Packet,
      headers: response.headers,
    };
  }
  async function session() {
    const r = await call('/api/world', { op: 'session' });
    assert.equal(r.status, 201);
    return r.headers.get('Set-Cookie')!.split(';')[0];
  }
  const row = () => {
    const r = sqlite
      .prepare('SELECT owner,world,revision FROM shared_farms')
      .get() as { owner: string; world: string; revision: number };
    return { ...r, record: JSON.parse(r.world) as SharedRecord };
  };
  return {
    sqlite,
    failNextBatchAfter,
    call,
    session,
    row,
    advance: (dt: number) => (now += dt),
    save: (r: SharedRecord) =>
      sqlite.prepare('UPDATE shared_farms SET world=?').run(JSON.stringify(r)),
    async setup() {
      const host = await session(),
        guest = await session();
      const lobby = await call(
        '/api/lobby',
        { op: 'create', name: 'Ev sahibi' },
        host,
      );
      assert.equal(lobby.status, 200);
      const code = lobby.data.room!.code;
      assert.equal(
        (await call('/api/lobby', { op: 'join', name: 'Konuk', code }, guest))
          .status,
        200,
      );
      const a = await call('/api/shared', { op: 'connect' }, host),
        b = await call('/api/shared', { op: 'connect' }, guest);
      assert.equal(a.status, 200);
      assert.equal(b.status, 200);
      return { host, guest, code, a: a.data, b: b.data };
    },
  };
}
function pulse(
  p: Packet,
  commands: Command[] = [],
  pose = p.you.player,
  paused = true,
) {
  return {
    op: 'pulse',
    revision: p.revision,
    pulse: {
      seq: p.seq + 1,
      pose: { x: pose.x, z: pose.z, facing: pose.facing },
      commands,
      paused,
    },
  };
}
void test('protocol mismatch, bounded retries and rate limiting never mutate the shared save', async () => {
  const h = harness();
  try {
    const x = await h.setup(),
      before = h.row();
    for (const protocol of ['', '0', '999'])
      assert.equal(
        (
          await h.call(
            '/api/shared',
            { op: 'connect' },
            x.host,
            '',
            'https://farm.test',
            protocol,
          )
        ).status,
        426,
      );
    assert.equal(h.row().world, before.world);
    h.sqlite
      .prepare(
        "UPDATE authoritative_limits SET count=180 WHERE id LIKE 'shared:%'",
      )
      .run();
    const denied = await h.call('/api/shared', pulse(x.a), x.host, x.a.nonce);
    assert.equal(denied.status, 429);
    assert.equal(denied.headers.get('Retry-After'), '60');
    assert.equal(h.row().world, before.world);
    h.advance(60_001);
    const resumed = await h.call('/api/shared', pulse(x.a), x.host, x.a.nonce);
    assert.equal(resumed.status, 200);
  } finally {
    h.sqlite.close();
  }
});
void test('concurrent duplicate requests commit once and a failed cloud transaction rolls back before retry', async () => {
  const h = harness();
  try {
    const x = await h.setup(),
      before = h.row();
    const body = pulse(x.a, [
      { seq: 1, method: 'trade', args: ['wood', 1, false] },
    ]);
    const duplicate = await Promise.all([
      h.call('/api/shared', body, x.host, x.a.nonce),
      h.call('/api/shared', body, x.host, x.a.nonce),
    ]);
    assert.ok(duplicate.every((r) => r.status === 200));
    assert.equal(h.row().revision, before.revision + 1);
    assert.equal(
      h.row().record.players[before.owner].inventory.wood,
      before.record.world.state.inventory.wood - 1,
    );
    const a = duplicate[0].data,
      body2 = pulse(a, [{ seq: 2, method: 'trade', args: ['wood', 1, false] }]),
      saved = h.row();
    h.failNextBatchAfter(1);
    await assert.rejects(
      h.call('/api/shared', body2, x.host, a.nonce),
      /Injected transaction failure/,
    );
    assert.equal(h.row().world, saved.world);
    assert.equal(h.row().revision, saved.revision);
    assert.equal(
      (await h.call('/api/shared', body2, x.host, a.nonce)).status,
      200,
    );
    assert.equal(
      h.row().record.players[before.owner].inventory.wood,
      before.record.world.state.inventory.wood - 2,
    );
  } finally {
    h.sqlite.close();
  }
});
void test('API failure logs carry a correlation ID and omit secrets, exception text and player data', async () => {
  const lines: string[] = [];
  const response = await guardOnline(
    'shared',
    async () => {
      throw Error('SECRET_COOKIE INVITE_CODE PLAYER_NAME');
    },
    (line) => lines.push(line),
  );
  assert.equal(response.status, 503);
  assert.equal(lines.length, 1);
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.requestId, response.headers.get('X-Roamcroft-Request-Id'));
  assert.equal(entry.event, 'online_api_failure');
  assert.ok(!lines[0].includes('SECRET_COOKIE'));
  assert.ok(!(await response.text()).includes('INVITE_CODE'));
  await guardOnline(
    'lobby',
    async () => Response.json({ error: 'capacity' }, { status: 503 }),
    (line) => lines.push(line),
  );
  await guardOnline(
    'shared',
    async () => Response.json({ error: 'nonce' }, { status: 409 }),
    (line) => lines.push(line),
  );
  assert.equal(lines.length, 2);
});
void test('departed player slots do not block construction and return at a valid free position', async () => {
  const h = harness();
  try {
    const x = await h.setup(),
      spot = x.b.you.player;
    await h.call('/api/lobby', { op: 'leave' }, x.guest);
    const built = await h.call(
      '/api/shared',
      pulse(x.a, [
        { seq: 1, method: 'build', args: ['fence', spot.x, spot.z, 0, false] },
      ]),
      x.host,
      x.a.nonce,
    );
    assert.equal(built.status, 200);
    assert.ok(
      h
        .row()
        .record.world.state.buildings.some(
          (b) => b.x === spot.x && b.z === spot.z,
        ),
    );
    await h.call(
      '/api/lobby',
      { op: 'join', name: 'Geri dönen', code: x.code },
      x.guest,
    );
    const returned = await h.call('/api/shared', { op: 'connect' }, x.guest);
    assert.equal(returned.status, 200);
    assert.ok(
      returned.data.you.player.x !== spot.x ||
        returned.data.you.player.z !== spot.z,
    );
  } finally {
    h.sqlite.close();
  }
});
void test('four simultaneous players cross midnight once and reconnect from a missed delta window', async () => {
  const h = harness();
  try {
    const x = await h.setup(),
      cookies = [x.host, x.guest, await h.session(), await h.session()];
    for (const cookie of cookies.slice(2))
      await h.call(
        '/api/lobby',
        { op: 'join', name: 'Gece gezgini', code: x.code },
        cookie,
      );
    const r = h.row().record;
    r.world.state.time = 1 - 0.4 / 300;
    h.save(r);
    const packets: Packet[] = [];
    for (const cookie of cookies) {
      let p = (await h.call('/api/shared', { op: 'connect' }, cookie)).data;
      p = (
        await h.call(
          '/api/shared',
          pulse(p, [], p.you.player, false),
          cookie,
          p.nonce,
        )
      ).data;
      packets.push(p);
    }
    h.advance(1000);
    const replies = await Promise.all(
      cookies.map((cookie, i) =>
        h.call(
          '/api/shared',
          pulse(packets[i], [], packets[i].you.player, false),
          cookie,
          packets[i].nonce,
        ),
      ),
    );
    assert.ok(replies.every((r) => r.status === 200));
    const final = h.row().record.world.state;
    assert.equal(final.day, 2);
    assert.ok(Math.abs(final.time - 0.6 / 300) < 1e-6);
    for (const reply of replies) {
      const day = reply.data.patches?.flatMap((d) =>
        d.changes.day === undefined ? [] : [d.changes.day],
      );
      assert.deepEqual(day, [2]);
    }
    const trimmed = h.row().record;
    trimmed.history = [];
    h.save(trimmed);
    const p = replies[1].data,
      old = pulse(p);
    old.revision = 0;
    const fresh = await h.call('/api/shared', old, x.guest, p.nonce);
    assert.equal(fresh.status, 200);
    assert.ok(fresh.data.state);
    assert.equal(fresh.data.state.day, 2);
    assert.equal(fresh.data.state.time, final.time);
  } finally {
    h.sqlite.close();
  }
});
void test('delayed crafting and machine products return to the paying guest, even after leaving', async () => {
  const h = harness();
  try {
    const x = await h.setup(),
      row = h.row(),
      guestId = Object.keys(row.record.players).find((id) => id !== row.owner)!;
    row.record.players[guestId].inventory = { fiber: 8, wheat: 6 };
    row.record.world.state.level = 3;
    row.record.world.state.buildings.push({
      id: 999,
      type: 'mill',
      x: 14,
      z: 20,
      level: 1,
      hp: 100,
      timer: 0,
      enabled: true,
      repeat: true,
      processing: false,
    });
    h.save(row.record);
    const bought = await h.call(
      '/api/shared',
      pulse(x.b, [
        { seq: 1, method: 'craft', args: ['rope'] },
        { seq: 2, method: 'startProduction', args: [999] },
      ]),
      x.guest,
      x.b.nonce,
    );
    assert.equal(bought.status, 200);
    assert.equal(bought.data.bag.inventory.fiber, 4);
    assert.equal(bought.data.bag.inventory.wheat, 3);
    let host = (
      await h.call(
        '/api/shared',
        pulse(x.a, [], x.a.you.player, false),
        x.host,
        x.a.nonce,
      )
    ).data;
    const pending = h.row().record;
    pending.world.state.jobs[0].remaining = 0.1;
    pending.world.state.buildings.find((b) => b.id === 999)!.timer = 44.9;
    h.save(pending);
    await h.call('/api/lobby', { op: 'leave' }, x.guest);
    h.advance(1000);
    host = (
      await h.call(
        '/api/shared',
        pulse(host, [], host.you.player, false),
        x.host,
        host.nonce,
      )
    ).data;
    h.advance(500);
    host = (
      await h.call(
        '/api/shared',
        pulse(host, [], host.you.player, false),
        x.host,
        host.nonce,
      )
    ).data;
    const completed = h.row().record;
    assert.equal(completed.players[guestId].inventory.rope, 2);
    assert.equal(completed.players[guestId].inventory.flour, 2);
    assert.equal(host.bag.inventory.rope, undefined);
    assert.equal(host.bag.inventory.flour, undefined);
    assert.equal(completed.world.state.jobs.length, 0);
    assert.equal(completed.players[guestId].inventory.wheat, 0);
    const fishing = { x: 19, z: 25, timer: 0.1 };
    completed.world.runtime!.fishing = fishing;
    completed.players[row.owner].fishing = { ...fishing };
    h.save(completed);
    h.advance(1000);
    await h.call(
      '/api/shared',
      pulse(host, [], host.you.player, false),
      x.host,
      host.nonce,
    );
    assert.equal(h.row().record.world.runtime!.fishing, null);
    assert.equal(h.row().record.players[row.owner].fishing, null);
  } finally {
    h.sqlite.close();
  }
});
void test('shared API requires membership, authenticated cookie, strict input and nonce', async () => {
  const h = harness();
  try {
    assert.equal((await h.call('/api/shared', { op: 'connect' })).status, 401);
    const cookie = await h.session();
    assert.equal(
      (await h.call('/api/shared', { op: 'connect' }, cookie)).status,
      410,
    );
    assert.equal(
      (
        await h.call(
          '/api/shared',
          { op: 'connect' },
          cookie,
          '',
          'https://evil.test',
        )
      ).status,
      403,
    );
    const x = await h.setup();
    assert.equal(
      (await h.call('/api/shared', { op: 'connect', owner: 'forged' }, x.guest))
        .status,
      400,
    );
    assert.equal(
      (await h.call('/api/shared', pulse(x.b), x.guest, x.a.nonce)).status,
      409,
    );
    assert.equal(
      (
        await h.call(
          '/api/shared',
          {
            op: 'pulse',
            revision: 0,
            pulse: {
              seq: 1,
              pose: { x: 0, z: 0, facing: 0 },
              commands: [{ seq: 1, method: 'add', args: [{ gold: 999 }] }],
              paused: false,
            },
          },
          x.guest,
          x.b.nonce,
        )
      ).status,
      400,
    );
    const before = h.row();
    assert.equal(before.revision, 2);
    assert.equal(Object.keys(before.record.players).length, 2);
    assert.ok(!JSON.stringify(x.b).includes(before.owner));
  } finally {
    h.sqlite.close();
  }
});
void test('concurrent harvest and building placement commit only once and preserve private worlds', async () => {
  const h = harness();
  try {
    const x = await h.setup(),
      r = h.row().record,
      owner = h.row().owner;
    const guest = Object.keys(r.players).find((id) => id !== owner)!;
    Object.assign(r.world.state.player, { x: 15, z: 19 });
    Object.assign(r.players[owner].player, { x: 15, z: 19 });
    Object.assign(r.players[guest].player, { x: 13, z: 19 });
    for (const z of [19, 20])
      Object.assign(tileAt(r.world.state, 14, z)!, {
        terrain: 'grass',
        resource: null,
        source: null,
        crop: null,
        tilled: false,
        height: 0,
      });
    Object.assign(tileAt(r.world.state, 14, 19)!, {
      crop: 'wheat',
      tilled: true,
      growth: 999,
      water: 100,
    });
    r.world.state.inventory = { wood: 100 };
    r.players[owner].inventory = r.world.state.inventory;
    r.players[guest].inventory = { wood: 100 };
    r.world.state.stats.harvest = 0;
    h.save(r);
    const original = h.sqlite
      .prepare('SELECT world FROM authoritative_worlds WHERE id=?')
      .get(owner)!.world;
    const harvest = (p: Packet) =>
      pulse(p, [{ seq: 1, method: 'act', args: [14, 19, 'hand', 'wheat'] }]);
    const aBody = harvest(x.a),
      bBody = harvest(x.b);
    const [a, b] = await Promise.all([
      h.call('/api/shared', aBody, x.host, x.a.nonce),
      h.call('/api/shared', bBody, x.guest, x.b.nonce),
    ]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(h.row().record.world.state.stats.harvest, 1);
    const wheat = () =>
      Object.values(h.row().record.players).reduce(
        (n, p) => n + (p.inventory.wheat || 0),
        0,
      );
    const count = wheat();
    assert.equal(
      (await h.call('/api/shared', aBody, x.host, x.a.nonce)).status,
      200,
    );
    assert.equal(wheat(), count);
    const build = (p: Packet) =>
      pulse(p, [
        { seq: 2, method: 'build', args: ['fence', 14, 20, 0, false] },
      ]);
    const placed = await Promise.all([
      h.call('/api/shared', build(a.data), x.host, a.data.nonce),
      h.call('/api/shared', build(b.data), x.guest, b.data.nonce),
    ]);
    assert.ok(placed.every((p) => p.status === 200));
    const after = h.row().record.world.state;
    assert.equal(
      after.buildings.filter((b) => b.x === 14 && b.z === 20).length,
      1,
    );
    assert.equal(
      Object.values(h.row().record.players).reduce(
        (n, p) => n + (p.inventory.wood || 0),
        0,
      ),
      200 - BUILDINGS.fence.cost.wood,
    );
    assert.equal(
      h.sqlite
        .prepare('SELECT world FROM authoritative_worlds WHERE id=?')
        .get(owner)!.world,
      original,
    );
    const fence = after.buildings.find((b) => b.x === 14 && b.z === 20)!;
    const denied = await h.call(
      '/api/shared',
      pulse(placed[1].data, [{ seq: 3, method: 'demolish', args: [fence.id] }]),
      x.guest,
      placed[1].data.nonce,
    );
    assert.equal(denied.status, 200);
    assert.ok(
      h.row().record.world.state.buildings.some((b) => b.id === fence.id),
    );
  } finally {
    h.sqlite.close();
  }
});
void test('world time advances once, movement is bounded and incremental updates include other players actions', async () => {
  const h = harness();
  try {
    const x = await h.setup();
    let a = x.a,
      b = x.b;
    let state = x.b.state!;
    let revision = x.b.revision;
    function accept(p: Packet) {
      if (p.state) state = p.state;
      else
        for (const d of p.patches!) {
          state = applyDelta(state, d, revision++);
        }
      revision = p.revision;
    }
    const start = state.time;
    a = (
      await h.call(
        '/api/shared',
        pulse(a, [], a.you.player, false),
        x.host,
        a.nonce,
      )
    ).data;
    b = (
      await h.call(
        '/api/shared',
        pulse(b, [], b.you.player, false),
        x.guest,
        b.nonce,
      )
    ).data;
    accept(b);
    h.advance(1000);
    a = (
      await h.call(
        '/api/shared',
        pulse(a, [], { ...a.you.player, x: 1e9, z: 1e9 }, false),
        x.host,
        a.nonce,
      )
    ).data;
    b = (
      await h.call(
        '/api/shared',
        pulse(b, [], { ...b.you.player, x: -1e9, z: -1e9 }, false),
        x.guest,
        b.nonce,
      )
    ).data;
    accept(b);
    assert.ok(
      Math.hypot(
        a.you.player.x - x.a.you.player.x,
        a.you.player.z - x.a.you.player.z,
      ) < 7,
    );
    assert.ok(
      Math.hypot(
        b.you.player.x - x.b.you.player.x,
        b.you.player.z - x.b.you.player.z,
      ) < 1,
    );
    assert.ok(Math.abs(state.time - start - 1 / 300) < 1e-6);
    assert.equal(b.peers.length, 2);
    assert.ok(b.patches && !b.state);
    assert.deepEqual(state, {
      ...h.row().record.world.state,
      inventory: {},
      overflow: {},
    });
    h.advance(500);
    b = (await h.call('/api/shared', pulse(b), x.guest, b.nonce)).data;
    assert.equal(b.peers.length, 2);
  } finally {
    h.sqlite.close();
  }
});
void test('reconnect retains acknowledged commands and reopening host lobby restores its shared farm', async () => {
  const h = harness();
  try {
    const x = await h.setup();
    const r = h.row().record;
    r.world.state.gold = 987;
    h.save(r);
    const p = (await h.call('/api/shared', pulse(x.b), x.guest, x.b.nonce))
      .data;
    const connected = (await h.call('/api/shared', { op: 'connect' }, x.guest))
      .data;
    assert.equal(connected.seq, p.seq);
    assert.equal(connected.nonce, p.nonce);
    assert.equal(
      (await h.call('/api/lobby', { op: 'leave' }, x.host)).status,
      200,
    );
    assert.equal(
      (await h.call('/api/shared', pulse(p), x.guest, p.nonce)).status,
      410,
    );
    await h.call('/api/lobby', { op: 'create', name: 'Ev sahibi' }, x.host);
    const reopened = await h.call('/api/shared', { op: 'connect' }, x.host);
    assert.equal(reopened.status, 200);
    assert.equal(reopened.data.state!.gold, 987);
    assert.equal(
      Object.values(h.row().record.players).filter((p) => p.present).length,
      1,
    );
    assert.equal(
      (await h.call('/api/shared', pulse(x.a), x.host, x.a.nonce)).status,
      409,
    );
  } finally {
    h.sqlite.close();
  }
});
void test('guest bags persist across leaving and reopening, and shared chest withdrawals are atomic', async () => {
  const h = harness();
  try {
    const x = await h.setup(),
      row = h.row(),
      guestId = Object.keys(row.record.players).find((id) => id !== row.owner)!;
    row.record.world.state.buildings.push({
      id: 999,
      type: 'chest',
      x: 14,
      z: 20,
      level: 1,
      hp: 100,
      timer: 0,
      enabled: true,
    });
    row.record.world.state.storage = { iron: 1 };
    h.save(row.record);
    assert.deepEqual(x.b.bag.inventory, {});
    assert.deepEqual(x.b.state!.inventory, {});
    const withdraw = (p: Packet) =>
      pulse(p, [
        { seq: 1, method: 'transferStorage', args: ['iron', 1, false] },
      ]);
    const [a, b] = await Promise.all([
      h.call('/api/shared', withdraw(x.a), x.host, x.a.nonce),
      h.call('/api/shared', withdraw(x.b), x.guest, x.b.nonce),
    ]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(
      Object.values(h.row().record.players).reduce(
        (n, p) => n + (p.inventory.iron || 0),
        0,
      ),
      1,
    );
    let guest = b.data;
    guest = (
      await h.call(
        '/api/shared',
        pulse(guest, [{ seq: 2, method: 'trade', args: ['wood', 2, true] }]),
        x.guest,
        guest.nonce,
      )
    ).data;
    const expected = guest.bag.inventory,
      peerId = guest.you.id;
    assert.equal(expected.wood, 2);
    assert.ok(!guest.patches?.some((d) => d.changes.inventory));
    await h.call('/api/lobby', { op: 'leave' }, x.guest);
    await h.call('/api/shared', pulse(a.data), x.host, a.data.nonce);
    await h.call(
      '/api/lobby',
      { op: 'join', name: 'Konuk', code: x.code },
      x.guest,
    );
    let rejoined = (await h.call('/api/shared', { op: 'connect' }, x.guest))
      .data;
    assert.deepEqual(rejoined.bag.inventory, expected);
    assert.equal(rejoined.you.id, peerId);
    await h.call('/api/lobby', { op: 'leave' }, x.host);
    const lobby = await h.call(
      '/api/lobby',
      { op: 'create', name: 'Ev sahibi' },
      x.host,
    );
    await h.call('/api/shared', { op: 'connect' }, x.host);
    await h.call(
      '/api/lobby',
      { op: 'join', name: 'Konuk', code: lobby.data.room!.code },
      x.guest,
    );
    rejoined = (await h.call('/api/shared', { op: 'connect' }, x.guest)).data;
    assert.deepEqual(rejoined.bag.inventory, expected);
    assert.equal(rejoined.you.id, peerId);
    assert.equal(h.row().record.players[guestId].inventory.wood, 2);
  } finally {
    h.sqlite.close();
  }
});
void test('four authenticated players share one world, host absence freezes writes and reconnect resumes safely', async () => {
  const h = harness();
  try {
    const x = await h.setup();
    const c = await h.session(),
      d = await h.session(),
      fifth = await h.session();
    for (const cookie of [c, d]) {
      assert.equal(
        (
          await h.call(
            '/api/lobby',
            { op: 'join', name: 'Arkadaş', code: x.code },
            cookie,
          )
        ).status,
        200,
      );
      assert.equal(
        (await h.call('/api/shared', { op: 'connect' }, cookie)).status,
        200,
      );
    }
    assert.equal(
      (
        await h.call(
          '/api/lobby',
          { op: 'join', name: 'Fazla oyuncu', code: x.code },
          fifth,
        )
      ).status,
      409,
    );
    let host = (
      await h.call(
        '/api/shared',
        pulse(x.a, [], x.a.you.player, false),
        x.host,
        x.a.nonce,
      )
    ).data;
    assert.equal(host.peers.length, 4);
    h.advance(16_000);
    const before = h.row();
    const blocked = await h.call(
      '/api/shared',
      pulse(x.b, [{ seq: 1, method: 'trade', args: ['wood', 1, true] }]),
      x.guest,
      x.b.nonce,
    );
    assert.equal(blocked.status, 423);
    assert.equal(h.row().world, before.world);
    assert.equal(h.row().revision, before.revision);
    assert.equal(
      (await h.call('/api/shared', { op: 'connect' }, x.guest)).status,
      423,
    );
    host = (
      await h.call(
        '/api/shared',
        pulse(host, [], host.you.player, false),
        x.host,
        host.nonce,
      )
    ).data;
    const resumed = await h.call(
      '/api/shared',
      pulse(x.b, [{ seq: 1, method: 'trade', args: ['wood', 1, true] }]),
      x.guest,
      x.b.nonce,
    );
    assert.equal(resumed.status, 200);
    assert.equal(resumed.data.bag.inventory.wood, 1);
    h.advance(301_000);
    assert.equal(
      (await h.call('/api/shared', { op: 'connect' }, x.guest)).status,
      410,
    );
  } finally {
    h.sqlite.close();
  }
});
