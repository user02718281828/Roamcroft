'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import { useEffect, useRef, useState } from 'react';
import type { Engine } from '@/lib/game/model';
import SharedSleep from './SharedSleep';
type Room = {
  code: string;
  host: boolean;
  members: { name: string; you: boolean; host: boolean; online: boolean }[];
  sharedWorld: true;
};
export default function FriendLobby({
  engine,
  onEnter,
}: {
  engine: Engine;
  onEnter: () => void;
}) {
  useLocale();
  const [room, setRoom] = useState<Room | null>(null),
    [name, setName] = useState(() => translate("m_768201cbf7")),
    [code, setCode] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false);
  const pending = useRef(false),
    alive = useRef(true);
  async function call(body: Record<string, unknown>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const response = await fetch('/api/lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      const data = (await response.json()) as {
        room: Room | null;
        error?: string;
      };
      if (!response.ok) throw Error(data.error || sourceText("m_2008fbd8ba"));
      if (alive.current) {
        setRoom(data.room);
        setError('');
      }
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : sourceText("m_2008fbd8ba"));
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  useEffect(() => {
    alive.current = true;
    const first = setTimeout(() => void call({ op: 'status' }), 0);
    const timer = setInterval(() => {
      if (!document.hidden) void call({ op: 'status' });
    }, 5000);
    return () => {
      alive.current = false;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  return (
    <section className="friend-lobby">
      <h3>{translate("m_c33c2b9099")}</h3>
      <p>
        {translate("m_0412035f56")}</p>
      <SharedSleep engine={engine}/>
      {room ? (
        <>
          <label>
            {translate("m_b2d8a657f7")}<input readOnly value={room.code} aria-label={translate("m_03a9ce23ee")} />
          </label>
          <button
            className="secondary-button"
            onClick={() =>
              void navigator.clipboard
                .writeText(room.code)
                .then(() => setCopied(true))
                .catch(() => setError(sourceText("m_ff607fda5d")))
            }
          >
            {localize(copied ? sourceText("m_02af74b2f0") : sourceText("m_a8a9de57da"))}
          </button>
          <ul>
            {room.members.map((m, i) => (
              <li key={i}>
                {localize(m.name)}
                {localize(m.you ? sourceText("m_f7e84cde04") : '')}
                {localize(m.host ? sourceText("m_88a0c933ff") : '')} ·{' '}
                {localize(m.online ? sourceText("m_fb8d508c13") : sourceText("m_d6f74da2d0"))}
              </li>
            ))}
          </ul>
          <button
            className="primary-button"
            disabled={busy}
            onClick={() => {
              if (engine.network?.shared) {
                onEnter();
                return;
              }
              setBusy(true);
              void engine.network
                ?.enterShared?.()
                .then(onEnter)
                .catch((e) =>
                  setError(e instanceof Error ? e.message : sourceText("m_3c3fee458f")),
                )
                .finally(() => {
                  if (alive.current) setBusy(false);
                });
            }}
          >
            {localize(engine.network?.shared ? sourceText("m_82b001b4f6") : sourceText("m_a09d97eb25"))}
          </button>
          <p>{translate('lobby.memberCount', {count: room.members.length})}</p>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => {
              if (engine.network?.shared) {
                setBusy(true);
                void engine.network
                  .leaveShared?.()
                  .then(() => setRoom(null))
                  .catch((e) =>
                    setError(e instanceof Error ? e.message : sourceText("m_0fbfcbbc87")),
                  )
                  .finally(() => setBusy(false));
              } else void call({ op: 'leave' });
            }}
          >
            {localize(room.host ? sourceText("m_306892bb7a") : sourceText("m_b29fbb0de2"))}
          </button>
        </>
      ) : (
        <>
          <label>
            {translate("m_ec0762e936")}<input
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="primary-button"
            disabled={busy || !name.trim()}
            onClick={() => void call({ op: 'create', name })}
          >
            {translate("m_0a0a86ccff")}</button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void call({ op: 'join', name, code: code.trim().toLowerCase() });
            }}
          >
            <label>
              {translate("m_f1c4a30cc5")}<input
                value={code}
                maxLength={24}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <button
              className="secondary-button"
              disabled={busy || !name.trim() || code.trim().length !== 24}
            >
              {translate("m_b7a8806e6c")}</button>
          </form>
        </>
      )}
      <p>{translate("m_e27b740ea7")}</p>
      <details>
        <summary>{translate("m_eee77dfd36")}</summary>
        <p>
          {translate("m_bf05e47358")}</p>
        <p>
          {translate("m_0f789d2a9c")}</p>
      </details>
      {localize(error && (
        <p role="alert" className="inventory-warning">
          {localize(error)}
        </p>
      ))}
    </section>
  );
}
