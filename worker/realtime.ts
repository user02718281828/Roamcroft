import { sourceText } from '../lib/i18n/source.ts';
import { DurableObject } from 'cloudflare:workers';
import { worldIdentity, allowed, readBody } from '../lib/server/api.ts';
import { initLobby } from '../lib/server/lobby.ts';
import { handleShared } from '../lib/server/shared-api.ts';
import { RoomCore } from '../lib/server/room-core.ts';
import { sharedToken, type SharedRecord } from '../lib/server/shared-world.ts';
import {
  REALTIME_VERSION,
  TICK_MS,
  SNAPSHOT_TICKS,
} from '../lib/coop/realtime-protocol.ts';
import { SHARED_PROTOCOL } from '../lib/server/shared-protocol.ts';

type Env = { DB: D1Database; ROOMS: DurableObjectNamespace<RealtimeRoom> };
type Member = { owner: string; code: string; name: string };
type Saved = {
  owner: string;
  record: SharedRecord;
  revision: number;
  dbRevision: number;
  attempt?: { revision: number; hash: string };
  blocked?: boolean;
};
type Connection = { user: string; epoch: string };
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function routeRealtime(request: Request, env: Env) {
  const url = new URL(request.url),
    socket = url.pathname === '/api/realtime',
    now = Date.now();
  if (
    request.headers.get('Origin') !== url.origin ||
    request.headers.get('Sec-Fetch-Site') === 'cross-site'
  )
    return json({ error: sourceText("m_f516389793") }, 403);
  if (socket) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket')
      return json({ error: sourceText("m_43c98f7890") }, 426);
    if (url.searchParams.get('v') !== String(REALTIME_VERSION))
      return json({ error: sourceText("m_09df375081") }, 426);
  } else {
    if (request.method !== 'POST') return json({ error: sourceText("m_4e4ea38d7e") }, 405);
    if (
      request.headers.get('Content-Type')?.split(';')[0] !== 'application/json'
    )
      return json({ error: sourceText("m_dc2be08b0d") }, 415);
    if (request.headers.get('X-Roamcroft-Protocol') !== String(SHARED_PROTOCOL))
      return json(
        { error: sourceText("m_f4f1ad9399"), protocolVersion: SHARED_PROTOCOL },
        426,
      );
  }
  const identity = await worldIdentity(request, env.DB, now);
  if (!identity) return json({ error: sourceText("m_61666f7ffe") }, 401);
  if (
    !(await allowed(
      env.DB,
      (socket ? 'ws:' : 'shared:') + identity.id,
      now,
      socket ? 20 : 180,
      60000,
    ))
  )
    return new Response(JSON.stringify({ error: sourceText("m_7ddda23089") }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'Cache-Control': 'no-store',
      },
    });
  await initLobby(env.DB);
  const member = await env.DB.prepare(
    'SELECT r.owner,r.code,m.name FROM friend_lobbies r JOIN friend_members m ON m.room=r.code WHERE m.user=? AND r.expires>? AND m.seen>?',
  )
    .bind(identity.id, now, now - 90000)
    .first<Member>();
  if (!member)
    return json({ error: sourceText("m_111e55970e") }, 410);
  const headers = new Headers(request.headers);
  headers.set('X-Room-User', identity.id);
  headers.set('X-Room-Owner', member.owner);
  headers.set('X-Room-Code', member.code);
  headers.set('X-Room-Name', encodeURIComponent(member.name));
  return env.ROOMS.get(env.ROOMS.idFromName(member.owner)).fetch(
    new Request(request, { headers }),
  );
}

export class RealtimeRoom extends DurableObject<Env> {
  core: RoomCore | null = null;
  private dbRevision = 0;
  private attempt: Saved['attempt'];
  private sockets = new Map<WebSocket, Connection>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private lastStep = 0;
  private accumulator = 0;
  private lastActivity = 0;
  private savedAt = 0;
  private cloudAt = 0;
  private cloudFlight: Promise<void> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private stopped = false;
  private blocked = false;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(
        'CREATE TABLE IF NOT EXISTS checkpoint (id INTEGER PRIMARY KEY, payload TEXT NOT NULL)',
      );
      const raw = [
        ...ctx.storage.sql.exec<{ payload: string }>(
          'SELECT payload FROM checkpoint WHERE id=1',
        ),
      ][0];
      const saved: Saved | undefined = raw
        ? JSON.parse(raw.payload)
        : undefined;
      if (saved) {
        this.core = new RoomCore(saved.record, saved.owner, saved.revision);
        this.dbRevision = saved.dbRevision;
        this.attempt = saved.attempt;
        this.blocked = !!saved.blocked;
      }
    });
  }
  private async persist() {
    const c = this.core!;
    c.syncRuntime();
    // Serialize before yielding: tick mutations cannot alter this checkpoint.
    const saved = JSON.stringify({
      owner: c.owner,
      record: c.record,
      revision: c.revision,
      dbRevision: this.dbRevision,
      attempt: this.attempt,
      blocked: this.blocked,
    });
    if (new TextEncoder().encode(saved).length > 1900000)
      throw Error('checkpoint capacity');
    this.ctx.storage.transactionSync(() =>
      this.ctx.storage.sql.exec(
        'INSERT INTO checkpoint(id,payload) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
        saved,
      ),
    );
  }
  private cloud() {
    if (this.cloudFlight || !this.core || this.stopped) return;
    const c = this.core;
    c.publish(true);
    const owner = c.owner,
      room = c.record.room,
      revision = c.revision,
      encoded = JSON.stringify(c.record),
      now = Date.now();
    this.cloudFlight = (async () => {
      const live = await this.env.DB.prepare(
        'SELECT code FROM friend_lobbies WHERE owner=? AND code=? AND expires>?',
      )
        .bind(owner, room, now)
        .first();
      if (!live) {
        this.stop(sourceText("m_41a31d8697"));
        return;
      }
      const hash = async (text: string) =>
        Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              'SHA-256',
              new TextEncoder().encode(text),
            ),
          ),
          (n) => n.toString(16).padStart(2, '0'),
        ).join('');
      // Resolve only our own committed-but-unacknowledged D1 checkpoint.
      if (this.attempt) {
        const previous = await this.env.DB.prepare(
          'SELECT revision,world FROM shared_farms WHERE owner=?',
        )
          .bind(owner)
          .first<{ revision: number; world: string }>();
        if (
          previous?.revision === this.attempt.revision &&
          (await hash(previous.world)) === this.attempt.hash
        )
          this.dbRevision = previous.revision;
        else if (previous?.revision !== this.dbRevision) {
          this.stop(sourceText("m_24760c73d0"), true);
          return;
        }
        this.attempt = undefined;
      }
      this.attempt = { revision, hash: await hash(encoded) };
      await this.persist();
      const result = await this.env.DB.prepare(
        'UPDATE shared_farms SET world=?,revision=?,updated=? WHERE owner=? AND revision=?',
      )
        .bind(encoded, revision, now, owner, this.dbRevision)
        .run();
      if (!result.meta.changes) {
        // A crash may occur after D1 commit but before the local checkpoint.
        const row = await this.env.DB.prepare(
          'SELECT revision,world FROM shared_farms WHERE owner=?',
        )
          .bind(owner)
          .first<{ revision: number; world: string }>();
        if (
          row &&
          row.revision === this.attempt.revision &&
          (await hash(row.world)) === this.attempt.hash
        )
          this.dbRevision = row.revision;
        else {
          this.stop(sourceText("m_24760c73d0"), true);
          return;
        }
      } else this.dbRevision = revision;
      this.attempt = undefined;
      const present = Object.entries(c.record.players).filter(
        ([, p]) => p.present && p.seen > now - 15000,
      );
      if (present.length)
        await this.env.DB.batch(
          present.map(([id]) =>
            this.env.DB.prepare(
              'UPDATE friend_members SET seen=? WHERE user=? AND room=?',
            ).bind(now, id, room),
          ),
        );
      if (c.hostReady(now))
        await this.env.DB.prepare(
          'UPDATE friend_lobbies SET expires=? WHERE code=? AND owner=?',
        )
          .bind(now + 300000, room, owner)
          .run();
      const members = await this.env.DB.prepare(
        'SELECT user FROM friend_members WHERE room=?',
      )
        .bind(room)
        .all<{ user: string }>();
      const ids = new Set(members.results.map((m) => m.user));
      for (const [id, p] of Object.entries(c.record.players))
        if (!ids.has(id)) p.present = false;
      for (const [ws, connection] of this.sockets)
        if (!ids.has(connection.user)) {
          ws.close(4001, sourceText("m_b6cf079ae9"));
          this.sockets.delete(ws);
          c.disconnect(connection.user, connection.epoch);
        }
      await this.persist();
    })()
      .catch(() =>
        console.error(
          JSON.stringify({
            event: 'room_checkpoint_failed',
            requestId: crypto.randomUUID(),
          }),
        ),
      )
      .finally(() => {
        this.cloudFlight = null;
      });
  }
  private stop(reason: string, blocked = false) {
    if (blocked) {
      this.blocked = true;
      this.ctx.waitUntil(this.persist());
    }
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    for (const ws of this.sockets.keys()) ws.close(4001, reason);
    this.sockets.clear();
  }
  private run() {
    if (this.timer) return;
    this.lastStep = Date.now();
    this.lastActivity = this.lastStep;
    this.cloudAt = this.lastStep;
    this.stopped = false;
    this.timer = setInterval(() => {
      const now = Date.now(),
        c = this.core!;
      this.accumulator += Math.min(150, now - this.lastStep);
      this.lastStep = now;
      let steps = 0;
      while (this.accumulator >= TICK_MS && steps++ < 3) {
        c.step(now);
        this.accumulator -= TICK_MS;
        if (c.tick % SNAPSHOT_TICKS === 0)
          for (const [ws, connection] of this.sockets) {
            try {
              ws.send(JSON.stringify(c.snapshot(connection.user, now)));
            } catch {
              this.sockets.delete(ws);
              c.disconnect(connection.user, connection.epoch);
            }
          }
      }
      if (now - this.savedAt >= 1000) {
        this.savedAt = now;
        this.ctx.waitUntil(
          this.persist().catch(() =>
            this.stop(sourceText("m_fcb6d5e160")),
          ),
        );
      }
      if (now - this.cloudAt >= 5000) {
        this.cloudAt = now;
        this.cloud();
      }
      if (!this.sockets.size && now - this.lastActivity > 15000) {
        if (this.timer) clearInterval(this.timer);
        this.timer = undefined;
        this.ctx.waitUntil(this.persist());
        this.cloud();
      }
    }, TICK_MS / 2);
  }
  async fetch(request: Request): Promise<Response> {
    // The entry Worker overwrites these headers after cookie and membership checks.
    const user = request.headers.get('X-Room-User')!,
      owner = request.headers.get('X-Room-Owner')!,
      room = request.headers.get('X-Room-Code')!,
      name = decodeURIComponent(request.headers.get('X-Room-Name') || '');
    if (!user || !owner || !room)
      return json({ error: sourceText("m_ceacdfbf67") }, 401);
    if (this.blocked)
      return json(
        {
          error:
            sourceText("m_ce050629c2"),
        },
        503,
      );
    const op = async () => {
      if (!this.core) {
        // Reuse the existing migration/first-farm creation exactly once.
        const init = new Request(request.url, {
          method: 'POST',
          headers: request.headers,
          body: JSON.stringify({ op: 'connect' }),
        });
        const response = await handleShared(init, this.env.DB);
        if (!response.ok) return response;
        const row = await this.env.DB.prepare(
          'SELECT world,revision FROM shared_farms WHERE owner=?',
        )
          .bind(owner)
          .first<{ world: string; revision: number }>();
        if (!row) return json({ error: sourceText("m_9b89933d91") }, 503);
        this.core = new RoomCore(JSON.parse(row.world), owner, row.revision);
        this.dbRevision = row.revision;
      }
      const c = this.core;
      if (c.record.room !== room) {
        if (user !== owner)
          return json({ error: sourceText("m_26573dfe88") }, 423);
        this.stop(sourceText("m_1ff6fe3fd0"));
        c.record.room = room;
        c.record.history = [];
        for (const p of Object.values(c.record.players))
          Object.assign(p, {
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
        c.streams.clear();
        c.publish();
      }
      this.lastActivity = Date.now();
      if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
        if (!c.record.players[user]?.present)
          return json({ error: sourceText("m_a6339b6cc5") }, 409);
        if (user !== owner && !c.hostReady(Date.now()))
          return json({ error: sourceText("m_26573dfe88") }, 423);
        const hello = c.connect(user, name, Date.now());
        for (const [ws, con] of this.sockets)
          if (con.user === user) {
            ws.close(4002, sourceText("m_0268365e19"));
            this.sockets.delete(ws);
          }
        const pair = new WebSocketPair(),
          [client, server] = Object.values(pair);
        server.accept();
        this.sockets.set(server, { user, epoch: hello.epoch });
        let messages = 0,
          window = Date.now();
        server.addEventListener('message', (event) => {
          if (this.sockets.get(server)?.epoch !== hello.epoch) return;
          try {
            if (Date.now() - window >= 1000) {
              messages = 0;
              window = Date.now();
            }
            if (++messages > 50) throw Error();
            if (typeof event.data !== 'string' || event.data.length > 4096)
              throw Error();
            const message = JSON.parse(event.data);
            if (message.type === 'ping' && Number.isFinite(message.sent)) {
              server.send(JSON.stringify({ type: 'pong', sent: message.sent }));
              return;
            }
            if (
              message.type !== 'inputs' ||
              message.epoch !== hello.epoch ||
              !c.receive(user, hello.epoch, message.frames, Date.now())
            )
              throw Error();
          } catch {
            server.close(1008, sourceText("m_56af168273"));
          }
        });
        const close = () => {
          this.sockets.delete(server);
          c.disconnect(user, hello.epoch);
        };
        server.addEventListener('close', close);
        server.addEventListener('error', close);
        server.send(JSON.stringify(hello));
        this.run();
        return new Response(null, { status: 101, webSocket: client });
      }
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(await readBody(request));
      } catch {
        return json({ error: sourceText("m_49b8e07264") }, 400);
      }
      if (!body || typeof body !== 'object' || Array.isArray(body))
        return json({ error: sourceText("m_5358cad9ac") }, 400);
      const result = await c.pulse(
        user,
        name,
        body,
        request.headers.get('X-Roamcroft-Nonce') || '',
        Date.now(),
      );
      if (result.status === 200) {
        await this.persist(); // Economic ACK never precedes its atomic durable save.
        this.run();
      }
      return json({ ...result.data, realtime: true }, result.status);
    };
    const result = this.queue.then(op, op);
    this.queue = result.catch(() => {});
    try {
      return await result;
    } catch {
      this.stop(sourceText("m_22d6e3890e"));
      // Reload only the last committed state on the next request.
      const raw = [
        ...this.ctx.storage.sql.exec<{ payload: string }>(
          'SELECT payload FROM checkpoint WHERE id=1',
        ),
      ][0];
      const saved: Saved | undefined = raw
        ? JSON.parse(raw.payload)
        : undefined;
      if (saved) {
        this.core = new RoomCore(saved.record, saved.owner, saved.revision);
        this.dbRevision = saved.dbRevision;
        this.attempt = saved.attempt;
        this.blocked = !!saved.blocked;
      }
      return json({ error: sourceText("m_77e58a4444") }, 503);
    }
  }
}
