import { sourceText } from '../i18n/source.ts';
import { allowed, readBody, worldIdentity } from './api.ts';
import { validPulse } from './protocol.ts';
import { SHARED_PROTOCOL } from './shared-protocol.ts';
import {
  advanceShared,
  ensureSharedPlayer,
  sharedPacket,
  sharedToken,
  HOST_GRACE,
  type SharedRecord,
} from './shared-world.ts';
import { initLobby } from './lobby.ts';
import { Engine } from '../game/model.ts';
import type { WorldRecord } from './world.ts';
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const initialized = new WeakMap<D1Database, Promise<unknown>>();
async function init(db: D1Database) {
  let p = initialized.get(db);
  if (!p) {
    p = db.batch([
      db.prepare(
        'CREATE TABLE IF NOT EXISTS shared_farms(owner TEXT PRIMARY KEY, world TEXT NOT NULL, revision INTEGER NOT NULL, updated INTEGER NOT NULL)',
      ),
    ]);
    initialized.set(db, p);
    p.catch(() => initialized.delete(db));
  }
  await p;
}
type Membership = { owner: string; code: string; name: string };
type Row = { world: string; revision: number; updated: number };
export async function handleShared(
  request: Request,
  db: D1Database,
  now = Date.now(),
) {
  if (request.method !== 'POST') return json({ error: sourceText("m_4e4ea38d7e") }, 405);
  if (
    request.headers.get('Origin') !== new URL(request.url).origin ||
    request.headers.get('Sec-Fetch-Site') === 'cross-site'
  )
    return json({ error: sourceText("m_f516389793") }, 403);
  if (
    request.headers.get('Content-Type')?.split(';')[0].trim() !==
    'application/json'
  )
    return json({ error: sourceText("m_dc2be08b0d") }, 415);
  if (request.headers.get('X-Roamcroft-Protocol') !== String(SHARED_PROTOCOL))
    return json(
      {
        error: sourceText("m_f4f1ad9399"),
        protocolVersion: SHARED_PROTOCOL,
      },
      426,
    );
  let body: Record<string, unknown>, raw: string;
  try {
    raw = await readBody(request);
    body = JSON.parse(raw);
  } catch {
    return json({ error: sourceText("m_49b8e07264") }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return json({ error: sourceText("m_805fb11525") }, 400);
  const connect = body.op === 'connect' && Object.keys(body).length === 1;
  if (
    !connect &&
    !(
      body.op === 'pulse' &&
      Object.keys(body).length === 3 &&
      validPulse(body.pulse) &&
      Number.isSafeInteger(body.revision) &&
      Number(body.revision) >= 0
    )
  )
    return json({ error: sourceText("m_5358cad9ac") }, 400);
  const identity = await worldIdentity(request, db, now);
  if (!identity) return json({ error: sourceText("m_61666f7ffe") }, 401);
  if (!(await allowed(db, 'shared:' + identity.id, now, 180, 60_000)))
    return Response.json(
      { error: sourceText("m_f2c4be0857") },
      {
        status: 429,
        headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
      },
    );
  // Membership is derived from the authenticated cookie, never from a supplied owner or room id.
  await initLobby(db);
  const member = await db
    .prepare(
      'SELECT r.owner,r.code,m.name FROM friend_lobbies r JOIN friend_members m ON m.room=r.code WHERE m.user=? AND r.expires>? AND m.seen>?',
    )
    .bind(identity.id, now, now - 90_000)
    .first<Membership>();
  if (!member)
    return json(
      {
        error:
          sourceText("m_0a45b5d43a"),
      },
      410,
    );
  await init(db);
  const digest = Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw!)),
    ),
    (n) => n.toString(16).padStart(2, '0'),
  ).join('');
  for (let attempt = 0; attempt < 5; attempt++) {
    let row = await db
      .prepare('SELECT world,revision,updated FROM shared_farms WHERE owner=?')
      .bind(member.owner)
      .first<Row>();
    if (!row) {
      if (identity.id !== member.owner)
        return json(
          { error: sourceText("m_18874acb6e") },
          423,
        );
      const original = await db
        .prepare(
          'SELECT world FROM authoritative_worlds WHERE id=? AND expires>?',
        )
        .bind(member.owner, now)
        .first<{ world: string }>();
      if (!original)
        return json({ error: sourceText("m_a1554bd1e0") }, 410);
      const world = JSON.parse(original.world) as WorldRecord;
      if (world.state.mine) {
        const e = new Engine(world.state);
        e.leaveMine(true);
        world.state = e.s;
        world.runtime = undefined;
      }
      const record: SharedRecord = {
        world,
        players: {},
        room: member.code,
        history: [],
      };
      await db
        .prepare(
          'INSERT OR IGNORE INTO shared_farms(owner,world,revision,updated) SELECT ?,?,0,? WHERE (SELECT COUNT(*) FROM shared_farms)<200',
        )
        .bind(member.owner, JSON.stringify(record), now)
        .run();
      row = await db
        .prepare(
          'SELECT world,revision,updated FROM shared_farms WHERE owner=?',
        )
        .bind(member.owner)
        .first<Row>();
      if (!row) return json({ error: sourceText("m_d8f319ff34") }, 503);
    }
    const record = JSON.parse(row.world) as SharedRecord;
    if (
      identity.id !== member.owner &&
      (record.room !== member.code ||
        !record.players[member.owner]?.present ||
        record.players[member.owner].seen < now - HOST_GRACE)
    )
      return json(
        {
          error:
            sourceText("m_26673c8934"),
        },
        423,
      );
    if (record.room !== member.code) {
      record.room = member.code;
      record.history = [];
      for (const player of Object.values(record.players))
        Object.assign(player, {
          present: false,
          seen: 0,
          paused: true,
          seq: 0,
          commandSeq: 0,
          nonce: sharedToken(),
          previousNonce: '',
          digest: '',
          fishing: null,
        });
    }
    const members = await db
      .prepare('SELECT user,name FROM friend_members WHERE room=?')
      .bind(member.code)
      .all<{ user: string; name: string }>();
    const active = new Set(members.results.map((m) => m.user));
    for (const [id, player] of Object.entries(record.players))
      if (!active.has(id)) player.present = false;
    const existing = record.players[identity.id];
    if (!connect && (!existing || !existing.present))
      return json({ error: sourceText("m_7147b3e91e") }, 409);
    if (!existing && Object.keys(record.players).length >= 32)
      return json(
        {
          error:
            sourceText("m_eee579c8dc"),
        },
        409,
      );
    const p = ensureSharedPlayer(
      record,
      identity.id,
      member.owner,
      member.name,
      now,
    );
    let events: ReturnType<typeof advanceShared>['events'] = [];
    if (!connect) {
      const pulse = body.pulse as {
        seq: number;
        commands: import('../coop/protocol.ts').Command[];
        pose: import('../coop/protocol.ts').Pose;
        paused: boolean;
      };
      const nonce = request.headers.get('X-Roamcroft-Nonce');
      if (
        pulse.seq === p.seq &&
        nonce === p.previousNonce &&
        p.digest === digest
      )
        return json(
          sharedPacket(
            record,
            member.owner,
            identity.id,
            row.revision,
            Number(body.revision),
            now,
          ),
        );
      if (nonce !== p.nonce || pulse.seq !== p.seq + 1)
        return json(
          { error: sourceText("m_84d3dc8043") },
          409,
        );
      let seq = p.commandSeq;
      for (const command of pulse.commands)
        if (command.seq !== ++seq)
          return json({ error: sourceText("m_9eef75e71a") }, 409);
      const result = advanceShared(
        record,
        member.owner,
        identity.id,
        pulse.pose,
        pulse.commands,
        pulse.paused,
        Math.min(1, Math.max(0, (now - row.updated) / 1000)),
        now,
      );
      events = result.events;
      p.seq = pulse.seq;
      p.commandSeq = seq;
      p.previousNonce = p.nonce;
      p.nonce = sharedToken();
      p.digest = digest;
      result.delta.baseSeq = row.revision;
      record.history.push({ revision: row.revision + 1, delta: result.delta });
      record.history = record.history.slice(-24);
      if (JSON.stringify(record.history).length > 250_000) record.history = [];
    } else {
      p.seen = now;
      p.paused = true;
      record.history.push({
        revision: row.revision + 1,
        delta: { baseSeq: row.revision, changes: {} },
      });
      record.history = record.history.slice(-24);
    }
    const encoded = JSON.stringify(record);
    if (new TextEncoder().encode(encoded).length > 1_900_000)
      return json({ error: sourceText("m_109ac33c91") }, 507);
    const results = await db.batch([
      db
        .prepare(
          'UPDATE shared_farms SET world=?,revision=?,updated=? WHERE owner=? AND revision=? AND EXISTS (SELECT 1 FROM friend_members m JOIN friend_lobbies r ON r.code=m.room WHERE m.user=? AND r.code=? AND r.expires>? AND m.seen>?)',
        )
        .bind(
          encoded,
          row.revision + 1,
          now,
          member.owner,
          row.revision,
          identity.id,
          member.code,
          now,
          now - 90_000,
        ),
      db
        .prepare('UPDATE friend_members SET seen=? WHERE user=? AND room=?')
        .bind(now, identity.id, member.code),
      db
        .prepare('UPDATE friend_lobbies SET expires=? WHERE code=? AND owner=?')
        .bind(now + 300_000, member.code, identity.id),
    ]);
    if (results[0].meta.changes)
      return json(
        sharedPacket(
          record,
          member.owner,
          identity.id,
          row.revision + 1,
          connect ? undefined : Number(body.revision),
          now,
          events,
        ),
      );
  }
  return json(
    { error: sourceText("m_bd4470093f") },
    429,
  );
}
