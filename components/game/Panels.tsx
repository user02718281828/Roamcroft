'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';

import AudioSettings from './AudioSettings';
import LanguageSettings from './LanguageSettings';
import FirstSteps, { GuidanceSetting } from './FirstSteps';
import CampNavigation from './CampNavigation';
import TouchSettings from './TouchSettings';
import {usePanelHistory} from '@/lib/ui/panel-history';
import InventoryPanel from './InventoryPanel';
import { GAME_VERSION } from '@/lib/version';
import type { Panel } from '@/lib/ui/game-menu';
export type { Panel } from '@/lib/ui/game-menu';
import DailyOrders from './DailyOrders';
import MaterialNeeds from './MaterialNeeds';
import { settlementStory } from '@/lib/game/story';
import FriendLobby from './FriendLobby';
import {marketSells} from '@/lib/game/economy';
import {CropPlanner,MachineCard,ProductionWorkshop} from './FarmPlanning';
import type {ValleyAudio} from '@/lib/game/audio';
import GameIcon from './GameIcon';
import VillagerPortrait from './VillagerPortrait';
import { orchardStatus } from '@/lib/game/orchard';
import StoragePanel from './StoragePanel';
import {timedGreeting,schedule} from '@/lib/game/living';
import type { CoopClient } from '@/lib/coop/client';
import {
  BundlesPanel,
  MinePanel,
  SettlementPanel,
  SettlementName,
} from './MechanicsPanels';
import { inventoryUsed, inventoryCapacity } from '@/lib/game/progression';
import { Input } from '@/components/ui/input';
import { useRef, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Download,
  Upload,
  Save,
  RotateCcw,
  Check,
  Lock,
  Clock,
  ArrowRight,
  Heart,
  Zap,
  Star,
  BookOpen,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  BUILDINGS,
  ITEMS,
  RECIPES,
  QUESTS,
  CROPS,
  ANIMALS,
  SEASONS,
  TALENTS,
} from '@/lib/game/data';
import {
  canAfford,
  upgradeCost,
  skillLevel,
  season,
  tradeUnitPrice,
} from '@/lib/game/model';
import type { Engine } from '@/lib/game/model';
import type { Bag } from '@/lib/game/data';
import { NPCS, LANDMARKS, ACHIEVEMENTS } from '@/lib/game/content';
export function Cost({ bag, inventory }: { bag: Bag; inventory: Bag }) {
  useLocale();
  return (
    <div className="cost">
      {Object.entries(bag).map(([id, n]) => (
        <span
          key={id}
          className={(inventory[id] || 0) < n ? 'missing' : ''}
          title={localize(sourceText("m_9cd1eb4d3d", { p0: ITEMS[id]?.name, p1: inventory[id] || 0, p2: n }))}
        >
          <i>
            <GameIcon id={id} />
          </i>
          {n}
        </span>
      ))}
    </div>
  );
}
export default function Panels({
  engine,
  audio,
  coop,
  panel,
  setPanel,
  onBuild,
  onSeed,
  onEquip,
  onImport,
  onExport,
  onSave,
  onReset,
  selectedBuilding,
  sound,
  setSound,
  saveStatus,
  onApproach,
  selectedNPC,
  quality,
  setQuality,
}: {
  engine: Engine;
  audio: ValleyAudio | null;
  coop: CoopClient | null;
  panel: Panel;
  quality: boolean;
  setQuality: (q: boolean) => void;
  selectedNPC: string;
  setPanel: (p: Panel) => void;
  onBuild: (type: string) => void;
  onSeed: (type: string) => void;
  onEquip: (tool: string) => void;
  onImport: (f: File) => void;
  onExport: () => void;
  onSave: () => void;
  onReset: () => void;
  selectedBuilding: number | null;
  sound: boolean;
  setSound: (v: boolean) => void;
  saveStatus: string;
  onApproach: (x: number, z: number) => void;
}) {
  useLocale();
  const s = engine.s,
    [confirm, setConfirm] = useState<'reset' | 'demolish' | null>(null),
    [quantity, setQuantity] = useState(1),
    file = useRef<HTMLInputElement>(null);
  usePanelHistory(!!panel, () => setPanel(null));
  const titles: Record<NonNullable<Panel>, [string, string]> = {
    online: [sourceText("m_d9c859e464"), sourceText("m_7ad162b3bb")],
    bundles: [
      sourceText("m_1d65450c69"),
      sourceText("m_afc133e70e"),
    ],
    mine: [sourceText("m_7a6c3dd877"), sourceText("m_2c9235b59e")],
    build: [sourceText("m_6941efa97f"), sourceText("m_4c4db148a7")],
    craft: [sourceText("m_508194b685"), sourceText("m_1b3f640d05")],
    inventory: [
      sourceText("m_350094d967"),
      sourceText("m_cd559e6fb5"),
    ],
    quests: [sourceText("m_69510f5f16"), sourceText("m_7cdba6b34b")],
    market: [sourceText("m_5ffaaf5c73"), sourceText("m_fc0e12d1b8")],
    settings: [sourceText("m_748dc76205"), sourceText("m_c156f08d8b")],
    building: [sourceText("m_f909a095ec"), sourceText("m_a689ae9b8d")],
    villagers: [sourceText("m_b1632198ae"), sourceText("m_908ad66c98")],
    ranch: [
      sourceText("m_99476bffac"),
      sourceText("m_0de183d105"),
    ],
    guide: [sourceText("m_6cb0038efb"), sourceText("m_8941b3f1c2")],
  };
  const b = s.buildings.find((b) => b.id === selectedBuilding),
    d = b ? BUILDINGS[b.type] : null;
  return (
    <>
      <Sheet
        open={!!panel}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SheetContent className="game-panel camp-panel" data-panel={panel} translate="no" showCloseButton>
          <SheetHeader className="panel-header">
            <span className="eyebrow">Roamcroft</span>
            <SheetTitle>{localize(panel ? titles[panel][0] : '')}</SheetTitle>
            <SheetDescription>{localize(panel ? titles[panel][1] : '')}</SheetDescription>
          </SheetHeader>
          <CampNavigation panel={panel} server={!!engine.network?.server} building={!!b} titles={titles} onSelect={setPanel}/>
          <div className="panel-pause">
            <Clock size={13} /> {localize(engine.network?.shared?sourceText("m_d859c09bdd"):coop?.active ? sourceText("m_d90f1633ed") : sourceText("m_49730237c2"))} <span className="keyboard-hint">{translate("m_e6d1a69097")}</span>
          </div>
          <div className="panel-body" key={panel}>
            {panel === 'online' && engine.network?.server && <FriendLobby engine={engine} onEnter={()=>setPanel(null)}/>}
            {panel === 'bundles' && <BundlesPanel engine={engine} />}
            {panel === 'mine' && (
              <MinePanel
                engine={engine}
                onApproach={onApproach}
                onClose={() => setPanel(null)}
              />
            )}
            {panel === 'ranch' && (
              <div className="ranch-content">
                <CropPlanner engine={engine} onSeed={onSeed}/>
                <section className="orchard-overview">
                  <div className="orchard-heading"><GameIcon id="appletree"/><div><h3>{translate("m_a97a486592")}</h3><p>{translate("m_124bda5cf3")}</p></div></div>
                  <div className="ranch-builds"><button className="secondary-button" onClick={()=>onBuild('appletree')}><GameIcon id="appletree"/> {translate("m_b35ca9a231")}</button><button className="secondary-button" onClick={()=>onBuild('peartree')}><GameIcon id="peartree"/> {translate("m_517aa5c85f")}</button><button className="secondary-button" onClick={()=>setPanel('market')}>{translate("m_a4b37e529c")}</button></div>
                  {s.buildings.filter(b=>BUILDINGS[b.type].orchard).length===0?<p>{translate("m_b165844571")}</p>:<div className="orchard-grid">{s.buildings.filter(b=>BUILDINGS[b.type].orchard).map(tree=>{
                    const status=orchardStatus(tree,s)!;
                    return <article className={`orchard-tree ${status.ready?'is-ripe':''}`} key={tree.id}><GameIcon id={tree.type}/><div><b>{localize(BUILDINGS[tree.type].name)}</b><p>{localize(status.label)}</p><small>{tree.x}, {tree.z} · {status.age} {translate("m_d864e81ece")}</small></div><button className="secondary-button" onClick={()=>onApproach(tree.x,tree.z)}>{localize(status.ready?sourceText("m_6d351d32b5"):sourceText("m_0accdae7ef"))}</button></article>;
                  })}</div>}
                  <p className="orchard-chain"><GameIcon id="apple"/> {translate("m_c801d0c1d2")}<span>→</span><GameIcon id="applejam"/> {translate("m_6d90689664")}<span>→</span><GameIcon id="gold"/> {translate("m_38c98abf19")}</p>
                </section>
                <div className="ranch-intro">
                  <GameIcon id="barn" />
                  <div>
                    <h3>
                      {s.animals.length} {translate("m_b67723f6d2")}{s.inventory.feed || 0} {translate("m_a8ff7611bf")}</h3>
                    <p>
                      {translate("m_f0102e22bd")}</p>
                  </div>
                </div>
                <div className="ranch-builds">
                  {['coop', 'barn'].map((id) => (
                    <button
                      key={id}
                      className="secondary-button"
                      onClick={() => onBuild(id)}
                    >
                      <GameIcon id={id} /> {localize(BUILDINGS[id].name)} {translate("m_6e6be560ca")}</button>
                  ))}
                </div>
                {s.animals.length > 0 && (
                  <h3 className="subheading">{translate("m_bde4d65937")}</h3>
                )}
                {s.animals.map((a) => (
                  <article className="ranch-animal" key={a.id}>
                    <div className="catalog-top">
                      <span className="item-art">
                        <GameIcon id={a.type} />
                      </span>
                      <div>
                        <Input
                          aria-label={translate("m_3bc0ca32ea")}
                          className="animal-name"
                          placeholder={localize(ANIMALS[a.type].name)}
                          defaultValue={a.name || ''}
                          maxLength={24}
                          onBlur={(event) =>
                            engine.renameAnimal(a.id, event.target.value)
                          }
                        />
                        <small>
                          {localize((a.ready || 0) > 0
                            ? sourceText("m_e7b0ac730b", { p0: a.ready })
                            : s.day - (a.bornDay ?? -3) < 2
                              ? sourceText("m_b896afaeff")
                              : a.fed
                                ? sourceText("m_4325f4ece5")
                                : sourceText("m_62d1280a9c"))}{' '}
                          {translate("m_a426e743e1")}{a.bond || 0}/100
                          {' · '}
                          {localize((
                              {
                                walking: sourceText("m_c2969b879c"),running:sourceText("m_e45eb25410"),happy:sourceText("m_5ee5dcb38b"),lying:sourceText("m_0787eefa64"),fleeing:sourceText("m_4b1ed5eaba"),
                                grazing: sourceText("m_51e64616d2"),
                                sleeping: sourceText("m_90584e8f62"),
                                following: sourceText("m_aa8678c123"),
                              } as const
                            )[engine.animalMotion.get(a.id)?.mood ?? 'grazing'])}
                        </small>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(
                        100,
                        (a.timer / ANIMALS[a.type].time) * 100,
                      )}
                    />
                    <div className="ranch-builds">
                      <button
                        className="primary-button"
                        disabled={!a.ready}
                        onClick={() => engine.harvestAnimal(a.id)}
                      >
                        {translate("m_e7951cc58c")}{a.ready || 0}
                      </button>
                      <button
                        className="secondary-button"
                        disabled={a.fedDay === s.day || !s.inventory.feed}
                        onClick={() => engine.feedAnimal(a.id)}
                      >
                        {localize(a.fedDay === s.day
                          ? sourceText("m_cf3f3e4525")
                          : sourceText("m_ea15287ad1"))}
                      </button>
                      <button
                        className="secondary-button"
                        disabled={a.pettedDay === s.day}
                        onClick={() => engine.petAnimal(a.id)}
                      >
                        <Heart size={15} />{' '}
                        {localize(a.pettedDay === s.day
                          ? sourceText("m_f26221ff32")
                          : sourceText("m_50d85742fb"))}
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => engine.breedAnimal(a.id)}
                      >
                        {translate("m_3d45319205")}</button>
                    </div>
                  </article>
                ))}
                <h3 className="subheading">{translate("m_bc644d1926")}</h3>
                {Object.entries(ANIMALS).map(([id, a]) => {
                  const home = s.buildings.find(
                    (b) =>
                      b.type === a.home &&
                      s.animals.filter((v) => v.home === b.id).length <
                        3 * b.level,
                  );
                  return (
                    <article className="catalog-card" key={id}>
                      <div className="catalog-top">
                        <span className="item-art">
                          <GameIcon id={id} />
                        </span>
                        <div>
                          <h3>{localize(a.name)}</h3>
                          <small>
                            {localize(BUILDINGS[a.home].name)} · {localize(ITEMS[a.product].name)}
                          </small>
                        </div>
                      </div>
                      <p>
                        {localize(home
                          ? sourceText("m_17b9afd887", { p0: a.time })
                          : sourceText("m_db86f2d0ce", { p0: BUILDINGS[a.home].name.toLocaleLowerCase('tr') }))}
                      </p>
                      <div className="catalog-bottom">
                        <span className="gold-text">
                          <GameIcon id="gold" /> {a.cost}
                        </span>
                        <button
                          className="primary-button"
                          disabled={!home || s.gold < a.cost || !!s.mine}
                          onClick={() => engine.buyAnimal(id)}
                        >
                          {translate("m_78541222ac")}</button>
                      </div>
                    </article>
                  );
                })}
                <button
                  className="secondary-button full-width"
                  onClick={() => setPanel('craft')}
                >
                  <GameIcon id="feed" /> {translate("m_348b08268f")}</button>
              </div>
            )}
            {panel === 'build' && (
              <>
                {inventoryUsed(s) >= inventoryCapacity(s) && (
                  <p className="inventory-warning" role="alert">
                    {translate("m_6839d924fc")}</p>
                )}
                {Object.values(s.overflow).some((n) => n > 0) && (
                  <article className="quest-card">
                    <h3>{translate("m_dd2d7e3d95")}</h3>
                    <p>{translate("m_f19fb961a0")}</p>
                    <Cost bag={s.overflow} inventory={s.overflow} />
                    <button
                      className="primary-button"
                      disabled={inventoryUsed(s) >= inventoryCapacity(s)}
                      onClick={() => engine.collectDelivery()}
                    >
                      {translate("m_5c71127641")}</button>
                  </article>
                )}
                <Tabs defaultValue="Tümü">
                  <TabsList className="game-tabs">
                    {[sourceText("m_f43a65ad82"), sourceText("m_58b7a69368"), sourceText("m_aeb79ca9a6"), sourceText("m_0d3d1e1ccb"), sourceText("m_28925851ca")].map((c) => (
                      <TabsTrigger key={c} value={c}>
                        {localize(c)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {[sourceText("m_f43a65ad82"), sourceText("m_58b7a69368"), sourceText("m_aeb79ca9a6"), sourceText("m_0d3d1e1ccb"), sourceText("m_28925851ca")].map((c) => (
                    <TabsContent value={c} key={c}>
                      <div className="catalog">
                        {Object.entries(BUILDINGS)
                          .filter(
                            ([id, x]) =>
                              (c === sourceText("m_f43a65ad82") || x.category === c) &&
                              id !== 'home' &&
                              id !== 'market',
                          )
                          .map(([id, x]) => {
                            const unlocked = s.level >= x.level,
                              exists =
                                x.unique &&
                                s.buildings.some((b) => b.type === id);
                            return (
                              <article
                                key={id}
                                className={`catalog-card ${unlocked ? '' : 'locked'}`}
                              >
                                <div className="catalog-top">
                                  <span className="item-art">
                                    <GameIcon id={id} />
                                  </span>
                                  <div>
                                    <h3>{localize(x.name)}</h3>
                                    <span className="catalog-tag">
                                      {localize(x.category)} {translate("m_539f968770")}{x.level}
                                    </span>
                                  </div>
                                  {!unlocked && <Lock size={15} />}
                                </div>
                                <p>{localize(x.desc)}</p>
                                <div className="catalog-bottom">
                                  <Cost bag={x.cost} inventory={s.inventory} />
                                  <button
                                    className="primary-button"
                                    disabled={
                                      !unlocked ||
                                      !canAfford(s, x.cost) ||
                                      !!exists
                                    }
                                    onClick={() => onBuild(id)}
                                  >
                                    {localize(exists
                                      ? sourceText("m_993b5e2c2e")
                                      : unlocked
                                        ? sourceText("m_cc3f40f85c")
                                        : sourceText("m_5d22ce1415", { p0: x.level }))}
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                <p className="panel-note">
                  {translate("m_1c00d39031")}</p>
              </>
            )}
            {panel === 'craft' && (
              <>
                <ProductionWorkshop engine={engine}/>
                <div className="queue">
                  <div className="section-label">
                    <h3>{translate("m_ec9bfba661")}</h3>
                    <span>{s.jobs.length} / 3</span>
                  </div>
                  {s.jobs.length ? (
                    s.jobs.map((j, i) => (
                      <div className="queue-job" key={`${i}-${j.recipe}`}>
                        <span>
                          <GameIcon id={j.recipe} />
                        </span>
                        <div>
                          <b>{localize(RECIPES[j.recipe].name)}</b>
                          <Progress value={(1 - j.remaining / j.total) * 100} />
                        </div>
                        <small>{Math.ceil(j.remaining)} {translate("m_1928e61fec")}</small>
                      </div>
                    ))
                  ) : (
                    <p>{translate("m_4f7f24d9c1")}</p>
                  )}
                </div>
                <Tabs defaultValue="Malzeme">
                  <TabsList className="game-tabs">
                    {[sourceText("m_97571bb067"), sourceText("m_a8372e80d2"), sourceText("m_ae38913760")].map((c) => (
                      <TabsTrigger value={c} key={c}>
                        {localize(c)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {[sourceText("m_97571bb067"), sourceText("m_a8372e80d2"), sourceText("m_ae38913760")].map((c) => (
                    <TabsContent value={c} key={c}>
                      <div className="catalog">
                        {Object.entries(RECIPES)
                          .filter(([, r]) =>
                            c === sourceText("m_ae38913760")
                              ? !!r.upgrade
                              : c === sourceText("m_a8372e80d2")
                                ? Object.keys(r.output).some(
                                    (k) => ITEMS[k].food,
                                  )
                                : !r.upgrade &&
                                  !Object.keys(r.output).some(
                                    (k) => ITEMS[k].food,
                                  ),
                          )
                          .map(([id, r]) => {
                            const tier = r.upgrade
                                ? (s.upgrades[r.upgrade] || 0) +
                                  s.jobs.filter(
                                    (j) =>
                                      RECIPES[j.recipe].upgrade === r.upgrade,
                                  ).length
                                : 0,
                              cost = Object.fromEntries(
                                Object.entries(r.input).map(([k, n]) => [
                                  k,
                                  n * (tier + 1),
                                ]),
                              ),
                              station =
                                !r.station ||
                                s.buildings.some((b) => b.type === r.station),
                              locked = s.level < r.level;
                            return (
                              <article className="catalog-card" key={id}>
                                <div className="catalog-top">
                                  <span className="item-art">
                                    <GameIcon id={id} />
                                  </span>
                                  <div>
                                    <h3>{localize(r.name)}</h3>
                                    <span className="catalog-tag">
                                      {localize(r.upgrade
                                        ? sourceText("m_d0952e354b", { p0: tier, p1: Math.min(3, tier + 1) })
                                        : Object.entries(r.output)
                                            .map(
                                              ([k, n]) =>
                                                sourceText("m_8cbaa55a52", { p0: n, p1: ITEMS[k].name }),
                                            )
                                            .join(', '))}{' '}
                                      · <Zap size={11} /> 4
                                    </span>
                                  </div>
                                </div>
                                {localize(r.station && (
                                  <p className={station ? '' : 'missing'}>
                                    <GameIcon id={r.station} />{' '}
                                    {localize(BUILDINGS[r.station].name)}{' '}
                                    {station ? translate("m_5aa460c91c") : translate('common.required')}
                                  </p>
                                ))}
                                <div className="catalog-bottom">
                                  <Cost bag={cost} inventory={s.inventory} />
                                  <button
                                    className="primary-button"
                                    disabled={
                                      locked ||
                                      !station ||
                                      !canAfford(s, cost) ||
                                      s.jobs.length >= 3 ||
                                      s.player.energy < 4 ||
                                      (!!r.upgrade && tier >= 3)
                                    }
                                    onClick={() => engine.craft(id)}
                                  >
                                    {localize(locked
                                      ? sourceText("m_5d22ce1415", { p0: r.level })
                                      : r.upgrade && tier >= 3
                                        ? sourceText("m_a7e10db1a5")
                                        : !station ? sourceText("m_740f7b7127")
                                        : s.jobs.length >= 3 ? sourceText("m_efb85b57f5")
                                        : s.player.energy < 4 ? sourceText("m_820aaa9be8")
                                        : !canAfford(s,cost) ? sourceText("m_28c47c7cff") : sourceText("m_fb3b1a2ce1"))}
                                  </button>
                                </div>
                                <MaterialNeeds engine={engine} cost={cost} kind="craft" target={id}/>
                              </article>
                            );
                          })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </>
            )}
            {panel === 'inventory' && (
              <>
                <InventoryPanel engine={engine} onSeed={onSeed} onBuild={onBuild}/>
                {Object.values(s.overflow).some((n) => n > 0) && (
                  <article className="quest-card">
                    <h3>{translate("m_dd2d7e3d95")}</h3>
                    <p>{translate("m_f19fb961a0")}</p>
                    <Cost bag={s.overflow} inventory={s.overflow} />
                    <button
                      className="primary-button"
                      disabled={inventoryUsed(s) >= inventoryCapacity(s)}
                      onClick={() => engine.collectDelivery()}
                    >
                      {translate("m_5c71127641")}</button>
                  </article>
                )}
              </>
            )}
            {panel === 'quests' && (
              <>
                <SettlementPanel engine={engine} />
                <Tabs defaultValue="Görevler">
                  <TabsList className="game-tabs">
                    <TabsTrigger value="Görevler">{translate("m_7d03cf59fb")}</TabsTrigger>
                    <TabsTrigger value="Yetenekler">{translate("m_277b511cb9")}</TabsTrigger>
                    <TabsTrigger value="Başarımlar">{translate("m_a625b27c7c")}</TabsTrigger>
                    <TabsTrigger value="Ustalıklar">{translate("m_efafcb83bb")}</TabsTrigger>
                    <TabsTrigger value="Köy">{translate("m_aeb79ca9a6")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="Görevler">
                    <div className="journal-intro">
                      <span>✦</span>
                      <div>
                        <h3>{translate("m_0c10f9ee2e")}</h3>
                        <p>
                          {translate("m_0b57624d24")}</p>
                      </div>
                    </div>
                    {QUESTS.map((q, index) => {
                      const value = Math.min(q.target, s.stats[q.stat] || 0),
                        done = s.claimed.includes(q.id);
                      return (
                        <article
                          key={q.id}
                          className={`quest-card ${done ? 'completed' : ''}`}
                        >
                          <div className="section-label">
                            <span className="quest-number">
                              {localize(done ? (
                                <Check size={16} />
                              ) : (
                                String(index + 1).padStart(2, '0')
                              ))}
                            </span>
                            <h3>{localize(q.name)}</h3>
                            <span>
                              {value}/{q.target}
                            </span>
                          </div>
                          <p>{localize(q.desc)}</p>
                          <Progress value={(value / q.target) * 100} />
                          <div className="quest-rewards">
                            <span>◈ {q.reward.gold}</span>
                            <span>✦ {q.reward.xp} {translate("m_bf2be7a0aa")}</span>
                            <button
                              className="primary-button"
                              disabled={done || value < q.target}
                              onClick={() => engine.claim(q.id)}
                            >
                              {localize(done ? sourceText("m_7c6f3f5f37") : sourceText("m_780491daae"))}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </TabsContent>
                  <TabsContent value="Yetenekler">
                    <div className="talent-points">
                      <Star size={20} />
                      <div>
                        <b>{engine.talentPoints()} {translate("m_30202c47f1")}</b>
                        <p>
                          {translate("m_c727e227c8")}</p>
                      </div>
                    </div>
                    {Object.entries(TALENTS).map(([id, t]) => {
                      const rank = s.talents[id] || 0;
                      return (
                        <article className="talent-card" key={id}>
                          <div className="catalog-top">
                            <span className="item-art">
                              <GameIcon id={id} />
                            </span>
                            <div>
                              <h3>{localize(t.name)}</h3>
                              <div className="talent-ranks">
                                {[0, 1, 2, 3, 4].map((n) => (
                                  <i
                                    key={n}
                                    className={n < rank ? 'filled' : ''}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p>{localize(t.desc)}</p>
                          <button
                            className="primary-button"
                            disabled={
                              engine.talentPoints() < 1 ||
                              rank >= 5 ||
                              s.gold < (rank + 1) * 40
                            }
                            onClick={() => engine.unlockTalent(id)}
                          >
                            {localize(rank >= 5
                              ? sourceText("m_33470c75ee")
                              : sourceText("m_bd564f9d12", { p0: (rank + 1) * 40 }))}
                          </button>
                        </article>
                      );
                    })}
                  </TabsContent>
                  <TabsContent value="Başarımlar">
                    {ACHIEVEMENTS.map((a) => {
                      const done = s.achievements.includes(a.id),
                        value = s.stats[a.stat] || 0;
                      return (
                        <article className="quest-card" key={a.id}>
                          <div className="section-label">
                            <h3>
                              <GameIcon id={done ? 'gold' : 'beacon'} />{' '}
                              {localize(a.name)}
                            </h3>
                            <span>
                              {Math.min(value, a.target)}/{a.target}
                            </span>
                          </div>
                          <p>{localize(a.description)}</p>
                          <Progress
                            value={Math.min(100, (value / a.target) * 100)}
                          />
                          <div className="quest-rewards">
                            <span>◈ {a.rewardGold}</span>
                            <button
                              className="primary-button"
                              disabled={done || value < a.target}
                              onClick={() => engine.claimAchievement(a.id)}
                            >
                              {localize(done ? sourceText("m_c638ad4e86") : sourceText("m_780491daae"))}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                    <h3 className="subheading">{translate("m_f320cb07e7")}</h3>
                    {LANDMARKS.map((l) => (
                      <article className="quest-card" key={l.id}>
                        <div className="section-label">
                          <h3>
                            {localize(s.discoveries.includes(l.id) ? '✦' : '◇')} {localize(l.name)}
                          </h3>
                          <span>
                            {l.x}, {l.z}
                          </span>
                        </div>
                        <p>
                          {localize(s.discoveries.includes(l.id)
                            ? l.description
                            : sourceText("m_04ad97f5ab"))}
                        </p>
                        <button
                          className="secondary-button"
                          onClick={() => onApproach(l.x, l.z)}
                        >
                          {translate("m_c2884b024d")}</button>
                      </article>
                    ))}
                  </TabsContent>
                  <TabsContent value="Ustalıklar">
                    {Object.entries({
                      farming: [
                        'seed',
                        sourceText("m_4ebfebd02e"),
                        sourceText("m_6f8ff76093"),
                      ],
                      gathering: [
                        'axe',
                        sourceText("m_14327aea77"),
                        sourceText("m_6bced267fb"),
                      ],
                      crafting: [
                        'workshop',
                        sourceText("m_e2ecc290d7"),
                        sourceText("m_2962483969"),
                      ],
                      combat: [
                        'sword',
                        sourceText("m_b9dfd3d099"),
                        sourceText("m_f43d3500b3"),
                      ],
                      fishing: [
                        'fish',
                        sourceText("m_d2f669c08a"),
                        sourceText("m_57e49bf46d"),
                      ],
                    }).map(([key, [icon, name, desc]]) => (
                      <article className="skill-card" key={key}>
                        <GameIcon id={String(icon)} />
                        <div>
                          <div className="section-label">
                            <h3>{localize(name)}</h3>
                            <b>{translate("m_419b788dc3")}{skillLevel(s, key)}</b>
                          </div>
                          <p>{localize(desc)}</p>
                          <small>
                            {Math.floor(s.skills[key] || 0)} {translate("m_12faeafcbe")}</small>
                        </div>
                      </article>
                    ))}
                  </TabsContent>
                  <TabsContent value="Köy">
                    <div className="village-stats">
                      {[
                        ['home', sourceText("m_b451ee8141"), s.buildings.length],
                        ['chicken', sourceText("m_707c2a7513"), s.animals.length],
                        ['seed', sourceText("m_3b84f672e2"), s.tiles.filter((t) => t.crop).length],
                        ['sword', sourceText("m_ba4f188ba7"), s.stats.kills || 0],
                        ['day', sourceText("m_35784c3627"), s.day],
                        ['gold', sourceText("m_737d1b72e4"), s.stats.sell || 0],
                      ].map(([icon, label, n]) => (
                        <div key={label}>
                          <GameIcon id={String(icon)} />
                          <b>{localize(n)}</b>
                          <small>{localize(label)}</small>
                        </div>
                      ))}
                    </div>
                    <h3 className="subheading">{translate("m_b5969bf541")}</h3>
                    {s.animals.length ? (
                      s.animals.map((a) => (
                        <div className="animal-row" key={a.id}>
                          <span>
                            <GameIcon id={a.type} />
                          </span>
                          <div>
                            <b>{localize(ANIMALS[a.type].name)}</b>
                            <small>
                              {localize(a.ready
                                ? sourceText("m_e7b0ac730b", { p0: a.ready })
                                : a.producedDay === s.day
                                  ? sourceText("m_adeacccacd")
                                  : a.fed
                                    ? sourceText("m_c9faa3c5ab", { p0: Math.ceil(ANIMALS[a.type].time - a.timer), p1: ITEMS[ANIMALS[a.type].product].name })
                                    : sourceText("m_62d1280a9c"))}
                            </small>
                          </div>
                          <Progress
                            value={(a.timer / ANIMALS[a.type].time) * 100}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="panel-note">
                        {translate("m_9e1cd0c9aa")}</p>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
            {panel === 'market' && (
              <>
                <div className="merchant">
                  <span><VillagerPortrait id="narin"/></span>
                  <div>
                    <h3>Narin</h3>
                    <p>
                      {translate("m_32911e8db4")}</p>
                  </div>
                  <b>◈ {s.gold}</b>
                </div>
                <button className="secondary-button" onClick={()=>setPanel('villagers')}>{translate("m_be4efe6dcd")}</button>
                <Tabs defaultValue="Satın al">
                  <TabsList className="game-tabs">
                    {[sourceText("m_28ba80fbab"), sourceText("m_fdeb71b569"), sourceText("m_6b255f5461")].map((c) => (
                      <TabsTrigger value={c} key={c}>
                        {localize(c)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="quantity-selector">
                    <span>{translate("m_9b3036150b")}</span>
                    {[1, 5, 10].map((n) => (
                      <button
                        key={n}
                        aria-pressed={quantity === n}
                        onClick={() => setQuantity(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {[sourceText("m_28ba80fbab"), sourceText("m_fdeb71b569")].map((tab) => (
                    <TabsContent value={tab} key={tab}>
                      <div className="market-list">
                        {Object.entries(ITEMS)
                          .filter(([id]) =>
                            tab === sourceText("m_fdeb71b569")
                              ? (s.inventory[id] || 0) > 0
                              : marketSells(id),
                          )
                          .map(([id, item]) => {
                            const buy = tab === sourceText("m_28ba80fbab"),
                              price = tradeUnitPrice(s, id, buy) * quantity;
                            return (
                              <div className="market-row" key={id}>
                                <span>
                                  <GameIcon id={id} />
                                </span>
                                <div>
                                  <b>{localize(item.name)}</b>
                                  <small>
                                    {translate("m_9e0bbc87d1")}{s.inventory[id] || 0}
                                  </small>
                                </div>
                                <button
                                  disabled={
                                    buy
                                      ? s.gold < price
                                      : (s.inventory[id] || 0) < quantity
                                  }
                                  onClick={() =>
                                    engine.trade(id, quantity, buy)
                                  }
                                >
                                  {localize(buy ? sourceText("m_1af8ffa278") : sourceText("m_fdeb71b569"))} · ◈ {price}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </TabsContent>
                  ))}
                  <TabsContent value="Hayvanlar">
                    {Object.entries(ANIMALS).map(([id, a]) => (
                      <article className="catalog-card" key={id}>
                        <div className="catalog-top">
                          <span className="item-art">
                            <GameIcon id={id} />
                          </span>
                          <div>
                            <h3>{localize(a.name)}</h3>
                            <span className="catalog-tag">
                              {localize(BUILDINGS[a.home].name)} {translate("m_16c76b355e")}</span>
                          </div>
                        </div>
                        <p>
                          {translate("m_d0b61c46f3")}{a.time} {translate("m_a97f66cafc")}{' '}
                          {localize(ITEMS[a.product].name.toLocaleLowerCase('tr'))}{' '}
                          {translate("m_ac934b57af")}</p>
                        <div className="catalog-bottom">
                          <span className="gold-text">◈ {a.cost}</span>
                          <button
                            className="primary-button"
                            disabled={
                              s.gold < a.cost ||
                              !s.buildings.some(
                                (b) =>
                                  b.type === a.home &&
                                  s.animals.filter((a) => a.home === b.id)
                                    .length <
                                    3 * b.level,
                              )
                            }
                            onClick={() => engine.buyAnimal(id)}
                          >
                            {translate("m_78541222ac")}</button>
                        </div>
                      </article>
                    ))}
                  </TabsContent>
                </Tabs>
              </>
            )}
            {panel==='inventory' && engine.storageCapacity()>0 && <StoragePanel engine={engine}/>}
            {panel === 'building' && b && d && (
              <>
                <div className="building-detail">
                  <span>
                    <GameIcon id={b.type} />
                  </span>
                  <h2>{localize(d.name)}</h2>
                  <p>
                    {translate("m_3493f04db5")}{b.level} / 3 · {b.x}, {b.z}
                  </p>
                </div>
                <p className="detail-description">{localize(d.desc)}</p>
                {d.orchard&&<div className="orchard-overview"><GameIcon id={b.type}/><h3>{localize(orchardStatus(b,s)!.label)}</h3><p>{translate("m_e364b3ca55")}{2+b.level} {translate("m_943256d599")}{localize(d.orchard.seasons.map(i=>SEASONS[i]).join(', '))}.</p><button className="primary-button" onClick={()=>onApproach(b.x,b.z)}>{localize(orchardStatus(b,s)!.ready?sourceText("m_9c2a091a9e"):sourceText("m_f01799e925"))}</button></div>}
                <div className="section-label">
                  <h3>{translate("m_2e8984bca4")}</h3>
                  <span>
                    {Math.ceil(b.hp)} / {d.hp * b.level}
                  </span>
                </div>
                <Progress value={(b.hp / (d.hp * b.level)) * 100} />
                {d.production && <MachineCard engine={engine} building={b}/>}
                {b.type==='chest' && <StoragePanel engine={engine}/>}
                <div className="building-buttons">
                  <button className="secondary-button" onClick={() => engine.rotateBuilding(b.id)}>{translate("m_545873dce4")}{(b.rotation || 0)*90}°</button>
                  {['fence','wall'].includes(b.type) && <button className="secondary-button" onClick={()=>engine.reshapeBuilding(b.id)}>{localize(b.corner ? sourceText("m_0bc2541fab") : sourceText("m_5a88dc46be"))}</button>}
                  {b.type === 'home' && (
                    <button
                      className="primary-button"
                      onClick={() => {
                        if (engine.sleep()) setPanel(null);
                      }}
                    >
                      {localize(engine.network?.shared?sourceText("m_fc28150d16"):sourceText("m_a848ca9e7d"))}
                    </button>
                  )}
                  {b.type === 'market' && (
                    <button
                      className="primary-button"
                      onClick={() => setPanel('market')}
                    >
                      {translate("m_94ab14556e")}</button>
                  )}
                  <button
                    className="secondary-button"
                    onClick={() => onApproach(b.x, b.z)}
                  >
                    {translate("m_20983697d0")}</button>
                  <button
                    className="secondary-button"
                    disabled={
                      b.hp >= d.hp * b.level ||
                      !canAfford(s, { wood: 3, stone: 2 })
                    }
                    onClick={() => engine.repair(b.id)}
                  >
                    {translate("m_86d2901ff7")}</button>
                  {b.level < 3 && (
                    <div className="upgrade-box">
                      <h3>{translate("m_3493f04db5")}{b.level + 1}</h3>
                      <p>
                        {localize(d.production
                          ? sourceText("m_d0ad2daf55")
                          : sourceText("m_feb398e854"))}
                      </p>
                      <Cost bag={upgradeCost(b)} inventory={s.inventory} />
                      <button
                        className="primary-button"
                        disabled={
                          !canAfford(s, upgradeCost(b)) || s.level < b.level * 2
                        }
                        onClick={() => engine.upgrade(b.id)}
                      >
                        {translate("m_6837a56bef")}{' '}
                        {localize(s.level < b.level * 2
                          ? sourceText("m_66f5985239", { p0: b.level * 2 })
                          : '')}
                      </button>
                    </div>
                  )}
                  {!['home', 'market'].includes(b.type) && (
                    <button
                      className="danger-button"
                      onClick={() => setConfirm('demolish')}
                    >
                      <Trash2 size={15} /> {translate("m_a829409f02")}</button>
                  )}
                </div>
              </>
            )}
            {panel === 'villagers' && (
              <Tabs defaultValue={selectedNPC}>
                <TabsList className="game-tabs">
                  {NPCS.map((n) => (
                    <TabsTrigger key={n.id} value={n.id}>
                      {localize(n.name)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {NPCS.map((n) => {
                  const stage = s.won
                      ? 'beacon'
                      : s.day <= 3
                        ? 'early'
                        : s.day <= 7
                          ? 'growing'
                          : 'established',
                    friendship = s.friendship[n.id] || 0,
                    gifted = s.gifts[n.id] === s.day;
                  return (
                    <TabsContent key={n.id} value={n.id}>
                      <div className="npc-profile">
                        <span>
                          <VillagerPortrait id={n.id}/>
                        </span>
                        <div>
                          <h2>{localize(n.name)}</h2>
                          <p>{localize(n.role)}</p>
                          <div className="friendship">
                            {[20, 40, 60, 80, 100].map((v) => (
                              <Heart
                                key={v}
                                size={16}
                                fill={friendship >= v ? 'currentColor' : 'none'}
                              />
                            ))}
                            <small>{friendship}/100</small>
                          </div>
                        </div>
                      </div>
                      <p className="friendship-effect">
                        {localize(n.id === 'narin'
                          ? sourceText("m_faf89b44d0", { p0: Math.floor(friendship * 0.1) })
                          : n.id === 'torin'
                            ? sourceText("m_ddbaa69235", { p0: Math.floor(friendship * 0.1) })
                            : sourceText("m_e2ab0b74b4", { p0: Math.floor(friendship * 0.05) }))}
                      </p>
                      <p className="npc-routine">{localize(schedule(NPCS.indexOf(n),s.time,n).label)} · {localize(timedGreeting(s.time))}</p><div className="dialogue-box">
                        <p><b>{translate("m_6b0121ad74")}</b>{localize(settlementStory(s).chapter.voices[n.id as 'narin'|'torin'|'lale'])}</p>
                        <p>
                          {localize(n.dialogue[stage][
                              (s.day - 1) % n.dialogue[stage].length
                            ])}
                        </p>
                        <button
                          className="secondary-button"
                          disabled={s.talks[n.id] === s.day}
                          onClick={() => engine.talk(n.id)}
                        >
                          {localize(s.talks[n.id] === s.day
                            ? sourceText("m_6aad92c42a")
                            : sourceText("m_ccddb79392"))}
                        </button>
                      </div>
                      <DailyOrders engine={engine} npc={n.id}/>
                      <div className="gift-box">
                        <div>
                          <h3>{translate("m_7591437fe3")}</h3>
                          <p>
                            <GameIcon id={n.gift} /> {localize(ITEMS[n.gift].name)} · ♥
                            +12
                          </p>
                        </div>
                        <button
                          className="secondary-button"
                          disabled={gifted || !s.inventory[n.gift]}
                          onClick={() => engine.gift(n.id)}
                        >
                          {localize(gifted ? sourceText("m_80499fc07d") : sourceText("m_2a985d4c56"))}
                        </button>
                      </div>
                      <button
                        className="secondary-button full-width"
                        onClick={() => onApproach(engine.npcMotion.get(n.id)?.x??n.x, engine.npcMotion.get(n.id)?.z??n.z)}
                      >
                        {localize(n.name)} {translate("m_6e78076b66")}</button>
                      {n.id === 'narin' && (
                        <button
                          className="primary-button full-width"
                          onClick={() => setPanel('market')}
                        >
                          {translate("m_e5468d1bc2")}</button>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
            {panel === 'settings' && (
              <>
                <div className="settings-section"><LanguageSettings /></div>
                <TouchSettings/>
                <div className="settings-section"><GuidanceSetting/><button type="button" className="secondary-button" onClick={() => setPanel('guide')}>{translate('steps.title')}</button></div>
                {engine.network?.server&&<button className="primary-button" onClick={()=>setPanel('online')}>{translate("m_77d4059a4f")}</button>}
                <div className="settings-section">
                  <SettlementName engine={engine} />
                  <h3>{translate("m_3c2585310d")}</h3>
                  <p>
                    {localize(engine.network?.server?sourceText("m_f5bdf0c1dd"):sourceText("m_ca81e1548d"))}
                  </p>
                  <div className="save-status">
                    <Save size={15} />
                    {localize(saveStatus ||
                      (engine.network?.server?sourceText("m_f2cfff6525"):sourceText("m_6c7efee6cf")))}
                  </div>
                  <div className="save-actions"><button className="primary-button" onClick={onSave}>
                    <Save size={16} /> {translate("m_345776972d")}</button>
                  <button className="secondary-button" onClick={onExport}>
                    <Download size={16} /> {translate("m_3bd6103a31")}</button>
                  <button
                    className="secondary-button"
                    disabled={engine.network?.server}
                    onClick={() => file.current?.click()}
                  >
                    <Upload size={16} /> {translate("m_453bf55c4b")}</button>
                  <input
                    hidden
                    ref={file}
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onImport(f);
                      e.currentTarget.value = '';
                    }}
                  />
                  </div>
                </div>
                <div className="settings-section">
                  <h3>{translate("m_f3d4d53c08")}</h3>
                  <p>
                    {translate("m_3621ea4cd0")}</p>
                  <label className="quality-setting">
                    <span>{translate("m_ee2de2a139")}</span>
                    <Switch checked={quality} onCheckedChange={setQuality} />
                  </label>
                </div>
                <div className="settings-section">
                  <h3>{translate("m_9ab936ba64")}</h3>
                  <p>{translate("m_b98f5b706b")}</p>
                  <AudioSettings audio={audio}/>
                  <button
                    className="secondary-button"
                    onClick={() => setSound(!sound)}
                  >
                    {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}{' '}
                    {localize(sound ? sourceText("m_9e37e5ce56") : sourceText("m_b1e169c43b"))}
                  </button>
                </div>
                <div className="settings-section">
                  <h3>{translate("m_f3c26534c7")}</h3>
                  <div className="key-guide">
                    {[
                      [sourceText("m_bfe3acbf97"), sourceText("m_52b61e1819")],
                      ['Tab', sourceText("m_ceb9f80c28")],
                      ['1 – 8', sourceText("m_e6b26269ae")],
                      [sourceText("m_16782e4568"), sourceText("m_995c03f9a9")],
                      ['Ctrl', sourceText("m_de69a6e31c")],
                      ['Shift', sourceText("m_6e6749655d")],
                      ['E', sourceText("m_3cca9491e7")],
                      [sourceText("m_52a4a7534f"), sourceText("m_e59f433691")],
                      [sourceText("m_4eb2de9ec0"), sourceText("m_f90db5988b")],
                      [sourceText("m_960b20ae98"), sourceText("m_99d8711725")],
                      [sourceText("m_3b4a9f186b"), sourceText("m_319e0d814c")],
                      ['Esc', sourceText("m_14ee164206")],
                    ].map(([key, action]) => (
                      <div key={key}>
                        <kbd>{localize(key)}</kbd>
                        <span>{localize(action)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="settings-section">
                  <h3>{translate("m_2315e60bae")}</h3>
                  <p>
                    {translate("m_ad8d5b30e5")}</p>
                  <button
                    className="danger-button"
                    disabled={engine.network?.server}
                    onClick={() => setConfirm('reset')}
                  >
                    <RotateCcw size={16} /> {translate("m_184f5fac3d")}</button>
                </div>
                <div className="credits">
                  Roamcroft · {GAME_VERSION}<br />
                  {translate("m_e58ecd899c")}<br />
                  Three.js · React · TypeScript
                </div>
              </>
            )}
            {panel === 'guide' && (
              <div className="guide-content">
                <FirstSteps state={s} shared={!!engine.network?.shared} onEquip={onEquip} onOpen={setPanel}/>
                <details className="valley-handbook"><summary>{translate('m_6cb0038efb')}</summary>
                {[
                  [
                    '01',
                    sourceText("m_05cd8d5fbe"),
                    sourceText("m_0bf7ed6ddd"),
                  ],
                  [
                    '02',
                    sourceText("m_830dea6b24"),
                    sourceText("m_09fb67b337"),
                  ],
                  [
                    '03',
                    sourceText("m_b666f8304f"),
                    sourceText("m_0e2d0138f6"),
                  ],
                  [
                    '04',
                    sourceText("m_2e25d4ef44"),
                    sourceText("m_df62f39eab"),
                  ],
                  [
                    '05',
                    sourceText("m_13f2cc23a5"),
                    sourceText("m_ab81436cfa"),
                  ],
                  [
                    '06',
                    sourceText("m_29c556b3a9"),
                    sourceText("m_0155ba96e9"),
                  ],
                  [
                    '07',
                    sourceText("m_8164eb2fa6"),
                    sourceText("m_f8118ad2bd"),
                  ],
                  [
                    '08',
                    sourceText("m_80a04ccbbc"),
                    sourceText("m_95231db34f"),
                  ],
                  [
                    '09',
                    sourceText("m_a94cf5f6c9"),
                    sourceText("m_d6e35a1345"),
                  ],
                  [
                    '10',
                    sourceText("m_b618bf4107"),
                    sourceText("m_d51b412032"),
                  ],
                  [
                    '11',
                    sourceText("m_0f9299e397"),
                    sourceText("m_8b6879edb3"),
                  ],
                ].map(([n, title, text]) => (
                  <section key={n}>
                    <span>{localize(n)}</span>
                    <div>
                      <h3>{localize(title)}</h3>
                      <p>{localize(text)}</p>
                    </div>
                  </section>
                ))}
                </details><div className="season-card">
                  <b>{translate("m_1b4347b42b")}{localize(SEASONS[season(s)])}</b>
                  <p>
                    {localize(Object.values(CROPS)
                      .filter((c) => c.seasons.includes(season(s)))
                      .map((c) => c.name)
                      .join(' · '))}
                  </p>
                </div>
              </div>
            )}
          </div>
          <SheetClose className="camp-return" type="button">{translate('ui.close')}</SheetClose>
        </SheetContent>
      </Sheet>
      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent className="game-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {localize(confirm === 'reset'
                ? sourceText("m_fa539a903a")
                : sourceText("m_7d983fd273"))}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {localize(confirm === 'reset'
                ? sourceText("m_af3cdfc738")
                : sourceText("m_0ee0224367"))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translate("m_39a8d28c1c")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm === 'reset') onReset();
                else if (b) {
                  engine.demolish(b.id);
                  setPanel(null);
                }
                setConfirm(null);
              }}
            >
              {localize(confirm === 'reset' ? sourceText("m_0a89501c7e") : sourceText("m_4e29c62c0b"))}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function BackpackIcon() {
  useLocale();
  return (
    <span className="bag-art">
      <GameIcon id="bag" />
    </span>
  );
}
