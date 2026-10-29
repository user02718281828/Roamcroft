'use client';
import { sourceText } from '@/lib/i18n/source';
import { localize, localizeText, translate } from '@/lib/i18n/core';
import { useLocale } from '@/lib/i18n/react';
import { getLocale, intlLocale } from '@/lib/i18n/locale';

import GameIcon from './GameIcon';
import {frameProfile} from '@/lib/game/profile';
import {profileFixture} from '@/lib/game/profile-fixture';
import VillagerPortrait from './VillagerPortrait';
import { orchardStatus } from '@/lib/game/orchard';
import './menu.css';
import './mobile.css';
import './ui-v2.css';
import { nextPanel } from '@/lib/ui/game-menu';
import { firstSteps } from '@/lib/ui/first-steps';
import { useGuidance } from '@/lib/ui/guidance';
import './foundation.css';
import MainMenu from './MainMenu';
import Joystick from './Joystick';
import {ServerWorldClient} from '@/lib/server/client';
import {preparePwa} from '@/lib/game/pwa';
import {enterGameFullscreen,MOBILE_QUERY} from '@/lib/game/viewport';
import type { CoopClient } from '@/lib/coop/client';
import { nextMilestone, settlementRank } from '@/lib/game/settlement';
import { recommendedQuest } from '@/lib/game/quests';
import { inventoryUsed, inventoryCapacity } from '@/lib/game/progression';
import { useEffect, useRef, useState, lazy, Suspense } from 'react';
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
  Maximize,
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
  RECIPES,
} from '@/lib/game/data';
import { loadLocal, saveLocal, serialize, deserialize } from '@/lib/game/save';
import { loadStored, saveStored } from '@/lib/game/storage';
import { ValleyAudio } from '@/lib/game/audio';
import type { ValleyScene } from '@/lib/game/scene';
const Panels=lazy(()=>import('./Panels'));
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

export default function Game({autoStart=false,serverMode=false,onExit}:{autoStart?:boolean;serverMode?:boolean;onExit?:()=>void}={}) {
  useLocale();
  const [guidanceEnabled] = useGuidance();
  const renderStarted=frameProfile.begin();
  useEffect(()=>{frameProfile.mount();return()=>frameProfile.dispose();},[]);
  const exitPending=useRef(false);
  const host = useRef<HTMLDivElement>(null),
    mini = useRef<HTMLCanvasElement>(null),
    engine = useRef<Engine | null>(null),
    scene = useRef<ValleyScene | null>(null),
    audio = useRef<ValleyAudio | null>(null),
    keys = useRef(new Set<string>()),
    joystick = useRef({x:0,y:0}),
    nextState = useRef<State | null>(null),
    allowSave = useRef(true),
    coop = useRef<CoopClient | null>(null);
  const authority=useRef<ServerWorldClient|null>(null);
  const renderSettings = useRef({ high: false });
  const [storageReady, setStorageReady] = useState(false);
  const initialMessage = useRef('');
  useEffect(() => {
    let canceled = false;
    if(serverMode){
      const client=new ServerWorldClient(()=>engine.current,()=>control.current.paused||document.hidden,()=>refresh(n=>n+1));authority.current=client;
      void client.start().then(state=>{if(canceled)return;nextState.current=state;initialMessage.current=sourceText("m_7619685fa5");setStorageReady(true);}).catch(error=>{if(!canceled)setError(error instanceof Error?error.message:sourceText("m_7d7982e90d"));});
      return()=>{canceled=true;client.dispose();};
    }
    void loadStored().then((loaded) => {
      if (canceled) return;
      // Reproducible profiling fixture is restricted to local production previews.
      const requestedFixture=new URLSearchParams(location.search).get('fixture');
      const fixture=['localhost','127.0.0.1'].includes(location.hostname)&&['normal','dense'].includes(requestedFixture||'')&&requestedFixture;
      if(fixture){
        nextState.current=profileFixture(fixture==='dense');
      }else nextState.current = loaded.state;
      initialMessage.current = fixture?sourceText("m_0ced9d4f13"):loaded.message;
      setStorageReady(true);
    });
    return () => {
      canceled = true;
    };
  }, []);
  const [, refresh] = useState(0),
    [epoch, setEpoch] = useState(0),
    [ready, setReady] = useState(false),
    [loadingProgress,setLoadingProgress]=useState(0),
    [error, setError] = useState(''),
    [loadError, setLoadError] = useState(''),
    [tool, setTool] = useState('hand'),
    [seed, setSeed] = useState('wheat'),
    [build, setBuild] = useState('workshop'),
    [rotation, setRotation] = useState(0),
    [corner, setCorner] = useState(false),
    [paused, setPaused] = useState(false),
    [mainMenu,setMainMenu] = useState(!autoStart),
    [panel, setPanel] = useState<Panel>(serverMode?'online':null),
    [selectedBuilding, setSelectedBuilding] = useState<number | null>(null),
    [selectedNPC, setSelectedNPC] = useState('narin'),
    [sound, setSoundState] = useState(false),
    [quality, setQuality] = useState(false),
    [compactHud, setCompactHud] = useState(true),
    [saveStatus, setSaveStatus] = useState(''),
    [hover, setHover] = useState<{ x: number; z: number } | null>(null),
    [messages, setMessages] = useState<
      (Event & { id: number; expires: number })[]
    >([]);
  useEffect(()=>{if(window.matchMedia(MOBILE_QUERY).matches)setCompactHud(true);},[]);
  useEffect(()=>{if(ready)preparePwa();},[ready]);
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
    paused: !ready || paused || mainMenu || (!!panel && !coop.current?.active) || (serverMode&&!authority.current?.connected),
    panel,
    sound,
  };
  if (engine.current) {engine.current.placementRotation = rotation; engine.current.placementCorner = corner;}
  if (scene.current) {scene.current.placementRotation = rotation; scene.current.placementCorner = corner;}
  const interact=()=>{
    const e=engine.current;if(!e||control.current.paused)return;
    const p=e.s.player;
    if(['build','seed','hoe','water','fertilize'].includes(control.current.tool)){
      const x=Math.round(p.x+Math.sin(p.facing)),z=Math.round(p.z+Math.cos(p.facing));
      if(control.current.tool==='build')e.build(control.current.selection,x,z,e.placementRotation,e.placementCorner);
      else e.act(x,z,control.current.tool,control.current.selection);
      return;
    }
    const person=!e.s.mine&&NPCS.find(n=>{const position=e.npcMotion.get(n.id)||n;return Math.hypot(position.x-p.x,position.z-p.z)<2.2;});
    if(person){setSelectedNPC(person.id);setPanel('villagers');return;}
    const animal=e.s.animals.find(a=>Math.hypot(a.x-p.x,a.z-p.z)<1.8);
    if(animal){if(animal.ready)e.harvestAnimal(animal.id);else e.petAnimal(animal.id);return;}
    const building=e.s.buildings.find(b=>Math.hypot(b.x-p.x,b.z-p.z)<1.8);
    if(building){if(orchardStatus(building,e.s)?.ready){e.act(building.x,building.z,'hand');return;}setSelectedBuilding(building.id);setPanel('building');return;}
    const target=e.s.tiles.filter(t=>(t.resource||t.crop||(control.current.tool==='fish'&&t.terrain==='water'))&&Math.hypot(t.x-p.x,t.z-p.z)<1.8).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
    if(target)e.act(target.x,target.z,control.current.tool==='fish'?'fish':'hand');else e.emit(sourceText("m_6455e5a37b"));
  };
  const setSound = (value: boolean) => {
    void audio.current?.enable(value).then((enabled) => {
      setSoundState(enabled);
      if (value && !enabled)
        engine.current?.emit(
          sourceText("m_eb97b6015c"),
          'bad',
        );
    });
  };
  const doSave = async () => {
    if(serverMode){if(!authority.current)throw Error(sourceText("m_36e4fe8a78"));await authority.current.flush();setSaveStatus(sourceText("m_a21b2f953a"));return;}
    if(coop.current?.active) {
      try {await coop.current.publish();setSaveStatus(sourceText("m_281c7779e7"));} catch(error){setSaveStatus(error instanceof Error ? error.message : sourceText("m_e2bf9be3f4"));throw error;}
      return;
    }
    if (engine.current) {
      allowSave.current = true;
      const ok = await saveStored(engine.current.s);
      setSaveStatus(
        ok
          ? sourceText("m_f0ec215938", { p0: new Date().toLocaleTimeString(intlLocale()) })
          : sourceText("m_d0bb9477bf"),
      );
      engine.current.emit(
        ok ? sourceText("m_fd40e204c8") : sourceText("m_cdf082cbcb"),
        ok ? 'good' : 'bad',
      );
      if(!ok)throw Error(sourceText("m_18bab29cd0"));
    }
  };
  const doExit = async () => {
    if(exitPending.current)return;
    exitPending.current=true;keys.current.clear();joystick.current={x:0,y:0};
    try {
      if(serverMode){if(!authority.current)throw Error(sourceText("m_36e4fe8a78"));await authority.current.exitToMenu();}
      else {await doSave();if(coop.current?.active)await coop.current.leave();}
      allowSave.current=false;
      if(onExit)onExit();else window.location.reload();
    } catch(error){exitPending.current=false;throw error;}
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
    engine.current.emit(sourceText("m_59b60599c0"), 'good');
  };
  const doImport = async (file: File) => {
    setLoadError('');
    if(serverMode){setLoadError(sourceText("m_8e46a19b48"));return;}
    if(coop.current?.active){engine.current?.emit(sourceText("m_c4b41e9fae"),'bad');return;}
    try {
      if (file.size > 32_000_000) throw new Error(sourceText("m_0806e1acd3"));
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
      setLoadError(e instanceof Error ? e.message : sourceText("m_af9676cedc"));
      engine.current?.emit(
        e instanceof Error ? e.message : sourceText("m_af9676cedc"),
        'bad',
      );
    }
  };
  const doReset = () => {
    if(serverMode){engine.current?.emit(sourceText("m_dbb0a7206e"),'info');return;}
    if(coop.current?.active){engine.current?.emit(sourceText("m_f7193a4977"),'bad');return;}
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
  useEffect(() => {
    if (!storageReady) return;
    let disposed = false,
      frame = 0,
      wakeTimer = 0,
      last = 0,
      ui = 0,
      saveClock = 0,
      eventId = 0;
    const loaded = nextState.current
      ? {
          state: nextState.current,
          message: initialMessage.current || sourceText("m_510ac3aca5"),
        }
      : loadLocal();
    nextState.current = null;
    initialMessage.current = '';
    const e = new Engine(loaded.state,serverMode);
    engine.current = e;
    coop.current?.bind(e);
    authority.current?.bind(e);
    e.emit(loaded.message);
    allowSave.current = !serverMode && !coop.current?.active && !loaded.message.startsWith(sourceText("m_77c932fee6"));
    setReady(false);
    setLoadingProgress(0);
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
              if (b && control.current.tool !== 'build') {
                if(control.current.tool==='hand'&&orchardStatus(b,e.s)?.ready){e.go(x,z,'hand');return;}
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
          if(window.matchMedia(MOBILE_QUERY).matches)view.setZoom(-4);
          view.setQuality(renderSettings.current.high);
          let worldReady=false,lastProgress=-1,lastPausedView='',continuousFrame=false;
          const initialChunks=view.dirtyChunks.size;
          const loop = (now: number) => {
            const loopStarted=frameProfile.begin();
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
              const keyboardMoving=horizontal!==0||vertical!==0;
              horizontal+=joystick.current.x;vertical+=joystick.current.y;
              const strength=keyboardMoving?1:Math.min(1,Math.hypot(horizontal,vertical));
              e.sprinting=keys.current.has('shift');
              const angle = view.angle;
              if (horizontal || vertical)
                e.move(
                  horizontal * Math.cos(angle) + vertical * Math.sin(angle),
                  -horizontal * Math.sin(angle) + vertical * Math.cos(angle),
                  dt*strength,
                );
              const simulationStarted=frameProfile.begin();
              e.tick(dt);
              frameProfile.end('simulation',simulationStarted);
              const audioStarted=frameProfile.begin();
              music.footsteps(e.s);
              saveClock += dt;
              music.tick(dt, e.s);
              frameProfile.end('audio',audioStarted);
            }
            view.activeTool = control.current.tool;
            view.placement =
              control.current.tool === 'build'
                ? control.current.selection
                : null;
            const pausedView=[view.target.x,view.target.z,view.angle,view.zoom,view.highQuality,view.canvas.width,view.canvas.height].join(',');
            if (!document.hidden && (!worldReady || !control.current.paused || authority.current?.shared || pausedView!==lastPausedView)){
              const sceneStarted=frameProfile.begin();
              view.render(control.current.paused&&!authority.current?.shared ? 0 : dt, frameDuration,
                worldReady&&!control.current.paused&&continuousFrame);
              frameProfile.end('scene',sceneStarted);
              lastPausedView=pausedView;
            }
            if(!worldReady){
              const completed=initialChunks-view.dirtyChunks.size+view.assetsLoaded,total=initialChunks+3;
              const percent=Math.min(100,Math.round(completed/total*100));
              if(percent!==lastProgress){lastProgress=percent;setLoadingProgress(percent);}
              if(view.dirtyChunks.size===0&&view.assetsLoaded===3){worldReady=true;setReady(true);if(view.assetsFailed)e.emit(sourceText("m_b46fd5695f"));}
            }
            ui += dt;
            if (ui > 0.25) {
              if(frameProfile.recording){const link=authority.current?.realtime?.metrics;frameProfile.metadata.network=link?{rttMs:link.rtt,jitterMs:link.jitter,interpolationMs:link.buffer,snapshotGaps:link.gaps,staleSnapshots:link.stale}:null;}
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
              if(!control.current.paused||e.events.length)refresh((n) => n + 1);
              if (mini.current&&!control.current.paused) {const started=frameProfile.begin();view.drawMinimap(mini.current);frameProfile.end('minimap',started);}
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
                  if(m.sound) music.action(m.sound); else music.effect(m.kind);
                  if (m.celebration)
                    view.celebrate(m.x ?? e.s.player.x, m.z ?? e.s.player.z);
                  if (m.x !== undefined && !m.celebration)
                    view.burst(
                      m.x,
                      m.z!,
                      m.kind === 'bad' ? 0xdc8875 : m.sound === 'water' || m.sound === 'fish' ? 0x70cede : m.sound === 'pickaxe' ? 0xa5a6a1 : m.sound === 'axe' ? 0x99b875 : 0xe1c57b,
                      m.sound,
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
                const saveStarted=frameProfile.begin();
                const saved = await saveStored(e.s);
                frameProfile.end('saveWallTime',saveStarted);
                setSaveStatus(
                  saved
                    ? sourceText("m_71c57272af", { p0: new Date().toLocaleTimeString(intlLocale()) })
                    : sourceText("m_a1023d4d92"),
                );
              };
              if ('requestIdleCallback' in window)
                window.requestIdleCallback(storeSave, { timeout: 4000 });
              else setTimeout(storeSave, 50);
              saveClock = 0;
            }
            frameProfile.end('rafCpu',loopStarted);
            frameProfile.frame(frameDuration*1000,worldReady&&!control.current.paused&&!document.hidden&&continuousFrame);
            continuousFrame=worldReady&&!control.current.paused&&!document.hidden;
            if(worldReady&&(control.current.paused||document.hidden))wakeTimer=window.setTimeout(()=>{frame=requestAnimationFrame(loop);},document.hidden?500:100);
            else frame = requestAnimationFrame(loop);
          };
          frame = requestAnimationFrame(loop);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : sourceText("m_25de8c0a47"),
          );
        }
      })
      .catch(() => setError(sourceText("m_30fb8bdc99")));
    const down = (ev: KeyboardEvent) => {
      if(exitPending.current){ev.preventDefault();return;}
      const tag = (ev.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      const key = ev.key.toLowerCase();
      if (ev.key === 'Escape') {
        if (control.current.panel) setPanel(null);
        else if (control.current.tool === 'build') setTool('hand');
        else setPaused((p) => !p);
        return;
      }
      // The modal owns Tab focus traversal; Escape closes it.
      if(key==='tab') {if(control.current.panel)return;ev.preventDefault();setMainMenu(false);if(!ev.repeat)setPanel('inventory');return;}
      if(control.current.panel) {
        if(['q','e','arrowleft','arrowright'].includes(key) && !(key.startsWith('arrow')&&(ev.target as HTMLElement).getAttribute('role')==='tab')) {
          ev.preventDefault();setPanel(nextPanel(control.current.panel,['q','arrowleft'].includes(key)?-1:1,serverMode));
        }
        return;
      }
      if (control.current.paused) return;
      if(control.current.tool==='build' && ['arrowleft','arrowright','arrowup','arrowdown'].includes(key)) {
        ev.preventDefault();if(!ev.repeat)setRotation(r=>(r+(['arrowleft','arrowdown'].includes(key)?3:1))%4);return;
      }
      if(['arrowup','arrowdown','arrowleft','arrowright','control'].includes(key))ev.preventDefault();
      keys.current.add(key);if(ev.repeat)return;
      if(/^[1-8]$/.test(key)){setTool(TOOLS[Number(key)-1].id);return;}
      if(key==='control')e.attack();
      if(key==='e')interact();

    };
    const up = (ev: KeyboardEvent) => keys.current.delete(ev.key.toLowerCase());
    const blur = () => {keys.current.clear();joystick.current={x:0,y:0};};
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
      clearTimeout(wakeTimer);
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
        ? sourceText("m_ee93c474f3")
        : hover.z === MINE_LIFT.z
          ? sourceText("m_8a21c0150b")
          : sourceText("m_28921c7dd9")
      : null;
  const label =
    portalLabel ||
    (npc
      ? npc.name
      : b
        ? BUILDINGS[b.type].name
        : t?.resource
          ? {
              tree: sourceText("m_970fbd3e86"),
              bush: sourceText("m_e559023fd7"),
              stone: sourceText("m_2eea9f6a73"),
              iron: sourceText("m_bffe70f622"),
              copper: sourceText("m_e63ad63532"),
              crystal: sourceText("m_ff5675eb85"),
              mushroom: sourceText("m_4d04550421"),
            }[t.resource]
          : t?.crop
            ? CROPS[t.crop].name
            : t?.tilled
              ? sourceText("m_f797da3bfb")
              : t?.terrain === 'water'
                ? sourceText("m_08a7477a9a")
                : s?.mine
                  ? sourceText("m_23b47d8342")
                  : sourceText("m_a751b91f52"));
  const quest = s ? recommendedQuest(s) : null;
  const introStep = s ? firstSteps(s).find(step => !step.done) : undefined;
  const chooseBuild = (type: string) => {
    setBuild(type);
    setTool('build');
    setPanel(null);
    engine.current?.emit(sourceText("m_87dfec49e7", { p0: BUILDINGS[type].name }));
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
        ? sourceText("m_08026178a9")
        : TOOLS.find((t) => t.id === tool)?.name;
  frameProfile.end('reactFunctionCpu',renderStarted);
  return (
    <main translate="no" className={`game-shell ${compactHud ? 'hud-collapsed' : ''} ${panel ? 'has-panel' : ''}`}>
      {serverMode&&<div className="server-status" role="status">{localize(authority.current?.status||sourceText("m_8ee7c652b8"))}{authority.current?.sleep&&<span> {translate("m_d6023f16fc")}{authority.current.sleep.ready.length}/{authority.current.sleep.ready.length+authority.current.sleep.waiting.length} {translate("m_5bfd1b5024")}</span>}</div>}
      <div ref={host} className="world" />
      <div className="world-vignette" />
      {!ready && (
        <div className="loading-screen">
          <Flame size={40} />
          <h1>Roamcroft</h1>
          <p>{localize(error || sourceText("m_6e40333eda"))}</p>
          {!error && <><progress aria-label={translate("m_2cbfcb4e20")} max={100} value={loadingProgress}/><small>%{loadingProgress} {translate("m_e602c67473")}</small></>}
          {localize(error && (
            <>
              <p className="error-help">
                {localize(serverMode&&!storageReady?sourceText("m_5fd10a1450"):sourceText("m_971e307971"))}
              </p>
              <button
                className="primary-button"
                onClick={() => location.reload()}
              >
                {translate("m_50643503b2")}</button>
            </>
          ))}
        </div>
      )}
      {s && (
        <>
          {ready && mainMenu && !panel && <MainMenu serverMode={serverMode} loadError={loadError} onContinue={()=>{setMainMenu(false);setPaused(false);}} onNew={doReset} onLoad={doImport} onSettings={()=>setPanel('settings')} onGuide={()=>setPanel('guide')} onSave={doSave} onExit={doExit}/>}
          <header className="game-header">
            <div className="brand">
              <div className="brand-icon">
                <Flame />
              </div>
              <div>
                <h1>Roamcroft</h1>
                <span className="settlement-brand" title={s.settlement.name}>
                  {s.settlement.name} · {localize(settlementRank(s))}
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
                  <small>{localize(ITEMS[id].name)}</small>
                </div>
              ))}
              <div className="resource gold">
                <span>◈</span>
                <b>{localize(s.gold.toLocaleString(intlLocale()))}</b>
                <small>{translate("m_6ee0381c24")}</small>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="icon-button sound-button"
                aria-label={localize(sound ? sourceText("m_9e37e5ce56") : sourceText("m_b1e169c43b"))}
                title={localize(sound ? sourceText("m_9e37e5ce56") : sourceText("m_b1e169c43b"))}
                onClick={() => setSound(!sound)}
              >
                {sound ? <Volume2 /> : <VolumeX />}
              </button>
              <button
                className="icon-button pause-button"
                aria-label={localize(paused ? sourceText("m_26183306dc") : sourceText("m_19b6acde33"))}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play /> : <Pause />}
              </button>
              <button className="icon-button mobile-fullscreen" aria-label={translate("m_ec2f69611c")} onClick={()=>void enterGameFullscreen().then(ok=>{if(!ok)engine.current?.emit(sourceText("m_fbf300983c"));})}><Maximize/></button>
              <button
                className="icon-button"
                aria-label={translate("m_489a38bb4a")}
                onClick={() => setMainMenu(true)}
              >
                <Settings />
              </button>
            </div>
          </header>
          <div className="mobile-vitals" aria-label={translate("m_a674b3c775")}>
            <span className={s.player.health<25?'low':''} aria-label={localize(sourceText("m_f13da9bb3b", { p0: Math.ceil(s.player.health) }))}><Heart/>{Math.ceil(s.player.health)}</span>
            <span className={s.player.energy<20?'low':''} aria-label={localize(sourceText("m_501862068d", { p0: Math.ceil(s.player.energy) }))}><Zap/>{Math.ceil(s.player.energy)}</span>
            <span className={s.player.hunger<20?'low':''} aria-label={localize(sourceText("m_6d230f7a9e", { p0: Math.ceil(s.player.hunger) }))}><Wheat/>{Math.ceil(s.player.hunger)}</span>
          </div>
          <div className="hud-left">
          <section className="status-card glass">
            <div className="portrait">
              <VillagerPortrait />
            </div>
            <div className="status-main">
              <div className="player-name">
                {translate("m_fcc172abee")}<span>{translate("m_c798c7e332")}{s.level}</span>
              </div>
              <Progress
                value={(s.xp / xpNext(s.level)) * 100}
                aria-label={translate("m_87689ad6a3")}
              />
              <div className="vitals">
                <span title={translate("m_5aed93824f")}>
                  <Heart />
                  {Math.ceil(s.player.health)}
                </span>
                <span title={translate("m_2cfd3126aa")}>
                  <Zap />
                  {Math.ceil(s.player.energy)}
                </span>
                <span title={translate("m_65edabcfc1")}>
                  <Wheat />
                  {Math.ceil(s.player.hunger)}
                </span>
              </div>
            </div>
          </section>
          <button
            className="hud-toggle glass"
            aria-label={localize(compactHud ? sourceText("m_c7781fb6e8") : sourceText("m_02bd45b132"))}
            aria-expanded={!compactHud}
            aria-controls="left-quest left-actions"
            onClick={() => setCompactHud((v) => !v)}
          >
            <BookOpen aria-hidden="true"/><span>{localize(compactHud ? (s.mine ? FLOOR_NAMES[s.mine.floor - 1] : quest?.name || sourceText("m_69510f5f16")) : sourceText("m_b59056b4d7"))}</span>
          </button>
          {inventoryUsed(s) >= inventoryCapacity(s) && (
            <div className="hud-warning" role="alert">
              <button
                className="inventory-warning"
                onClick={() => setPanel('inventory')}
              >
                {translate("m_b4f7275752")}{inventoryUsed(s)}/{inventoryCapacity(s)}
              </button>
            </div>
          )}
          <aside id="left-quest" className="quest-peek glass">
            {s.mine ? (
              <>
                <span className="eyebrow">
                  {translate("m_eaac15e06d")}{s.mine.floor} / 5
                </span>
                <h2>{localize(FLOOR_NAMES[s.mine.floor - 1])}</h2>
                <p>
                  {translate("m_b071e3dd8e")}</p>
                <Progress aria-label={translate("m_f6d4a8c493")} value={Math.min(100, (s.mine.mined / 4) * 100)} />
                <div className="mine-objectives">
                  <span>{s.enemies.length} {translate("m_8e4fbba012")}</span>
                  <span>{translate("m_8730a9f542")}{Math.min(4, s.mine.mined)}/4</span>
                </div>
                <div className="mine-buttons">
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setTool('hand');
                      engine.current?.go(MINE_LIFT.x, MINE_LIFT.z);
                    }}
                  >
                    {translate("m_1fb3d1131c")}</button>
                  <button
                    className="primary-button"
                    disabled={!!s.enemies.length || s.mine.mined < 4}
                    onClick={() => {
                      setTool('hand');
                      engine.current?.go(MINE_STAIRS.x, MINE_STAIRS.z);
                    }}
                  >
                    {localize(s.mine.floor === 5 ? sourceText("m_c42e1defd6") : sourceText("m_737899082e"))}
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">
                  {localize(s.won ? sourceText("m_1507bc2ab8") : sourceText("m_84c1e3c1f2"))}
                </span>
                <h2>{localize(quest?.name || sourceText("m_c5faa545a9"))}</h2>
                <button
                  className="horizon-link"
                  onClick={() => setPanel('quests')}
                >
                  {translate("m_5fd99c8eb3")}{' '}
                  {localize(nextMilestone(s)?.name || sourceText("m_bb34997f5c"))}
                </button>
                <p>{localize(quest?.desc || sourceText("m_5961fb6829"))}</p>
                {quest && (
                  <>
                    <Progress
                      aria-label={localize(sourceText("m_3ef72850cc", { p0: quest.name }))}
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
                        {localize((s.stats[quest.stat] || 0) >= quest.target
                          ? sourceText("m_780491daae")
                          : sourceText("m_f3c1e63c30"))}{' '}
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
                  <Compass size={15} /> {translate("m_cbb0c6bb78")}<span>{translate("m_f2516599d1")}</span>
                </button>
              </>
            )}
          </aside>
          <nav
            id="left-actions"
            className="main-actions glass"
            aria-label={translate("m_1720f0820e")}
          >
            <button onClick={()=>setPanel('inventory')} title={translate("m_45a70ad025")}><Backpack/><span>{translate("m_a314bd0b56")}</span></button>
            <button onClick={()=>{if(engine.current)engine.current.toggleRest();}} title={translate("m_d178441945")}><Pause/><span>{translate("m_9eb4ab0bb4")}</span></button>
            {guidanceEnabled && introStep && !s.mine && <button className="guidance-launch" onClick={() => setPanel('guide')} title={translate('steps.next', {title: translate(introStep.title)})} aria-label={translate('steps.title')}><HelpCircle/><span>{translate('steps.title')}</span></button>}
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
                {translate('hud.calendar', {season: localize(SEASONS[season(s)]), day: ((s.day - 1) % 7) + 1})}
              </b>
              <span>
                {localize(String(Math.floor(s.time * 24)).padStart(2, '0'))}:
                {localize(String(Math.floor(s.time * 24 * 60) % 60).padStart(2, '0'))}{' '}
                <i />{' '}
                {localize(s.mine
                  ? sourceText("m_e52838391a")
                  : s.weather === 'rain'
                    ? season(s)===3 ? sourceText("m_12ca8a5279") : sourceText("m_82703561d8")
                    : sourceText("m_1afa980f33"))}
              </span>
            </div>
          </div>
          <nav className="world-actions" aria-label={translate("m_32edeecd77")}>
            <button
              onClick={() => scene.current?.recenter()}
              aria-label={translate("m_86749934b7")}
              title={translate("m_86749934b7")}
            >
              <Target />
            </button>
            <button
              className="camera-secondary"
              onClick={() => scene.current?.setZoom(-2)}
              aria-label={translate("m_c265542277")}
            >
              <Plus />
            </button>
            <button
              className="camera-secondary"
              onClick={() => scene.current?.setZoom(2)}
              aria-label={translate("m_2e4fb0e294")}
            >
              <Minus />
            </button>
            <button
              onClick={() => {
                if (scene.current) scene.current.angle += Math.PI / 2;
              }}
              aria-label={translate("m_c535d96e07")}
              title={translate("m_c535d96e07")}
            >
              <Compass />
            </button>
            <button
              className="camera-secondary"
              onClick={() => setPanel('guide')}
              aria-label={translate("m_6cb0038efb")}
            >
              <HelpCircle />
            </button>
          </nav>
          <div className="location-label">
            <span>✧</span>{' '}
            {localize(s.player.z < 10
              ? sourceText("m_0055690dc6")
              : s.player.x > 25
                ? sourceText("m_cb5f8ded2d")
                : s.player.z > 26
                  ? sourceText("m_7b91cd54b9")
                  : sourceText("m_586b0c7c7f"))}{' '}
            <span>✧</span>
          </div>
          <div className="messages" aria-live="polite">
            {messages.map((m) => (
              <div className={`${m.kind} ${m.kind === 'good' && m.sound ? 'action-result' : ''}`} key={m.id}>
                {m.kind === 'good' && (m.sound ? <GameIcon id={m.sound === 'harvest' ? 'wheat' : m.sound === 'fish' ? 'rod' : m.sound}/> : <Check size={13} />)} {localizeText(m.text, getLocale(), 0, [s.settlement.name, ...s.animals.map(animal => animal.name || ''), ...(coop.current?.peers.map(peer => peer.name) || [])])}
              </div>
            ))}
          </div>
          <section className="minimap glass">
            <div>
              <Compass size={14} />
              <b>
                {localize(s.mine
                  ? sourceText("m_53956bd7ff")
                  : biomeAt(s.player.x, s.player.z, s.seed).toLocaleUpperCase(
                      'tr',
                    ))}
              </b>
              <span>{translate('compass.north')}</span>
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
              {Math.round(s.player.x)}, {Math.round(s.player.z)} {translate("m_a83646a513")}{s.day}
            </small>
            {!s.mine && (
              <button
                className="home-return"
                onClick={() => {
                  engine.current?.returnHome();
                  scene.current?.recenter();
                }}
              >
                <House size={13} /> {translate("m_4f02c4e6d9")}</button>
            )}
            {frameProfile.enabled && (<small className="performance-readout">
              {Math.round(
                1000 / Math.max(1, scene.current?.metrics.frameMs || 16.7),
              )}{' '}
              {translate("m_1de4961c8e")}{localize((scene.current?.metrics.frameMs||16.7).toFixed(1))} {translate("m_9dc43f788c")}{scene.current?.metrics.chunks || 0} {translate("m_daf138c7f4")}</small>)}
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
              <b>{localize(toolLabel)}</b>
              <p>
                {localize(hover ? label : sourceText("m_a86a248616"))}{' '}
                {localize(t?.crop &&
                  sourceText("m_3b4a32bf1b", { p0: Math.floor((t.growth / CROPS[t.crop].grow) * 100) }))}
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
                  title={localize(sourceText("m_ae04d0e6f6", { p0: c.name, p1: c.seasons.map((n) => SEASONS[n]).join(', ') }))}
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
                <b>{localize(BUILDINGS[build].name)}</b>
                <small>{translate("m_765cdcc523")}{rotation * 90}°</small>
              </div>
              <button onClick={() => setRotation(r => (r + 1) % 4)} title={translate("m_bc383dfb63")}>{translate("m_b7b08d2989")}</button>
              {['fence','wall'].includes(build) && <button onClick={() => setCorner(v=>!v)}>{localize(corner ? sourceText("m_3f379f7557") : sourceText("m_fd48f38b96"))}</button>}
              <button
                onClick={() => setTool('hand')}
                aria-label={translate("m_3760dabe7d")}
              >
                <X size={17} />
              </button>
            </div>
          )}
          <footer className="bottom-hud">
            <div className="control-hints">
              <span>
                <kbd>W A S D</kbd> {translate("m_864e75d241")}</span>
              <span>
                <kbd>R</kbd> {translate("m_b7f4ae32d1")}</span>
              <span>
                <kbd>{translate("m_361fbf0539")}</kbd> {translate("m_36ad4dc2b4")}</span>
              <span>{translate("m_579318f8e9")}</span>
            </div>
            <div className="toolbar glass">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  aria-pressed={tool === t.id}
                  className={tool === t.id ? 'selected' : ''}
                  onClick={() => setTool(t.id)}
                  title={localize(t.name)}
                >

                  <span>
                    <GameIcon id={t.id === 'fish' ? 'rod' : t.id} />
                  </span>
                  <small>{localize(t.name)}</small>
                </button>
              ))}
            </div>
          </footer>
          <div className="touch-controls">
            <Joystick disabled={control.current.paused} onMove={vector=>{joystick.current=vector;}}/>
            <button className="touch-interact" aria-label={localize(tool==='build'?sourceText("m_af7443454c"):sourceText("m_d55ed84703"))} disabled={control.current.paused} onClick={interact}><GameIcon id={tool==='build'?'build':'hand'}/></button>
            <button
              className="touch-attack"
              aria-label={translate("m_ef89a5085b")}
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
                  <Moon size={15} /> {translate("m_601359b3e5")}{' '}
                  <button
                    onClick={() => {
                      if (engine.current) engine.current.toggleRest();
                    }}
                  >
                    {translate("m_cd39584541")}</button>
                </>
              ) : (
                <>
                  {translate("m_76457e7ce5")}{' '}
                  {Math.ceil(engine.current.fishing!.timer)} {translate("m_1928e61fec")}</>
              )}
            </div>
          )}
          {s.enemies.length > 0 && (
            <div className="raid-banner">
              <Swords size={17} />
              <div>
                <b>
                  {localize(s.mine
                    ? s.enemies.some((e) => e.kind === 'guardian')
                      ? sourceText("m_b618bf4107")
                      : sourceText("m_c65df465f1")
                    : sourceText("m_42a349bbf9"))}
                </b>
                <span>
                  {s.enemies.length} {translate("m_e4529116b7")}{' '}
                  {localize(s.mine ? sourceText("m_1f2bd35a81") : sourceText("m_f2710a7b36"))}
                </span>
              </div>
              <button
                onClick={() => {
                  setTool('sword');
                  scene.current?.recenter();
                }}
              >
                {translate("m_e7c0f3d384")}</button>
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
                <b>{localize(RECIPES[s.jobs[0].recipe].name)}</b>
                <Progress
                  aria-label={localize(sourceText("m_ac809c28c6", { p0: RECIPES[s.jobs[0].recipe].name }))}
                  value={(1 - s.jobs[0].remaining / s.jobs[0].total) * 100}
                />
              </div>
              <small>{Math.ceil(s.jobs[0].remaining)} {translate("m_1928e61fec")}</small>
            </button>
          )}
          {paused && !panel && (
            <div className="pause-banner glass">
              <Pause size={18} /> {translate("m_a985fc165d")}{' '}
              <button onClick={() => setPaused(false)}>{translate("m_26183306dc")}</button>
            </div>
          )}
          {panel && <Suspense fallback={<div className="panel-loading" role="status">{translate("m_2b60fcaf24")}</div>}><Panels
            audio={audio.current}
            engine={engine.current!}
            coop={coop.current}
            panel={panel}
            setPanel={setPanel}
            onBuild={chooseBuild}
            onSeed={chooseSeed}
            onEquip={tool => {if(tool === 'seed') chooseSeed('wheat'); else {setTool(tool);setPanel(null);}}}
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
          /></Suspense>}
        </>
      )}
    </main>
  );
}
