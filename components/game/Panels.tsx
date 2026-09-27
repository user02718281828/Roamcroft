'use client';
import AudioSettings from './AudioSettings';
import DailyOrders from './DailyOrders';
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
export type Panel =
  | 'online'
  | 'build'
  | 'craft'
  | 'inventory'
  | 'quests'
  | 'market'
  | 'settings'
  | 'building'
  | 'guide'
  | 'villagers'
  | 'ranch'
  | 'bundles'
  | 'mine'
  | null;
export function Cost({ bag, inventory }: { bag: Bag; inventory: Bag }) {
  return (
    <div className="cost">
      {Object.entries(bag).map(([id, n]) => (
        <span
          key={id}
          className={(inventory[id] || 0) < n ? 'missing' : ''}
          title={`${ITEMS[id]?.name}: ${inventory[id] || 0} / ${n}`}
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
  const s = engine.s,
    [confirm, setConfirm] = useState<'reset' | 'demolish' | null>(null),
    [quantity, setQuantity] = useState(1),
    file = useRef<HTMLInputElement>(null);
  const titles: Record<NonNullable<Panel>, [string, string]> = {
    online: ['Birlikte oyna', 'Davet koduyla aynı çiftlikte buluşun.'],
    bundles: [
      'Köy emanetleri',
      'Ortak sandıkları doldur, vadine kalıcı iyileştirmeler kazandır.',
    ],
    mine: ['Maden asansörü', 'Açılan katlar sonraki keşiflerde seni bekler.'],
    build: ['Köyünü inşa et', 'Her yapı, vadinin geleceğine bir adım.'],
    craft: ['Üretim atölyesi', 'Malzemeleri işle. Araçlarını geliştir.'],
    inventory: [
      'Gezginin çantası',
      'Topladığın, yetiştirdiğin ve ürettiğin her şey.',
    ],
    quests: ['Vadi günlüğü', 'Küçük adımlar, büyük bir hikâye.'],
    market: ['Söğüt pazarı', 'Tüccar Narin her gün tezgâhının başında.'],
    settings: ['Kamp menüsü', 'Oyun kaydı, ses ve kontroller.'],
    building: ['Yapı yönetimi', 'Köyündeki üretimi ve savunmayı yönet.'],
    villagers: ['Vadi sakinleri', 'Bir köyü yuva yapan, içindeki insanlardır.'],
    ranch: [
      'Çiftliğim',
      'Barınaklarını kur, hayvanlarını büyüt, ürünlerini topla.',
    ],
    guide: ['Gezginin el kitabı', 'Vadideki ilk gününden kadim fenere.'],
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
        <SheetContent className="game-panel" data-panel={panel} showCloseButton>
          <SheetHeader className="panel-header">
            <span className="eyebrow">Roamcroft</span>
            <SheetTitle>{panel ? titles[panel][0] : ''}</SheetTitle>
            <SheetDescription>{panel ? titles[panel][1] : ''}</SheetDescription>
          </SheetHeader>
          <Tabs className="panel-navigation" value={panel || 'inventory'} onValueChange={value=>setPanel(value as Panel)}>
            <TabsList className="unified-tabs">
              {engine.network?.server&&<TabsTrigger value="online">Online</TabsTrigger>}
              {([['inventory','Çanta'],['craft','Üretim'],['build','İnşa'],['quests','Günlük'],['ranch','Çiftlik'],['villagers','Dostlar'],['bundles','Emanet'],['mine','Maden'],['settings','Ayarlar']] as const).map(([id,label])=><TabsTrigger key={id} value={id}>{label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="panel-pause">
            <Clock size={13} /> {engine.network?.shared?'Sen beklemedesin · Ortak dünya açık':coop?.active ? 'Ortak dünya · Ev sahibi zamanın akışını yönetir' : 'Duraklatıldı'} <span className="keyboard-hint">· Tab: kapat · Q / E: sekme değiştir</span>
          </div>
          <div className="panel-body">
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
                  <div className="orchard-heading"><GameIcon id="appletree"/><div><h3>Meyve bahçem</h3><p>Bugün dik, yarının gölgesini büyüt.</p></div></div>
                  <div className="ranch-builds"><button className="secondary-button" onClick={()=>onBuild('appletree')}><GameIcon id="appletree"/> Elma dik</button><button className="secondary-button" onClick={()=>onBuild('peartree')}><GameIcon id="peartree"/> Armut dik</button><button className="secondary-button" onClick={()=>setPanel('market')}>Fidan satın al</button></div>
                  {s.buildings.filter(b=>BUILDINGS[b.type].orchard).length===0?<p>Elma fidanı iki, armut fidanı üç günde ağaca dönüşür. Ağaçlar kalıcıdır; mevsiminde her gün yeniden hasat edebilirsin.</p>:<div className="orchard-grid">{s.buildings.filter(b=>BUILDINGS[b.type].orchard).map(tree=>{
                    const status=orchardStatus(tree,s)!;
                    return <article className={`orchard-tree ${status.ready?'is-ripe':''}`} key={tree.id}><GameIcon id={tree.type}/><div><b>{BUILDINGS[tree.type].name}</b><p>{status.label}</p><small>{tree.x}, {tree.z} · {status.age} günlük</small></div><button className="secondary-button" onClick={()=>onApproach(tree.x,tree.z)}>{status.ready?'Git ve topla':'Yanına git'}</button></article>;
                  })}</div>}
                  <p className="orchard-chain"><GameIcon id="apple"/> Hasat <span>→</span><GameIcon id="applejam"/> Mutfakta işle <span>→</span><GameIcon id="gold"/> Yeni bahçeni kur</p>
                </section>
                <div className="ranch-intro">
                  <GameIcon id="barn" />
                  <div>
                    <h3>
                      {s.animals.length} hayvan · {s.inventory.feed || 0} yem
                    </h3>
                    <p>
                      Her hayvan günde bir yem yer. Hazır yumurta, süt ve yünü
                      aşağıdan ya da hayvana tıklayarak topla. Yavrular iki
                      günde büyür. Gündüz merada dolaşır, gece yuvalarına
                      dönerler. İlgilendiğin hayvan kısa süre seni takip eder.
                    </p>
                  </div>
                </div>
                <div className="ranch-builds">
                  {['coop', 'barn'].map((id) => (
                    <button
                      key={id}
                      className="secondary-button"
                      onClick={() => onBuild(id)}
                    >
                      <GameIcon id={id} /> {BUILDINGS[id].name} kur
                    </button>
                  ))}
                </div>
                {s.animals.length > 0 && (
                  <h3 className="subheading">Hayvanların</h3>
                )}
                {s.animals.map((a) => (
                  <article className="ranch-animal" key={a.id}>
                    <div className="catalog-top">
                      <span className="item-art">
                        <GameIcon id={a.type} />
                      </span>
                      <div>
                        <Input
                          aria-label="Hayvanın adı"
                          className="animal-name"
                          placeholder={ANIMALS[a.type].name}
                          defaultValue={a.name || ''}
                          maxLength={24}
                          onBlur={(event) =>
                            engine.renameAnimal(a.id, event.target.value)
                          }
                        />
                        <small>
                          {(a.ready || 0) > 0
                            ? `${a.ready} ürün toplanmayı bekliyor`
                            : s.day - (a.bornDay ?? -3) < 2
                              ? 'Yavru · büyüyor'
                              : a.fed
                                ? 'Tok · ürün hazırlanıyor'
                                : 'Yem bekliyor'}{' '}
                          · Yakınlık {a.bond || 0}/100
                          {' · '}
                          {
                            (
                              {
                                walking: 'Dolaşıyor',running:'Koşuyor',happy:'Mutlu',lying:'Uzanıyor',fleeing:'Tehlikeden kaçıyor',
                                grazing: 'Otluyor',
                                sleeping: 'Uyuyor',
                                following: 'Seni takip ediyor',
                              } as const
                            )[engine.animalMotion.get(a.id)?.mood ?? 'grazing']
                          }
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
                        Ürünü topla · {a.ready || 0}
                      </button>
                      <button
                        className="secondary-button"
                        disabled={a.fedDay === s.day || !s.inventory.feed}
                        onClick={() => engine.feedAnimal(a.id)}
                      >
                        {a.fedDay === s.day
                          ? 'Bugün beslendi'
                          : 'Besle · 1 yem'}
                      </button>
                      <button
                        className="secondary-button"
                        disabled={a.pettedDay === s.day}
                        onClick={() => engine.petAnimal(a.id)}
                      >
                        <Heart size={15} />{' '}
                        {a.pettedDay === s.day
                          ? 'Bugün ilgilenildi'
                          : 'İlgilen'}
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() => engine.breedAnimal(a.id)}
                      >
                        Yavru yetiştir · 6 yem
                      </button>
                    </div>
                  </article>
                ))}
                <h3 className="subheading">Çiftliğe kat</h3>
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
                          <h3>{a.name}</h3>
                          <small>
                            {BUILDINGS[a.home].name} · {ITEMS[a.product].name}
                          </small>
                        </div>
                      </div>
                      <p>
                        {home
                          ? `Her ${a.time} saniyede ürün verir. 60 yakınlıkta verim ikiye katlanır.`
                          : `Önce ${BUILDINGS[a.home].name.toLocaleLowerCase('tr')} kur veya kapasitesini yükselt.`}
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
                          Sahiplen
                        </button>
                      </div>
                    </article>
                  );
                })}
                <button
                  className="secondary-button full-width"
                  onClick={() => setPanel('craft')}
                >
                  <GameIcon id="feed" /> Yem üretimine git
                </button>
              </div>
            )}
            {panel === 'build' && (
              <>
                {inventoryUsed(s) >= inventoryCapacity(s) && (
                  <p className="inventory-warning" role="alert">
                    ÇANTA DOLU · Ürün sat, kullan veya emanet sandıklarına
                    bağışla.
                  </p>
                )}
                {Object.values(s.overflow).some((n) => n > 0) && (
                  <article className="quest-card">
                    <h3>Teslimat sandığı</h3>
                    <p>Çantana sığmayan ödüller burada korunur.</p>
                    <Cost bag={s.overflow} inventory={s.overflow} />
                    <button
                      className="primary-button"
                      disabled={inventoryUsed(s) >= inventoryCapacity(s)}
                      onClick={() => engine.collectDelivery()}
                    >
                      Boş yerlere al
                    </button>
                  </article>
                )}
                <Tabs defaultValue="Tümü">
                  <TabsList className="game-tabs">
                    {['Tümü', 'Bahçe', 'Köy', 'Üretim', 'Savunma'].map((c) => (
                      <TabsTrigger key={c} value={c}>
                        {c}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {['Tümü', 'Bahçe', 'Köy', 'Üretim', 'Savunma'].map((c) => (
                    <TabsContent value={c} key={c}>
                      <div className="catalog">
                        {Object.entries(BUILDINGS)
                          .filter(
                            ([id, x]) =>
                              (c === 'Tümü' || x.category === c) &&
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
                                    <h3>{x.name}</h3>
                                    <span className="catalog-tag">
                                      {x.category} · Sv. {x.level}
                                    </span>
                                  </div>
                                  {!unlocked && <Lock size={15} />}
                                </div>
                                <p>{x.desc}</p>
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
                                    {exists
                                      ? 'İnşa edildi'
                                      : unlocked
                                        ? 'Yerleştir'
                                        : `Sv. ${x.level}`}
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
                  Yerleştirdikten sonra aynı yapıyı tekrar kurabilirsin. Esc
                  veya Keşfet ile inşa modundan çık.
                </p>
              </>
            )}
            {panel === 'craft' && (
              <>
                <ProductionWorkshop engine={engine}/>
                <div className="queue">
                  <div className="section-label">
                    <h3>Üretim kuyruğu</h3>
                    <span>{s.jobs.length} / 3</span>
                  </div>
                  {s.jobs.length ? (
                    s.jobs.map((j, i) => (
                      <div className="queue-job" key={`${i}-${j.recipe}`}>
                        <span>
                          <GameIcon id={j.recipe} />
                        </span>
                        <div>
                          <b>{RECIPES[j.recipe].name}</b>
                          <Progress value={(1 - j.remaining / j.total) * 100} />
                        </div>
                        <small>{Math.ceil(j.remaining)} sn</small>
                      </div>
                    ))
                  ) : (
                    <p>Bir tarif seçerek üretime başla.</p>
                  )}
                </div>
                <Tabs defaultValue="Malzeme">
                  <TabsList className="game-tabs">
                    {['Malzeme', 'Yemek', 'Ekipman'].map((c) => (
                      <TabsTrigger value={c} key={c}>
                        {c}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {['Malzeme', 'Yemek', 'Ekipman'].map((c) => (
                    <TabsContent value={c} key={c}>
                      <div className="catalog">
                        {Object.entries(RECIPES)
                          .filter(([, r]) =>
                            c === 'Ekipman'
                              ? !!r.upgrade
                              : c === 'Yemek'
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
                                    <h3>{r.name}</h3>
                                    <span className="catalog-tag">
                                      {r.upgrade
                                        ? `Sv. ${tier} → ${Math.min(3, tier + 1)}`
                                        : Object.entries(r.output)
                                            .map(
                                              ([k, n]) =>
                                                `${n} ${ITEMS[k].name}`,
                                            )
                                            .join(', ')}{' '}
                                      · <Zap size={11} /> 4
                                    </span>
                                  </div>
                                </div>
                                {r.station && (
                                  <p className={station ? '' : 'missing'}>
                                    <GameIcon id={r.station} />{' '}
                                    {BUILDINGS[r.station].name}{' '}
                                    {station ? 'hazır' : 'gerekli'}
                                  </p>
                                )}
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
                                    {locked
                                      ? `Sv. ${r.level}`
                                      : r.upgrade && tier >= 3
                                        ? 'En üst seviye'
                                        : 'Üret'}
                                  </button>
                                </div>
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
                <div className="inventory-summary">
                  <BackpackIcon />
                  <div>
                    <b>
                      {Object.values(s.inventory).reduce((a, b) => a + b, 0)}{' '}
                      eşya
                    </b>
                    <p>
                      {inventoryUsed(s)} / {inventoryCapacity(s)} kapasite
                    </p>
                  </div>
                </div>
                {inventoryUsed(s) >= inventoryCapacity(s) && (
                  <p className="inventory-warning" role="alert">
                    ÇANTA DOLU · Ürün sat, kullan veya emanet sandıklarına
                    bağışla.
                  </p>
                )}
                {Object.values(s.overflow).some((n) => n > 0) && (
                  <article className="quest-card">
                    <h3>Teslimat sandığı</h3>
                    <p>Çantana sığmayan ödüller burada korunur.</p>
                    <Cost bag={s.overflow} inventory={s.overflow} />
                    <button
                      className="primary-button"
                      disabled={inventoryUsed(s) >= inventoryCapacity(s)}
                      onClick={() => engine.collectDelivery()}
                    >
                      Boş yerlere al
                    </button>
                  </article>
                )}
                <Tabs defaultValue="Tümü">
                  <TabsList className="game-tabs">
                    {['Tümü', 'Yiyecek', 'Tohum', 'Kaynak'].map((c) => (
                      <TabsTrigger value={c} key={c}>
                        {c}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {['Tümü', 'Yiyecek', 'Tohum', 'Kaynak'].map((c) => (
                    <TabsContent value={c} key={c}>
                      <div className="inventory-grid">
                        {Object.entries(s.inventory)
                          .filter(
                            ([id, n]) =>
                              n > 0 &&
                              (c === 'Tümü' || ITEMS[id]?.category === c),
                          )
                          .map(([id, n]) => {
                            const item = ITEMS[id],
                              crop = Object.keys(CROPS).find(
                                (k) => CROPS[k].seed === id,
                              );
                            return (
                              <article key={id} className="inventory-item">
                                <span className="item-count">{n}</span>
                                <span className="inventory-art">
                                  <GameIcon id={id} />
                                </span>
                                <h3>{item.name}</h3>
                                <p>
                                  {item.food
                                    ? `Doygunluk +${item.food}`
                                    : item.heal
                                      ? `Sağlık +${item.heal}`
                                      : `${item.price} altın / adet`}
                                </p>
                                {item.food || item.energy || item.heal ? (
                                  <button onClick={() => engine.eat(id)}>
                                    Kullan{' '}
                                    {item.energy ? `· ⚡ ${item.energy}` : ''}
                                  </button>
                                ) : crop ? (
                                  <button onClick={() => onSeed(crop)}>
                                    Ekime geç
                                  </button>
                                ) : item.category === 'Fidan' ? (
                                  <button onClick={()=>onBuild(id==='applesapling'?'appletree':'peartree')}>Fidanı dik</button>
                                ) : id === 'sprinkler' ? (
                                  <button onClick={() => onBuild('sprinkler')}>
                                    Fıskiyeyi yerleştir
                                  </button>
                                ) : id === 'fertilizer' ? (
                                  <button onClick={() => onSeed('fertilizer')}>
                                    Gübrele
                                  </button>
                                ) : (
                                  <span className="item-kind">
                                    {item.category}
                                  </span>
                                )}
                              </article>
                            );
                          })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </>
            )}
            {panel === 'quests' && (
              <>
                <SettlementPanel engine={engine} />
                <Tabs defaultValue="Görevler">
                  <TabsList className="game-tabs">
                    <TabsTrigger value="Görevler">Görevler</TabsTrigger>
                    <TabsTrigger value="Yetenekler">Yetenekler</TabsTrigger>
                    <TabsTrigger value="Başarımlar">Başarımlar</TabsTrigger>
                    <TabsTrigger value="Ustalıklar">Ustalıklar</TabsTrigger>
                    <TabsTrigger value="Köy">Köy</TabsTrigger>
                  </TabsList>
                  <TabsContent value="Görevler">
                    <div className="journal-intro">
                      <span>✦</span>
                      <div>
                        <h3>Vadinin ışığını geri getir.</h3>
                        <p>
                          Seviye 10’a ulaş. Kadim feneri kur ve üç kez ışıkla
                          doldur. Karanlık sona erse de köyün yaşamaya devam
                          eder.
                        </p>
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
                              {done ? (
                                <Check size={16} />
                              ) : (
                                String(index + 1).padStart(2, '0')
                              )}
                            </span>
                            <h3>{q.name}</h3>
                            <span>
                              {value}/{q.target}
                            </span>
                          </div>
                          <p>{q.desc}</p>
                          <Progress value={(value / q.target) * 100} />
                          <div className="quest-rewards">
                            <span>◈ {q.reward.gold}</span>
                            <span>✦ {q.reward.xp} DP</span>
                            <button
                              className="primary-button"
                              disabled={done || value < q.target}
                              onClick={() => engine.claim(q.id)}
                            >
                              {done ? 'Tamamlandı' : 'Ödülü al'}
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
                        <b>{engine.talentPoints()} yetenek puanı</b>
                        <p>
                          Her seviye, kalıcı bir seçim. Her yetenek en fazla 5.
                        </p>
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
                              <h3>{t.name}</h3>
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
                          <p>{t.desc}</p>
                          <button
                            className="primary-button"
                            disabled={
                              engine.talentPoints() < 1 ||
                              rank >= 5 ||
                              s.gold < (rank + 1) * 40
                            }
                            onClick={() => engine.unlockTalent(id)}
                          >
                            {rank >= 5
                              ? 'Ustalaştın'
                              : `Geliştir · 1 puan + ◈ ${(rank + 1) * 40}`}
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
                              {a.name}
                            </h3>
                            <span>
                              {Math.min(value, a.target)}/{a.target}
                            </span>
                          </div>
                          <p>{a.description}</p>
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
                              {done ? 'Kazanıldı' : 'Ödülü al'}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                    <h3 className="subheading">Keşif defteri</h3>
                    {LANDMARKS.map((l) => (
                      <article className="quest-card" key={l.id}>
                        <div className="section-label">
                          <h3>
                            {s.discoveries.includes(l.id) ? '✦' : '◇'} {l.name}
                          </h3>
                          <span>
                            {l.x}, {l.z}
                          </span>
                        </div>
                        <p>
                          {s.discoveries.includes(l.id)
                            ? l.description
                            : 'Bu bölgeyi ziyaret ederek saklı erzakları bul.'}
                        </p>
                        <button
                          className="secondary-button"
                          onClick={() => onApproach(l.x, l.z)}
                        >
                          Bölgeye yürü
                        </button>
                      </article>
                    ))}
                  </TabsContent>
                  <TabsContent value="Ustalıklar">
                    {Object.entries({
                      farming: [
                        'seed',
                        'Çiftçilik',
                        'Her ustalık seviyesi ekin büyümesini %2 hızlandırır.',
                      ],
                      gathering: [
                        'axe',
                        'Toplayıcılık',
                        'Ağaç ve maden işleyerek deneyim kazan.',
                      ],
                      crafting: [
                        'workshop',
                        'Zanaatkârlık',
                        'Üret, inşa et ve ticaret yap.',
                      ],
                      combat: [
                        'sword',
                        'Muhafızlık',
                        'Her ustalık seviyesi kılıç hasarını 2 artırır.',
                      ],
                      fishing: [
                        'fish',
                        'Balıkçılık',
                        'Her ustalık seviyesi yakalama şansını %2 artırır.',
                      ],
                    }).map(([key, [icon, name, desc]]) => (
                      <article className="skill-card" key={key}>
                        <GameIcon id={String(icon)} />
                        <div>
                          <div className="section-label">
                            <h3>{name}</h3>
                            <b>Sv. {skillLevel(s, key)}</b>
                          </div>
                          <p>{desc}</p>
                          <small>
                            {Math.floor(s.skills[key] || 0)} deneyim · En yüksek
                            seviye 10
                          </small>
                        </div>
                      </article>
                    ))}
                  </TabsContent>
                  <TabsContent value="Köy">
                    <div className="village-stats">
                      {[
                        ['home', 'Yapı', s.buildings.length],
                        ['chicken', 'Hayvan', s.animals.length],
                        ['seed', 'Ekin', s.tiles.filter((t) => t.crop).length],
                        ['sword', 'Yenilen akıncı', s.stats.kills || 0],
                        ['day', 'Gün', s.day],
                        ['gold', 'Ticaret geliri', s.stats.sell || 0],
                      ].map(([icon, label, n]) => (
                        <div key={label}>
                          <GameIcon id={String(icon)} />
                          <b>{n}</b>
                          <small>{label}</small>
                        </div>
                      ))}
                    </div>
                    <h3 className="subheading">Köy sakinleri</h3>
                    {s.animals.length ? (
                      s.animals.map((a) => (
                        <div className="animal-row" key={a.id}>
                          <span>
                            <GameIcon id={a.type} />
                          </span>
                          <div>
                            <b>{ANIMALS[a.type].name}</b>
                            <small>
                              {a.ready
                                ? `${a.ready} ürün toplanmayı bekliyor`
                                : a.producedDay === s.day
                                  ? 'Yeni ürün yarın'
                                  : a.fed
                                    ? `${Math.ceil(ANIMALS[a.type].time - a.timer)} sn sonra ${ITEMS[ANIMALS[a.type].product].name}`
                                    : 'Yem bekliyor'}
                            </small>
                          </div>
                          <Progress
                            value={(a.timer / ANIMALS[a.type].time) * 100}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="panel-note">
                        Bir kümes kurup pazardan tavuk satın alarak
                        başlayabilirsin.
                      </p>
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
                      “Toprak emek ister, güzel bir hasat da iyi bir fiyat.”
                    </p>
                  </div>
                  <b>◈ {s.gold}</b>
                </div>
                <button className="secondary-button" onClick={()=>setPanel('villagers')}>Satmadan önce günlük siparişlere bak</button>
                <Tabs defaultValue="Satın al">
                  <TabsList className="game-tabs">
                    {['Satın al', 'Sat', 'Hayvanlar'].map((c) => (
                      <TabsTrigger value={c} key={c}>
                        {c}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="quantity-selector">
                    <span>İşlem adedi</span>
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
                  {['Satın al', 'Sat'].map((tab) => (
                    <TabsContent value={tab} key={tab}>
                      <div className="market-list">
                        {Object.entries(ITEMS)
                          .filter(([id]) =>
                            tab === 'Sat'
                              ? (s.inventory[id] || 0) > 0
                              : marketSells(id),
                          )
                          .map(([id, item]) => {
                            const buy = tab === 'Satın al',
                              price = tradeUnitPrice(s, id, buy) * quantity;
                            return (
                              <div className="market-row" key={id}>
                                <span>
                                  <GameIcon id={id} />
                                </span>
                                <div>
                                  <b>{item.name}</b>
                                  <small>
                                    Çantanda: {s.inventory[id] || 0}
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
                                  {buy ? 'Al' : 'Sat'} · ◈ {price}
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
                            <h3>{a.name}</h3>
                            <span className="catalog-tag">
                              {BUILDINGS[a.home].name} · 1 yem / ürün
                            </span>
                          </div>
                        </div>
                        <p>
                          Her {a.time} saniyede{' '}
                          {ITEMS[a.product].name.toLocaleLowerCase('tr')}{' '}
                          üretir. Barınak başına her seviyede 3 hayvan.
                        </p>
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
                            Sahiplen
                          </button>
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
                  <h2>{d.name}</h2>
                  <p>
                    Seviye {b.level} / 3 · {b.x}, {b.z}
                  </p>
                </div>
                <p className="detail-description">{d.desc}</p>
                {d.orchard&&<div className="orchard-overview"><GameIcon id={b.type}/><h3>{orchardStatus(b,s)!.label}</h3><p>Hasat başına {2+b.level} meyve. Mevsimleri: {d.orchard.seasons.map(i=>SEASONS[i]).join(', ')}.</p><button className="primary-button" onClick={()=>onApproach(b.x,b.z)}>{orchardStatus(b,s)!.ready?'Ağaca git ve meyveleri topla':'Ağacın yanına git'}</button></div>}
                <div className="section-label">
                  <h3>Yapı sağlığı</h3>
                  <span>
                    {Math.ceil(b.hp)} / {d.hp * b.level}
                  </span>
                </div>
                <Progress value={(b.hp / (d.hp * b.level)) * 100} />
                {d.production && <MachineCard engine={engine} building={b}/>}
                {b.type==='chest' && <StoragePanel engine={engine}/>}
                <div className="building-buttons">
                  <button className="secondary-button" onClick={() => engine.rotateBuilding(b.id)}>90° döndür · {(b.rotation || 0)*90}°</button>
                  {['fence','wall'].includes(b.type) && <button className="secondary-button" onClick={()=>engine.reshapeBuilding(b.id)}>{b.corner ? 'Düz parçaya dönüştür' : 'L köşe yap'}</button>}
                  {b.type === 'home' && (
                    <button
                      className="primary-button"
                      onClick={() => {
                        if (engine.sleep()) setPanel(null);
                      }}
                    >
                      🌙 Uyu · Yeni güne geç
                    </button>
                  )}
                  {b.type === 'market' && (
                    <button
                      className="primary-button"
                      onClick={() => setPanel('market')}
                    >
                      Pazarı aç
                    </button>
                  )}
                  <button
                    className="secondary-button"
                    onClick={() => onApproach(b.x, b.z)}
                  >
                    Yapının yanına yürü
                  </button>
                  <button
                    className="secondary-button"
                    disabled={
                      b.hp >= d.hp * b.level ||
                      !canAfford(s, { wood: 3, stone: 2 })
                    }
                    onClick={() => engine.repair(b.id)}
                  >
                    Onar · 3 odun + 2 taş
                  </button>
                  {b.level < 3 && (
                    <div className="upgrade-box">
                      <h3>Seviye {b.level + 1}</h3>
                      <p>
                        {d.production
                          ? 'Üretim hızı artar.'
                          : 'Dayanıklılık ve yapı kapasitesi artar.'}
                      </p>
                      <Cost bag={upgradeCost(b)} inventory={s.inventory} />
                      <button
                        className="primary-button"
                        disabled={
                          !canAfford(s, upgradeCost(b)) || s.level < b.level * 2
                        }
                        onClick={() => engine.upgrade(b.id)}
                      >
                        Yükselt{' '}
                        {s.level < b.level * 2
                          ? `· Sv. ${b.level * 2} gerekli`
                          : ''}
                      </button>
                    </div>
                  )}
                  {!['home', 'market'].includes(b.type) && (
                    <button
                      className="danger-button"
                      onClick={() => setConfirm('demolish')}
                    >
                      <Trash2 size={15} /> Yapıyı sök · %50 malzeme iadesi
                    </button>
                  )}
                </div>
              </>
            )}
            {panel === 'villagers' && (
              <Tabs defaultValue={selectedNPC}>
                <TabsList className="game-tabs">
                  {NPCS.map((n) => (
                    <TabsTrigger key={n.id} value={n.id}>
                      {n.name}
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
                          <h2>{n.name}</h2>
                          <p>{n.role}</p>
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
                        {n.id === 'narin'
                          ? `Dostluk avantajı: pazarda %${Math.floor(friendship * 0.1)} indirim.`
                          : n.id === 'torin'
                            ? `Dostluk avantajı: el üretimleri %${Math.floor(friendship * 0.1)} daha kısa sürer.`
                            : `Dostluk avantajı: balık yakalama şansı +%${Math.floor(friendship * 0.05)}.`}
                      </p>
                      <p className="npc-routine">{schedule(NPCS.indexOf(n),s.time,n).label} · {timedGreeting(s.time)}</p><div className="dialogue-box">
                        <p>
                          {
                            n.dialogue[stage][
                              (s.day - 1) % n.dialogue[stage].length
                            ]
                          }
                        </p>
                        <button
                          className="secondary-button"
                          disabled={s.talks[n.id] === s.day}
                          onClick={() => engine.talk(n.id)}
                        >
                          {s.talks[n.id] === s.day
                            ? 'Bugün sohbet edildi'
                            : 'Sohbet et · Dostluk +2'}
                        </button>
                      </div>
                      <DailyOrders engine={engine} npc={n.id}/>
                      <div className="gift-box">
                        <div>
                          <h3>Sevdiği hediye</h3>
                          <p>
                            <GameIcon id={n.gift} /> {ITEMS[n.gift].name} · ♥
                            +12
                          </p>
                        </div>
                        <button
                          className="secondary-button"
                          disabled={gifted || !s.inventory[n.gift]}
                          onClick={() => engine.gift(n.id)}
                        >
                          {gifted ? 'Bugün verildi' : 'Hediye ver'}
                        </button>
                      </div>
                      <button
                        className="secondary-button full-width"
                        onClick={() => onApproach(engine.npcMotion.get(n.id)?.x??n.x, engine.npcMotion.get(n.id)?.z??n.z)}
                      >
                        {n.name} yanına yürü
                      </button>
                      {n.id === 'narin' && (
                        <button
                          className="primary-button full-width"
                          onClick={() => setPanel('market')}
                        >
                          Pazar tezgâhına bak
                        </button>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
            {panel === 'settings' && (
              <>
                {engine.network?.server&&<button className="primary-button" onClick={()=>setPanel('online')}>Arkadaşlarla oyna</button>}
                <div className="settings-section">
                  <SettlementName engine={engine} />
                  <h3>Oyun kaydı</h3>
                  <p>
                    {engine.network?.server?'Dünya sunucuda saklanır. Bu tarayıcının çerezini silersen erişimini kaybedersin; oturum her bağlantıda 30 gün uzar. Dosya indirerek çevrimdışı bir kopyasını koruyabilirsin. Sunucuya kayıt dosyası yüklenemez.':'Dünya bu tarayıcının veritabanına kaydedilir. Başka cihaza taşımak için kayıt dosyası indir. Oyun kapalıyken zaman ilerlemez.'}
                  </p>
                  <div className="save-status">
                    <Save size={15} />
                    {saveStatus ||
                      (engine.network?.server?'Sunucu bağlantısında otomatik kayıt açık':'Otomatik kayıt açık · Yaklaşık 15 saniyede bir')}
                  </div>
                  <div className="save-actions"><button className="primary-button" onClick={onSave}>
                    <Save size={16} /> Şimdi kaydet
                  </button>
                  <button className="secondary-button" onClick={onExport}>
                    <Download size={16} /> Kayıt dosyası indir
                  </button>
                  <button
                    className="secondary-button"
                    disabled={engine.network?.server}
                    onClick={() => file.current?.click()}
                  >
                    <Upload size={16} /> Kayıt dosyası yükle
                  </button>
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
                  <h3>Görüntü kalitesi</h3>
                  <p>
                    Ayrıntılı mod, yumuşak güneş gölgeleri ve daha keskin
                    görüntü sağlar. Çözünürlük, cihazının hızına göre otomatik
                    dengelenir.
                  </p>
                  <label className="quality-setting">
                    <span>Ayrıntılı görüntü</span>
                    <Switch checked={quality} onCheckedChange={setQuality} />
                  </label>
                </div>
                <div className="settings-section">
                  <h3>Ses</h3>
                  <p>Vadinin müziği, kuşlar ve oyun sesleri.</p>
                  <AudioSettings audio={audio}/>
                  <button
                    className="secondary-button"
                    onClick={() => setSound(!sound)}
                  >
                    {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}{' '}
                    {sound ? 'Sesi kapat' : 'Sesi aç'}
                  </button>
                </div>
                <div className="settings-section">
                  <h3>Kontroller</h3>
                  <div className="key-guide">
                    {[
                      ['W A S D / Oklar', 'Yürü'],
                      ['Tab', 'Tek pencere menüsü'],
                      ['1 – 8', 'Araç seç'],
                      ['Sol tık', 'Yürü / aracı kullan'],
                      ['Ctrl', 'Yakındaki düşmana saldır'],
                      ['Shift', 'Koş (enerji tüketir)'],
                      ['E', 'Yakındaki kişi / ürün / yapı ile etkileşim'],
                      ['Menüde Q / E veya ← / →', 'Sekme değiştir'],
                      ['İnşada ← / →', 'Nesneyi 90° döndür'],
                      ['Fare tekerleği', 'Yakınlaştır / uzaklaştır'],
                      ['Sürükle', 'Haritayı taşı'],
                      ['Esc', 'Menüyü kapat / duraklat'],
                    ].map(([key, action]) => (
                      <div key={key}>
                        <kbd>{key}</kbd>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="settings-section">
                  <h3>Yeni vadi</h3>
                  <p>
                    Yeni bir dünya başlatmak mevcut kaydını değiştirir. Önce
                    kayıt dosyanı indirebilirsin.
                  </p>
                  <button
                    className="danger-button"
                    disabled={engine.network?.server}
                    onClick={() => setConfirm('reset')}
                  >
                    <RotateCcw size={16} /> Yeni oyuna başla
                  </button>
                </div>
                <div className="credits">
                  Roamcroft · 1.10.0
                  <br />
                  Özgün dünya, modeller ve müzik.
                  <br />
                  Three.js · React · TypeScript
                </div>
              </>
            )}
            {panel === 'guide' && (
              <div className="guide-content">
                {[
                  [
                    '01',
                    'İlk hasadın',
                    'Evin doğusundaki altın renkli buğdaylara tıkla. Keşfet aracıyla olgun ekinleri topla. Domates ve mısır kökte kalıp yeniden ürün verir; diğer ekinler hasatta bir tohum geri verir. Çapa, ekini söküp yer açar. Çiftlik → Ekim planı bölümünde süre ve mevsimleri görebilirsin.',
                  ],
                  [
                    '02',
                    'Toprak ve su',
                    'Çapayı seç, boş çayıra tıkla. Tohum aracını ve ekini seçerek dik. Sulama kabıyla su ver. Kuyu, 3 kare yakınını otomatik sular; yağmur tüm tarlalara ulaşır.',
                  ],
                  [
                    '03',
                    'Mevsimler',
                    'Bir gün 5 dakika, bir mevsim 7 gündür. Buğday her mevsim büyür. Havuç ilkbahar ve sonbaharda; domates ilkbahar ve yazda yetişir. Sera tüm mevsimleri açar. Uygun olmayan mevsimde ekin ölmez, büyümesi durur.',
                  ],
                  [
                    '04',
                    'Kendi köyün',
                    'Ağaç ve kayalara tıkla; uygun aracı otomatik kullanırsın. İnşa menüsünden yapı seçip boş bir kareye yerleştir. Yeni yapıların yanında yolları açık bırak. Seviye atladıkça yeni yapılar açılır.',
                  ],
                  [
                    '05',
                    'Üretim ve hayvanlar',
                    'El yapımı tarifler en fazla 3 işlik kuyruğa alınır. Üretim → Makinelerim bölümünden bir tarif ve tek parti ya da otomatik tekrar seç. Malzeme partinin başında makineye ayrılır. Dolu çantada bitmiş ürün makinede bekler. Yapıya tıklayıp üretimi duraklatabilirsin. Çiftlik menüsünden kümes ve ahır kur; tavuk, inek ve koyun sahiplen. İki yetişkin ve 6 yemle yavru yetiştirebilirsin. Hayvanlar günde bir yem tüketir, günde bir kez ürün hazırlar. Hazır ürünü hayvana tıklayarak veya Çiftlik menüsünden topla. İlgilendiğin hayvanların yakınlığı ve verimi artar.',
                  ],
                  [
                    '06',
                    'Hayatta kal',
                    'Sağlık, enerji ve doygunluğunu izle. Çantadan yiyecek tüket. Dinlen düğmesiyle otur; kamp ateşi yanında daha hızlı toparlanırsın. Akşam evin yakınına gelerek uyuyabilirsin. Yenilirsen köylüler seni eve taşır; altınının %10’unu kaybedersin.',
                  ],
                  [
                    '07',
                    'Geceyi savun',
                    'Üçüncü geceden başlayarak her 3 günde akıncılar gelir. Boşluk veya kılıçla saldır. Sur yolları kapatır; gözcü kuleleri otomatik ateş eder. Demir eriterek kılıç ve zırhını geliştir.',
                  ],
                  [
                    '08',
                    'Kadim fener',
                    'Kuzeydeki madenlikte demir, bakır ve ay kristalleri ara. Görev ödüllerini günlükten al. Seviye 10’da kadim feneri inşa et, 3. seviyeye yükselt ve vadiyi karanlıktan kurtar.',
                  ],
                  [
                    '09',
                    'Kadim maden',
                    '3. seviyede kuzeybatıdaki kadim harabeye ulaş ve el aracıyla girişe tıkla. Her oyun günü bir keşif yapabilirsin. Beş katın her birinde düşmanları yenip en az dört birim cevher kaz; kuzey geçidi sonraki kata götürür. Güney asansörü ganimetlerinle vadiye döndürür. Yeraltında vadi saati, tarlalar ve hayvanlar bekler; açlığın ve üretim kuyruğun ilerler.',
                  ],
                  [
                    '10',
                    'Derinlik Muhafızı',
                    'Pelteler yakın dövüşür, kül büyücüleri uzaktan alan saldırısı yapar, taş muhafızlar ağır darbeler indirir. Kırmızı halkalar darbenin düşeceği yeri gösterir; yürüyerek dışına çık. Beşinci kattaki muhafız yarı canında hızlanır. Son geçitten hazineyi alarak keşfi tamamla. Yenilgi seni köye taşır; altınının %10’unu kaybedersin.',
                  ],
                  [
                    '11',
                    'Ucu açık dünya',
                    'İstediğin yöne yürüdükçe çam ormanları, bakır sırtları, çiçek ovaları ve kristal bozkırları açılır. Kestiğin ağaçlar ve yapılar geride kaldığında saklanır. Uzak tarlalar ve hayvanlar sen dönene kadar bekler. Haritanın altındaki Eve dön düğmesi seni başlangıç köyüne taşır; çatışma sırasında kullanılamaz.',
                  ],
                ].map(([n, title, text]) => (
                  <section key={n}>
                    <span>{n}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </section>
                ))}
                <div className="season-card">
                  <b>Şu an: {SEASONS[season(s)]}</b>
                  <p>
                    {Object.values(CROPS)
                      .filter((c) => c.seasons.includes(season(s)))
                      .map((c) => c.name)
                      .join(' · ')}
                  </p>
                </div>
              </div>
            )}
          </div>
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
              {confirm === 'reset'
                ? 'Yeni bir vadiye geçilsin mi?'
                : 'Yapı sökülsün mü?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'reset'
                ? 'Bu tarayıcıdaki mevcut oyun kaydı değişecek. İndirdiğin kayıt dosyalarını daha sonra yükleyebilirsin.'
                : 'Yapı kaldırılır ve ilk inşa malzemelerinin yarısı çantana döner. Bu yapıdaki hayvanlar yeni barınak bekler.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
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
              {confirm === 'reset' ? 'Yeni oyun' : 'Yapıyı sök'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function BackpackIcon() {
  return (
    <span className="bag-art">
      <GameIcon id="bag" />
    </span>
  );
}
