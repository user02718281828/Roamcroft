import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';
import type { Engine } from '@/lib/game/model';
import { BUNDLES } from '@/lib/game/progression';
import { ITEMS } from '@/lib/game/data';
import { recommendedQuest } from '@/lib/game/quests';
import { settlementStory } from '@/lib/game/story';
import {
  MILESTONES,
  milestoneReady,
  nextMilestone,
  settlementRank,
} from '@/lib/game/settlement';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { FLOOR_NAMES, MINE_ENTRANCE } from '@/lib/game/expedition';
import { Progress } from '@/components/ui/progress';
import GameIcon from './GameIcon';

export function SettlementName({ engine }: { engine: Engine }) {
  useLocale();
  const [name, setName] = useState(engine.s.settlement.name);
  const [feedback, setFeedback] = useState('');
  return (
    <div className="settlement-name">
      <label htmlFor="settlement-name">{translate("m_3ef997348f")}</label>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setFeedback(
            engine.renameSettlement(name)
              ? sourceText("m_2fec4782aa")
              : sourceText("m_0ceeef9cda"),
          );
        }}
      >
        <Input
          id="settlement-name"
          maxLength={32}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="primary-button" type="submit">
          {translate("m_04b69901df")}</button>
      </form>
      <output>
        {localize(feedback || sourceText("m_e484ddff90"))}
      </output>
    </div>
  );
}

export function SettlementPanel({ engine }: { engine: Engine }) {
  useLocale();
  const story=settlementStory(engine.s);
  const s = engine.s,
    next = nextMilestone(s),
    quest = recommendedQuest(s);
  return (
    <section className="settlement-board" aria-label={translate("m_4d3e61ac52")}>
      <span className="eyebrow">{localize(settlementRank(s))}</span>
      <h3>{s.settlement.name}</h3>
      <article className="planning-card"><span className="eyebrow">{translate('story.chapter', {chapter: story.stage+1})}</span><h4>{localize(story.chapter.title)}</h4><p>{localize(story.chapter.text)}</p>
        {!!story.memories.length&&<details><summary>{translate("m_eeb0786f4e")}</summary>{story.memories.map(ch=><p key={ch.title}><b>{localize(ch.title)}</b><br/>{localize(ch.text)}</p>)}</details>}
      </article>
      <p className="panel-note">
        {translate("m_f2ae57ef04")}</p>
      {quest && (
        <article className="quest-card">
          <span className="horizon-label">{translate("m_7120151d74")}</span>
          <h4>{localize(quest.name)}</h4>
          <p>{localize(quest.desc)}</p>
          <Progress
            value={Math.min(
              100,
              ((s.stats[quest.stat] || 0) / quest.target) * 100,
            )}
          />
          <button
            className="secondary-button"
            disabled={(s.stats[quest.stat] || 0) < quest.target}
            onClick={() => engine.claim(quest.id)}
          >
            {translate("m_b75de63449")}{' '}
            {Math.min(quest.target, s.stats[quest.stat] || 0)}/{quest.target}
          </button>
        </article>
      )}
      {MILESTONES.map((m, index) => {
        const done = s.settlement.milestones.includes(m.id),
          active = next?.id === m.id;
        return (
          <details
            className={`quest-card ${done ? 'completed' : ''}`}
            key={`${m.id}-${active}`}
            open={active}
          >
            <summary>
              <span className="horizon-label">
                {localize(done
                  ? sourceText("m_0338c7da41")
                  : active
                    ? sourceText("m_47303aa72c")
                    : index === MILESTONES.length - 1
                      ? sourceText("m_78887bcd4e")
                      : sourceText("m_75eeb9eb6b"))}
              </span>
              <h4>
                {index + 1}. {localize(m.name)}
              </h4>
            </summary>
            {m.requirements.map((r) => (
              <div key={r.label}>
                <p>
                  {localize(r.label)} · {Math.min(r.target, r.value(s))}/{r.target}
                </p>
                <Progress
                  value={Math.min(100, (r.value(s) / r.target) * 100)}
                />
              </div>
            ))}
            <p>{localize(m.next)}</p>
            <div className="cost">
              {Object.entries(m.reward).map(([id, count]) => (
                <span key={id} title={localize(ITEMS[id].name)}>
                  <GameIcon id={id} />
                  {count} {localize(ITEMS[id].name)}
                </span>
              ))}
            </div>
            <button
              className="primary-button"
              disabled={!active || !milestoneReady(s, m)}
              onClick={() => engine.claimMilestone(m.id)}
            >
              {localize(done
                ? sourceText("m_5fcac75bca")
                : active
                  ? sourceText("m_3e9699753c")
                  : sourceText("m_5d54d1e8ca"))}
            </button>
          </details>
        );
      })}
      <p className="panel-note">
        {translate("m_24bf19360b")}</p>
    </section>
  );
}

export function BundlesPanel({ engine }: { engine: Engine }) {
  useLocale();
  const s = engine.s;
  return (
    <div className="bundle-list">
      <p className="panel-note">
        {translate("m_cc6d85ddea")}</p>
      {Object.entries(BUNDLES).map(([id, bundle]) => {
        const paid = s.bundles.donations[id] ?? {};
        const complete = s.bundles.completed.includes(id);
        const total = Object.values(bundle.items).reduce((a, b) => a + b, 0);
        const count = Object.values(paid).reduce((a, b) => a + b, 0);
        return (
          <article
            className={`quest-card ${complete ? 'completed' : ''}`}
            key={id}
          >
            <h3>
              {localize(bundle.name)} {localize(complete ? sourceText("m_a188229dca") : '')}
            </h3>
            <p>{localize(bundle.description)}</p>
            <Progress value={(100 * count) / total} />
            {Object.entries(bundle.items).map(([item, required]) => {
              const remaining = required - (paid[item] || 0);
              const quantity = Math.min(remaining, s.inventory[item] || 0);
              return (
                <div className="bundle-item" key={item}>
                  <GameIcon id={item} />
                  <span>
                    {localize(ITEMS[item].name)}
                    <small>
                      {paid[item] || 0} / {required}
                    </small>
                  </span>
                  <button
                    className="secondary-button"
                    disabled={complete || quantity <= 0}
                    onClick={() => engine.donate(id, item, quantity)}
                  >
                    {localize(remaining
                      ? sourceText("m_976673a2be", { p0: quantity || remaining })
                      : sourceText("m_1edbe5d0d1"))}
                  </button>
                </div>
              );
            })}
            <p className="bundle-reward">
              {localize(complete ? sourceText("m_de91313104") : sourceText("m_388ad6341e"))} · {localize(bundle.reward)}
            </p>
          </article>
        );
      })}
    </div>
  );
}

export function MinePanel({
  engine,
  onApproach,
  onClose,
}: {
  engine: Engine;
  onApproach: (x: number, z: number) => void;
  onClose: () => void;
}) {
  useLocale();
  const s = engine.s,
    checkpoint = Math.min(5, s.stats.minecheckpoint || 1);
  const near =
    Math.hypot(s.player.x - MINE_ENTRANCE.x, s.player.z - MINE_ENTRANCE.z) <=
    2.2;
  return (
    <>
      <p className="panel-note">
        {translate("m_d11b61a9e5")}</p>
      {!near && (
        <button
          className="primary-button full-width"
          onClick={() => onApproach(MINE_ENTRANCE.x, MINE_ENTRANCE.z + 2)}
        >
          {translate("m_415bd26e1e")}</button>
      )}
      {s.stats.mineday === s.day && (
        <p className="panel-note">
          {translate("m_dc50c6d5d4")}</p>
      )}
      {FLOOR_NAMES.map((name, index) => (
        <article className="catalog-card" key={name}>
          <h3>
            {translate('mine.floor', {floor: index + 1, name: localize(name)})}
          </h3>
          <p>
            {localize(index + 1 <= checkpoint
              ? sourceText("m_a7eb0a8e40")
              : sourceText("m_c96c872b4b"))}
          </p>
          <button
            className="primary-button"
            disabled={
              !!s.mine ||
              !near ||
              index + 1 > checkpoint ||
              s.level < 3 ||
              s.stats.mineday === s.day
            }
            onClick={() => {
              if (engine.enterMine(index + 1)) onClose();
            }}
          >
            {translate("m_90c456e6de")}</button>
        </article>
      ))}
    </>
  );
}
