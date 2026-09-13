'use client';
import GameIcon from './GameIcon';
import './menu.css';
import MainMenu from './MainMenu';
import { CoopClient } from '@/lib/coop/client';
import { nextMilestone, settlementRank } from '@/lib/game/settlement';
import { inventoryUsed, inventoryCapacity } from '@/lib/game/progression';
import { useEffect, useRef, useState } from 'react';
import {
  Flame,
  Sun,
  CloudRain,
  Heart,
  Zap,
  Wheat,
  Compass,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Pause,
  Play,
  House,
  Hammer,
  Backpack,
  BookOpen,
  Settings,
  Target,
  ShoppingBasket,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Swords,
  Moon,
  X,
  Check,
  Bird,
  Users,
} from 'lucide-react';
import {
  Engine,
  season,
  tileAt,
  buildingAt,
  xpNext,
  createState,
} from '@/lib/game/model';
import type { State, Event } from '@/lib/game/model';
import {
  ITEMS,
  TOOLS,
  SEASONS,
  BUILDINGS,
  CROPS,
  QUESTS,
  RECIPES,
} from '@/lib/game/data';
import { loadLocal, saveLocal, serialize, deserialize } from '@/lib/game/save';
import { loadStored, saveStored } from '@/lib/game/storage';
import { ValleyAudio } from '@/lib/game/audio';
import type { ValleyScene } from '@/lib/game/scene';
import Panels from './Panels';
import type { Panel } from './Panels';
import { Progress } from '@/components/ui/progress';
import { NPCS } from '@/lib/game/content';
import { worldOrigin, worldSize, biomeAt } from '@/lib/game/world';
import {
  FLOOR_NAMES,
  MINE_ENTRANCE,
  MINE_LIFT,
  MINE_STAIRS,
} from '@/lib/game/expedition';
import { registerGameTools } from '@/lib/game/webmcp';

export default function Game() {
  const host = useRef<HTMLDivElement>(null),
    mini = useRef<HTMLCanvasElement>(null),
    engine = useRef<Engine | null>(null),
    scene = useRef<ValleyScene | null>(null),
    audio = useRef<ValleyAudio | null>(null),
    keys = useRef(new Set<string>()),
    nextState = useRef<State | null>(null),
    allowSave = useRef(true),
    coop = useRef<CoopClient | null>(null);
  const renderSettings = useRef({ high: true });
  const [storageReady, setStorageReady] = useState(false);
  const initialMessage = useRef('');
  useEffect(() => {
    let canceled = false;
    void loadStored().then((loaded) => {
      if (canceled) return;
      nextState.current = loaded.state;
      initialMessage.current = loaded.message;
      setStorageReady(true);
    });
    return () => {
      canceled = true;
    };
  }, []);
  const [, refresh] = useState(0),
    [epoch, setEpoch] = useState(0),
    [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [tool, setTool] = useState('hand'),
    [seed, setSeed] = useState('wheat'),
    [build, setBuild] = useState('workshop'),
    [rotation, setRotation] = useState(0),
    [corner, setCorner] = useState(false),
    [paused, setPaused] = useState(false),
    [mainMenu,setMainMenu] = useState(true),
    [panel, setPanel] = useState<Panel>(null),
    [selectedBuilding, setSelectedBuilding] = useState<number | null>(null),
    [selectedNPC, setSelectedNPC] = useState('narin'),
    [sound, setSoundState] = useState(false),
    [quality, setQuality] = useState(true),
    [compactHud, setCompactHud] = useState(false),
    [saveStatus, setSaveStatus] = useState(''),
    [hover, setHover] = useState<{ x: number; z: number } | null>(null),
    [messages, setMessages] = useState<
      (Event & { id: number; expires: number })[]
    >([]);
  useEffect(()=>{if(window.matchMedia('(pointer: coarse)').matches)setCompactHud(true);},[]);
  const control = useRef({
    tool: 'hand',
    selection: 'wheat',
    paused: false,
    panel: null as Panel,
    sound: false,
  });
  control.current = {
    tool,
    selection: tool === 'build' ? build : seed,
    paused: paused || mainMenu || (!!panel && !coop.current?.active),
    panel,
    sound,
  };
  if (engine.current) {engine.current.placementRotation = rotation; engine.current.placementCorner = corner;}
  if (scene.current) {scene.current.placementRotation = rotation; scene.current.placementCorner = corner;}
  const setSound = (value: boolean) => {
    void audio.current?.enable(value).then((enabled) => {
      setSoundState(enabled);
      if (value && !enabled)
        engine.current?.emit(
          'Ses başlatılamadı. Tarayıcı ses iznini kontrol et.',
          'bad',
        );
    });
  };
  const doSave = async () => {
    if(coop.current?.active) {
      try {await coop.current.publish();setSaveStatus('Ortak dünya sunucuya kaydedildi.');} catch(error){setSaveStatus(error instanceof Error ? error.message : 'Kayıt bekleniyor.');throw error;}
      return;
    }
    if (engine.current) {
      allowSave.current = true;
      const ok = await saveStored(engine.current.s);
      setSaveStatus(
        ok
          ? 'Kaydedildi · ' + new Date().toLocaleTimeString('tr-TR')
          : 'Kayıt yapılamadı. Dosya indirerek ilerlemeni koru.',
      );
      engine.current.emit(
        ok ? 'Vadin kaydedildi.' : 'Tarayıcı kaydı kullanılamıyor.',
        ok ? 'good' : 'bad',
      );
      if(!ok)throw Error('Kayıt yapılamadı. Ayarlar bölümünden dosya indir.');
    }
  };
  const doExport = () => {
    if (!engine.current) return;
    const blob = new Blob([serialize(engine.current.s)], {
        type: 'application/json',
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = `roamcroft-gun-${engine.current.s.day}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    engine.current.emit('Kayıt dosyası indirildi.', 'good');
  };
  const doImport = async (file: File) => {
    if(coop.current?.active){engine.current?.emit('Kayıt yüklemek için önce ortak odadan ayrıl.','bad');return;}
    try {
      if (file.size > 32_000_000) throw new Error('Kayıt dosyası çok büyük.');
      const state = deserialize(await file.text());
      nextState.current = state;
      allowSave.current = true;
      saveLocal(state);
      await saveStored(state);
      setPanel(null);
      setMainMenu(false);
      setPaused(false);
      setEpoch((n) => n + 1);
    } catch (e) {
      engine.current?.emit(
        e instanceof Error ? e.message : 'Kayıt yüklenemedi.',
        'bad',
      );
    }
  };
  const doReset = () => {
    if(coop.current?.active){engine.current?.emit('Yeni oyun için önce ortak odadan ayrıl.','bad');return;}
    setMainMenu(false);
    const seed = new Uint32Array(1);
    crypto.getRandomValues(seed);
    nextState.current = createState(seed[0]);
    allowSave.current = true;
    saveLocal(nextState.current);
    void saveStored(nextState.current);
    setTool('hand');
    setPanel(null);
    setPaused(false);
    setEpoch((n) => n + 1);
  };
  useEffect(()=>{
    const client=new CoopClient(()=>engine.current,state=>{
      nextState.current=state;setMainMenu(false);setPaused(false);setPanel(null);setEpoch(n=>n+1);
    },()=>refresh(n=>n+1));
    coop.current=client;
    return()=>{client.dispose();coop.current=null;};
  },[]);
  useEffect(() => {
    if (!storageReady) return;
    let disposed = false,
      frame = 0,
      last = 0,
      ui = 0,
      saveClock = 0,
      eventId = 0;
    const loaded = nextState.current
      ? {
          state: nextState.current,
          message: initialMessage.current || 'Vadin hazır.',
        }
      : loadLocal();
    nextState.current = null;
    initialMessage.current = '';
    const e = new Engine(loaded.state);
    engine.current = e;
    coop.current?.bind(e);
    e.emit(loaded.message);
    allowSave.current = !coop.current?.active && !loaded.message.startsWith('Kayıt okunamadı');
    setReady(false);
    setError('');
    keys.current.clear();
    const music = new ValleyAudio();
    audio.current = music;
    setSoundState(false);
    const unregister = registerGameTools(
      e,
      () => {
        refresh((n) => n + 1);
      },
      () => control.current.paused,
    );
    import('@/lib/game/scene')
      .then(({ ValleyScene }) => {
        if (disposed || !host.current) return;
        try {
          const view = new ValleyScene(
            host.current,
            e,
            (x, z) => {
              if (control.current.paused) return;
              if (control.current.tool === 'hand') {
                const animal = e.s.animals.find(
                  (a) => Math.hypot(a.x - x, a.z - z) < 0.8,
                );
                if (animal) {
                  if (animal.ready) e.harvestAnimal(animal.id);
                  else e.petAnimal(animal.id);
                  return;
                }
                if (
                  !e.s.mine &&
                  x === MINE_ENTRANCE.x &&
                  z === MINE_ENTRANCE.z
                ) {
                  setPanel('mine');
                  return;
                }
              }
              const npc = !e.s.mine && NPCS.find((n) => {const pos=e.npcMotion.get(n.id)||n;return Math.round(pos.x)===x&&Math.round(pos.z)===z;});
              if (npc && control.current.tool === 'hand') {
                setSelectedNPC(npc.id);
                setPanel('villagers');
                return;
              }
              const b = buildingAt(e.s, x, z);
              if (b && control.current.tool === 'hand') {
                setSelectedBuilding(b.id);
                setPanel('building');
                return;
              }
              if(e.s.enemies.some(enemy=>Math.hypot(enemy.x-x,enemy.z-z)<.8) && Math.hypot(e.s.player.x-x,e.s.player.z-z)<2.2){e.attack();return;}
              e.go(x, z, control.current.tool, control.current.selection);
            },
            (x, z) =>
              setHover((old) => (old?.x === x && old.z === z ? old : { x, z })),
          );
          scene.current = view;
          view.setQuality(renderSettings.current.high);
          setReady(true);
          const loop = (now: number) => {
            if (disposed) return;
            if (e.worldRevision > 0) {
              nextState.current = e.s;
              if (allowSave.current && !coop.current?.active) void saveStored(e.s);
              setPanel(null);
              setHover(null);
              setEpoch((n) => n + 1);
              return;
            }
            const frameDuration = (now - (last || now)) / 1000;
            const dt = Math.min(0.08, frameDuration);
            last = now;
            if (
              !control.current.paused &&
              !document.hidden &&
              !view.contextLost
            ) {
              let horizontal = 0,
                vertical = 0;
              if (keys.current.has('w') || keys.current.has('arrowup'))
                vertical -= 1;
              if (keys.current.has('s') || keys.current.has('arrowdown'))
                vertical += 1;
              if (keys.current.has('a') || keys.current.has('arrowleft'))
                horizontal -= 1;
              if (keys.current.has('d') || keys.current.has('arrowright'))
                horizontal += 1;
              e.sprinting=keys.current.has('shift');
              const angle = view.angle;
              if (horizontal || vertical)
                e.move(
                  horizontal * Math.cos(angle) + vertical * Math.sin(angle),
                  -horizontal * Math.sin(angle) + vertical * Math.cos(angle),
                  dt,
                );
              e.tick(dt);
              saveClock += dt;
              music.tick(dt, e.s.time > 0.77 || e.s.time < 0.24);
            }
            view.activeTool = control.current.tool;
            view.placement =
              control.current.tool === 'build'
                ? control.current.selection
                : null;
            if (
              !document.hidden &&
              (!control.current.paused || ui > 0.25 || view.confettiLife > 0)
            )
              view.render(control.current.paused ? 0 : dt, frameDuration);
            ui += dt;
            if (ui > 0.25) {
              music.ambience(
                e.s,
                {
                  x: view.target.x,
                  z: view.target.z,
                  angle: view.angle,
                  zoom: view.zoom,
                },
                control.current.paused || document.hidden,
              );
              if (renderSettings.current.high !== view.highQuality) {
                renderSettings.current.high = view.highQuality;
                setQuality(view.highQuality);
              }
              refresh((n) => n + 1);
              if (mini.current) view.drawMinimap(mini.current);
              const nowMs = Date.now();
              if (e.events.length) {
                const events = e.events.splice(0);
                setMessages((old) =>
                  [
                    ...old.filter((m) => m.expires > nowMs),
                    ...events.map((m) => ({
                      ...m,
                      id: ++eventId,
                      expires: nowMs + 4500,
                    })),
                  ].slice(-3),
                );
                events.forEach((m) => {
                  music.effect(m.kind);
                  if (m.celebration)
                    view.celebrate(m.x ?? e.s.player.x, m.z ?? e.s.player.z);
                  if (m.x !== undefined && !m.celebration)
                    view.burst(
                      m.x,
                      m.z!,
                      m.kind === 'bad' ? 0xdc8875 : 0xe1c57b,
                    );
                });
              } else
                setMessages((old) =>
                  old.some((m) => m.expires <= nowMs)
                    ? old.filter((m) => m.expires > nowMs)
                    : old,
                );
              ui = 0;
            }
            if (saveClock >= 15 && allowSave.current && !coop.current?.active) {
              const storeSave = async () => {
                if (disposed) return;
                const saved = await saveStored(e.s);
                setSaveStatus(
                  saved
                    ? 'Otomatik kaydedildi · ' +
                        new Date().toLocaleTimeString('tr-TR')
                    : 'Kayıt yapılamadı. Dosya indir.',
                );
              };
              if ('requestIdleCallback' in window)
                window.requestIdleCallback(storeSave, { timeout: 4000 });
              else setTimeout(storeSave, 50);
              saveClock = 0;
            }
            frame = requestAnimationFrame(loop);
          };
          frame = requestAnimationFrame(loop);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Görüntü başlatılamadı.',
          );
        }
      })
      .catch(() => setError('Oyun motoru yüklenemedi. Sayfayı yenile.'));
    const down = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      const key = ev.key.toLowerCase();
      if (ev.key === 'Escape') {
        if (control.current.panel) setPanel(null);
        else if (control.current.tool === 'build') setTool('hand');
        else setPaused((p) => !p);
        return;
      }
      if(key==='tab') {ev.preventDefault();setMainMenu(false);if(!ev.repeat)setPanel(p=>p?null:'inventory');return;}
      if(control.current.panel) {
        if(['q','e','arrowleft','arrowright'].includes(key) && !(key.startsWith('arrow')&&(ev.target as HTMLElement).getAttribute('role')==='tab')) {
          ev.preventDefault();const tabs:Panel[]=['inventory','craft','build','quests','ranch','villagers','bundles','mine','online','settings'];
          const current=Math.max(0,tabs.indexOf(control.current.panel));setPanel(tabs[(current+(['q','arrowleft'].includes(key)?tabs.length-1:1))%tabs.length]);
        }
        return;
      }
      if (control.current.paused) return;
      if(control.current.tool==='build' && ['arrowleft','arrowright','arrowup','arrowdown'].includes(key)) {
        ev.preventDefault();if(!ev.repeat)setRotation(r=>(r+(['arrowleft','arrowdown'].includes(key)?3:1))%4);return;
      }
      if(['arrowup','arrowdown','arrowleft','arrowright','control'].includes(key))ev.preventDefault();
      keys.current.add(key);if(ev.repeat)return;
      if(key==='control')e.attack();
      if(key==='e') {
        const p=e.s.player;
        const person=NPCS.find(n=>{const position=e.npcMotion?.get(n.id) || n;return Math.hypot(position.x-p.x,position.z-p.z)<2.2;});
        if(person){setSelectedNPC(person.id);setPanel('villagers');return;}
        const animal=e.s.animals.find(a=>Math.hypot(a.x-p.x,a.z-p.z)<1.8);
        if(animal){if(animal.ready)e.harvestAnimal(animal.id);else e.petAnimal(animal.id);return;}
        const building=e.s.buildings.find(b=>Math.hypot(b.x-p.x,b.z-p.z)<1.8);
        if(building){setSelectedBuilding(building.id);setPanel('building');return;}
        const target=e.s.tiles.filter(t=>(t.resource || t.crop) && Math.hypot(t.x-p.x,t.z-p.z)<1.8).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
        if(target)e.act(target.x,target.z,'hand');else setPanel('inventory');
      }

    };
    const up = (ev: KeyboardEvent) => keys.current.delete(ev.key.toLowerCase());
    const blur = () => keys.current.clear();
    const persist = () => {
      keys.current.clear();
      if (allowSave.current && !coop.current?.active) saveLocal(e.s);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', persist);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      scene.current?.dispose();
      scene.current = null;
      music.dispose();
      unregister();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', persist);
    };
  }, [epoch, storageReady]);
  useEffect(() => {
    if (panel || paused) keys.current.clear();
  }, [panel, paused]);
  const s = engine.current?.s,
    t = hover && s ? tileAt(s, hover.x, hover.z) : undefined,
    b = hover && s ? buildingAt(s, hover.x, hover.z) : undefined;
  const npc =
    hover && !s?.mine
      ? NPCS.find((n) => {const pos=engine.current?.npcMotion.get(n.id)||n;return Math.round(pos.x)===hover.x&&Math.round(pos.z)===hover.z;})
      : undefined;
  const portalLabel =
    hover && engine.current?.isPortal(hover.x, hover.z)
      ? !s?.mine
        ? 'Kadim maden · Seviye 3'
        : hover.z === MINE_LIFT.z
          ? 'Asansör · Vadiye dön'
          : 'Mühürlü geçit · Alt kat'
      : null;
  const label =
    portalLabel ||
    (npc
      ? npc.name
      : b
        ? BUILDINGS[b.type].name
        : t?.resource
          ? {
              tree: 'Orman ağacı',
              bush: 'Orman meyveleri',
              stone: 'Taş yatağı',
              iron: 'Demir yatağı',
              copper: 'Bakır yatağı',
              crystal: 'Ay kristali',
              mushroom: 'Mantar',
            }[t.resource]
          : t?.crop
            ? CROPS[t.crop].name
            : t?.tilled
              ? 'Ekim alanı'
              : t?.terrain === 'water'
                ? 'Söğüt Nehri'
                : s?.mine
                  ? 'Maden galerisi'
                  : 'Çayır');
  const quest = s ? QUESTS.find((q) => !s.claimed.includes(q.id)) : null;
  const chooseBuild = (type: string) => {
    setBuild(type);
    setTool('build');
    setPanel(null);
    engine.current?.emit(`${BUILDINGS[type].name}: boş bir kareye tıkla.`);
  };
  const chooseSeed = (type: string) => {
    if (type === 'fertilizer') setTool('fertilize');
    else {
      setSeed(type);
      setTool('seed');
    }
    setPanel(null);
  };
  const toolLabel =
    tool === 'build'
      ? BUILDINGS[build].name
      : tool === 'fertilize'
        ? 'Gübre'
        : TOOLS.find((t) => t.id === tool)?.name;
  return (
    <main className={`game-shell ${compactHud ? 'hud-collapsed' : ''} ${panel ? 'has-panel' : ''}`}>
      <div ref={host} className="world" />
      <div className="world-vignette" />
      {!ready && (
        <div className="loading-screen">
          <Flame size={40} />
          <h1>Roamcroft</h1>
          <p>{error || 'Vadin uyanıyor…'}</p>
          {error && (
            <>
              <p className="error-help">
                WebGL destekli güncel bir tarayıcı ve donanım hızlandırması
                gerekir.
              </p>
              <button
                className="primary-button"
                onClick={() => location.reload()}
              >
                Yeniden dene
              </button>
            </>
          )}
        </div>
      )}
      {s && (
        <>
          {mainMenu && !panel && <MainMenu onContinue={()=>{setMainMenu(false);setPaused(false);}} onNew={doReset} onLoad={doImport} onSettings={()=>setPanel('settings')} onCoop={()=>{setMainMenu(false);setPanel('online');}} onSave={doSave}/>}
          <header className="game-header">
            <div className="brand">
              <div className="brand-icon">
                <Flame />
              </div>
              <div>
                <h1>Roamcroft</h1>
                <span className="settlement-brand" title={s.settlement.name}>
                  {s.settlement.name} · {settlementRank(s)}
                </span>
              </div>
            </div>
            <div className="resource-bar">
              {['wood', 'stone', 'fiber'].map((id) => (
                <div className="resource" key={id}>
                  <span>
                    <GameIcon id={id} />
                  </span>
                  <b>{s.inventory[id] || 0}</b>
                  <small>{ITEMS[id].name}</small>
                </div>
              ))}
              <div className="resource gold">
                <span>◈</span>
                <b>{s.gold.toLocaleString('tr-TR')}</b>
                <small>Altın</small>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="icon-button"
                aria-label={sound ? 'Sesi kapat' : 'Sesi aç'}
                title={sound ? 'Sesi kapat' : 'Sesi aç'}
                onClick={() => setSound(!sound)}
              >
                {sound ? <Volume2 /> : <VolumeX />}
              </button>
              <button
                className="icon-button"
                aria-label={paused ? 'Devam et' : 'Duraklat'}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play /> : <Pause />}
              </button>
              <button
                className="icon-button"
                aria-label="Ana menü"
                onClick={() => setMainMenu(true)}
              >
                <Settings />
              </button>
            </div>
          </header>
          <div className="hud-left">
          <section className="status-card glass">
            <div className="portrait">
              <GameIcon id="home" />
            </div>
            <div className="status-main">
              <div className="player-name">
                Gezgin <span>SV. {s.level}</span>
              </div>
              <Progress
                value={(s.xp / xpNext(s.level)) * 100}
                aria-label="Seviye ilerlemesi"
              />
              <div className="vitals">
                <span title="Sağlık">
                  <Heart />
                  {Math.ceil(s.player.health)}
                </span>
                <span title="Enerji">
                  <Zap />
                  {Math.ceil(s.player.energy)}
                </span>
                <span title="Doygunluk">
                  <Wheat />
                  {Math.ceil(s.player.hunger)}
                </span>
              </div>
            </div>
          </section>
          <button
            className="hud-toggle glass"
            aria-expanded={!compactHud}
            aria-controls="left-quest left-actions"
            onClick={() => setCompactHud((v) => !v)}
          >
            {compactHud ? 'Menüleri aç' : 'Menüleri daralt'}
          </button>
          {inventoryUsed(s) >= inventoryCapacity(s) && (
            <div className="hud-warning" role="alert">
              <button
                className="inventory-warning"
                onClick={() => setPanel('inventory')}
              >
                ÇANTA DOLU · {inventoryUsed(s)}/{inventoryCapacity(s)}
              </button>
            </div>
          )}
          <aside id="left-quest" className="quest-peek glass">
            {s.mine ? (
              <>
                <span className="eyebrow">
                  KADİM MADEN · KAT {s.mine.floor} / 5
                </span>
                <h2>{FLOOR_NAMES[s.mine.floor - 1]}</h2>
                <p>
                  Kırmızı saldırı alanlarından uzaklaş. Geçidi açmak için
                  galeriyi temizle.
                </p>
                <Progress value={Math.min(100, (s.mine.mined / 4) * 100)} />
                <div className="mine-objectives">
                  <span>{s.enemies.length} düşman</span>
                  <span>Cevher {Math.min(4, s.mine.mined)}/4</span>
                </div>
                <div className="mine-buttons">
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setTool('hand');
                      engine.current?.go(MINE_LIFT.x, MINE_LIFT.z);
                    }}
                  >
                    Asansöre dön
                  </button>
                  <button
                    className="primary-button"
                    disabled={!!s.enemies.length || s.mine.mined < 4}
                    onClick={() => {
                      setTool('hand');
                      engine.current?.go(MINE_STAIRS.x, MINE_STAIRS.z);
                    }}
                  >
                    {s.mine.floor === 5 ? 'Hazineye ulaş' : 'Alt kata ilerle'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">
                  {s.won ? 'VADİNİN KORUYUCUSU' : 'VADİ GÜNLÜĞÜ'}
                </span>
                <h2>{quest?.name || 'Yuvan büyüyor'}</h2>
                <button
                  className="horizon-link"
                  onClick={() => setPanel('quests')}
                >
                  Sonraki köy hedefi ·{' '}
                  {nextMilestone(s)?.name || 'Kendi hikâyeni yaz'}
                </button>
                <p>{quest?.desc || 'Kendi hikâyeni yazmaya devam et.'}</p>
                {quest && (
                  <>
                    <Progress
                      value={Math.min(
                        100,
                        ((s.stats[quest.stat] || 0) / quest.target) * 100,
                      )}
                    />
                    <div className="quest-peek-footer">
                      <small>
                        {Math.min(quest.target, s.stats[quest.stat] || 0)} /{' '}
                        {quest.target}
                      </small>
                      <button
                        onClick={() => {
                          if ((s.stats[quest.stat] || 0) >= quest.target)
                            engine.current?.claim(quest.id);
                          else setPanel('quests');
                        }}
                      >
                        {(s.stats[quest.stat] || 0) >= quest.target
                          ? 'Ödülü al'
                          : 'Günlüğü aç'}{' '}
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </>
                )}
                <button
                  className="mine-entry"
                  onClick={() => {
                    setTool('hand');
                    setPanel('mine');
                  }}
                >
                  <Compass size={15} /> Kadim madene git <span>Sv. 3</span>
                </button>
              </>
            )}
          </aside>
          <nav
            id="left-actions"
            className="main-actions glass"
            aria-label="Oyun menüleri"
          >
            <button onClick={()=>setPanel('inventory')} title="Menü (Tab)"><Backpack/><span>Menü</span></button>
            <button onClick={()=>setPanel('online')} title={coop.current?.status || 'Birlikte oyna'}><Users/><span>Co-op</span></button>
            <button onClick={()=>{if(engine.current)engine.current.toggleRest();}} title="Otur / kalk"><Pause/><span>Dinlen</span></button>
          </nav>
          </div>
          <div className="calendar glass">
            <div className="weather">
              {s.weather === 'rain' ? (
                <CloudRain />
              ) : s.time > 0.77 || s.time < 0.24 ? (
                <Moon />
              ) : (
                <Sun />
              )}
            </div>
            <div>
              <b>
                {SEASONS[season(s)]} · {((s.day - 1) % 7) + 1}. gün
              </b>
              <span>
                {String(Math.floor(s.time * 24)).padStart(2, '0')}:
                {String(Math.floor(s.time * 24 * 60) % 60).padStart(2, '0')}{' '}
                <i />{' '}
                {s.mine
                  ? 'Yeraltı · Vadi saati durdu'
                  : s.weather === 'rain'
                    ? 'Yağmurlu'
                    : 'Açık hava'}
              </span>
            </div>
          </div>
          <nav className="world-actions" aria-label="Kamera">
            <button
              onClick={() => scene.current?.recenter()}
              aria-label="Karaktere odaklan"
              title="Karaktere odaklan (F)"
            >
              <Target />
            </button>
            <button
              onClick={() => scene.current?.setZoom(-2)}
              aria-label="Yakınlaştır"
            >
              <Plus />
            </button>
            <button
              onClick={() => scene.current?.setZoom(2)}
              aria-label="Uzaklaştır"
            >
              <Minus />
            </button>
            <button
              onClick={() => {
                if (scene.current) scene.current.angle += Math.PI / 2;
              }}
              aria-label="Görüşü döndür"
              title="Görüşü döndür (Q / E)"
            >
              <Compass />
            </button>
            <button
              onClick={() => setPanel('guide')}
              aria-label="Gezginin el kitabı"
            >
              <HelpCircle />
            </button>
          </nav>
          <div className="location-label">
            <span>✧</span>{' '}
            {s.player.z < 10
              ? 'AYTAŞI SIRTLARI'
              : s.player.x > 25
                ? 'SÖĞÜT NEHRİ'
                : s.player.z > 26
                  ? 'YABAN ORMANI'
                  : 'SÖĞÜT ÇAYIRI'}{' '}
            <span>✧</span>
          </div>
          <div className="messages" aria-live="polite">
            {messages.map((m) => (
              <div className={m.kind} key={m.id}>
                {m.kind === 'good' && <Check size={13} />} {m.text}
              </div>
            ))}
          </div>
          <section className="minimap glass">
            <div>
              <Compass size={14} />
              <b>
                {s.mine
                  ? 'KADİM MADEN'
                  : biomeAt(s.player.x, s.player.z, s.seed).toLocaleUpperCase(
                      'tr',
                    )}
              </b>
              <span>K</span>
            </div>
            <canvas
              width={144}
              height={144}
              ref={mini}
              onClick={(ev) => {
                const r = ev.currentTarget.getBoundingClientRect();
                if (scene.current) {
                  scene.current.pan.x =
                    worldOrigin(s).x +
                    ((ev.clientX - r.left) / r.width) * worldSize(s) -
                    s.player.x;
                  scene.current.pan.z =
                    worldOrigin(s).z +
                    ((ev.clientY - r.top) / r.height) * worldSize(s) -
                    s.player.z;
                }
              }}
            />
            <small>
              {Math.round(s.player.x)}, {Math.round(s.player.z)} · Gün {s.day}
            </small>
            {!s.mine && (
              <button
                className="home-return"
                onClick={() => {
                  engine.current?.returnHome();
                  scene.current?.recenter();
                }}
              >
                <House size={13} /> Eve dön
              </button>
            )}
            <small className="performance-readout">
              {Math.round(
                1000 / Math.max(1, scene.current?.metrics.frameMs || 16.7),
              )}{' '}
              FPS · {scene.current?.metrics.chunks || 0} bölge
            </small>
          </section>
          <div className="tool-info glass">
            <span>
              <GameIcon
                id={
                  tool === 'build'
                    ? build
                    : tool === 'fertilize'
                      ? 'fertilizer'
                      : tool === 'fish'
                        ? 'rod'
                        : tool
                }
              />
            </span>
            <div>
              <b>{toolLabel}</b>
              <p>
                {hover ? label : 'Bir kare seç'}{' '}
                {t?.crop &&
                  `· %${Math.floor((t.growth / CROPS[t.crop].grow) * 100)}`}
              </p>
            </div>
          </div>
          {tool === 'seed' && (
            <div className="seed-picker glass">
              {Object.entries(CROPS).map(([id, c]) => (
                <button
                  key={id}
                  disabled={s.level < c.level}
                  className={seed === id ? 'active' : ''}
                  onClick={() => setSeed(id)}
                  title={`${c.name} · ${c.seasons.map((n) => SEASONS[n]).join(', ')}`}
                >
                  <span>
                    <GameIcon id={id} />
                  </span>
                  <small>{s.inventory[c.seed] || 0}</small>
                </button>
              ))}
            </div>
          )}
          {tool === 'build' && (
            <div className="placement-banner glass">
              <span>
                <GameIcon id={build} />
              </span>
              <div>
                <b>{BUILDINGS[build].name}</b>
                <small>Boş kareye yerleştir · {rotation * 90}°</small>
              </div>
              <button onClick={() => setRotation(r => (r + 1) % 4)} title="90 derece döndür (yön tuşları)">Döndür</button>
              {['fence','wall'].includes(build) && <button onClick={() => setCorner(v=>!v)}>{corner ? 'L köşe' : 'Düz'}</button>}
              <button
                onClick={() => setTool('hand')}
                aria-label="İnşa modundan çık"
              >
                <X size={17} />
              </button>
            </div>
          )}
          <footer className="bottom-hud">
            <div className="control-hints">
              <span>
                <kbd>W A S D</kbd> Yürü
              </span>
              <span>
                <kbd>R</kbd> Dinlen
              </span>
              <span>
                <kbd>Boşluk</kbd> Saldır
              </span>
              <span>Sürükle · Haritayı taşı</span>
            </div>
            <div className="toolbar glass">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  aria-pressed={tool === t.id}
                  className={tool === t.id ? 'selected' : ''}
                  onClick={() => setTool(t.id)}
                  title={t.name}
                >

                  <span>
                    <GameIcon id={t.id === 'fish' ? 'rod' : t.id} />
                  </span>
                  <small>{t.name}</small>
                </button>
              ))}
            </div>
          </footer>
          <div className="touch-controls">
            <div className="dpad">
              {[
                { key: 'w', icon: ArrowUp },
                { key: 'a', icon: ArrowLeft },
                { key: 's', icon: ArrowDown },
                { key: 'd', icon: ArrowRight },
              ].map((k) => (
                <button
                  key={k.key}
                  className={`pad-${k.key}`}
                  aria-label={`${k.key} yönünde yürü`}
                  onPointerDown={(ev) => {
                    ev.preventDefault();if(control.current.paused)return;
                    ev.currentTarget.setPointerCapture(ev.pointerId);
                    keys.current.add(k.key);
                  }}
                  onPointerUp={() => keys.current.delete(k.key)}
                  onPointerCancel={() => keys.current.delete(k.key)}
                  onLostPointerCapture={() => keys.current.delete(k.key)}
                >
                  <k.icon />
                </button>
              ))}
            </div>
            <button
              className="touch-attack"
              aria-label="Saldır"
              onClick={() => {
                if (!control.current.paused) engine.current?.attack();
              }}
            >
              <Swords />
            </button>
          </div>
          {(engine.current?.resting || engine.current?.fishing) && (
            <div className="activity-banner glass">
              {engine.current.resting ? (
                <>
                  <Moon size={15} /> Dinleniyorsun · Enerji yenileniyor{' '}
                  <button
                    onClick={() => {
                      if (engine.current) engine.current.toggleRest();
                    }}
                  >
                    Kalk
                  </button>
                </>
              ) : (
                <>
                  🎣 Balık bekleniyor…{' '}
                  {Math.ceil(engine.current.fishing!.timer)} sn
                </>
              )}
            </div>
          )}
          {s.enemies.length > 0 && (
            <div className="raid-banner">
              <Swords size={17} />
              <div>
                <b>
                  {s.mine
                    ? s.enemies.some((e) => e.kind === 'guardian')
                      ? 'Derinlik Muhafızı'
                      : 'Maden çatışması'
                    : 'Gece akını'}
                </b>
                <span>
                  {s.enemies.length} düşman ·{' '}
                  {s.mine ? 'Saldırı halkalarından kaçın' : 'Köyünü savun'}
                </span>
              </div>
              <button
                onClick={() => {
                  setTool('sword');
                  scene.current?.recenter();
                }}
              >
                Kılıcı kuşan
              </button>
            </div>
          )}
          {s.jobs.length > 0 && !panel && (
            <button
              className="production-peek glass"
              onClick={() => setPanel('craft')}
            >
              <span>
                <GameIcon id={s.jobs[0].recipe} />
              </span>
              <div>
                <b>{RECIPES[s.jobs[0].recipe].name}</b>
                <Progress
                  value={(1 - s.jobs[0].remaining / s.jobs[0].total) * 100}
                />
              </div>
              <small>{Math.ceil(s.jobs[0].remaining)} sn</small>
            </button>
          )}
          {paused && !panel && (
            <div className="pause-banner glass">
              <Pause size={18} /> Oyun duraklatıldı{' '}
              <button onClick={() => setPaused(false)}>Devam et</button>
            </div>
          )}
          <Panels
            engine={engine.current!}
            coop={coop.current}
            panel={panel}
            setPanel={setPanel}
            onBuild={chooseBuild}
            onSeed={chooseSeed}
            onImport={doImport}
            onExport={doExport}
            onSave={()=>void doSave().catch(()=>{})}
            onReset={doReset}
            selectedBuilding={selectedBuilding}
            sound={sound}
            setSound={setSound}
            saveStatus={saveStatus}
            selectedNPC={selectedNPC}
            quality={quality}
            setQuality={(q) => {
              renderSettings.current.high = q;
              setQuality(q);
              scene.current?.setQuality(q);
            }}
            onApproach={(x, z) => {
              setPanel(null);
              engine.current?.go(x, z, 'hand');
            }}
          />
        </>
      )}
    </main>
  );
}
