import { sourceText } from '../i18n/source.ts';
import type {MotionControl} from '../coop/realtime-client.ts';
import {frameProfile} from './profile.ts';
import type {ActionSound} from './audio.ts';
import { withinSharedRange } from '../coop/motion.ts';
import { orchardStatus } from './orchard.ts';
import { machineRecipe, machineRecipes, productionRate } from './production.ts';
import { cropGrowthRate } from './farming.ts';
import { dailyOrders } from './orders.ts';
import { materialCost, materialPlan, type MaterialTarget } from './materials.ts';
import { sleepBlockReason, type SleepStatus } from './rest.ts';
import { marketSells, tradeUnitPrice } from './economy.ts';
export { tradeUnitPrice } from './economy.ts';
import {blocksPoint} from './collision.ts';
import { schedule, type HumanAction, type AnimalAction } from './living.ts';
import { findRoute } from './pathfinding.ts';
import type { Peer } from '../coop/protocol.ts';
import {
  BUNDLES,
  inventoryUsed,
  inventoryCapacity,
  inventoryFits,
  movementSpeed,
  farmCoverage,
} from './progression.ts';
import { nextMilestone, milestoneReady } from './settlement.ts';
import { NPCS, LANDMARKS, ACHIEVEMENTS } from './content.ts';
import {
  ENEMIES,
  MINE_ENTRANCE,
  MINE_LIFT,
  MINE_STAIRS,
  MINE_FLOORS,
  FLOOR_NAMES,
  mineTiles,
} from './expedition.ts';
import type { EnemyKind } from './expedition.ts';
import {
  ANIMALS,
  BUILDINGS,
  CROPS,
  ITEMS,
  QUESTS,
  RECIPES,
  TALENTS,
} from './data.ts';
import type { Bag } from './data.ts';
import {
  tileIndex,
  worldOrigin,
  worldSize,
  shiftWindow,
  registerBaseline,
  hasBaseline,
  rememberTiles,
  flattenSurface,
} from './world.ts';
import type { World } from './world.ts';
export const SIZE = 36,
  DAY_SECONDS = 300,
  SAVE_VERSION = 1;
export type Tile = {
  x: number;
  z: number;
  terrain: 'grass' | 'sand' | 'water' | 'path' | 'wall';
  height: number;
  resource: string | null;
  source: string | null;
  amount: number;
  respawn: number;
  tilled: boolean;
  water: number;
  crop: string | null;
  growth: number;
  fertilized: boolean;
  seen: boolean;
};
export type Building = {
  recipient?: string;
  recipe?: string;
  processing?: boolean;
  repeat?: boolean;
  plantedDay?: number;
  harvestDay?: number;
  corner?: boolean;
  rotation?: number;
  id: number;
  type: string;
  x: number;
  z: number;
  level: number;
  hp: number;
  timer: number;
  enabled: boolean;
};
export type Animal = {
  parent?: number;
  name?: string;
  bond?: number;
  pettedDay?: number;
  bornDay?: number;
  breedDay?: number;
  id: number;
  type: string;
  home: number;
  x: number;
  z: number;
  timer: number;
  fed: boolean;
  fedDay?: number;
  producedDay?: number;
  ready?: number;
};
export type Enemy = {
  kind?: EnemyKind;
  windup?: number;
  aimX?: number;
  aimZ?: number;
  id: number;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  cooldown: number;
};
export type Job = { recipe: string; remaining: number; total: number; recipient?: string };
export type State = {
  settlement: { name: string; milestones: string[] };
  bundles: { donations: Record<string, Bag>; completed: string[] };
  overflow: Bag;
  storage: Bag;
  talks: Bag;
  world: World;
  mine: null | {
    floor: number;
    mined: number;
    surface: {
      tiles: Tile[];
      buildings: Building[];
      animals: Animal[];
      x: number;
      z: number;
    };
  };
  version: number;
  seed: number;
  rng: number;
  tiles: Tile[];
  buildings: Building[];
  animals: Animal[];
  enemies: Enemy[];
  jobs: Job[];
  talents: Bag;
  friendship: Bag;
  contracts: Bag;
  gifts: Bag;
  discoveries: string[];
  achievements: string[];
  player: {
    x: number;
    z: number;
    health: number;
    hunger: number;
    energy: number;
    facing: number;
  };
  inventory: Bag;
  gold: number;
  xp: number;
  level: number;
  skills: Bag;
  upgrades: Bag;
  day: number;
  time: number;
  weather: string;
  stats: Bag;
  claimed: string[];
  nextId: number;
  raidDay: number;
  won: boolean;
};
export type Event = {
  text: string;
  kind: 'info' | 'good' | 'bad';
  celebration?: boolean;
  sound?: ActionSound;
  x?: number;
  z?: number;
};
export function noise(x: number, z: number, seed: number) {
  const n = Math.sin(x * 127.1 + z * 311.7 + seed * 0.013) * 43758.5453;
  return n - Math.floor(n);
}
export function tileAt(s: State, x: number, z: number) {
  return s.tiles[tileIndex(s, x, z)];
}
export function season(s: State) {
  return Math.floor((s.day - 1) / 7) % 4;
}
export function xpNext(level: number) {
  return Math.floor(65 * Math.pow(level, 1.32));
}
export function upgradeCost(b: Building): Bag {
  return Object.fromEntries(
    Object.entries(BUILDINGS[b.type].cost).map(([k, v]) => [
      k,
      Math.ceil(v * b.level * 0.65),
    ]),
  );
}
export function skillLevel(s: State, key: string) {
  return Math.min(10, 1 + Math.floor(Math.sqrt((s.skills[key] || 0) / 80)));
}
export function buildingAt(s: State, x: number, z: number) {
  return s.buildings.find(
    (b) => b.x === Math.round(x) && b.z === Math.round(z),
  );
}
export function canAfford(s: State, cost: Bag) {
  return Object.entries(cost).every(([k, v]) => (s.inventory[k] || 0) >= v);
}
export function walkable(s: State, x: number, z: number) {
  const t = tileAt(s, x, z);
  return (
    !!t &&
    !blocksPoint(t,x,z) &&
    !buildingAt(s, x, z)
  );
}
export function createState(seed = 84621): State {
  const tiles: Tile[] = [];
  for (let z = 0; z < SIZE; z++)
    for (let x = 0; x < SIZE; x++) {
      const n = noise(x, z, seed),
        r = noise(x + 17, z - 4, seed),
        river = 26 + Math.sin(z * 0.23) * 2.5;
      let terrain: Tile['terrain'] =
        Math.abs(x - river) < 1.65
          ? 'water'
          : Math.abs(x - river) < 2.5
            ? 'sand'
            : 'grass';
      if (z === 19 && x >= 22 && x <= 30) terrain = 'path';
      if ((z === 19 && x > 8 && x < 24) || (x === 15 && z >= 12 && z <= 24))
        terrain = 'path';
      const center = Math.hypot(x - 15, z - 17) < 6.2;
      let resource: string | null = null;
      if (!center && terrain === 'grass') {
        if (n < 0.16) resource = 'tree';
        else if (n < 0.21)
          resource =
            z < 10
              ? r < 0.32
                ? 'crystal'
                : r < 0.65
                  ? 'iron'
                  : 'copper'
              : 'stone';
        else if (n < 0.25) resource = 'bush';
        else if (n < 0.28) resource = 'mushroom';
      }
      tiles.push({
        x,
        z,
        terrain,
        height: terrain === 'water' ? -0.3 : 0,
        resource,
        source: resource,
        amount:
          resource === 'tree'
            ? 3
            : resource === 'bush' || resource === 'mushroom'
              ? 1
              : 3,
        respawn: 0,
        tilled: false,
        water: 0,
        crop: null,
        growth: 0,
        fertilized: false,
        seen: Math.hypot(x - 15, z - 17) < 11,
      });
    }
  const buildings: Building[] = [
    {
      id: 1,
      type: 'home',
      x: 13,
      z: 15,
      level: 1,
      hp: 300,
      timer: 0,
      enabled: true,
    },
    {
      id: 2,
      type: 'campfire',
      x: 16,
      z: 17,
      level: 1,
      hp: 80,
      timer: 0,
      enabled: true,
    },
    {
      id: 3,
      type: 'market',
      x: 18,
      z: 14,
      level: 1,
      hp: 160,
      timer: 0,
      enabled: true,
    },
  ];
  const s: State = {
    settlement: { name: sourceText("m_a1d6250bee"), milestones: [] },
    world: { x: 0, z: 0, generation: 2, edits: {} },
    mine: null,
    version: SAVE_VERSION,
    seed,
    rng: seed,
    tiles,
    buildings,
    animals: [],
    enemies: [],
    jobs: [],
    talents: {},
    friendship: {},
    contracts: {},
    gifts: {},
    talks: {},
    overflow: {},
    storage: {},
    bundles: { donations: {}, completed: [] },
    discoveries: [],
    achievements: [],
    player: { x: 15, z: 19, health: 100, hunger: 100, energy: 100, facing: 0 },
    inventory: {
      wood: 25,
      stone: 18,
      fiber: 10,
      wheatseed: 12,
      carrotseed: 8,
      berry: 8,
      bread: 3,
      feed: 10,
    },
    gold: 180,
    xp: 0,
    level: 1,
    skills: { farming: 0, gathering: 0, combat: 0, crafting: 0, fishing: 0 },
    upgrades: { axe: 0, pickaxe: 0, sword: 0, armor: 0 },
    day: 1,
    time: 0.3,
    weather: 'sun',
    stats: {},
    claimed: [],
    nextId: 4,
    raidDay: 0,
    won: false,
  };
  for (let z = 18; z < 21; z++)
    for (let x = 18; x < 21; x++) {
      const t = tileAt(s, x, z)!;
      t.terrain = 'grass';
      t.tilled = true;
      if (z === 18) {
        t.crop = 'wheat';
        t.growth = x === 18 ? 65 : 30;
        t.water = 100;
      }
    }
  for (const [x, z, type] of [
    [10, 19, 'tree'],
    [11, 21, 'tree'],
    [10, 17, 'stone'],
    [21, 16, 'bush'],
  ] as const) {
    const t = tileAt(s, x, z)!;
    t.resource = type;
    t.source = type;
    t.terrain = 'grass';
    t.amount = 3;
  }
  for (const spot of [...NPCS, ...LANDMARKS])
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        const t = tileAt(s, spot.x + dx, spot.z + dz);
        if (t && t.terrain !== 'water' && !t.crop) {
          t.resource = null;
          t.source = null;
          t.amount = 0;
        }
      }
  registerBaseline(seed, s.tiles);
  return s;
}
export class Engine {
  sharedAnchors?: {x:number;z:number}[];
  network: {motion?:MotionControl;sleep?:SleepStatus|null;guest:boolean;server?:boolean;shared?:boolean;enterShared?:()=>Promise<void>;leaveShared?:()=>Promise<void>;send:(method:string,args:unknown[])=>boolean;peers:Peer[]} | null = null;
  networkActor = false;
  productionRecipient?: string;
  productionInventory?: (recipient: string | undefined) => Pick<State,'inventory'|'overflow'> | undefined;
  worldRevision = 0;
  placementRotation = 0;
  placementCorner = false;
  sprinting = false;
  playerAction: {kind:HumanAction;remaining:number} = {kind:'idle',remaining:0};
  npcMeetings = new Map<string,number>();
  npcMotion = new Map<string,{x:number;z:number;facing:number;action:HumanAction;path:{x:number;z:number}[];destination:string;wait:number}>();
  s: State;
  events: Event[] = [];
  path: { x: number; z: number }[] = [];
  pending: { x: number; z: number; tool: string; selection: string } | null =
    null;
  actionCooldown = 0;
  resting = false;
  systemClock = 0;
  animalMotion = new Map<
    number,
    {
      path: { x: number; z: number }[];
      idle: number;
      follow: number;
      facing: number;
      moving: boolean;
      mood: AnimalAction;
      happy?: number;
    }
  >();
  fishing: { x: number; z: number; timer: number } | null = null;
  enemyPaths = new Map<
    number,
    { ttl: number; path: { x: number; z: number }[] }
  >();
  constructor(state: State = createState(), preserveWindow = false) {
    this.s = state;
    state.settlement ??= { name: sourceText("m_a1d6250bee"), milestones: [] };
    state.talks ??= {};
    state.overflow ??= {};
    state.storage ??= {};
    state.bundles ??= { donations: {}, completed: [] };
    flattenSurface(state);
    if (!hasBaseline(state.seed)) createState(state.seed);
    if (!state.mine && !preserveWindow) shiftWindow(state);
  }
  emit(text: string, kind: Event['kind'] = 'info', x?: number, z?: number, sound?: ActionSound) {
    this.events.push({ text, kind, x, z, sound });
    if (this.events.length > 15) this.events.shift();
  }
  random() {
    this.s.rng = (Math.imul(1664525, this.s.rng) + 1013904223) >>> 0;
    return this.s.rng / 4294967296;
  }
  stat(key: string, n = 1) {
    this.s.stats[key] = (this.s.stats[key] || 0) + n;
  }
  add(items: Bag) {
    let space = Math.max(0, inventoryCapacity(this.s) - inventoryUsed(this.s));
    let full = false;
    for (const [key, amount] of Object.entries(items)) {
      const accepted = Math.min(space, amount);
      this.s.inventory[key] = (this.s.inventory[key] || 0) + accepted;
      space -= accepted;
      if (amount > accepted) {
        const free=Math.max(0,this.storageCapacity()-Object.values(this.s.storage).reduce((n,v)=>n+v,0));
        const stored=Math.min(free,amount-accepted);
        if(stored)this.s.storage[key]=(this.s.storage[key]||0)+stored;
        if(amount-accepted-stored>0)this.s.overflow[key]=(this.s.overflow[key]||0)+amount-accepted-stored;
        full = true;
      }
    }
    if (full)
      this.emit(
        sourceText("m_124cfc4a4f"),
        'bad',
      );
    return !full;
  }
  renameSettlement(name: string) {
    if(this.network?.guest) return this.network.send('renameSettlement',[name]);
    const clean = name.trim().replace(/\s+/g, ' ');
    if (
      !clean ||
      clean.length > 32 ||
      Array.from(clean).some(
        (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127,
      )
    )
      return false;
    this.s.settlement.name = clean;
    this.emit(sourceText("m_c590422a14", { p0: clean }), 'good');
    return true;
  }
  claimMilestone(id: string) {
    if(this.network?.guest) return this.network.send('claimMilestone',[id]);
    const milestone = nextMilestone(this.s);
    if (!milestone || milestone.id !== id || !milestoneReady(this.s, milestone))
      return false;
    this.s.settlement.milestones.push(id);
    this.add(milestone.reward);
    this.celebrate(sourceText("m_1d3c6c040c", { p0: this.s.settlement.name, p1: milestone.name }));
    return true;
  }
  storageCapacity() {
    const buildings=this.s.mine?this.s.mine.surface.buildings:this.s.buildings;
    return buildings.filter(b=>b.type==='chest').reduce((n,b)=>n+b.level*1200,0);
  }
  transferStorage(item:string,quantity:number,deposit:boolean) {
    if(this.network?.guest)return this.network.send('transferStorage',[item,quantity,deposit]);
    if(!Object.hasOwn(ITEMS,item)||!Number.isSafeInteger(quantity)||quantity<=0||!this.storageCapacity())return false;
    const source=deposit?this.s.inventory:this.s.storage,target=deposit?this.s.storage:this.s.inventory;
    const room=deposit?this.storageCapacity()-Object.values(this.s.storage).reduce((n,v)=>n+v,0):inventoryCapacity(this.s)-inventoryUsed(this.s);
    if((source[item]||0)<quantity||room<quantity){this.emit(deposit?sourceText("m_3f7e8095b8"):sourceText("m_2be30d1d33"),'bad');return false;}
    source[item]-=quantity;target[item]=(target[item]||0)+quantity;
    this.emit(deposit?sourceText("m_27d1e20058"):sourceText("m_5a4669cf33"),'good');return true;
  }
  depositMaterials() {
    if(this.network?.guest)return this.network.send('depositMaterials',[]);
    for(const item of ['wood','stone','fiber','copper','iron','coal','crystal','plank','brick','flour','wool']){
      const quantity=Math.min(this.s.inventory[item]||0,this.storageCapacity()-Object.values(this.s.storage).reduce((n,v)=>n+v,0));
      if(quantity>0)this.transferStorage(item,quantity,true);
    }
  }
  prepareMaterials(kind: MaterialTarget, id: string | number, token?: string) {
    if (this.network?.guest) return this.network.send('prepareMaterials', token === undefined ? [kind, id] : [kind, id, token]);
    const cost = materialCost(this.s, kind, id, token);
    if (!cost) { this.emit(sourceText("m_604fcca0f9"), 'bad'); return false; }
    const plan = materialPlan(this.s, cost);
    if (!plan.ready) { this.emit(plan.reason!, 'info'); return false; }
    // Validate the entire transfer before mutating either bag. A competing
    // player may have consumed shared stock since this menu was rendered.
    for (const { id: item, amount } of plan.missing) {
      this.s.storage[item] -= amount;
      this.s.inventory[item] = (this.s.inventory[item] || 0) + amount;
    }
    this.emit(sourceText("m_544b5b7258", { p0: plan.total }), 'good');
    return true;
  }
  collectDelivery() {
    if(this.network?.guest) return this.network.send('collectDelivery',[]);
    const items = { ...this.s.overflow };
    this.s.overflow = {};
    this.add(items);
  }
  donate(bundle: string, item: string, quantity: number) {
    if(this.network?.guest) return this.network.send('donate',[bundle,item,quantity]);
    if (!Object.hasOwn(BUNDLES, bundle)) return false;
    const definition = BUNDLES[bundle];
    if (
      !definition ||
      this.s.bundles.completed.includes(bundle) ||
      !Object.hasOwn(definition.items, item) ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    )
      return false;
    const paid = this.s.bundles.donations[bundle] ?? {};
    const remaining = definition.items[item] - (paid[item] || 0);
    if (quantity > remaining || !this.spend({ [item]: quantity })) return false;
    paid[item] = (paid[item] || 0) + quantity;
    this.s.bundles.donations[bundle] = paid;
    if (
      Object.entries(definition.items).every(
        ([key, count]) => (paid[key] || 0) >= count,
      )
    ) {
      this.s.bundles.completed.push(bundle);
      this.gainXp(100, 'crafting');
      this.celebrate(sourceText("m_beac2f2771", { p0: definition.name, p1: definition.reward }));
    }
    return true;
  }
  celebrate(text: string) {
    this.events.push({
      text,
      kind: 'good',
      celebration: true,
      x: this.s.player.x,
      z: this.s.player.z,
    });
  }
  talk(id: string) {
    if(this.network?.guest) return this.network.send('talk',[id]);
    const npc = NPCS.find((n) => n.id === id);
    const actor=this.npcMotion.get(id);if(actor){actor.action='greeting';actor.wait=3;}
    if (!npc || this.s.mine) return false;
    if (this.s.talks[id] !== this.s.day) {
      this.s.talks[id] = this.s.day;
      this.s.friendship[id] = Math.min(100, (this.s.friendship[id] || 0) + 2);
      this.emit(sourceText("m_30b1df9f57", { p0: npc.name }), 'good');
    }
    return true;
  }
  feedAnimal(id: number) {
    if(this.network?.guest) return this.network.send('feedAnimal',[id]);
    const a = this.s.animals.find((a) => a.id === id);
    if (!a || a.fedDay === this.s.day || !this.spend({ feed: 1 })) return false;
    a.fed = true;
    a.fedDay = this.s.day;
    return true;
  }
  harvestAnimal(id: number) {
    if(this.network?.guest) return this.network.send('harvestAnimal',[id]);
    const a = this.s.animals.find((a) => a.id === id);
    if (!a || !a.ready) return false;
    const output = { [ANIMALS[a.type].product]: a.ready };
    if (!inventoryFits(this.s, output)) {
      this.emit(sourceText("m_a7402906df"), 'bad');
      return false;
    }
    this.add(output);
    this.stat('animalharvest', a.ready);
    a.ready = 0;
    this.gainXp(4, 'farming');
    this.emit(sourceText("m_7472aac906"), 'good');
    return true;
  }
  spend(cost: Bag) {
    if (!canAfford(this.s, cost)) return false;
    for (const [k, n] of Object.entries(cost)) this.s.inventory[k] -= n;
    return true;
  }
  gainXp(n: number, skill = 'gathering') {
    this.s.xp += n;
    this.s.skills[skill] = (this.s.skills[skill] || 0) + n;
    while (this.s.level < 30 && this.s.xp >= xpNext(this.s.level)) {
      this.s.xp -= xpNext(this.s.level);
      this.s.level++;
      this.s.player.energy = 100;
      this.s.gold += this.s.level * 15;
      this.emit(
        sourceText("m_8eeccf7470", { p0: this.s.level }),
        'good',
      );
    }
  }
  findPath(
    tx: number,
    tz: number,
    adjacent = false,
    origin: {x:number;z:number} = this.s.player,
    maxNodes = this.s.tiles.length,
  ) {
    const started=frameProfile.begin();
    const result=findRoute(this.s,{x:Math.round(tx),z:Math.round(tz)},origin,adjacent,maxNodes);
    frameProfile.end('pathfinding',started);return result;
  }

  go(x: number, z: number, tool = 'hand', selection = 'wheat') {
    const t = tileAt(this.s, x, z);
    if (!t) return;
    this.resting = false;
    this.fishing = null;
    const action =
      tool !== 'hand' ||
      this.isPortal(t.x, t.z) ||
      !!t.resource ||
      !!t.crop ||
      !!buildingAt(this.s, x, z);
    const path = this.findPath(t.x, t.z, action);
    if (!path) {
      this.emit(sourceText("m_83cb940d7e"), 'bad');
      return;
    }
    this.path = path;
    this.pending = action ? { x: t.x, z: t.z, tool, selection } : null;
    if (!path.length && this.pending && this.actionCooldown <= 0) {
      const a = this.pending;
      this.pending = null;
      this.act(a.x, a.z, a.tool, a.selection);
    }
  }
  travelSpeed() {return movementSpeed(this.s.player.energy)*(this.sprinting && this.s.player.energy>20 ? 1.5 : 1);}
  sharedRange(x:number,z:number) {
    const anchors=this.sharedAnchors ?? (this.network?.shared ? this.network.peers.map(p=>p.player) : []);
    return withinSharedRange(this.s.player,{x,z},anchors);
  }
  move(dx: number, dz: number, dt: number) {
    this.path = [];
    this.pending = null;
    this.resting = false;
    this.fishing = null;
    if(this.network?.motion){const d=Math.max(1,Math.hypot(dx,dz));this.network.motion.intent(dx/d,dz/d);return;}
    const p = this.s.player,
      d = Math.hypot(dx, dz) || 1,
      oldX=p.x,oldZ=p.z,
      x = p.x + (dx / d) * this.travelSpeed() * dt,
      z = p.z + (dz / d) * this.travelSpeed() * dt;
    if (this.sharedRange(x,p.z) && walkable(this.s, x, p.z))
      p.x = this.s.mine ? Math.max(0, Math.min(SIZE - 1, x)) : x;
    if (this.sharedRange(p.x,z) && walkable(this.s, p.x, z))
      p.z = this.s.mine ? Math.max(0, Math.min(SIZE - 1, z)) : z;
    if(Math.hypot(p.x-oldX,p.z-oldZ)<dt*this.travelSpeed()*.15){
      for(const angle of [Math.PI/6,-Math.PI/6,Math.PI/3,-Math.PI/3]){
        const nx=oldX+(dx*Math.cos(angle)-dz*Math.sin(angle))/d*this.travelSpeed()*dt,nz=oldZ+(dx*Math.sin(angle)+dz*Math.cos(angle))/d*this.travelSpeed()*dt;
        if(this.sharedRange(nx,nz)&&walkable(this.s,nx,nz)){p.x=nx;p.z=nz;break;}
      }
    }
    if(this.sprinting && (dx || dz)) p.energy=Math.max(0,p.energy-dt*1.8);
    p.facing = Math.atan2(dx, dz);
    this.streamWorld();
  }
  streamWorld() {
    if(this.network?.guest || this.networkActor) return;
    if (shiftWindow(this.s)) {
      this.s.enemies = this.s.enemies.filter((e) => !!tileAt(this.s, e.x, e.z));
      this.enemyPaths.clear();
    }
  }
  returnHome() {
    if(this.network?.server)return this.network.send('returnHome',[]);
    if(this.network?.guest) {this.emit(sourceText("m_dcb29f639a"),'info');return false;}
    if (this.s.mine || this.s.enemies.length) {
      this.emit(sourceText("m_73805d6dee"), 'bad');
      return false;
    }
    const home = this.s.buildings.find((b) => b.type === 'home');
    if (!home) return false;
    shiftWindow(this.s, home.x, home.z);
    const spot = this.nearbyFree(home.x, home.z);
    if (!spot) return false;
    Object.assign(this.s.player, spot);
    this.clearMovement();
    this.emit(sourceText("m_d4b1d83238"), 'good');
    return true;
  }
  isPortal(x: number, z: number) {
    return this.s.mine
      ? (x === MINE_LIFT.x && z === MINE_LIFT.z) ||
          (x === MINE_STAIRS.x && z === MINE_STAIRS.z)
      : x === MINE_ENTRANCE.x && z === MINE_ENTRANCE.z;
  }
  clearMovement() {
    this.path = [];
    this.pending = null;
    this.fishing = null;
    this.resting = false;
    this.actionCooldown = 0;
    this.enemyPaths.clear();
  }
  enterMine(floor = 1) {
    if(this.network?.server)return this.network.send('enterMine',[floor]);
    if(this.network?.guest) {this.emit(sourceText("m_dcb29f639a"),'info');return false;}
    if (
      !Number.isInteger(floor) ||
      floor < 1 ||
      floor > Math.min(5, this.s.stats.minecheckpoint || 1)
    )
      return false;
    const s = this.s;
    if (
      s.mine ||
      Math.hypot(s.player.x - MINE_ENTRANCE.x, s.player.z - MINE_ENTRANCE.z) >
        2.2
    )
      return false;
    if (s.level < 3) {
      this.emit(sourceText("m_7d58d7b26c"), 'bad');
      return false;
    }
    if (
      s.enemies.length ||
      (!s.won && s.day >= 3 && s.day % 3 === 0 && s.raidDay !== s.day)
    ) {
      this.emit(sourceText("m_11748b8bfe"), 'bad');
      return false;
    }
    if (s.stats.mineday === s.day) {
      this.emit(
        sourceText("m_804118d410"),
        'bad',
      );
      return false;
    }
    s.stats.mineday = s.day;
    s.mine = {
      floor: 1,
      mined: 0,
      surface: {
        tiles: s.tiles,
        buildings: s.buildings,
        animals: s.animals,
        x: s.player.x,
        z: s.player.z,
      },
    };
    s.buildings = [];
    s.animals = [];
    this.loadMineFloor(floor);
    return true;
  }
  loadMineFloor(floor: number) {
    const s = this.s;
    if (!s.mine) return;
    s.mine.floor = floor;
    s.stats.minecheckpoint = Math.max(s.stats.minecheckpoint || 1, floor);
    s.mine.mined = 0;
    s.stats.minedepth = Math.max(s.stats.minedepth || 0, floor);
    s.tiles = mineTiles((s.seed + s.day * 31) >>> 0, floor);
    s.enemies = [];
    Object.assign(s.player, { x: MINE_LIFT.x, z: MINE_LIFT.z - 1 });
    const kinds: EnemyKind[] =
      floor === 5
        ? ['guardian', 'shaman', 'golem']
        : floor === 4
          ? ['golem', 'shaman', 'golem', 'slime']
          : floor === 3
            ? ['golem', 'shaman', 'slime']
            : floor === 2
              ? ['shaman', 'slime', 'slime']
              : ['slime', 'slime'];
    const spots = [
      { x: 18, z: 11 },
      { x: 11, z: 17 },
      { x: 25, z: 17 },
      { x: 18, z: 20 },
    ];
    kinds.forEach((kind, i) => {
      const hp = ENEMIES[kind].hp + (kind === 'guardian' ? 0 : floor * 5);
      s.enemies.push({
        id: s.nextId++,
        kind,
        ...spots[i],
        hp,
        maxHp: hp,
        cooldown: 1.5,
      });
    });
    this.clearMovement();
    this.worldRevision++;
    this.emit(
      sourceText("m_76b7ddaf54", { p0: floor, p1: FLOOR_NAMES[floor - 1] }),
      'info',
    );
  }
  descendMine() {
    if(this.network?.server)return this.network.send('descendMine',[]);
    if(this.network?.guest) {this.emit(sourceText("m_dcb29f639a"),'info');return false;}
    const s = this.s,
      mine = s.mine;
    if (
      !mine ||
      Math.hypot(s.player.x - MINE_STAIRS.x, s.player.z - MINE_STAIRS.z) > 2.2
    )
      return false;
    if (s.enemies.length || mine.mined < 4) {
      this.emit(
        sourceText("m_7c8c2006da", { p0: s.enemies.length, p1: Math.min(4, mine.mined) }),
        'bad',
      );
      return false;
    }
    if (mine.floor < MINE_FLOORS) this.loadMineFloor(mine.floor + 1);
    else {
      this.stat('minecomplete');
      this.add({ crystal: 12, iron: 15, coal: 10 });
      s.gold += 400;
      this.gainXp(220, 'combat');
      this.leaveMine(true);
      this.emit(
        sourceText("m_3479abc674"),
        'good',
      );
    }
    return true;
  }
  leaveMine(forced = false) {
    if(this.network?.server)return this.network.send('leaveMine',[]);
    if(this.network?.guest) {this.emit(sourceText("m_dcb29f639a"),'info');return false;}
    const s = this.s,
      mine = s.mine;
    if (
      !mine ||
      (!forced &&
        Math.hypot(s.player.x - MINE_LIFT.x, s.player.z - MINE_LIFT.z) > 2.2)
    )
      return false;
    s.tiles = mine.surface.tiles;
    s.buildings = mine.surface.buildings;
    s.animals = mine.surface.animals;
    Object.assign(s.player, { x: mine.surface.x, z: mine.surface.z });
    s.mine = null;
    s.enemies = [];
    this.clearMovement();
    this.worldRevision++;
    if (!forced)
      this.emit(
        sourceText("m_98f760ee6e"),
        'good',
      );
    return true;
  }
  talentPoints() {
    return Math.max(
      0,
      this.s.level -
        1 -
        Object.values(this.s.talents).reduce((a, b) => a + b, 0),
    );
  }
  unlockTalent(id: string) {
    if(this.network?.guest) return this.network.send('unlockTalent',[id]);
    if (
      !Object.hasOwn(TALENTS, id) ||
      this.talentPoints() < 1 ||
      (this.s.talents[id] || 0) >= 5
    )
      return false;
    const cost = 40 * ((this.s.talents[id] || 0) + 1);
    if (this.s.gold < cost) {
      this.emit(sourceText("m_08939f5c92"), 'bad');
      return false;
    }
    this.s.gold -= cost;
    this.s.talents[id] = (this.s.talents[id] || 0) + 1;
    this.emit(sourceText("m_e060438953", { p0: TALENTS[id].name }), 'good');
    return true;
  }
  energy(cost: number) {
    cost *= 1 - 0.08 * (this.s.talents.vigor || 0);
    if (this.s.player.energy < cost) {
      this.emit(sourceText("m_12215a31cf"), 'bad');
      return false;
    }
    this.s.player.energy -= cost;
    return true;
  }
  act(x: number, z: number, tool: string, selection = 'wheat') {
    if(this.network?.guest) {
      if(tool==='build') return this.build(selection,x,z);
      return this.network.send('act',[x,z,tool,selection]);
    }
    if (tool === 'sword') {
      this.attack();
      return;
    }
    if (this.actionCooldown > 0) return;
    const t = tileAt(this.s, x, z);
    if (!t || Math.hypot(x - this.s.player.x, z - this.s.player.z) > 1.8)
      return;
    if (tool === 'hand' && this.isPortal(x, z)) {
      if (!this.s.mine) this.enterMine();
      else if (x === MINE_LIFT.x && z === MINE_LIFT.z) this.leaveMine();
      else this.descendMine();
      return;
    }
    if (t.terrain === 'wall') return;
    if (this.s.mine && !['hand', 'pickaxe', 'sword'].includes(tool)) {
      this.emit(
        sourceText("m_325d38212a"),
        'bad',
      );
      return;
    }
    if (tool === 'build') {
      this.build(selection, x, z);
      return;
    }
    const b = buildingAt(this.s, x, z);
    if (b) {
      const orchard = orchardStatus(b, this.s);
      if (orchard) {
        if (tool !== 'hand' || !orchard.ready) { this.emit(orchard.label, 'info', x, z); return; }
        if (!inventoryFits(this.s, { [orchard.fruit]: orchard.yield })) { this.emit(sourceText("m_791f46fa29"), 'bad'); return; }
        if (!this.energy(2)) return;
        b.harvestDay = this.s.day;
        this.add({ [orchard.fruit]: orchard.yield });
        this.stat('fruit', orchard.yield);
        this.gainXp(18, 'farming');
        this.playerAction = { kind: 'harvesting', remaining: .8 };
        this.actionCooldown = .4;
        this.emit(sourceText("m_1f9eb53f3c", { p0: orchard.yield, p1: ITEMS[orchard.fruit].name }), 'good', x, z, 'harvest');
        return;
      }
      this.emit(sourceText("m_885d443580", { p0: BUILDINGS[b.type].name, p1: b.level }));
      return;
    }
    if (t.resource) {
      const r = t.resource,
        required =
          r === 'tree'
            ? 'axe'
            : ['stone', 'iron', 'copper', 'crystal'].includes(r)
              ? 'pickaxe'
              : 'hand';
      if (tool !== required && tool !== 'hand') {
        this.emit(sourceText("m_63ae232e4d"), 'bad');
        return;
      }
      if (!this.energy(3)) return;
      this.playerAction={kind:'working',remaining:.7};
      const power = Math.min(t.amount, 1 + (this.s.upgrades[required] || 0));
      const count =
        ((r === 'tree' ? 3 : r === 'stone' ? 3 : r === 'bush' ? 3 : 2) +
          (this.s.talents.forage || 0)) *
        power;
      const id = r === 'tree' ? 'wood' : r === 'bush' ? 'berry' : r;
      this.add({ [id]: count });
      if (r === 'tree') this.add({ fiber: power });
      if (r === 'stone' && this.random() < 0.4) this.add({ coal: power });
      t.amount -= power;
      if (t.amount <= 0) {
        t.resource = null;
        t.respawn = this.s.day + 3;
      }
      this.stat(id, count);
      if (this.s.mine) this.s.mine.mined += power;
      this.gainXp(7 * power);
      this.actionCooldown = 0.38;
      this.emit(sourceText("m_53d5fdea60", { p0: count, p1: ITEMS[id].name }), 'good', x, z, required === 'hand' ? 'harvest' : required);
      return;
    }
    if (tool === 'hoe' && t.crop) {
      if (!this.energy(1)) return;
      t.crop = null; t.growth = 0; t.fertilized = false;
      this.actionCooldown = .4;
      this.emit(sourceText("m_023ad3e1e8"), 'info', x, z, 'hoe');
      return;
    }
    if (t.crop && t.growth >= CROPS[t.crop].grow) {
      if (!this.energy(2)) return;
      this.playerAction={kind:'harvesting',remaining:.8};
      const crop = t.crop,
        c = CROPS[crop],
        count =
          c.yield +
          (t.fertilized ? 1 : 0) +
          Math.floor((this.s.talents.harvest || 0) / 2);
      this.add(c.regrow ? { [crop]: count } : { [crop]: count, [c.seed]: 1 });
      t.crop = c.regrow ? crop : null;
      t.growth = c.regrow ? c.grow - c.regrow : 0;
      if (!c.regrow) t.fertilized = false;
      this.actionCooldown = .4;
      this.stat('harvest');
      this.gainXp(16, 'farming');
      this.emit(sourceText("m_eb7afad007", { p0: count, p1: c.name, p2: c.regrow ? sourceText("m_5d53a76ee3") : sourceText("m_aa09c67c93") }), 'good', x, z, 'harvest');
      return;
    }
    if (tool === 'hoe' && t.terrain === 'grass' && !t.tilled) {
      if (!this.energy(2)) return;
      t.tilled = true;
      this.stat('till');
      this.gainXp(3, 'farming');
      this.emit(sourceText("m_9ca2a064c9"), 'good', x, z, 'hoe');
    } else if (tool === 'seed' && t.tilled && !t.crop) {
      const c = CROPS[selection];
      if (!c || this.s.level < c.level) {
        this.emit(sourceText("m_4e931c4ef2"), 'bad');
        return;
      }
      if (!this.s.inventory[c.seed]) {
        this.emit(sourceText("m_65c6c71eab"), 'bad');
        return;
      }
      if (!this.energy(1)) return;
      this.s.inventory[c.seed]--;
      t.crop = selection;
      t.growth = 0;
      this.stat('plant');
      this.gainXp(5, 'farming');
      this.emit(sourceText("m_aff534b1be", { p0: c.name }), 'good', x, z, 'seed');
    } else if (tool === 'water' && t.tilled) {
      if (t.water > 90) return;
      if (!this.energy(1)) return;
      t.water = 100;
      this.emit(sourceText("m_998c1b5b01"), 'good', x, z, 'water');
    } else if (tool === 'fertilize' && t.tilled && !t.fertilized) {
      if (!this.spend({ fertilizer: 1 })) {
        this.emit(sourceText("m_1b2379b9f8"), 'bad');
        return;
      }
      t.fertilized = true;
      this.emit(sourceText("m_b32b93bf11"), 'good', x, z);
    } else if (tool === 'fish' && t.terrain === 'water') {
      if (!this.energy(3)) return;
      this.fishing = { x, z, timer: 3.4 };
      this.emit(sourceText("m_32856f759d"), 'info', x, z, 'fish');
    } else if (tool === 'hoe' && t.terrain === 'path') {
      if (!this.energy(2)) return;
      t.terrain = 'grass';
      t.tilled = true;
      this.stat('till');
      this.gainXp(3, 'farming');
    } else if (tool === 'seed' && !t.tilled)
      this.emit(sourceText("m_13d8882414"), 'info');
    else if (t.crop)
      this.emit(
        sourceText("m_a79de4cf0a", { p0: CROPS[t.crop].name, p1: Math.floor((t.growth / CROPS[t.crop].grow) * 100), p2: t.water <= 0 ? sourceText("m_4458aab9b6") : '' }),
      );
  }
  build(type: string, x: number, z: number, rotation = this.placementRotation, corner = this.placementCorner) {
    if(this.network?.guest) return this.network.send('build',[type,x,z,rotation,corner]);
    if (!Number.isInteger(rotation) || rotation < 0 || rotation > 3) return false;
    if (this.s.mine) return false;
    const s = this.s,
      d = BUILDINGS[type],
      t = tileAt(s, x, z);
    if (!d || !t) return false;
    if (s.level < d.level) {
      this.emit(sourceText("m_97af3dbd9a", { p0: d.level }), 'bad');
      return false;
    }
    if (d.unique && s.buildings.some((b) => b.type === type)) {
      this.emit(sourceText("m_8edd380493"), 'bad');
      return false;
    }
    if (
      NPCS.some((n) => n.x === x && n.z === z) ||
      LANDMARKS.some((n) => Math.hypot(n.x - x, n.z - z) < 1.5) ||
      t.terrain === 'water' ||
      t.terrain === 'path' ||
      t.resource ||
      t.crop ||
      buildingAt(s, x, z) ||
      Math.hypot(s.player.x - x, s.player.z - z) < 0.65 ||
      (Math.round(s.player.x) === t.x && Math.round(s.player.z) === t.z) ||
      s.animals.some((a) => Math.hypot(a.x - x, a.z - z) < 0.7) ||
      s.enemies.some((e) => Math.hypot(e.x - x, e.z - z) < 0.7)
    ) {
      this.emit(sourceText("m_c248ac03e3"), 'bad');
      return false;
    }
    if (!this.spend(d.cost)) {
      this.emit(sourceText("m_cc61fb4959"), 'bad');
      return false;
    }
    s.buildings.push({
      id: s.nextId++,
      type,
      rotation,
      corner: ['fence','wall'].includes(type) && corner,
      x: t.x,
      z: t.z,
      level: 1,
      hp: d.hp,
      ...(d.orchard ? { plantedDay: s.day, harvestDay: 0 } : {}),
      timer: 0,
      enabled: true,
      ...(d.production ? { recipe: 'default', processing: false, repeat: false } : {}),
    });
    t.tilled = false;
    t.water = 0;
    this.stat('build');
    if (d.orchard) this.stat('orchard');
    if (type === 'beacon') s.stats.beacon = 1;
    this.gainXp(35, 'crafting');
    this.emit(sourceText("m_0bdb678193", { p0: d.name }), 'good', x, z);
    return true;
  }
  rotateBuilding(id: number) {
    if(this.network?.guest) return this.network.send('rotateBuilding',[id]);
    const b=this.s.buildings.find(b=>b.id===id);
    if (!b || this.s.mine) return false;
    b.rotation=((b.rotation || 0)+1)%4;
    return true;
  }
  reshapeBuilding(id: number) {
    if(this.network?.guest) return this.network.send('reshapeBuilding',[id]);
    const b=this.s.buildings.find(b=>b.id===id);
    if (!b || !['fence','wall'].includes(b.type)) return false;
    b.corner=!b.corner; return true;
  }
  toggleBuilding(id: number) {
    if(this.network?.guest) return this.network.send('toggleBuilding',[id]);
    const b=this.s.buildings.find(b=>b.id===id);
    if (!b) return false;
    b.enabled=!b.enabled; return true;
  }
  setMachineRecipe(id: number, recipe: string) {
    if(this.network?.guest) return this.network.send('setMachineRecipe',[id,recipe]);
    const b = this.s.buildings.find(b => b.id === id);
    const selected = b && machineRecipes(b.type).find(r => r.id === recipe);
    if (!b || !selected || this.s.level < selected.level || b.processing) return false;
    b.recipe = recipe; b.timer = 0; b.repeat = false;
    this.emit(sourceText("m_e187c59a01"), 'good');
    return true;
  }
  setMachineRepeat(id: number, repeat: boolean) {
    if(this.network?.guest) return this.network.send('setMachineRepeat',[id,repeat]);
    const b = this.s.buildings.find(b => b.id === id);
    if (!b || !machineRecipe(b) || typeof repeat !== 'boolean') return false;
    b.repeat = repeat;
    this.emit(repeat ? sourceText("m_e31835c365") : sourceText("m_af810dc82f"), 'info');
    return true;
  }
  withProductionInventory(recipient:string|undefined,action:()=>void) {
    const bag=this.productionInventory?.(recipient);
    if(!bag){action();return;}
    const saved={inventory:this.s.inventory,overflow:this.s.overflow};
    this.s.inventory=bag.inventory;this.s.overflow=bag.overflow;
    try{action();}finally{bag.inventory=this.s.inventory;bag.overflow=this.s.overflow;Object.assign(this.s,saved);}
  }
  startProduction(id: number) {
    if(this.network?.guest) return this.network.send('startProduction',[id]);
    const b = this.s.buildings.find(b => b.id === id), r = b && machineRecipe(b);
    if (!b || !r || b.processing || b.hp <= 0 || this.s.level < r.level) return false;
    if (!this.spend(r.input)) { this.emit(sourceText("m_2926de3734"), 'bad'); return false; }
    b.processing = true; b.enabled = true;
    if(this.productionRecipient)b.recipient=this.productionRecipient;
    b.timer = Math.max(0, Math.min(b.timer, r.time));
    this.emit(sourceText("m_1e3a4f95a8"), 'good');
    return true;
  }
  upgrade(id: number) {
    if(this.network?.guest) return this.network.send('upgrade',[id]);
    const b = this.s.buildings.find((b) => b.id === id);
    if (!b) return false;
    if (b.level >= 3) {
      this.emit(sourceText("m_14bb949f6d"));
      return false;
    }
    if (this.s.level < b.level * 2) {
      this.emit(sourceText("m_97af3dbd9a", { p0: b.level * 2 }), 'bad');
      return false;
    }
    if (!this.spend(upgradeCost(b))) {
      this.emit(sourceText("m_de60a6c4d7"), 'bad');
      return false;
    }
    b.level++;
    b.hp = BUILDINGS[b.type].hp * b.level;
    this.stat('upgrade');
    this.gainXp(50, 'crafting');
    this.emit(sourceText("m_7f250c6352", { p0: BUILDINGS[b.type].name, p1: b.level }), 'good', b.x, b.z);
    if (b.type === 'beacon') {
      this.s.stats.beacon = b.level;
      if (b.level === 3) {
        this.s.won = true;
        this.s.enemies = [];
        this.emit(sourceText("m_47a892cfaf"), 'good');
      }
    }
    return true;
  }
  repair(id: number) {
    if(this.network?.guest) return this.network.send('repair',[id]);
    const b = this.s.buildings.find((b) => b.id === id);
    if (!b || b.hp >= BUILDINGS[b.type].hp * b.level) return false;
    if (!this.spend({ wood: 3, stone: 2 })) {
      this.emit(sourceText("m_5ca5687a14"), 'bad');
      return false;
    }
    b.hp = Math.min(BUILDINGS[b.type].hp * b.level, b.hp + 80);
    this.emit(sourceText("m_b6b55c576e"), 'good');
    return true;
  }
  demolish(id: number) {
    if(this.network?.guest) return this.network.send('demolish',[id]);
    const b = this.s.buildings.find((b) => b.id === id);
    if (!b || b.type === 'home' || b.type === 'market') {
      this.emit(sourceText("m_f09122c2fc"), 'bad');
      return false;
    }
    const reserved = b.processing && machineRecipe(b);
    if (reserved) this.add(reserved.input);
    this.add(
      Object.fromEntries(
        Object.entries(BUILDINGS[b.type].cost).map(([k, v]) => [
          k,
          Math.floor(v * 0.5),
        ]),
      ),
    );
    this.s.buildings = this.s.buildings.filter((b) => b.id !== id);
    this.emit(sourceText("m_b92972c0ae"));
    return true;
  }
  craft(id: string) {
    if(this.network?.guest) return this.network.send('craft',[id]);
    const r = RECIPES[id];
    if (!r) return false;
    const s = this.s;
    if (s.jobs.length >= 3) {
      this.emit(
        sourceText("m_90d3ed4329"),
        'bad',
      );
      return false;
    }
    if (s.level < r.level) {
      this.emit(sourceText("m_97af3dbd9a", { p0: r.level }), 'bad');
      return false;
    }
    if (r.station && !s.buildings.some((b) => b.type === r.station)) {
      this.emit(sourceText("m_8e9edc2e4c", { p0: BUILDINGS[r.station].name }), 'bad');
      return false;
    }
    const tier = r.upgrade
      ? (s.upgrades[r.upgrade] || 0) +
        s.jobs.filter((j) => RECIPES[j.recipe].upgrade === r.upgrade).length
      : 0;
    if (r.upgrade && tier >= 3) {
      this.emit(sourceText("m_0b32066591"));
      return false;
    }
    const cost = Object.fromEntries(
      Object.entries(r.input).map(([k, v]) => [k, v * (tier + 1)]),
    );
    if (!canAfford(s, cost)) {
      this.emit(sourceText("m_2926de3734"), 'bad');
      return false;
    }
    if (!this.energy(4)) return false;
    this.spend(cost);
    const duration =
      (r.upgrade ? 30 : r.station ? 12 : 7) *
      (1 - 0.001 * (s.friendship.torin || 0));
    s.jobs.push({ recipe: id, remaining: duration, total: duration, ...(this.productionRecipient?{recipient:this.productionRecipient}:{}) });
    this.emit(sourceText("m_53b94d6264", { p0: r.name }), 'good');
    return true;
  }
  eat(id: string) {
    if(this.network?.guest) return this.network.send('eat',[id]);
    const i = ITEMS[id];
    if (!i || (!i.food && !i.energy && !i.heal) || !(this.s.inventory[id] > 0))
      return false;
    const p = this.s.player;
    if (
      (!i.food || p.hunger >= 100) &&
      (!i.energy || p.energy >= 100) &&
      (!i.heal || p.health >= 100)
    ) {
      this.emit(sourceText("m_64e24c4da0"));
      return false;
    }
    this.s.inventory[id]--;
    this.playerAction={kind:'eating',remaining:1.6};
    p.hunger = Math.min(100, p.hunger + (i.food || 0));
    p.energy = Math.min(100, p.energy + (i.energy || 0));
    p.health = Math.min(100, p.health + (i.heal || 0));
    this.emit(sourceText("m_1c15ca0184", { p0: i.name }), 'good');
    return true;
  }
  trade(id: string, quantity: number, buy: boolean) {
    if(this.network?.guest) return this.network.send('trade',[id,quantity,buy]);
    if (this.s.mine) {
      this.emit(sourceText("m_eb5a42b8f7"), 'bad');
      return false;
    }
    const item = ITEMS[id];
    if (
      !Object.hasOwn(ITEMS, id) ||
      typeof buy !== 'boolean' ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 999
    )
      return false;
    const value = tradeUnitPrice(this.s, id, buy) * quantity;
    if (buy) {
      if (!marketSells(id)) {
        this.emit(sourceText("m_d38f5b86b8"), 'bad');
        return false;
      }
      if (this.s.gold < value) {
        this.emit(sourceText("m_76f98ce395"), 'bad');
        return false;
      }
      if (!inventoryFits(this.s, { [id]: quantity })) {
        this.emit(sourceText("m_7480c07055"), 'bad');
        return false;
      }
      this.s.gold -= value;
      this.add({ [id]: quantity });
    } else {
      if (!this.spend({ [id]: quantity })) return false;
      this.s.gold += value;
      const old = Math.floor((this.s.stats.sell || 0) / 15);
      this.stat('sell', value);
      const xp = Math.floor(this.s.stats.sell / 15) - old;
      if (xp) this.gainXp(xp, 'crafting');
    }
    this.emit(
      sourceText("m_f0c21295d3", { p0: quantity, p1: item.name, p2: buy ? sourceText("m_2d71b985bf") : sourceText("m_f5daadc130") }),
      'good',
    );
    return true;
  }
  buyAnimal(type: string) {
    if(this.network?.guest) return this.network.send('buyAnimal',[type]);
    const d = ANIMALS[type];
    if (!d) return false;
    const s = this.s,
      home = s.buildings.find(
        (b) =>
          b.type === d.home &&
          s.animals.filter((a) => a.home === b.id).length < 3 * b.level,
      );
    if (!home) {
      this.emit(
        sourceText("m_fd97c3fb1b", { p0: BUILDINGS[d.home].name }),
        'bad',
      );
      return false;
    }
    if (s.gold < d.cost) {
      this.emit(sourceText("m_76f98ce395"), 'bad');
      return false;
    }
    const spot = this.nearbyFree(home.x, home.z);
    if (!spot) {
      this.emit(sourceText("m_b039203e4b"), 'bad');
      return false;
    }
    s.gold -= d.cost;
    s.animals.push({
      id: s.nextId++,
      type,
      home: home.id,
      x: spot.x,
      z: spot.z,
      timer: 0,
      fed: false,
    });
    this.stat('animals');
    this.gainXp(20, 'farming');
    this.emit(sourceText("m_66dc95bc6f", { p0: d.name }), 'good');
    return true;
  }
  petAnimal(id: number) {
    if(this.network?.guest) return this.network.send('petAnimal',[id]);
    const a = this.s.animals.find((a) => a.id === id);
    if (!a || a.pettedDay === this.s.day || !tileAt(this.s, a.x, a.z))
      return false;
    a.pettedDay = this.s.day;
    a.bond = Math.min(100, (a.bond || 0) + 15);
    this.stat('care');
    const motion = this.animalMotion.get(id);
    if (motion) {
      motion.follow = 18;
      motion.happy = 3;
      motion.idle = 0;
      motion.path = [];
    }
    this.gainXp(4, 'farming');
    this.emit(sourceText("m_9d96f419c7", { p0: a.name || ANIMALS[a.type].name }), 'good');
    return true;
  }
  renameAnimal(id: number, name: string) {
    if(this.network?.guest) return this.network.send('renameAnimal',[id,name]);
    const a = this.s.animals.find((a) => a.id === id);
    if (!a) return false;
    a.name = name.trim().slice(0, 24);
    return true;
  }
  breedAnimal(id: number) {
    if(this.network?.guest) return this.network.send('breedAnimal',[id]);
    const s = this.s,
      a = s.animals.find((a) => a.id === id);
    if (!a || s.mine || !tileAt(s, a.x, a.z)) return false;
    const home = s.buildings.find((b) => b.id === a.home);
    const ready = (v: Animal) =>
      v.type === a.type &&
      v.home === a.home &&
      s.day - (v.bornDay ?? -3) >= 2 &&
      s.day - (v.breedDay ?? -3) >= 3;
    const partner = s.animals.find((v) => v.id !== id && ready(v));
    if (
      !home ||
      !ready(a) ||
      !partner ||
      s.animals.filter((v) => v.home === a.home).length >= 3 * home.level
    ) {
      this.emit(
        sourceText("m_4e8e544d3f"),
        'bad',
      );
      return false;
    }
    const spot = this.nearbyFree(home.x, home.z);
    if (!spot || !this.spend({ feed: 6 })) {
      this.emit(
        sourceText("m_3bbaaafdcd"),
        'bad',
      );
      return false;
    }
    a.breedDay = partner.breedDay = s.day;
    s.animals.push({
      id: s.nextId++,
      type: a.type,
      home: home.id,
      ...spot,
      timer: 0,
      fed: false,
      bornDay: s.day,
      parent: a.id,
      bond: 0,
    });
    this.stat('animals');
    this.stat('births');
    this.gainXp(30, 'farming');
    this.emit(
      sourceText("m_dba2d16462"),
      'good',
    );
    return true;
  }
  completeContract(id: string, token?: string) {
    if(this.network?.guest) return this.network.send('completeContract',token===undefined?[id]:[id,token]);
    if (this.s.mine) return false;
    const npc = NPCS.find((n) => n.id === id);
    if (!npc || this.s.contracts[id] === this.s.day) return false;
    const offers = dailyOrders(this.s, id), order = token === undefined ? offers[0] : offers.find(o => o.token === token);
    if (!order || this.s.level < order.level) {
      this.emit(sourceText("m_536952841c"), 'bad');
      return false;
    }
    if (!this.spend(order.input)) {
      this.emit(sourceText("m_330b8d51c0"), 'bad');
      return false;
    }
    this.s.contracts[id] = this.s.day;
    const actor=this.npcMotion.get(id);if(actor){actor.action='greeting';actor.wait=3;}
    this.s.friendship[id] = Math.min(100, (this.s.friendship[id] || 0) + 8);
    this.s.gold += order.gold;
    if (order.supplies) this.add(order.supplies);
    this.stat('orders');
    this.gainXp(order.xp, 'crafting');
    this.celebrate(sourceText("m_5256ccc880", { p0: npc.name, p1: order.name, p2: order.gold, p3: order.supplies?sourceText("m_8de478c126"):'' }));
    return true;
  }
  gift(id: string) {
    if(this.network?.guest) return this.network.send('gift',[id]);
    if (this.s.mine) return false;
    const npc = NPCS.find((n) => n.id === id);
    const actor=this.npcMotion.get(id);if(actor){actor.action='greeting';actor.wait=3;}
    if (!npc || this.s.gifts[id] === this.s.day) return false;
    if (!this.spend({ [npc.gift]: 1 })) {
      this.emit(sourceText("m_b7db14d9b2", { p0: ITEMS[npc.gift].name }), 'bad');
      return false;
    }
    this.s.gifts[id] = this.s.day;
    this.s.friendship[id] = Math.min(100, (this.s.friendship[id] || 0) + 12);
    this.emit(sourceText("m_892188b0b7", { p0: npc.name }), 'good');
    return true;
  }
  claimAchievement(id: string) {
    if(this.network?.guest) return this.network.send('claimAchievement',[id]);
    const a = ACHIEVEMENTS.find((a) => a.id === id);
    if (
      !a ||
      this.s.achievements.includes(id) ||
      (this.s.stats[a.stat] || 0) < a.target
    )
      return false;
    this.s.achievements.push(id);
    this.s.gold += a.rewardGold;
    this.emit(sourceText("m_cd9e95e509", { p0: a.name, p1: a.rewardGold }), 'good');
    return true;
  }
  claim(id: string) {
    if(this.network?.guest) return this.network.send('claim',[id]);
    const q = QUESTS.find((q) => q.id === id);
    if (
      !q ||
      this.s.claimed.includes(id) ||
      (this.s.stats[q.stat] || 0) < q.target
    )
      return false;
    this.s.claimed.push(id);
    this.s.gold += q.reward.gold;
    this.add(q.reward.items);
    this.gainXp(q.reward.xp);
    this.celebrate(sourceText("m_4be3c981c3", { p0: q.name, p1: q.reward.gold }));
    return true;
  }
  nearbyFree(x: number, z: number) {
    for (let r = 1; r <= 5; r++)
      for (let dz = -r; dz <= r; dz++)
        for (let dx = -r; dx <= r; dx++)
          if (
            walkable(this.s, x + dx, z + dz) &&
            !this.s.animals.some(
              (a) => Math.hypot(a.x - x - dx, a.z - z - dz) < 0.7,
            ) &&
            !this.s.enemies.some(
              (e) => Math.hypot(e.x - x - dx, e.z - z - dz) < 0.7,
            )
          )
            return { x: x + dx, z: z + dz };
    return null;
  }
  attack() {
    if(this.network?.guest) return this.network.send('attack',[]);
    if (this.actionCooldown > 0) return false;
    const p = this.s.player,
      e = this.s.enemies
        .filter(
          (e) =>
            Math.hypot(e.x - p.x, e.z - p.z) < 2.4 &&
            this.lineOfSight(p.x, p.z, e.x, e.z),
        )
        .sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z),
        )[0];
    if (!e) {
      this.emit(sourceText("m_cb1846c1d2"));
      return false;
    }
    const damage =
      16 + (this.s.upgrades.sword || 0) * 10 + skillLevel(this.s, 'combat') * 2;
    this.actionCooldown = 0.48;
    p.facing = Math.atan2(e.x - p.x, e.z - p.z);
    this.damageEnemy(e, damage);
    this.emit(`−${damage}`, 'good', e.x, e.z, 'sword');
    return true;
  }
  damageEnemy(e: Enemy, damage: number) {
    e.hp -= damage;
    if (e.hp <= 0) {
      this.s.enemies = this.s.enemies.filter((x) => x.id !== e.id);
      const definition = ENEMIES[e.kind || 'wolf'];
      this.s.gold += definition.gold;
      this.add(
        e.kind === 'golem' || e.kind === 'guardian'
          ? { iron: 3, coal: 2 }
          : { fiber: 2 },
      );
      if (this.random() < 0.25) this.add({ crystal: 1 });
      this.stat('kills');
      this.gainXp(definition.xp, 'combat');
      if (e.kind === 'guardian') this.stat('guardians');
      if (!this.s.enemies.length)
        this.emit(
          this.s.mine
            ? sourceText("m_6faff9b6e2")
            : sourceText("m_4e304c98c8"),
          'good',
        );
    }
  }
  raid() {
    if (
      this.s.mine ||
      this.s.won ||
      this.s.day < 3 ||
      this.s.day % 3 !== 0 ||
      this.s.raidDay === this.s.day
    )
      return;
    this.s.raidDay = this.s.day;
    const p = this.s.player,
      n = Math.min(8, 2 + Math.floor(this.s.day / 6));
    for (let i = 0; i < n; i++) {
      const angle = this.random() * Math.PI * 2,
        x = Math.round(p.x + Math.sin(angle) * 9),
        z = Math.round(p.z + Math.cos(angle) * 9),
        spot = walkable(this.s, x, z)
          ? { x, z }
          : this.nearbyFree(
              Math.max(
                worldOrigin(this.s).x + 2,
                Math.min(worldOrigin(this.s).x + worldSize(this.s) - 3, x),
              ),
              Math.max(
                worldOrigin(this.s).z + 2,
                Math.min(worldOrigin(this.s).z + worldSize(this.s) - 3, z),
              ),
            );
      if (spot) {
        const hp = 35 + Math.min(65, this.s.day * 1.5);
        this.s.enemies.push({
          kind:
            this.s.day >= 12 && i === 0
              ? 'golem'
              : this.s.day >= 6 && i % 3 === 0
                ? 'shaman'
                : 'wolf',
          id: this.s.nextId++,
          x: spot.x,
          z: spot.z,
          hp,
          maxHp: hp,
          cooldown: 0,
        });
      }
    }
    this.emit(sourceText("m_29469a3ba9"), 'bad');
  }
  nextDay() {
    const s = this.s;
    s.day++;
    for (const a of s.animals) a.fed = false;
    this.stat('days');
    s.weather = this.random() < 0.28 ? 'rain' : 'sun';
    for (const t of s.tiles) {
      if (
        t.source &&
        !t.resource &&
        t.respawn > 0 &&
        t.respawn <= s.day &&
        !t.crop &&
        !t.tilled &&
        !buildingAt(s, t.x, t.z) &&
        Math.hypot(t.x - s.player.x, t.z - s.player.z) > 1 &&
        !s.animals.some((a) => Math.hypot(a.x - t.x, a.z - t.z) < 1) &&
        !s.enemies.some((e) => Math.hypot(e.x - t.x, e.z - t.z) < 1)
      ) {
        t.resource = t.source;
        t.amount = t.source === 'bush' || t.source === 'mushroom' ? 1 : 3;
        t.respawn = 0;
      }
    }
    this.emit(
      sourceText("m_50f06ea5ba", { p0: s.day, p1: s.weather === 'rain' ? sourceText("m_25f2ce58eb") : sourceText("m_bf90ade1ef") }),
      'good',
    );
  }
  sleep() {
    if(this.network?.server)return this.network.send('sleep',[]);
    if(this.network?.guest) {this.emit(sourceText("m_dcb29f639a"),'info');return false;}
    const s = this.s, p = s.player, blocked=sleepBlockReason(s);
    if(blocked){this.emit(blocked,'info');return false;}
    this.path = [];
    this.pending = null;
    this.fishing = null;
    const advance = (duration: number) => {
      let remaining = duration;
      while (remaining > 1e-8) {
        const step = Math.min(0.5, remaining);
        this.systems(step);
        remaining -= step;
      }
    };
    if (s.time >= 0.65) {
      advance((1 - s.time) * DAY_SECONDS);
      this.nextDay();
      s.time = 0;
    }
    advance((0.28 - s.time) * DAY_SECONDS);
    s.time = 0.28;
    p.health = 100;
    p.energy = 100;
    p.hunger = Math.max(0, p.hunger - 10);
    this.playerAction={kind:'sleeping',remaining:2};
    this.emit(sourceText("m_474159898f"), 'good');
    return true;
  }
  cancelSleep() {
    return this.network?.server ? this.network.send('cancelSleep',[]) : false;
  }
  recover() {
    if (this.s.mine) this.leaveMine(true);
    const shelter = this.s.buildings.find((b) => b.type === 'home');
    if (shelter) shiftWindow(this.s, shelter.x, shelter.z);
    const s = this.s,
      home = s.buildings.find((b) => b.type === 'home'),
      spot = this.nearbyFree(home?.x ?? 15, home?.z ?? 17) ?? { x: 15, z: 19 };
    Object.assign(s.player, {
      x: spot.x,
      z: spot.z,
      health: 65,
      hunger: 45,
      energy: 65,
    });
    s.gold = Math.floor(s.gold * 0.9);
    s.enemies = [];
    this.path = [];
    this.pending = null;
    this.fishing = null;
    this.emit(sourceText("m_519a5b6669"), 'bad');
  }
  systems(dt: number) {
    const s = this.s,
      p = s.player;
    for (const place of this.s.mine ? [] : LANDMARKS) {
      if (
        !s.discoveries.includes(place.id) &&
        Math.hypot(place.x - p.x, place.z - p.z) < 2.2
      ) {
        s.discoveries.push(place.id);
        s.gold += place.reward.gold;
        this.add(place.reward.items);
        this.gainXp(place.reward.xp);
        this.emit(
          sourceText("m_885482e251", { p0: place.name, p1: place.reward.gold }),
          'good',
          place.x,
          place.z,
        );
        this.emit(place.description);
      }
    }
    const job = s.jobs[0];
    if (job) {
      job.remaining -= dt * (1 + 0.12 * (s.talents.artisan || 0));
      if (job.remaining <= 0) {
        const r = RECIPES[job.recipe];
        this.withProductionInventory(job.recipient,()=>this.add(r.output));
        if (r.upgrade) {
          s.upgrades[r.upgrade]++;
          this.stat('upgrade');
        }
        this.stat('craft');
        this.gainXp(10, 'crafting');
        this.emit(sourceText("m_dbcf16bb5b", { p0: r.name }), 'good');
        s.jobs.shift();
      }
    }
    const { watered, sheltered } = farmCoverage(s);
    for (let index = 0; index < s.tiles.length; index++) {
      const t = s.tiles[index];
      if (t.tilled && (s.weather === 'rain' || watered.has(index)))
        t.water = 100;
      if (t.crop) {
        const greenhouse = sheltered.has(index);
        if (
          t.water > 0 &&
          (greenhouse || CROPS[t.crop].seasons.includes(season(s)))
        )
          t.growth = Math.min(
            CROPS[t.crop].grow,
            t.growth +
              dt * cropGrowthRate(s, t.fertilized, greenhouse),
          );
        t.water = Math.max(0, t.water - dt * 0.3);
      }
      if (!t.seen && Math.hypot(t.x - p.x, t.z - p.z) < 7) t.seen = true;
    }
    for (const b of s.buildings) {
      if (!tileAt(s, b.x, b.z)) continue;
      const prod = machineRecipe(b);
      if (!prod || !b.enabled || b.hp <= 0) continue;
      this.withProductionInventory(b.recipient,()=>{
        // Undefined repeat preserves existing saves' continuous production.
        if (!b.processing && b.repeat !== false && s.level >= prod.level && this.spend(prod.input)) b.processing = true;
        if (!b.processing) return;
        b.timer = Math.min(prod.time, Math.max(0, b.timer) + dt * productionRate(s, b));
        if (b.timer >= prod.time && inventoryFits(s, prod.output)) {
          this.add(prod.output); b.timer = 0; b.processing = false;
          this.stat('production'); this.gainXp(2, 'crafting');
          this.emit(sourceText("m_ab5ca71d69", { p0: BUILDINGS[b.type].name }), 'good', b.x, b.z);
        }
      });
    }
    for (const a of s.animals) {
      if (!tileAt(s, a.x, a.z)) continue;
      const d = ANIMALS[a.type];
      let home = s.buildings.find((b) => b.id === a.home);
      if (!home) {
        home = s.buildings.find(
          (b) =>
            b.type === d.home &&
            s.animals.filter((a) => a.home === b.id).length < 3 * b.level,
        );
        if (home) a.home = home.id;
      }
      if (!home) continue;
      if (a.fedDay === undefined && a.fed) a.fedDay = s.day;
      if (a.fedDay !== s.day) this.feedAnimal(a.id);
      if (
        s.day - (a.bornDay ?? -3) < 2 ||
        a.fedDay !== s.day ||
        a.producedDay === s.day ||
        (a.ready || 0) >= 12
      )
        continue;
      a.timer += dt * (s.bundles.completed.includes('ranch') ? 1.2 : 1);
      if (a.timer >= d.time) {
        a.timer = 0;
        a.producedDay = s.day;
        a.ready = Math.min(12, (a.ready || 0) + ((a.bond || 0) >= 60 ? 2 : 1));
      }
    }
  }
  toggleRest() {
    if(this.network?.guest){if(!this.network.send('toggleRest',[]))return false;}
    this.resting=!this.resting;this.path=[];this.pending=null;this.fishing=null;
    if(!this.resting)this.playerAction={kind:'standing',remaining:1};
    return true;
  }
  updateVillagers(dt:number) {
    if(this.s.mine)return;
    let budget=1;
    NPCS.forEach((npc,index)=>{
      let actor=this.npcMotion.get(npc.id);
      if(!actor){actor={x:npc.x,z:npc.z,facing:0,action:'idle',path:[],destination:'',wait:0};this.npcMotion.set(npc.id,actor);}
      if(!tileAt(this.s,actor.x,actor.z))return;
      if(actor.wait>0){actor.wait-=dt;return;}
      const goal=schedule(index,this.s.time,npc),key=goal.x+','+goal.z;
      if(actor.destination!==key && budget>0){
        budget--; const route=this.findPath(goal.x,goal.z,false,actor,384);
        actor.path=route || this.findPath(goal.x,goal.z,true,actor,384) || [];
        actor.destination=key;
      }
      const next=actor.path[0];
      if(next){
        if(!walkable(this.s,next.x,next.z)){actor.path=[];actor.destination='';return;}
        const dx=next.x-actor.x,dz=next.z-actor.z,d=Math.hypot(dx,dz),step=dt*.9;
        actor.facing=Math.atan2(dx,dz);actor.action='walking';
        if(d<=step){actor.x=next.x;actor.z=next.z;actor.path.shift();}
        else {actor.x+=dx/d*step;actor.z+=dz/d*step;}
      }else{
        actor.action=goal.action;
        if(goal.action!=='sleeping' && Math.hypot(actor.x-this.s.player.x,actor.z-this.s.player.z)<2){
          actor.action='talking';actor.facing=Math.atan2(this.s.player.x-actor.x,this.s.player.z-actor.z);
        }
      }
    });
    const actors=[...this.npcMotion.entries()],hour=this.s.day*24+this.s.time*24;
    for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){
      const [id,a]=actors[i],[other,b]=actors[j],key=id+other;
      if(a.wait<=0&&b.wait<=0&&a.action==='walking'&&b.action==='walking'&&Math.hypot(a.x-b.x,a.z-b.z)<1.3&&hour-(this.npcMeetings.get(key)||0)>.5){
        a.action=b.action='talking';a.wait=b.wait=2.2;a.facing=Math.atan2(b.x-a.x,b.z-a.z);b.facing=a.facing-Math.PI;this.npcMeetings.set(key,hour);
      }
    }
  }
  wanderAnimals(dt: number) {
    const s = this.s;
    if (s.mine) return;
    const homes = new Map(s.buildings.map((b) => [b.id, b]));
    const night = s.time < 0.22 || s.time > 0.8;
    let routeBudget = 2;
    for (const a of s.animals) {
      if (!tileAt(s, a.x, a.z)) continue;
      const home = homes.get(a.home);
      if (!home) continue;
      let motion = this.animalMotion.get(a.id);
      if (!motion) {
        motion = {
          path: [],
          idle: this.random() * 3,
          follow: 0,
          facing: 0,
          moving: false,
          mood: 'grazing',
        };
        this.animalMotion.set(a.id, motion);
      }
      motion.follow = Math.max(0, motion.follow - dt);
      motion.happy = Math.max(0,(motion.happy||0)-dt);
      const threat=s.enemies.find(e=>Math.hypot(e.x-a.x,e.z-a.z)<4);
      const mother=s.day-(a.bornDay??-3)<2?s.animals.find(v=>v.id===a.parent):undefined;
      motion.idle = Math.max(0, motion.idle - dt);
      motion.moving = false;
      const nearHome = Math.hypot(a.x - home.x, a.z - home.z) < 2.5;
      if (!motion.path.length && motion.idle <= 0) {
        if (routeBudget <= 0) continue;
        routeBudget--;
        const follow =
          motion.follow > 0 &&
          Math.hypot(s.player.x - home.x, s.player.z - home.z) < 12;
        const center = threat?{x:a.x+(a.x-threat.x)*2,z:a.z+(a.z-threat.z)*2}:mother || (follow ? s.player : home);
        const radius = threat?1:mother||follow||night?2:8;
        if (!night || !nearHome || follow || threat) {
          for (let attempt = 0; attempt < 5; attempt++) {
            const x = Math.round(center.x + (this.random() - 0.5) * radius * 2);
            const z = Math.round(center.z + (this.random() - 0.5) * radius * 2);
            if (!walkable(s, x, z) || tileAt(s, x, z)?.crop) continue;
            const path = this.findPath(
              x,
              z,
              false,
              { ...s.player, x: a.x, z: a.z },
              256,
            );
            if (path && path.length <= 24) {
              motion.path = path;
              break;
            }
          }
        }
        motion.idle = 2 + this.random() * 5;
      }
      const next = motion.path[0];
      if (next) {
        if (!walkable(s, next.x, next.z)) {
          motion.path = [];
          continue;
        }
        const dx = next.x - a.x,
          dz = next.z - a.z,
          distance = Math.hypot(dx, dz);
        const step =
          dt *
          (threat?2.2:motion.follow>0?1.45:a.type === 'chicken' ? 1.15 : 0.8) *
          (s.day - (a.bornDay ?? -3) < 2 ? 0.8 : 1);
        motion.facing = Math.atan2(dx, dz);
        motion.moving = distance > 0.001;
        if (distance <= step) {
          a.x = next.x;
          a.z = next.z;
          motion.path.shift();
        } else {
          a.x += (dx / distance) * step;
          a.z += (dz / distance) * step;
        }
      }
      motion.mood = motion.happy ? 'happy' : motion.moving
        ? threat ? 'fleeing' : mother ? 'following' : motion.follow > 0
          ? 'running'
          : 'walking'
        : night && nearHome
          ? 'sleeping'
          : a.id%3===0 && motion.idle>4 ? 'lying' : 'grazing';
    }
    const living = new Set(s.animals.map((a) => a.id));
    for (const id of this.animalMotion.keys())
      if (!living.has(id)) this.animalMotion.delete(id);
  }
  lineOfSight(x: number, z: number, tx: number, tz: number) {
    const steps = Math.ceil(Math.hypot(tx - x, tz - z) * 5);
    for (let i = 1; i < steps; i++) {
      const t = tileAt(
        this.s,
        x + ((tx - x) * i) / steps,
        z + ((tz - z) * i) / steps,
      );
      if (
        !t ||
        t.terrain === 'wall' ||
        t.resource ||
        buildingAt(this.s, t.x, t.z)
      )
        return false;
    }
    return true;
  }
  combat(dt: number) {
    const s = this.s,
      p = s.player;
    for (const b of s.buildings.filter((b) => b.type === 'tower')) {
      b.timer = Math.max(0, b.timer - dt);
      if (b.timer <= 0) {
        const e = s.enemies.find(
          (e) => Math.hypot(e.x - b.x, e.z - b.z) < 5 + b.level,
        );
        if (e) {
          this.damageEnemy(
            e,
            10 * b.level * (1 + 0.15 * (s.talents.defender || 0)),
          );
          b.timer = 1.2;
        }
      }
    }
    for (const e of [...s.enemies]) {
      e.cooldown = Math.max(0, e.cooldown - dt);
      const definition = ENEMIES[e.kind || 'wolf'];
      const enraged = e.kind === 'guardian' && e.hp < e.maxHp * 0.5;
      if ((e.windup || 0) > 0) {
        e.windup = Math.max(0, e.windup! - dt);
        if (
          e.windup === 0 &&
          Math.hypot(p.x - e.aimX!, p.z - e.aimZ!) < definition.radius &&
          this.lineOfSight(e.x, e.z, p.x, p.z)
        ) {
          const damage = Math.max(
            2,
            definition.damage +
              (enraged ? 7 : 0) -
              (s.upgrades.armor || 0) * 2 -
              (s.talents.defender || 0),
          );
          p.health = Math.max(0, p.health - damage);
          this.resting = false;
          this.emit(sourceText("m_90ee550bda", { p0: damage }), 'bad', p.x, p.z);
        }
        continue;
      }
      const d = Math.hypot(e.x - p.x, e.z - p.z);
      if (d < definition.range && this.lineOfSight(p.x, p.z, e.x, e.z)) {
        if (e.cooldown <= 0) {
          e.aimX = p.x;
          e.aimZ = p.z;
          e.windup = definition.windup * (enraged ? 0.7 : 1);
          e.cooldown = definition.interval * (enraged ? 0.7 : 1);
          this.resting = false;
        }
        continue;
      }
      let navigation = this.enemyPaths.get(e.id);
      if (!navigation || navigation.ttl <= 0) {
        navigation = {
          ttl: 0.9,
          path:
            this.findPath(Math.round(p.x), Math.round(p.z), true, {
              ...p,
              x: e.x,
              z: e.z,
            }) ?? [],
        };
        this.enemyPaths.set(e.id, navigation);
      }
      navigation.ttl -= dt;
      if (navigation.path.length) {
        const next = navigation.path[0],
          vx = next.x - e.x,
          vz = next.z - e.z,
          dist = Math.hypot(vx, vz),
          step = dt * definition.speed * (enraged ? 1.3 : 1);
        if (!walkable(s, next.x, next.z)) {
          navigation.ttl = 0;
          navigation.path = [];
        } else if (dist <= step) {
          e.x = next.x;
          e.z = next.z;
          navigation.path.shift();
        } else {
          e.x += (vx / dist) * step;
          e.z += (vz / dist) * step;
        }
        continue;
      }
      const dx = ((p.x - e.x) / (d || 1)) * dt * 1.0,
        dz = ((p.z - e.z) / (d || 1)) * dt * 1.0,
        obstacle = buildingAt(s, e.x + dx * 6, e.z + dz * 6);
      if (obstacle) {
        if (obstacle.type === 'home' || obstacle.type === 'market') {
          const options = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]
            .map(([ax, az]) => ({ x: e.x + ax * dt, z: e.z + az * dt }))
            .filter((v) => walkable(s, v.x, v.z));
          const side = options.sort(
            (a, b) =>
              Math.hypot(a.x - p.x, a.z - p.z) -
              Math.hypot(b.x - p.x, b.z - p.z),
          )[0];
          if (side) {
            e.x = side.x;
            e.z = side.z;
          }
          continue;
        }
        if (e.cooldown <= 0) {
          obstacle.hp -= 9;
          e.cooldown = 1;
          if (obstacle.hp <= 0) {
            if (obstacle.type === 'home' || obstacle.type === 'market')
              obstacle.hp = 1;
            else {
              s.buildings = s.buildings.filter((b) => b.id !== obstacle.id);
              this.emit(sourceText("m_9553260ef2", { p0: BUILDINGS[obstacle.type].name }), 'bad');
            }
          }
        }
        continue;
      }
      if (walkable(s, e.x + dx, e.z)) e.x += dx;
      else if (walkable(s, e.x, e.z + (dx > 0 ? 1 : -1) * dt))
        e.z += (dx > 0 ? 1 : -1) * dt;
      if (walkable(s, e.x, e.z + dz)) e.z += dz;
      else if (walkable(s, e.x + (dz > 0 ? 1 : -1) * dt, e.z))
        e.x += (dz > 0 ? 1 : -1) * dt;
    }
    for (const e of s.enemies) {
      const o = worldOrigin(s);
      e.x = Math.max(o.x, Math.min(o.x + worldSize(s) - 1, e.x));
      e.z = Math.max(o.z, Math.min(o.z + worldSize(s) - 1, e.z));
    }
    for (const id of this.enemyPaths.keys())
      if (!s.enemies.some((e) => e.id === id)) this.enemyPaths.delete(id);
    if (p.health <= 0) this.recover();
  }
  updateFishing(dt:number) {
    const s=this.s;
    if (this.fishing) {
      this.fishing.timer -= dt;
      if (this.fishing.timer <= 0) {
        const chance = Math.min(
          0.98,
          0.72 +
            (skillLevel(s, 'fishing') - 1) * 0.02 +
            0.03 * (s.talents.angler || 0) +
            0.0005 * (s.friendship.lale || 0),
        );
        if (this.random() < chance) {
          this.add({ fish: 1 });
          if (this.random() < 0.02 * (s.talents.angler || 0)) {
            this.add({ crystal: 1 });
            this.emit(sourceText("m_4b13dd6aa6"), 'good');
          }
          this.stat('fish');
          this.gainXp(13, 'fishing');
          this.emit(sourceText("m_c5841800c8"), 'good', this.fishing.x, this.fishing.z);
        } else this.emit(sourceText("m_3e423c7522"));
        this.fishing = null;
      }
    }
  }
  tick(dt: number) {
    dt = Math.max(0, Math.min(dt, 0.1));
    this.actionCooldown = Math.max(0, this.actionCooldown - dt);
    this.playerAction.remaining=Math.max(0,this.playerAction.remaining-dt);
    const npcStarted=frameProfile.begin();this.updateVillagers(dt);frameProfile.end('npc',npcStarted);
    const s = this.s,
      p = s.player;
    if (this.path.length) {
      if(!this.network?.motion && this.sprinting && p.energy>20)p.energy=Math.max(0,p.energy-dt*1.8);
      const next = this.path[0],
        dx = next.x - p.x,
        dz = next.z - p.z,
        d = Math.hypot(dx, dz);
      if (!this.sharedRange(next.x,next.z) || !walkable(s, next.x, next.z)) {
        this.path = [];
        this.pending = null;
      } else if(this.network?.motion){
        if(d<.015)this.path.shift();
        else {const scale=Math.min(1,d/(this.travelSpeed()*.05));this.network.motion.intent(dx/(d||1)*scale,dz/(d||1)*scale);}
      } else if (d < dt * this.travelSpeed()) {
        p.x = next.x;
        p.z = next.z;
        this.path.shift();
      } else {
        p.x += (dx / d) * dt * this.travelSpeed();
        p.z += (dz / d) * dt * this.travelSpeed();
        p.facing = Math.atan2(dx, dz);
      }
    }
    if (!this.path.length && this.pending && this.actionCooldown <= 0) {
      const a = this.pending;
      this.pending = null;
      this.act(a.x, a.z, a.tool, a.selection);
    }
    this.network?.motion?.frame(dt);
    if(this.network?.guest) return;
    if (!s.mine) s.time += dt / DAY_SECONDS;
    if (s.time >= 1) {
      s.time -= 1;
      this.nextDay();
    }
    this.systemClock += dt;
    if (this.systemClock >= 0.5) {
      const systemsStarted=frameProfile.begin();this.systems(this.systemClock);frameProfile.end('systems',systemsStarted);
      this.systemClock = 0;
    }
    if (this.resting) {
      const warm = s.buildings.some(
        (b) => b.type === 'campfire' && Math.hypot(b.x - p.x, b.z - p.z) < 3,
      );
      p.energy = Math.min(100, p.energy + dt * (warm ? 5 : 2));
      if (warm && p.hunger > 20) p.health = Math.min(100, p.health + dt * 0.8);
    } else if (!this.path.length)
      p.energy = Math.min(100, p.energy + dt * 0.12);
    p.hunger = Math.max(0, p.hunger - dt * 0.06);
    if (p.hunger <= 0) p.health = Math.max(0, p.health - dt * 0.7);
    this.updateFishing(dt);
    if (s.time >= 0.78) this.raid();
    this.combat(dt);
    const animalStarted=frameProfile.begin();this.wanderAnimals(dt);frameProfile.end('animals',animalStarted);
    const streamStarted=frameProfile.begin();this.streamWorld();frameProfile.end('streaming',streamStarted);
  }
}
