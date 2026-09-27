import type { Engine } from '@/lib/game/model';
import { BUNDLES } from '@/lib/game/progression';
import { ITEMS } from '@/lib/game/data';
import { recommendedQuest } from '@/lib/game/quests';
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
  const [name, setName] = useState(engine.s.settlement.name);
  const [feedback, setFeedback] = useState('');
  return (
    <div className="settlement-name">
      <label htmlFor="settlement-name">Köyünün adı</label>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setFeedback(
            engine.renameSettlement(name)
              ? 'Köyünün adı kaydedildi.'
              : '1–32 karakterlik bir ad gir.',
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
          Adı kaydet
        </button>
      </form>
      <output>
        {feedback || 'Yaptığın yollar, yapılar ve tarlalar bu dünyada kalır.'}
      </output>
    </div>
  );
}

export function SettlementPanel({ engine }: { engine: Engine }) {
  const s = engine.s,
    next = nextMilestone(s),
    quest = recommendedQuest(s);
  return (
    <section className="settlement-board" aria-label="Köy gelişimi">
      <span className="eyebrow">{settlementRank(s)}</span>
      <h3>{s.settlement.name}</h3>
      <p className="panel-note">
        Kazandığın malzemeler bir sonraki işliğin, tarlan ve keşfin için. Köy
        dönüm noktalarını sırayla tamamla.
      </p>
      {quest && (
        <article className="quest-card">
          <span className="horizon-label">Şimdi · kısa hedef</span>
          <h4>{quest.name}</h4>
          <p>{quest.desc}</p>
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
            Görev ödülünü al ·{' '}
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
                {done
                  ? 'Köyüne katıldı'
                  : active
                    ? 'Sıradaki · orta hedef'
                    : index === MILESTONES.length - 1
                      ? 'Büyük hedef'
                      : 'Gelecek dönüm noktası'}
              </span>
              <h4>
                {index + 1}. {m.name}
              </h4>
            </summary>
            {m.requirements.map((r) => (
              <div key={r.label}>
                <p>
                  {r.label} · {Math.min(r.target, r.value(s))}/{r.target}
                </p>
                <Progress
                  value={Math.min(100, (r.value(s) / r.target) * 100)}
                />
              </div>
            ))}
            <p>{m.next}</p>
            <div className="cost">
              {Object.entries(m.reward).map(([id, count]) => (
                <span key={id} title={ITEMS[id].name}>
                  <GameIcon id={id} />
                  {count} {ITEMS[id].name}
                </span>
              ))}
            </div>
            <button
              className="primary-button"
              disabled={!active || !milestoneReady(s, m)}
              onClick={() => engine.claimMilestone(m.id)}
            >
              {done
                ? 'Köy günlüğüne işlendi'
                : active
                  ? 'Sonraki adımın malzemelerini al'
                  : 'Önceki dönüm noktasını tamamla'}
            </button>
          </details>
        );
      })}
      <p className="panel-note">
        Sonraki oyun gününde hayvanlar yeni ürün hazırlar, dostların yeni sohbet
        ve siparişlerle gelir. Çıkmadan önce ekinlerini sula ve üretim sıranı
        hazırla. Oyun kapalıyken zaman ilerlemez.
      </p>
    </section>
  );
}

export function BundlesPanel({ engine }: { engine: Engine }) {
  const s = engine.s;
  return (
    <div className="bundle-list">
      <p className="panel-note">
        Bağışladığın ürünler burada kalır. Bir sandığı tamamladığında ödülü tüm
        vadide kalıcı olarak açılır.
      </p>
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
              {bundle.name} {complete ? '· Tamamlandı' : ''}
            </h3>
            <p>{bundle.description}</p>
            <Progress value={(100 * count) / total} />
            {Object.entries(bundle.items).map(([item, required]) => {
              const remaining = required - (paid[item] || 0);
              const quantity = Math.min(remaining, s.inventory[item] || 0);
              return (
                <div className="bundle-item" key={item}>
                  <GameIcon id={item} />
                  <span>
                    {ITEMS[item].name}
                    <small>
                      {paid[item] || 0} / {required}
                    </small>
                  </span>
                  <button
                    className="secondary-button"
                    disabled={complete || quantity <= 0}
                    onClick={() => engine.donate(id, item, quantity)}
                  >
                    {remaining
                      ? `${quantity || remaining} bağışla`
                      : 'Teslim edildi'}
                  </button>
                </div>
              );
            })}
            <p className="bundle-reward">
              {complete ? 'Etkin' : 'Kalıcı ödül'} · {bundle.reward}
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
  const s = engine.s,
    checkpoint = Math.min(5, s.stats.minecheckpoint || 1);
  const near =
    Math.hypot(s.player.x - MINE_ENTRANCE.x, s.player.z - MINE_ENTRANCE.z) <=
    2.2;
  return (
    <>
      <p className="panel-note">
        İlerlediğin katlar asansöre kaydedilir. Sonraki gün açılmış bir kattan
        başlayabilirsin. Her katta cevher topla ve düşmanları yen; güney
        asansörüyle ganimetini çıkar.
      </p>
      {!near && (
        <button
          className="primary-button full-width"
          onClick={() => onApproach(MINE_ENTRANCE.x, MINE_ENTRANCE.z + 2)}
        >
          Maden girişine yürü
        </button>
      )}
      {s.stats.mineday === s.day && (
        <p className="panel-note">
          Bugünkü keşif kullanıldı. Yarın yeniden açılır.
        </p>
      )}
      {FLOOR_NAMES.map((name, index) => (
        <article className="catalog-card" key={name}>
          <h3>
            {index + 1}. kat · {name}
          </h3>
          <p>
            {index + 1 <= checkpoint
              ? 'Asansör durağı açık'
              : 'Önce üst katın geçidini aç'}
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
            Bu kattan başla
          </button>
        </article>
      ))}
    </>
  );
}
