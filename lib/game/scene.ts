import * as T from 'three';
import {sunlight,humanPose,animalPose,type HumanAction} from './living.ts';
import { PointerDrag, FrameBudget } from './interaction.ts';
import { WorldBatches, compactModel, releaseModel } from './batches.ts';
import { BUILDINGS, CROPS } from './data.ts';
import { NPCS, LANDMARKS } from './content.ts';
import {
  ENEMIES,
  MINE_ENTRANCE,
  MINE_LIFT,
  MINE_STAIRS,
} from './expedition.ts';
import { noise, season, tileAt, buildingAt } from './model.ts';
import {
  tileIndex,
  chunkKey,
  tileKey,
  worldOrigin,
  biomeAt,
  worldSize,
  WINDOW,
} from './world.ts';
import type { Engine, Tile, Building, Animal, Enemy } from './model.ts';

// All world objects are interactive, procedural meshes. No remote assets are required.
export class ValleyScene {
  highQuality = true;
  budget = new FrameBudget();
  drag = new PointerDrag();
  arrivalPending = false;
  placementRotation = 0;
  placementCorner = false;
  adaptiveScale = 1;
  frameAverage = 16;
  contextLost = false;
  adaptiveClock = 0;
  worldBatches?: WorldBatches;
  chunkMeshes = new Map<string, T.Group>();
  dirtyChunks = new Set<string>();
  terrainTiles: Tile[] | null = null;
  river!: T.InstancedMesh;
  bankBlend!: T.InstancedMesh;
  shoreFoam!:T.InstancedMesh;
  bankLight={value:1};
  windowLights?:T.InstancedMesh;
  buildingShadows!: T.InstancedMesh;
  confetti?: T.InstancedMesh;
  confettiLife = 0;
  confettiPieces: {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    spin: number;
  }[] = [];
  waterTime = { value: 0 };
  terrainBase!: T.Mesh;
  bridge = new T.Group();
  lastPick = 0;
  metrics = {
    drawCalls: 0,
    triangles: 0,
    frameMs: 0,
    activeTiles: 3600,
    chunks: 0,
  };
  activeTool = 'hand';
  heldTool = '';
  handTool = new T.Group();
  lastPlayer = new T.Vector2(15, 19);
  villagers: T.Group[] = [];
  remotePlayers = new Map<string,T.Group>();
  butterflies?: T.InstancedMesh;
  fishSchool?: T.InstancedMesh;
  affectionHearts?: T.InstancedMesh;
  ambienceDummy=new T.Object3D();
  waterSpots:{x:number;z:number}[]=[];
  landmarkGroups: T.Group[] = [];
  engine: Engine;
  renderer: T.WebGLRenderer;
  scene = new T.Scene();
  camera = new T.OrthographicCamera();
  root = new T.Group();
  materials = new Map<string, T.MeshStandardMaterial>();
  geometries = new Map<string, T.BufferGeometry>();
  tiles = new Map<string, { key: string; group: T.Group; pending?: Tile }>();
  structures = new Map<number, { key: string; group: T.Group }>();
  creatures = new Map<string, T.Group>();
  warnings = new Map<number, T.Mesh>();
  player = new T.Group();
  sun = new T.DirectionalLight(0xffe6b0, 3.2);
  ambient = new T.HemisphereLight(0xd7f2e9, 0x40553b, 2.5);
  ray = new T.Raycaster();
  pointer = new T.Vector2();
  plane = new T.Plane(new T.Vector3(0, 1, 0), -0.08);
  ground!: T.InstancedMesh;
  hover = new T.Group();
  width = 1;
  height = 1;
  zoom = 17;
  angle = Math.PI / 4;
  pan = new T.Vector3();
  target = new T.Vector3(15, 0, 17);
  time = 0;
  lastSeason = -1;
  lastWeather = '';
  hoverTile: { x: number; z: number } | null = null;
  tileVisuals = new T.Group();
  pickables: T.Object3D[] = [];
  shadowClock = 0;
  clock = 0;
  syncClock = 0;
  resizeObserver: ResizeObserver;
  canvas: HTMLCanvasElement;
  onSelect: (x: number, z: number) => void;
  onHover: (x: number, z: number) => void;
  disposeHandlers: (() => void)[] = [];
  flowers!: T.InstancedMesh;
  clouds = new T.Group();
  wheels: T.Object3D[] = [];
  effects: { mesh: T.Mesh; life: number; velocity: T.Vector3 }[] = [];
  textures: Record<string, T.Texture> = {};
  grassSurface!: T.InstancedMesh;
  placement: string | null = null;
  ghost = new T.Group();
  ghostType: string | null = null;
  rain!: T.LineSegments;
  fireflies!: T.Points;
  constructor(
    container: HTMLElement,
    engine: Engine,
    onSelect: (x: number, z: number) => void,
    onHover: (x: number, z: number) => void,
  ) {
    this.engine = engine;
    this.target.set(engine.s.player.x, 0, engine.s.player.z);
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute(
      'aria-label',
      'Roamcroft oyun dünyası. Yürümek veya seçili aracı kullanmak için araziye tıkla.',
    );
    this.canvas.tabIndex = 0;
    const lost = (event: Event) => {
      event.preventDefault();
      this.contextLost = true;
      engine.emit('Görüntü yeniden hazırlanıyor…', 'info');
    };
    const restored = () => {
      this.contextLost = false;
      this.setQuality(false);
      engine.emit('Görüntü dengeli modda geri yüklendi.', 'good');
    };
    this.canvas.addEventListener('webglcontextlost', lost);
    this.canvas.addEventListener('webglcontextrestored', restored);
    this.disposeHandlers.push(() => {
      this.canvas.removeEventListener('webglcontextlost', lost);
      this.canvas.removeEventListener('webglcontextrestored', restored);
    });
    container.appendChild(this.canvas);
    this.scene.background = new T.Color(0x345e61);
    this.scene.fog = new T.FogExp2(0x345e61, 0.014);
    this.scene.add(this.root, this.ambient, this.sun);
    this.sun.position.set(-8, 35, 16);
    this.sun.target.position.set(16, 0, 16);
    this.scene.add(this.sun.target);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(512, 512);
    Object.assign(this.sun.shadow.camera, {
      left: -14,
      right: 14,
      top: 14,
      bottom: -14,
      near: 1,
      far: 100,
    });
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.035;
    const loader = new T.TextureLoader();
    for (const [key, name] of Object.entries({
      grass: 'meadow-grass',
      soil: 'tilled-soil',
      wood: 'honey-oak-planks',
    })) {
      const texture = loader.load(`/textures/${name}.png`);
      texture.colorSpace = T.SRGBColorSpace;
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.anisotropy = Math.min(
        4,
        this.renderer.capabilities.getMaxAnisotropy(),
      );
      this.textures[key] = texture;
    }
    this.root.add(this.tileVisuals, this.ghost);
    this.makeTerrain();
    this.makeCharacter(this.player);
    this.handTool.position.set(0.34, 0.58, 0.13);
    this.player.add(this.handTool);
    this.root.add(this.player);
    this.makeHover();
    this.scene.add(this.hover);
    this.makeClouds();
    this.makeWeather();
    this.makeVillagers();
    this.scene.add(this.clouds);
    this.sync();
    this.resizeObserver = new ResizeObserver(() => this.resize(container));
    this.resizeObserver.observe(container);
    this.resize(container);
    const down = (e: PointerEvent) => {
      if (!this.drag.begin(e.pointerId,e.clientX,e.clientY,e.button)) return;
      this.canvas.focus({preventScroll:true});
      this.canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const delta=this.drag.move(e.pointerId,e.clientX,e.clientY,e.buttons);
      if (delta) {
        const k=this.zoom/Math.max(1,this.height), vertical=Math.hypot(32,28)/28;
        this.pan.x=T.MathUtils.clamp(this.pan.x-(delta.dx*Math.cos(this.angle)+delta.dy*Math.sin(this.angle)*vertical)*k,-24,24);
        this.pan.z=T.MathUtils.clamp(this.pan.z+(delta.dx*Math.sin(this.angle)-delta.dy*Math.cos(this.angle)*vertical)*k,-24,24);
        return;
      }
      if (performance.now()-this.lastPick<75) return;
      this.lastPick=performance.now();
      const p=this.pick(e.clientX,e.clientY);
      if(p) {this.hoverTile=p;this.onHover(p.x,p.z);} else this.hoverTile=null;
    };
    const up=(e:PointerEvent)=>{
      if(this.drag.end(e.pointerId)) {
        const p=this.pick(e.clientX,e.clientY);
        if(p) {this.onSelect(p.x,p.z);this.arrivalPending=this.engine.path.length>0;}
      }
      if(this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    };
    const cancel=()=>this.drag.cancel();
    window.addEventListener('blur',cancel);
    this.disposeHandlers.push(()=>window.removeEventListener('blur',cancel));
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      this.zoom = T.MathUtils.clamp(this.zoom + e.deltaY * 0.01, 7, 22);
      this.resize(container);
    };
    const context = (e: Event) => e.preventDefault();
    for (const [event, fn] of [
      ['pointerdown', down],
      ['pointermove', move],
      ['pointerup', up],
      ['pointercancel', cancel],
      ['lostpointercapture', cancel],
      ['wheel', wheel],
      ['contextmenu', context],
    ] as const) {
      this.canvas.addEventListener(event, fn as EventListener, {
        passive: false,
      });
      this.disposeHandlers.push(() =>
        this.canvas.removeEventListener(event, fn as EventListener),
      );
    }
  }
  mat(color: number, roughness = 1, emissive = 0) {
    const key = `${color}-${roughness}-${emissive}`;
    if (!this.materials.has(key)) {
      const soil = [0x735140, 0x95704f].includes(color),
        wood = [
          0x896447, 0xac855d, 0x89684e, 0x916a45, 0x926e45, 0xb19a70, 0xaa8b60,
          0xa8844d,
        ].includes(color);
      const map = soil
        ? (this.textures.soil ?? null)
        : wood
          ? (this.textures.wood ?? null)
          : null;
      this.materials.set(
        key,
        new T.MeshStandardMaterial({
          color: map ? (soil ? 0xc8ae99 : 0xded1b7) : color,
          map,
          roughness,
          flatShading: true,
          emissive,
          emissiveIntensity: emissive ? 0.65 : 0,
        }),
      );
    }
    return this.materials.get(key)!;
  }
  geo(kind: string) {
    if (!this.geometries.has(kind)) {
      let g: T.BufferGeometry;
      switch (kind) {
        case 'sphere':
          g = new T.IcosahedronGeometry(1, 1);
          break;
        case 'rock':
          g = new T.DodecahedronGeometry(1, 0);
          break;
        case 'cone':
          g = new T.ConeGeometry(1, 1, 7);
          break;
        case 'barnroof': {
          const shape = new T.Shape();
          shape.moveTo(-0.76, 0);
          shape.lineTo(-0.51, 0.5);
          shape.lineTo(0, 0.74);
          shape.lineTo(0.51, 0.5);
          shape.lineTo(0.76, 0);
          shape.closePath();
          g = new T.ExtrudeGeometry(shape, { depth: 1.4, bevelEnabled: false });
          g.translate(0, 0, -0.7);
          break;
        }
        case 'roof': {
          const shape = new T.Shape();
          shape.moveTo(-0.8, 0);
          shape.lineTo(0, 0.65);
          shape.lineTo(0.8, 0);
          shape.closePath();
          g = new T.ExtrudeGeometry(shape, {
            depth: 1.45,
            bevelEnabled: false,
          });
          g.translate(0, 0, -0.725);
          break;
        }
        case 'cylinder':
          g = new T.CylinderGeometry(1, 1, 1, 8);
          break;
        default:
          g = new T.BoxGeometry(1, 1, 1);
      }
      this.geometries.set(kind, g);
    }
    return this.geometries.get(kind)!;
  }
  mesh(
    parent: T.Object3D,
    kind: string,
    color: number,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
  ) {
    const m = new T.Mesh(this.geo(kind), this.mat(color));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  box(
    p: T.Object3D,
    c: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    return this.mesh(p, 'box', c, x, y, z, sx, sy, sz);
  }
  makeTerrain() {
    this.terrainBase = this.box(
      this.root,
      0x45594a,
      17.5,
      -0.85,
      17.5,
      WINDOW,
      1.6,
      WINDOW,
    );
    this.ground = new T.InstancedMesh(
      this.geo('box'),
      this.mat(0xffffff),
      WINDOW * WINDOW,
    );
    this.ground.receiveShadow = true;
    this.grassSurface = new T.InstancedMesh(
      new T.PlaneGeometry(1, 1),
      new T.MeshStandardMaterial({
        map: this.textures.grass ?? null,
        color: 0xc5cda6,
        roughness: 1,
      }),
      WINDOW * WINDOW,
    );
    this.grassSurface.receiveShadow = true;
    this.river = new T.InstancedMesh(
      this.geo('box'),
      new T.MeshStandardMaterial({
        color: 0x469cbd,
        roughness: 0.55,
        metalness: 0.02,
      }),
      WINDOW * WINDOW,
    );
    this.flowers = new T.InstancedMesh(
      this.geo('cone'),
      this.mat(0x93ad66),
      WINDOW * WINDOW,
    );
    this.root.add(this.ground, this.grassSurface, this.river, this.flowers);
    const vertexShader = `varying vec2 surfaceUV; void main() { surfaceUV=uv; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0); }`;
    this.bankBlend = new T.InstancedMesh(
      new T.PlaneGeometry(1.05, 0.6),
      new T.ShaderMaterial({
        vertexShader,
        uniforms:{bankLight:this.bankLight},
        fragmentShader: `uniform float bankLight;varying vec2 surfaceUV; void main() { float edge=1.0-smoothstep(0.0,0.5,abs(surfaceUV.y-0.5)); float grain=0.95+0.05*sin(surfaceUV.x*93.0+surfaceUV.y*71.0); gl_FragColor=vec4(vec3(0.66,0.59,0.39)*grain*bankLight, edge*0.65); }`,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
      WINDOW * WINDOW * 4,
    );
    this.bankBlend.count = 0;
    this.shoreFoam=new T.InstancedMesh(new T.PlaneGeometry(1,.22),new T.ShaderMaterial({uniforms:{streamTime:this.waterTime,bankLight:this.bankLight},vertexShader,
      fragmentShader:'varying vec2 surfaceUV;uniform float streamTime;uniform float bankLight;void main(){float ripple=sin(surfaceUV.x*27.0-streamTime*1.6+sin(surfaceUV.y*9.0));float edge=1.0-smoothstep(0.0,0.5,abs(surfaceUV.y-0.5));gl_FragColor=vec4(vec3(0.76,0.92,0.97)*bankLight,edge*smoothstep(-0.4,0.9,ripple)*0.35);}',
      transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),WINDOW*WINDOW*4);
    this.shoreFoam.count=0;this.root.add(this.shoreFoam);

    this.buildingShadows = new T.InstancedMesh(
      new T.PlaneGeometry(2.9, 2.2),
      new T.ShaderMaterial({
        vertexShader,
        fragmentShader: `varying vec2 surfaceUV; void main() { float d=length((surfaceUV-0.5)*2.0); float a=(1.0-smoothstep(0.1,1.0,d))*0.24; gl_FragColor=vec4(0.08,0.13,0.1,a); }`,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      2048,
    );
    this.buildingShadows.count = 0;
    this.root.add(this.bankBlend, this.buildingShadows);
    const waterMaterial = this.river.material as T.MeshStandardMaterial;
    waterMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.streamTime = this.waterTime;
      shader.vertexShader =
        'varying vec2 streamPosition;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nstreamPosition = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xz;',
      );
      shader.fragmentShader =
        'uniform float streamTime;\nvarying vec2 streamPosition;\n' +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float wave = sin(streamPosition.x * 5.0 + sin(streamPosition.y * 3.0 + streamTime * 0.7)) * sin(streamPosition.y * 7.0 - streamTime * 0.6);
        diffuseColor.rgb *= 0.91 + wave * 0.09;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.79, 0.93, 1.0), smoothstep(0.77, 1.0, wave) * 0.32);`,
      );
    };
    this.refreshGround();
    this.waterSpots=this.engine.s.tiles.filter(t=>t.terrain==='water').filter((_,i)=>i%13===0).map(t=>({x:t.x,z:t.z}));
    if (!this.engine.s.mine) {
      for (let x = 23; x < 31; x++) {
        this.box(this.bridge, 0xb19a70, x, 0.22, 19, 0.95, 0.17, 0.95);
        for (const z of [18.55, 19.45]) {
          this.box(this.bridge, 0x725d42, x, 0.63, z, 0.09, 0.8, 0.09);
          this.box(this.bridge, 0x987850, x, 0.85, z, 1.04, 0.1, 0.1);
        }
      }
      compactModel(this.bridge);
      this.root.add(this.bridge);
    }
  }
  refreshGround() {
    const s = this.engine.s,
      dummy = new T.Object3D(),
      o = worldOrigin(s);
    this.terrainTiles = s.tiles;
    this.terrainBase.scale.x = this.terrainBase.scale.z = worldSize(s);
    this.terrainBase.position.x = o.x + (worldSize(s) - 1) / 2;
    this.terrainBase.position.z = o.z + (worldSize(s) - 1) / 2;
    for (let i = 0; i < s.tiles.length; i++) {
      const t = s.tiles[i];
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(
        t.x,
        t.terrain === 'water' ? -0.27 : t.height / 2,
        t.z,
      );
      dummy.scale.set(
        1.005,
        t.terrain === 'water' ? 0.1 : 0.24 + t.height,
        1.005,
      );
      dummy.updateMatrix();
      this.ground.setMatrixAt(i, dummy.matrix);
      dummy.position.y = -0.12;
      dummy.scale.set(1, t.terrain === 'water' ? 0.08 : 0, 1);
      dummy.updateMatrix();
      this.river.setMatrixAt(i, dummy.matrix);
      this.updateTurf(t, i, dummy);
    }
    for (const m of [
      this.ground,
      this.grassSurface,
      this.river,
      this.flowers,
    ]) {
      m.count = s.tiles.length;
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    }
    let edge = 0;
    for (const t of s.tiles)
      if (t.terrain === 'grass') {
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const neighbor = tileAt(s, t.x + dx, t.z + dz);
          if (!neighbor || !['sand', 'water'].includes(neighbor.terrain))
            continue;
          dummy.position.set(t.x + dx * 0.48, t.height + 0.14, t.z + dz * 0.48);
          dummy.rotation.set(-Math.PI / 2, 0, dx ? Math.PI / 2 : 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          this.bankBlend.setMatrixAt(edge++, dummy.matrix);
        }
      }
    let foam=0;
    for(const t of s.tiles)if(t.terrain==='water'){
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const other=tileAt(s,t.x+dx,t.z+dz);if(!other||other.terrain==='water')continue;
        dummy.position.set(t.x+dx*.48,.235,t.z+dz*.48);dummy.rotation.set(-Math.PI/2,0,dx?Math.PI/2:0);dummy.scale.set(1,1,1);dummy.updateMatrix();this.shoreFoam.setMatrixAt(foam++,dummy.matrix);
      }
    }
    this.shoreFoam.count=foam;this.shoreFoam.instanceMatrix.needsUpdate=true;this.shoreFoam.computeBoundingSphere();
    this.bankBlend.count = edge;
    this.bankBlend.instanceMatrix.needsUpdate = true;
    this.bankBlend.computeBoundingSphere();
    this.updateTerrain();
    this.renderer.shadowMap.needsUpdate = true;
  }
  updateTurf(t: Tile, index: number, dummy = new T.Object3D()) {
    dummy.position.set(t.x, 0.125 + t.height, t.z);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.scale.setScalar(t.terrain === 'grass' && !t.tilled ? 1 : 0);
    dummy.updateMatrix();
    this.grassSurface.setMatrixAt(index, dummy.matrix);
    const n = noise(t.x, t.z, this.engine.s.seed);
    dummy.position.set(t.x + (n - 0.5) * 0.6, 0.22 + t.height, t.z + 0.2);
    dummy.rotation.set(0, n * 6, 0.1);
    const visible =
      t.terrain === 'grass' &&
      !t.resource &&
      !t.tilled &&
      !buildingAt(this.engine.s, t.x, t.z);
    dummy.scale.set(0.035, visible ? 0.2 : 0, 0.035);
    dummy.updateMatrix();
    this.flowers.setMatrixAt(index, dummy.matrix);
  }
  flushChunk() {
    const player = this.engine.s.player;
    const key = [...this.dirtyChunks].sort((a, b) => {
      const [ax, az] = a.split(',').map(Number),
        [bx, bz] = b.split(',').map(Number);
      return (
        Math.hypot(ax * 12 + 6 - player.x, az * 12 + 6 - player.z) -
        Math.hypot(bx * 12 + 6 - player.x, bz * 12 + 6 - player.z)
      );
    })[0];
    if (!key) return;
    this.dirtyChunks.delete(key);
    this.worldBatches ??= new WorldBatches(this.tileVisuals);
    const objects: T.Mesh[] = [];
    for (const entry of this.tiles.values()) {
      if (chunkKey(entry.group.position.x, entry.group.position.z) !== key)
        continue;
      if (entry.pending) {
        this.resource(entry.pending, entry.group);
        this.crop(entry.pending, entry.group);
        this.shore(entry.pending, entry.group);
        entry.group.updateMatrixWorld(true);
        entry.pending = undefined;
      }
      entry.group.traverse((o) => {
        if (o instanceof T.Mesh) objects.push(o);
      });
    }
    this.worldBatches.replace(key, objects);
    this.chunkMeshes.set(key, new T.Group());
    this.pickables = [...this.tiles.values()]
      .filter((t) => t.group.children.length)
      .map((t) => t.group)
      .concat(
        [...this.structures.values()].map((b) => b.group),
        this.villagers,
        this.landmarkGroups,
      );
  }
  makeHover() {
    const lineMat = new T.LineBasicMaterial({
      color: 0xffe3a0,
      transparent: true,
      opacity: 0.9,
    });
    const points = [
      [-0.5, 0.16, -0.5],
      [0.5, 0.16, -0.5],
      [0.5, 0.16, 0.5],
      [-0.5, 0.16, 0.5],
      [-0.5, 0.16, -0.5],
    ].map((p) => new T.Vector3(...(p as [number, number, number])));
    const geo = new T.BufferGeometry().setFromPoints(points);
    this.hover.add(new T.Line(geo, lineMat));
    const fill = new T.Mesh(
      new T.PlaneGeometry(0.96, 0.96),
      new T.MeshBasicMaterial({
        color: 0xffdd8b,
        transparent: true,
        opacity: 0.18,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.y = 0.14;
    this.hover.add(fill);
  }
  shore(t: Tile, g: T.Group) {
    if (this.engine.s.mine) return;
    const n = noise(t.x, t.z, this.engine.s.seed);
    if(t.terrain==='path'){
      for(let i=0;i<3;i++)this.mesh(g,'rock',0xaaa087,(n-.5)*.7+i*.09,.12,(i-1)*.25,.045,.025,.035);
      for(const x of [-.27,.27])this.box(g,0x9a8a64,x,.101,0,.025,.006,.78);
    }
    if(t.terrain==='grass'&&!t.resource&&!t.crop&&!t.tilled){
      if(t.source==='tree')this.mesh(g,'cylinder',0x94623d,0,.18,0,.18,.28,.18);
      else if(n<.035)this.mesh(g,'rock',0xaba98a,.15,.12,.1,.14,.06,.11);
      else if(n>.96){this.mesh(g,'sphere',0x789454,0,.17,0,.3,.2,.24);this.mesh(g,'sphere',0xedd4a9,.13,.33,0,.045,.04,.045);}
    }
    if (t.terrain === 'sand') {
      for (let i = 0; i < 3; i++) {
        const x = (n - 0.5) * 0.65 + i * 0.08;
        this.mesh(
          g,
          'cylinder',
          0x78925a,
          x,
          0.36 + i * 0.07,
          0.2,
          0.016,
          0.45 + i * 0.1,
          0.016,
        );
        this.mesh(
          g,
          'cylinder',
          0x9a7150,
          x,
          0.59 + i * 0.12,
          0.2,
          0.035,
          0.12,
          0.035,
        );
      }
      this.mesh(g, 'rock', 0xbfb596, -0.24, 0.15, -0.14, 0.2, 0.09, 0.15);
      if (Math.abs(t.z % 12) === 5) {
        // Low riverside platform: the adjacent water remains selectable for fishing.
        for (let i = 0; i < 4; i++)
          this.box(g, 0xb19a70, 0, 0.21, (i - 1.5) * 0.21, 0.92, 0.09, 0.19);
        this.box(g, 0x806047, -0.35, 0.48, -0.35, 0.07, 0.75, 0.07);
      }
    } else if (t.terrain === 'water' && n < 0.1) {
      this.mesh(g, 'cylinder', 0x91ab67, 0.12, 0.235, -0.1, 0.18, 0.015, 0.14);
      this.mesh(g, 'sphere', 0xf0c9ad, 0.12, 0.27, -0.1, 0.065, 0.035, 0.065);
    }
  }
  makeCharacter(g: T.Group, coat = 0x6f9b94) {
    this.mesh(g, 'sphere', 0x735443, -0.13, 0.21, 0.04, 0.115, 0.18, 0.14);
    this.mesh(g, 'sphere', 0x735443, 0.13, 0.21, 0.04, 0.115, 0.18, 0.14);
    this.mesh(g, 'sphere', coat, 0, 0.56, 0, 0.27, 0.29, 0.21);
    this.mesh(g, 'sphere', 0xf0c296, 0, 0.99, 0.02, 0.275, 0.28, 0.255);
    this.mesh(g, 'cylinder', 0xd6b572, 0, 1.2, 0, 0.39, 0.065, 0.37);
    this.mesh(g, 'cylinder', 0xe1c187, 0, 1.3, 0, 0.25, 0.19, 0.235);
    this.mesh(g, 'cylinder', 0x945d44, 0, 1.23, 0, 0.255, 0.05, 0.24);
    this.mesh(g, 'sphere', 0xe6b589, -0.3, 0.57, 0, 0.09, 0.21, 0.09);
    this.mesh(g, 'sphere', 0xe6b589, 0.3, 0.57, 0, 0.09, 0.21, 0.09);
    for (const [index, name] of [
      [0, 'leftLeg'],
      [1, 'rightLeg'],
      [7, 'leftArm'],
      [8, 'rightArm'],
    ] as const) {
      g.children[index].name = name;
      g.children[index].userData.animated = true;
    }
    this.box(g, 0x8c654c, 0, 0.58, -0.2, 0.33, 0.36, 0.15);
    this.box(g, 0xbe724a, 0, 0.72, 0.16, 0.39, 0.1, 0.07);
    this.box(g, 0xbe724a, 0.1, 0.62, 0.16, 0.09, 0.24, 0.05);
    for (const x of [-0.105, 0.105]) {
      this.mesh(g, 'sphere', 0x3f352e, x, 1.02, 0.25, 0.037, 0.052, 0.024);
      this.mesh(
        g,
        'sphere',
        0xfff1d5,
        x - 0.008,
        1.039,
        0.271,
        0.011,
        0.014,
        0.008,
      );
      this.mesh(
        g,
        'sphere',
        0xe6a089,
        x * 1.55,
        0.955,
        0.22,
        0.043,
        0.021,
        0.013,
      );
    }
    this.mesh(g, 'sphere', 0xe9ad86, 0, 0.976, 0.273, 0.038, 0.039, 0.038);
    const ring = new T.Mesh(
      new T.RingGeometry(0.32, 0.39, 32),
      new T.MeshBasicMaterial({
        color: 0xffe4a2,
        transparent: true,
        opacity: 0.8,
        side: T.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.13;
    g.add(ring);
    compactModel(g);
  }
  resource(t: Tile, g: T.Group) {
    const n = noise(t.x + 31, t.z + 17, this.engine.s.seed);
    if (t.resource === 'tree') {
      const pine = n < 0.48,
        height = 1.8 + n * 1.1;
      this.mesh(g, 'cylinder', 0x75543b, 0, 0.65, 0, 0.13, 1.3, 0.13);
      if (pine) {
        for (let i = 0; i < 3; i++)
          this.mesh(
            g,
            'cone',
            (n<.24?[0x3d7355,0x4c895c,0x619661]:[0x477d74,0x58968a,0x77a799])[i],
            0,
            0.85 + i * 0.49,
            0,
            0.85 - i * 0.16,
            height * 0.65,
            0.85 - i * 0.16,
          );
      } else {
        for (let i = 0; i < 4; i++) {
          const a = i * 2.1;
          this.mesh(
            g,
            'sphere',
            (n<.75?[0x79a666,0x93b16a,0x6b9858,0x83a558]:[0xd8ac61,0xe5bd73,0xbca35e,0xd1b46c])[i],
            Math.sin(a) * 0.3,
            1.3 + i * 0.23,
            Math.cos(a) * 0.27,
            0.7,
            0.65,
            0.7,
          );
        }
      }
    } else if (
      ['stone', 'copper', 'iron', 'crystal'].includes(t.resource || '')
    ) {
      const c =
        t.resource === 'stone'
          ? 0xa8b1a8
          : t.resource === 'copper'
            ? 0xc1815c
            : t.resource === 'iron'
              ? 0x8997a4
              : 0x9d91d5;
      this.mesh(
        g,
        'rock',
        0x808f8b,
        -0.13,
        0.32,
        0.1,
        0.49,
        0.4,
        0.46,
      ).rotation.y = n * 6;
      if (t.resource === 'crystal') {
        for (let i = 0; i < 3; i++)
          this.mesh(
            g,
            'cone',
            c,
            (i - 1) * 0.2,
            0.55 + i * 0.1,
            0,
            0.17,
            0.8,
            0.17,
          );
      } else {
        this.mesh(g, 'rock', c, 0.18, 0.47, -0.1, 0.32, 0.38, 0.35);
        this.mesh(g, 'rock', c, -0.25, 0.2, -0.25, 0.25, 0.21, 0.23);
      }
    } else if (t.resource === 'bush') {
      this.mesh(g, 'sphere', 0x62834d, 0, 0.38, 0, 0.55, 0.42, 0.48);
      for (let i = 0; i < 5; i++)
        this.mesh(
          g,
          'sphere',
          0x8b638f,
          Math.sin(i * 2.4) * 0.36,
          0.54,
          Math.cos(i * 2.4) * 0.3,
          0.08,
          0.08,
          0.08,
        );
    } else if (t.resource === 'mushroom') {
      for (let i = 0; i < 3; i++) {
        this.mesh(
          g,
          'cylinder',
          0xefe0bf,
          (i - 1) * 0.2,
          0.18,
          (i % 2) * 0.2,
          0.05,
          0.23,
          0.05,
        );
        this.mesh(
          g,
          'sphere',
          0xcf7860,
          (i - 1) * 0.2,
          0.3,
          (i % 2) * 0.2,
          0.15,
          0.1,
          0.15,
        );
      }
    }
  }
  crop(t: Tile, g: T.Group) {
    if (t.tilled) {
      this.box(
        g,
        t.water > 0 ? 0x735140 : 0x95704f,
        0,
        0.15,
        0,
        0.94,
        0.07,
        0.94,
      );
      for (let i = 0; i < 4; i++)
        this.box(
          g,
          t.water > 0 ? 0x604436 : 0x806044,
          (i - 1.5) * 0.22,
          0.19,
          0,
          0.04,
          0.02,
          0.86,
        );
    }
    if (!t.crop) return;
    const c = CROPS[t.crop],
      f = Math.min(1, t.growth / c.grow),
      ripe = f >= 1;
    for (let i = 0; i < 6; i++) {
      const x = ((i % 3) - 1) * 0.27,
        z = (Math.floor(i / 3) - 0.5) * 0.42,
        h = 0.12 + f * 0.65;
      this.mesh(
        g,
        'cylinder',
        ripe && t.crop === 'wheat' ? 0xcab25e : 0x527b35,
        x,
        0.21 + h * 0.4,
        z,
        0.021,
        h,
        0.021,
      );
      if (t.crop === 'wheat' || t.crop === 'corn') {
        this.mesh(
          g,
          'sphere',
          ripe ? c.color : 0x99ad52,
          x,
          0.2 + h,
          z,
          0.06 + f * 0.025,
          0.13 + f * 0.08,
          0.06,
        );
        this.box(
          g,
          0x8b9f45,
          x + 0.08,
          0.24 + h * 0.5,
          z,
          0.19,
          0.035,
          0.07,
        ).rotation.z = 0.5;
      } else {
        for (let j = 0; j < 2; j++)
          this.mesh(
            g,
            'sphere',
            0x698e3e,
            x + (j - 0.5) * 0.13,
            0.25 + h * 0.35,
            z,
            0.15,
            0.05,
            0.09,
          ).rotation.z = (j - 0.5) * 0.6;
        if (f > 0.5)
          this.mesh(
            g,
            'sphere',
            c.color,
            x,
            0.23 + (t.crop === 'tomato' ? h * 0.65 : 0),
            z,
            0.1 + f * 0.05,
            t.crop === 'carrot' ? 0.1 : 0.12 + f * 0.04,
            0.13,
          );
      }
    }
  }
  building(b: Building, g: T.Group) {
    const c = BUILDINGS[b.type].color;
    if (b.level >= 2 && !['fence', 'campfire', 'sprinkler'].includes(b.type)) {
      // Extensions use the same static batch as the building; upgrades add no draw calls.
      for (const x of [-0.56, 0.56])
        for (const z of [-0.52, 0.52])
          this.box(g, 0xa9b2a1, x, 0.32, z, 0.25, 0.42, 0.25);
      if (['home', 'coop', 'barn', 'greenhouse'].includes(b.type)) {
        this.box(g, 0x89664b, 0.48, 0.3, 0.69, 0.5, 0.22, 0.22);
        for (const x of [0.32, 0.48, 0.64])
          this.mesh(g, 'sphere', 0x8cb17b, x, 0.49, 0.69, 0.12, 0.17, 0.12);
      } else this.box(g, 0xb89562, -0.57, 0.44, 0.63, 0.38, 0.45, 0.32);
    }
    if (b.level >= 3 && !['fence', 'campfire', 'sprinkler'].includes(b.type)) {
      if (['barn', 'coop', 'mill', 'feedmill'].includes(b.type)) {
        this.mesh(g, 'cylinder', 0xd2c4a0, -0.68, 0.78, -0.44, 0.23, 1.3, 0.23);
        this.mesh(g, 'cone', c, -0.68, 1.54, -0.44, 0.3, 0.35, 0.3);
      } else {
        this.box(g, 0xc2ad7d, 0.66, 0.81, 0.5, 0.06, 1.35, 0.06);
        this.box(g, 0x648a71, 0.66, 1.05, 0.48, 0.42, 0.44, 0.06);
        this.mesh(g, 'sphere', 0xe6c374, 0.66, 1.57, 0.5, 0.09, 0.09, 0.09);
      }
    }
    if (b.type === 'sprinkler') {
      this.mesh(g, 'cylinder', 0x8e9e96, 0, 0.18, 0, 0.3, 0.12, 0.3);
      this.mesh(g, 'cylinder', 0xb38d5b, 0, 0.42, 0, 0.05, 0.48, 0.05);
      this.box(g, 0x75969b, 0, 0.67, 0, 0.62, 0.075, 0.08);
      for (const x of [-0.29, 0.29])
        this.mesh(g, 'sphere', 0xabcac4, x, 0.66, 0, 0.07, 0.055, 0.055);
      return;
    }
    this.box(g, 0x818a7b, 0, 0.18, 0, 1.28, 0.17, 1.22);
    if (b.type === 'campfire') {
      for (let i = 0; i < 8; i++)
        this.mesh(
          g,
          'rock',
          0x87918b,
          Math.sin((i * Math.PI) / 4) * 0.39,
          0.23,
          Math.cos((i * Math.PI) / 4) * 0.39,
          0.13,
          0.12,
          0.13,
        );
      for (let i = 0; i < 3; i++)
        this.mesh(
          g,
          'cone',
          [0xf1953b, 0xffca61, 0xf4e598][i],
          0,
          0.45 + i * 0.12,
          0,
          0.23 - i * 0.05,
          0.55 - i * 0.08,
          0.22 - i * 0.04,
        );
      return;
    }
    if (b.type === 'wall') {
      for (let row=0;row<3;row++) {
        const y=.32+row*.28;
        if(b.corner) {
          this.box(g,0x8a9683,.25,y,0,.5,.25,.22);
          this.box(g,0x9da691,0,y,.25,.22,.25,.5);
        } else this.box(g,row%2 ? 0x9da691 : 0x8a9683,0,y,0,1,.25,.24);
      }
      return;
    }
    if(b.type==='chest'){
      this.box(g,0x925e36,0,.32,0,.9,.55,.65);
      this.box(g,0xbb884b,0,.65,0,.95,.16,.7);
      for(const x of [-.32,.32])this.box(g,0x515b59,x,.4,0,.065,.67,.72);
      this.box(g,0xe8c16d,0,.47,.365,.13,.17,.035);return;
    }
    if (b.type === 'fence' && b.corner) {
      for (const [x,z] of [[0,0],[.5,0],[0,.5]]) this.box(g,0x896447,x,.65,z,.13,1,.13);
      for(const y of [.45,.85]) {
        this.box(g,0xac855d,.25,y,0,.5,.12,.12);
        this.box(g,0xac855d,0,y,.25,.12,.12,.5);
      }
      return;
    }
    if (b.type === 'fence') {
      for (const x of [-0.4, 0, 0.4]) {
        this.box(g, 0x896447, x, 0.65, 0, 0.15, 1, 0.16);
        this.mesh(g, 'cone', 0xa17b54, x, 1.19, 0, 0.105, 0.2, 0.105);
      }
      for (const y of [0.45, 0.85])
        this.box(g, 0xac855d, 0, y, 0, 1.05, 0.12, 0.13);
      return;
    }
    if (b.type === 'well') {
      this.mesh(g, 'cylinder', 0x9baca4, 0, 0.42, 0, 0.5, 0.6, 0.5);
      this.mesh(g, 'cylinder', 0x365f64, 0, 0.73, 0, 0.38, 0.02, 0.38);
      for (const x of [-0.48, 0.48])
        this.box(g, 0x906e4f, x, 1.04, 0, 0.11, 0.9, 0.12);
      this.mesh(g, 'cone', 0x8c9e86, 0, 1.64, 0, 0.78, 0.5, 0.69);
      return;
    }
    if (b.type === 'apiary') {
      for (const x of [-0.33, 0.33]) {
        this.box(g, 0xa8844d, x, 0.4, 0, 0.5, 0.4, 0.52);
        for (let i = 0; i < 3; i++)
          this.box(g, 0xd3b66f, x, 0.28 + i * 0.13, 0, 0.53, 0.05, 0.55);
        this.mesh(g, 'cone', c, x, 0.76, 0, 0.43, 0.35, 0.42);
      }
      return;
    }
    if (b.type === 'beacon') {
      this.mesh(g, 'cylinder', 0x9197a3, 0, 0.45, 0, 0.58, 0.6, 0.58);
      this.mesh(g, 'cylinder', 0xa9afbb, 0, 1.1, 0, 0.3, 1.2, 0.3);
      this.mesh(g, 'cone', 0xb4a3ed, 0, 2.0, 0, 0.38, 1, 0.38);
      return;
    }
    if (b.type === 'tower') {
      for (const x of [-0.42, 0.42])
        for (const z of [-0.42, 0.42])
          this.box(g, 0x86664b, x, 1.2, z, 0.15, 2, 0.15);
      this.box(g, 0xaa8b60, 0, 1.65, 0, 1.25, 0.2, 1.25);
      this.mesh(g, 'cone', 0x6b8776, 0, 2.65, 0, 0.95, 0.75, 0.95);
      this.box(g, 0xbba678, 0, 2, 0, 1.2, 0.4, 1.2);
      return;
    }
    if (b.type === 'market') {
      for (const x of [-0.6, 0.6])
        for (const z of [-0.45, 0.45])
          this.box(g, 0x806347, x, 0.86, z, 0.07, 1.4, 0.07);
      for (let i = 0; i < 6; i++)
        this.box(
          g,
          i % 2 ? 0xe8dcab : 0xbe9051,
          (i - 2.5) * 0.24,
          1.54,
          0,
          0.24,
          0.1,
          1.2,
        ).rotation.x = 0.08;
      this.box(g, 0x926e45, 0, 0.55, 0.25, 1.25, 0.58, 0.5);
      for (let i = 0; i < 4; i++)
        this.mesh(
          g,
          'sphere',
          [0xce6651, 0xe7bd5a, 0x77a053, 0xd69d56][i],
          (i - 1.5) * 0.25,
          0.9,
          0.25,
          0.12,
          0.12,
          0.12,
        );
      return;
    }
    if (
      [
        'barn',
        'coop',
        'workshop',
        'furnace',
        'greenhouse',
        'dairy',
        'kitchen',
        'feedmill',
        'smokehouse',
        'loom',
      ].includes(b.type)
    ) {
      this.specialBuilding(b, g);
      for (let i = 0; i < b.level; i++)
        this.mesh(
          g,
          'sphere',
          0xe5bd67,
          (i - (b.level - 1) / 2) * 0.12,
          0.36,
          0.69,
          0.035,
          0.035,
          0.025,
        );
      return;
    }
    const isMill = b.type === 'mill',
      isFurnace = b.type === 'furnace',
      height = isMill
        ? 1.9
        : b.type === 'home'
          ? 1.35
          : b.type === 'barn'
            ? 1.3
            : 0.95;
    const wall =
      b.type === 'barn'
        ? 0xb66555
        : b.type === 'greenhouse'
          ? 0xb3d4ba
          : 0xe1d1a5;
    this.box(g, wall, 0, 0.22 + height / 2, 0, 1.13, height, 1.12);
    for (const x of [-0.55, 0.55])
      for (const z of [-0.55, 0.55])
        this.box(g, 0x89684e, x, 0.3 + height / 2, z, 0.075, height, 0.075);
    const roof = this.mesh(g, 'roof', c, 0, 0.3 + height, 0, 0.9, 0.9, 0.9);
    for (const side of [-1, 1])
      for (let row = 0; row < 4; row++) {
        const tile = this.box(
          g,
          c,
          side * (0.13 + row * 0.17),
          0.3 + height + 0.52 - row * 0.13,
          0,
          0.22,
          0.06,
          1.36,
        );
        tile.rotation.z = -side * 0.69;
      }
    this.box(g, 0x644d3c, 0, 0.52, 0.57, 0.3, 0.69, 0.04);
    this.box(g, 0xe8cf92, 0.12, 0.54, 0.6, 0.035, 0.035, 0.03);
    for (const x of [-0.36, 0.36]) {
      this.box(g, 0x7f775b, x, 0.91, 0.572, 0.26, 0.29, 0.04);
      this.box(g, 0xf2d793, x, 0.91, 0.598, 0.19, 0.22, 0.01);
      this.box(g, 0x8b7653, x, 0.91, 0.61, 0.027, 0.25, 0.02);
    }
    this.box(g, 0x8f7956, 0, 0.23, 0.77, 0.5, 0.12, 0.35);
    if (b.type === 'home') {
      this.box(g, 0xa47a50, 0, 0.23, 0.85, 1.18, 0.12, 0.48);
      this.box(g, 0xc78c5d, 0, 1.1, 0.91, 1.18, 0.09, 0.55).rotation.x = 0.12;
      for (const x of [-0.52, 0.52]) {
        this.box(g, 0xcdb789, x, 0.68, 1.07, 0.07, 0.91, 0.07);
        this.box(g, 0xa47955, x, 0.49, 0.7, 0.32, 0.2, 0.2);
        for (let i = 0; i < 3; i++)
          this.mesh(
            g,
            'sphere',
            i % 2 ? 0xe9ba6d : 0xcd8e79,
            x + (i - 1) * 0.09,
            0.64,
            0.72,
            0.08,
            0.07,
            0.08,
          );
      }
    }
    if (b.type === 'home' || isFurnace || b.type === 'kitchen') {
      this.box(g, 0x8c8f7d, 0.38, height + 0.6, -0.2, 0.21, 0.75, 0.24);
      this.box(g, 0xb8b59a, 0.38, height + 0.98, -0.2, 0.29, 0.12, 0.31);
    }
    if (isMill) {
      const rotor = new T.Group();
      rotor.position.set(0, 2.0, 0.66);
      rotor.userData.animated = true;
      for (let i = 0; i < 4; i++) {
        const sail = new T.Group();
        sail.rotation.z = (i * Math.PI) / 2;
        this.box(sail, 0xb59a6a, 0, 0.58, 0, 0.07, 1.4, 0.05);
        this.box(sail, 0xeee3b9, 0.15, 0.72, 0.025, 0.28, 0.85, 0.04);
        rotor.add(sail);
      }
      this.mesh(
        rotor,
        'cylinder',
        0x8b7351,
        0,
        0,
        0.02,
        0.15,
        0.12,
        0.15,
      ).rotation.x = Math.PI / 2;
      compactModel(rotor);
      g.add(rotor);
      this.wheels.push(rotor);
    }
    if (b.type === 'coop') {
      this.box(g, 0xac8a5e, 0.8, 0.28, 0, 0.45, 0.1, 0.65);
      for (let i = 0; i < 3; i++)
        this.box(
          g,
          0x94764f,
          0.8,
          0.32 + i * 0.05,
          (i - 1) * 0.2,
          0.4,
          0.05,
          0.05,
        );
    }
    if (b.type === 'greenhouse') {
      const material = new T.MeshStandardMaterial({
        color: 0xb8e4d3,
        transparent: true,
        opacity: 0.55,
        roughness: 0.12,
      });
      (roof as T.Mesh).material = material;
    }
    if (b.level > 1) {
      for (let i = 0; i < b.level; i++)
        this.mesh(
          g,
          'sphere',
          0xe0bc60,
          (i - (b.level - 1) / 2) * 0.13,
          height + 0.2,
          0.61,
          0.045,
          0.045,
          0.045,
        );
    }
  }
  specialBuilding(b: Building, g: T.Group) {
    if (b.type === 'feedmill') {
      this.mesh(g, 'cylinder', 0xd7bb7e, -0.2, 0.8, 0, 0.43, 1.22, 0.43);
      this.mesh(g, 'cone', 0x8fa083, -0.2, 1.59, 0, 0.51, 0.45, 0.51);
      this.box(g, 0x9f7e53, 0.38, 0.47, 0, 0.52, 0.41, 0.6);
      this.mesh(
        g,
        'cylinder',
        0x7a7564,
        0.36,
        0.55,
        0.37,
        0.28,
        0.12,
        0.28,
      ).rotation.x = Math.PI / 2;
      for (let i = 0; i < 3; i++)
        this.mesh(
          g,
          'sphere',
          0xcbb17f,
          -0.43 + i * 0.36,
          0.39,
          0.6,
          0.16,
          0.24,
          0.15,
        );
    } else if (b.type === 'smokehouse') {
      this.box(g, 0x957255, 0, 0.86, 0, 0.97, 1.28, 0.9);
      this.mesh(g, 'roof', 0x6d7771, 0, 1.56, 0, 0.79, 0.57, 0.73);
      this.box(g, 0x686c63, 0.24, 1.93, -0.23, 0.23, 0.77, 0.23);
      this.box(g, 0x493e31, 0, 0.86, 0.46, 0.56, 0.76, 0.035);
      for (const x of [-0.16, 0.16]) {
        this.mesh(g, 'sphere', 0xc69762, x, 0.97, 0.49, 0.09, 0.24, 0.05);
        this.mesh(g, 'cone', 0xa98358, x, 1.21, 0.49, 0.11, 0.13, 0.035);
      }
      this.box(g, 0xe5a361, 0, 0.33, 0.49, 0.35, 0.08, 0.03);
    } else if (b.type === 'loom') {
      this.box(g, 0xd3ba94, 0, 0.7, -0.3, 1.1, 0.94, 0.44);
      this.mesh(g, 'roof', 0x9c847e, 0, 1.23, -0.1, 0.83, 0.65, 0.76);
      for (const x of [-0.47, 0.47])
        this.box(g, 0x8b6748, x, 0.73, 0.51, 0.075, 1.02, 0.08);
      for (const y of [0.41, 1.17])
        this.box(g, 0xb28b5c, 0, y, 0.51, 1.05, 0.09, 0.09);
      for (let i = 0; i < 9; i++)
        this.box(
          g,
          i % 3 ? 0xe7d4ad : 0x95b0a4,
          (i - 4) * 0.09,
          0.75,
          0.52,
          0.04,
          0.73,
          0.025,
        );
      this.mesh(g, 'sphere', 0xd8c6a5, 0.65, 0.37, 0.3, 0.2, 0.2, 0.2);
    } else if (b.type === 'barn') {
      this.box(g, 0xb86249, 0, 0.78, 0, 1.2, 1.1, 1.14);
      this.mesh(g, 'barnroof', 0x855341, 0, 1.32, 0, 1, 1, 1);
      for (const x of [-0.59, 0, 0.59])
        this.box(g, 0xe7cda0, x, 0.82, 0.59, 0.045, 1.13, 0.045);
      for (const x of [-0.25, 0.25]) {
        this.box(g, 0x824b39, x, 0.66, 0.59, 0.46, 0.81, 0.04);
        for (const side of [-1, 1])
          this.box(g, 0xe7cda0, x, 0.66, 0.62, 0.037, 0.9, 0.035).rotation.z =
            side * 0.49;
      }
      this.box(g, 0x513f30, 0, 1.56, 0.708, 0.35, 0.28, 0.03);
      this.box(g, 0xd9b35e, 0, 1.49, 0.72, 0.3, 0.1, 0.07);
      for (const x of [-0.73, 0.73])
        this.mesh(g, 'cylinder', 0xdcb966, x, 0.34, 0.37, 0.22, 0.3, 0.22);
      this.mesh(g, 'cylinder', 0xacb6ac, 0.52, 1.05, -0.53, 0.25, 1.55, 0.25);
      this.mesh(g, 'cone', 0x788e84, 0.52, 1.95, -0.53, 0.3, 0.35, 0.3);
    } else if (b.type === 'coop') {
      for (const x of [-0.4, 0.4])
        for (const z of [-0.35, 0.35])
          this.box(g, 0x896447, x, 0.41, z, 0.08, 0.65, 0.08);
      this.box(g, 0xe2b964, 0, 0.83, -0.1, 0.96, 0.7, 0.8);
      this.mesh(g, 'roof', 0x799281, 0, 1.21, -0.1, 0.77, 0.7, 0.7);
      this.box(g, 0x614934, 0, 0.69, 0.315, 0.3, 0.39, 0.03);
      this.box(g, 0xb08a59, 0, 0.37, 0.65, 0.4, 0.07, 0.85).rotation.x = 0.42;
      for (let i = 0; i < 4; i++)
        this.box(
          g,
          0xdfc28c,
          0,
          0.52 - i * 0.075,
          0.37 + i * 0.17,
          0.44,
          0.035,
          0.045,
        );
      this.box(g, 0xcba366, -0.61, 0.55, -0.13, 0.35, 0.35, 0.57);
      this.mesh(g, 'roof', 0x6a8376, -0.61, 0.75, -0.13, 0.31, 0.35, 0.49);
    } else if (b.type === 'furnace') {
      this.mesh(g, 'cylinder', 0x8b8173, 0, 0.71, 0, 0.55, 1.06, 0.5);
      this.mesh(g, 'cone', 0x9a8873, 0, 1.37, 0, 0.59, 0.47, 0.54);
      this.box(g, 0x756b61, -0.12, 1.81, -0.22, 0.29, 1.08, 0.3);
      this.box(g, 0x383b37, 0, 0.58, 0.49, 0.57, 0.49, 0.045);
      this.mesh(
        g,
        'sphere',
        0xefac51,
        0,
        0.47,
        0.53,
        0.22,
        0.14,
        0.045,
      ).material = this.mat(0xefac51, 1, 0x9c411b);
      for (const x of [-0.19, 0, 0.19])
        this.box(g, 0x514c43, x, 0.57, 0.56, 0.035, 0.47, 0.04);
      for (let i = 0; i < 3; i++)
        this.box(g, 0x8f9c95, 0.66, 0.23 + i * 0.08, 0, 0.27, 0.06, 0.19);
    } else if (b.type === 'workshop') {
      this.box(g, 0xbca177, 0, 0.64, -0.2, 1.05, 0.84, 0.74);
      this.box(g, 0x789087, 0, 1.18, 0, 1.38, 0.13, 1.3).rotation.x = -0.18;
      for (const x of [-0.55, 0.55])
        this.box(g, 0x806044, x, 0.7, 0.53, 0.075, 1.08, 0.075);
      this.box(g, 0x9a704a, 0, 0.52, 0.53, 1.03, 0.1, 0.45);
      this.box(g, 0x607474, -0.23, 0.68, 0.56, 0.39, 0.11, 0.2);
      this.box(g, 0x526464, -0.23, 0.59, 0.56, 0.2, 0.12, 0.15);
      for (let i = 0; i < 3; i++)
        this.box(
          g,
          0xd6b579,
          0.67 + i * 0.06,
          0.44,
          -0.12,
          0.04,
          0.69,
          0.11,
        ).rotation.z = -0.18;
    } else if (b.type === 'greenhouse') {
      for (const x of [-0.51, 0, 0.51]) {
        this.box(g, 0xb8d7c5, x, 0.68, 0, 0.48, 0.91, 1.04);
        this.mesh(g, 'roof', 0x95bdad, x, 1.11, 0, 0.33, 0.65, 0.77);
        for (const z of [-0.55, 0.55])
          this.box(g, 0xeff0d0, x, 0.77, z, 0.045, 1.17, 0.045);
      }
      for (const y of [0.33, 0.75, 1.18])
        this.box(g, 0xe0ddbd, 0, y, 0.57, 1.5, 0.04, 0.035);
      for (let i = 0; i < 4; i++) {
        this.mesh(
          g,
          'sphere',
          0x78a65f,
          (i - 1.5) * 0.3,
          0.49,
          0.6,
          0.14,
          0.17,
          0.08,
        );
        this.mesh(
          g,
          'sphere',
          0xdd9661,
          (i - 1.5) * 0.3,
          0.52,
          0.67,
          0.055,
          0.055,
          0.04,
        );
      }
    } else {
      const dairy = b.type === 'dairy';
      this.box(
        g,
        dairy ? 0xe1d4ac : 0xd6ae84,
        0,
        0.77,
        -0.08,
        1.03,
        1.04,
        0.95,
      );
      this.mesh(
        g,
        'roof',
        dairy ? 0x759a95 : 0xb77354,
        0,
        1.33,
        -0.08,
        0.85,
        0.85,
        0.85,
      );
      this.box(g, 0x604d3e, -0.25, 0.59, 0.41, 0.29, 0.72, 0.03);
      this.box(g, 0xd7aa61, 0.26, 0.86, 0.43, 0.29, 0.28, 0.03);
      if (dairy) {
        for (const x of [-0.56, 0.55]) {
          this.mesh(g, 'cylinder', 0xbccac0, x, 0.46, 0.57, 0.16, 0.47, 0.16);
          this.mesh(g, 'cylinder', 0x7b9892, x, 0.73, 0.57, 0.12, 0.08, 0.12);
        }
        this.box(g, 0xe7c36c, 0.1, 0.39, 0.69, 0.28, 0.13, 0.17);
      } else {
        this.mesh(g, 'sphere', 0xb98c65, 0.52, 0.53, 0.57, 0.35, 0.37, 0.29);
        this.box(g, 0x56493a, 0.52, 0.44, 0.84, 0.26, 0.19, 0.035);
        this.mesh(g, 'sphere', 0xf0ad5b, 0.52, 0.42, 0.86, 0.1, 0.05, 0.02);
        this.box(g, 0x9b8770, -0.3, 1.66, -0.3, 0.23, 0.88, 0.22);
      }
    }
  }
  animal(a: Animal, g: T.Group) {
    const cow = a.type === 'cow',
      sheep = a.type === 'sheep',
      size = cow ? 0.7 : sheep ? 0.55 : 0.3;
    this.mesh(
      g,
      'sphere',
      sheep ? 0xe8e1cd : 0xf3e9d0,
      0,
      size * 0.75,
      0,
      size * 0.6,
      size * 0.45,
      size * 0.8,
    );
    this.mesh(
      g,
      'sphere',
      cow ? 0xc4a283 : 0xe4d9bc,
      0,
      size * 0.95,
      size * 0.75,
      size * 0.35,
      size * 0.3,
      size * 0.32,
    );
    for (const x of [-size * 0.35, size * 0.35])
      for (const z of [-size * 0.45, size * 0.45])
        this.box(g, 0x6f6758, x, size * 0.3, z, 0.07, size * 0.5, 0.07);
    if (!cow && !sheep) {
      this.mesh(
        g,
        'cone',
        0xdfb64d,
        0,
        size * 0.95,
        size * 1.07,
        0.08,
        0.12,
        0.08,
      ).rotation.x = Math.PI / 2;
      this.mesh(
        g,
        'sphere',
        0xca6150,
        0,
        size * 1.3,
        size * 0.67,
        0.07,
        0.09,
        0.07,
      );
    }
    if (cow)
      this.mesh(g, 'sphere', 0x775945, 0.18, size * 0.88, 0, 0.15, 0.12, 0.23);
    for (const side of [-1, 1]) {
      this.mesh(
        g,
        'sphere',
        0x35352d,
        side * size * 0.16,
        size * 1.04,
        size * 1.03,
        size * 0.055,
        size * 0.07,
        size * 0.04,
      );
      if (cow || sheep)
        this.mesh(
          g,
          'sphere',
          cow ? 0xb18567 : 0xc1ad8e,
          side * size * 0.36,
          size * 1.05,
          size * 0.72,
          size * 0.16,
          size * 0.075,
          size * 0.12,
        );
    }
  }
  enemy(e: Enemy, g: T.Group) {
    if (e.kind === 'slime') {
      this.mesh(g, 'sphere', 0x74b6a9, 0, 0.35, 0, 0.55, 0.38, 0.5);
      for (const x of [-0.16, 0.16])
        this.mesh(g, 'sphere', 0x1d3447, x, 0.46, 0.42, 0.055, 0.07, 0.035);
      this.mesh(g, 'rock', 0xd0f5c9, 0, 0.4, 0, 0.16, 0.18, 0.16);
      return;
    }
    if (e.kind === 'shaman') {
      this.mesh(g, 'cone', 0x685285, 0, 0.52, 0, 0.4, 1.05, 0.4);
      this.mesh(g, 'sphere', 0x333047, 0, 1.08, 0, 0.23, 0.26, 0.23);
      for (const x of [-0.09, 0.09])
        this.mesh(g, 'sphere', 0xf6a76d, x, 1.11, 0.22, 0.035, 0.03, 0.035);
      this.box(g, 0x876646, 0.5, 0.7, 0, 0.06, 1.4, 0.06);
      this.mesh(g, 'rock', 0xc88bde, 0.5, 1.5, 0, 0.15, 0.25, 0.15);
      return;
    }
    if (e.kind === 'golem' || e.kind === 'guardian') {
      const boss = e.kind === 'guardian',
        c = boss ? 0x675d87 : 0x7c8993;
      this.mesh(g, 'rock', c, 0, 0.9, 0, 0.55, 0.7, 0.42);
      this.mesh(g, 'rock', c, 0, 1.58, 0.08, 0.32, 0.3, 0.31);
      for (const x of [-0.62, 0.62]) {
        this.mesh(g, 'rock', c, x, 0.92, 0, 0.25, 0.55, 0.28);
        this.mesh(g, 'rock', c, x * 0.5, 0.26, 0, 0.23, 0.32, 0.27);
        this.mesh(g, 'cone', 0xada2dd, x, 1.48, 0, 0.15, 0.4, 0.15);
      }
      this.mesh(
        g,
        'rock',
        boss ? 0xe6b57b : 0x99d5d8,
        0,
        1,
        0.39,
        0.16,
        0.27,
        0.08,
      );
      for (const x of [-0.12, 0.12])
        this.mesh(g, 'sphere', 0xf3cd82, x, 1.6, 0.36, 0.045, 0.04, 0.04);
      if (boss) g.scale.setScalar(1.6);
      return;
    }
    this.mesh(g, 'sphere', 0x706f82, 0, 0.45, 0, 0.32, 0.34, 0.54);
    this.mesh(g, 'sphere', 0x858397, 0, 0.66, 0.39, 0.28, 0.25, 0.29);
    for (const x of [-0.18, 0.18])
      this.mesh(g, 'cone', 0x605f75, x, 0.92, 0.38, 0.1, 0.25, 0.1);
    for (const x of [-0.12, 0.12])
      this.mesh(g, 'sphere', 0xeab975, x, 0.7, 0.63, 0.035, 0.035, 0.035);
    for (const x of [-0.22, 0.22])
      for (const z of [-0.32, 0.3])
        this.box(g, 0x565566, x, 0.2, z, 0.11, 0.35, 0.13);
  }
  makeClouds() {
    for (let i = 0; i < 10; i++) {
      const g = new T.Group();
      g.position.set(
        noise(i, 0, 2) * 50 - 7,
        9 + noise(i, 0, 4) * 6,
        noise(i, 3, 2) * 45,
      );
      for (let j = 0; j < 3; j++) {
        const m = this.mesh(
          g,
          'sphere',
          0xdde6d4,
          j * 1.1,
          0,
          0,
          1.7,
          0.5,
          1.0,
        );
        m.castShadow = false;
        m.receiveShadow = false;
      }
      compactModel(g);
      this.clouds.add(g);
    }
  }
  updateTerrain() {
    const s = this.engine.s;
    for (const t of s.tiles) {
      const n = noise(t.x, t.z, s.seed);
      const palette =
        season(s) === 3
          ? [0xc1d2c0, 0xb1c5b2, 0xacc3aa]
          : season(s) === 2
            ? [0x9aab61, 0xa9ae62, 0x8f9e55]
            : [0x9cb671, 0xadbd78, 0x91ab68];
      let c = s.mine
        ? t.terrain === 'wall'
          ? 0x333848
          : [0x646376, 0x595d70, 0x69677a][Math.floor(n * 3)]
        : t.terrain === 'water'
          ? 0x638c7c
          : t.terrain === 'sand'
            ? 0xd9c494
            : t.terrain === 'path'
              ? 0xb9a580
              : palette[Math.floor(n * 3)];
      this.ground.setColorAt(tileIndex(s, t.x, t.z), new T.Color(c));
    }
    this.ground.instanceColor!.needsUpdate = true;
    this.lastSeason = season(s);
  }
  sync() {
    const s = this.engine.s;
    if (this.bridge) this.bridge.visible = !s.mine && !!tileAt(s, 26, 19);
    if (this.lastSeason !== season(s)) this.updateTerrain();
    const shifted = this.terrainTiles !== s.tiles;
    if (shifted) {this.refreshGround();this.waterSpots=s.tiles.filter(t=>t.terrain==='water').filter((_,i)=>i%13===0).map(t=>({x:t.x,z:t.z}));}
    let changed = shifted;
    const active = new Set(s.tiles.map((t) => tileKey(t.x, t.z)));
    const activeChunks = new Set(s.tiles.map((t) => chunkKey(t.x, t.z)));
    for (const key of this.dirtyChunks)
      if (!activeChunks.has(key)) this.dirtyChunks.delete(key);
    for (const [key, group] of this.chunkMeshes)
      if (!activeChunks.has(key)) {
        this.worldBatches?.remove(key);
        this.chunkMeshes.delete(key);
        this.dirtyChunks.delete(key);
      }
    for (const [id, entry] of this.tiles)
      if (!active.has(id)) {
        this.tiles.delete(id);
      }
    for (const t of s.tiles) {
      const id = tileKey(t.x, t.z),
        key = `${t.resource}-${t.tilled}-${t.water > 0}-${t.crop}-${t.crop ? Math.floor((t.growth / CROPS[t.crop].grow) * 5) : 0}`;
      const old = this.tiles.get(id);
      if (old?.key === key) continue;
      if (old) this.root.remove(old.group);
      const g = new T.Group();
      g.position.set(t.x, t.height, t.z);
      g.userData.tile = { x: t.x, z: t.z };
      g.updateMatrixWorld(true);
      this.tiles.set(id, { key, group: g, pending: t });
      if (!shifted) this.updateTurf(t, tileIndex(s, t.x, t.z));
      this.dirtyChunks.add(chunkKey(t.x, t.z));
      changed = true;
    }
    const visibleBuildings = s.buildings.filter((b) => tileAt(s, b.x, b.z));
    const shadow = new T.Object3D();
    const nearbyShadows=visibleBuildings.filter(b=>Math.hypot(b.x-s.player.x,b.z-s.player.z)<18).slice(0,2048),light=sunlight(s.time);
    nearbyShadows.forEach((b, i) => {
      shadow.position.set(
        b.x - light.x*.015,
        (tileAt(s, b.x, b.z)?.height || 0) + 0.138,
        b.z + 0.22,
      );
      shadow.rotation.set(-Math.PI / 2, 0, -0.45);
      shadow.scale.setScalar(
        ['sprinkler', 'fence'].includes(b.type) ? 0.35 : 1,
      );
      shadow.updateMatrix();
      this.buildingShadows.setMatrixAt(i, shadow.matrix);
    });
    this.buildingShadows.count = nearbyShadows.length;
    this.buildingShadows.instanceMatrix.needsUpdate = true;
    this.buildingShadows.computeBoundingSphere();
    const ids = new Set(visibleBuildings.map((b) => b.id));
    for (const [id, b] of this.structures)
      if (!ids.has(id)) {
        this.root.remove(b.group);
        releaseModel(b.group);
        this.structures.delete(id);
        changed = true;
      }
    for (const b of visibleBuildings) {
      const key = `${b.type}-${b.level}-${b.rotation || 0}-${b.corner || false}`;
      const old = this.structures.get(b.id);
      if (old?.key === key) continue;
      if (old) {
        this.root.remove(old.group);
        releaseModel(old.group);
      }
      const g = new T.Group();
      g.position.set(b.x, tileAt(s, b.x, b.z)?.height || 0, b.z);
      this.building(b, g);
      g.rotation.y = (b.rotation || 0) * Math.PI / 2;
      compactModel(g);
      g.userData.tile = { x: b.x, z: b.z };
      this.root.add(g);
      this.structures.set(b.id, { key, group: g });
      changed = true;
    }
    const living = new Set([
      ...s.animals.filter((a) => tileAt(s, a.x, a.z)).map((a) => `a${a.id}`),
      ...s.enemies.map((e) => `e${e.id}`),
    ]);
    for (const [id, g] of this.creatures)
      if (!living.has(id)) {
        this.root.remove(g);
        releaseModel(g);
        this.creatures.delete(id);
      }
    for (const a of s.animals.filter((a) => tileAt(s, a.x, a.z))) {
      if (!this.creatures.has(`a${a.id}`)) {
        const g = new T.Group();
        this.animal(a, g);
        compactModel(g);
        this.root.add(g);
        this.creatures.set(`a${a.id}`, g);
      }
    }
    for (const e of s.enemies) {
      if (!this.creatures.has(`e${e.id}`)) {
        const g = new T.Group();
        this.enemy(e, g);
        compactModel(g);
        const health = new T.Group();
        health.name = 'health';
        health.position.y =
          e.kind === 'guardian' || e.kind === 'golem' ? 2.15 : 1.7;
        this.box(health, 0x28313b, 0, 0, 0, 0.85, 0.065, 0.04);
        const fill = this.box(
          health,
          e.kind === 'guardian' ? 0xd8a261 : 0xe77869,
          0,
          0,
          0.03,
          0.79,
          0.04,
          0.02,
        );
        fill.name = 'fill';
        g.add(health);
        this.root.add(g);
        this.creatures.set(`e${e.id}`, g);
      }
    }
    if (changed) {
      this.grassSurface.instanceMatrix.needsUpdate = true;
      this.flowers.instanceMatrix.needsUpdate = true;
      this.renderer.shadowMap.needsUpdate = true;
      this.pickables = [...this.tiles.values()]
        .filter((t) => t.group.children.length > 0)
        .map((t) => t.group)
        .concat(
          [...this.structures.values()].map((b) => b.group),
          this.villagers,
          this.landmarkGroups,
        );
      this.wheels = this.wheels.filter((w) => !!w.parent?.parent);
    }
  }
  pick(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((clientX - r.left) / r.width) * 2 - 1,
      (-(clientY - r.top) / r.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    const planePoint = new T.Vector3();
    this.ray.ray.intersectPlane(this.plane, planePoint);
    const candidates = this.pickables.filter(
      (g) =>
        Math.hypot(g.position.x - planePoint.x, g.position.z - planePoint.z) <
        7,
    );
    const hits = this.ray.intersectObjects(candidates, true);
    for (const hit of hits) {
      let o: T.Object3D | null = hit.object;
      while (o) {
        if (o.userData.tile) return o.userData.tile as { x: number; z: number };
        o = o.parent;
      }
    }
    let point = planePoint;
    let tile = tileAt(this.engine.s, point.x, point.z);
    if (tile && tile.height) {
      this.ray.ray.intersectPlane(
        new T.Plane(new T.Vector3(0, 1, 0), -tile.height - 0.12),
        point,
      );
      tile = tileAt(this.engine.s, point.x, point.z);
    }
    return tile ? { x: tile.x, z: tile.z } : null;
  }
  resize(container: HTMLElement) {
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.renderer.setSize(this.width, this.height);
    const aspect = this.width / Math.max(1, this.height);
    this.camera.left = (-this.zoom * aspect) / 2;
    this.camera.right = (this.zoom * aspect) / 2;
    this.camera.top = this.zoom / 2;
    this.camera.bottom = -this.zoom / 2;
    this.camera.near = 0.1;
    this.camera.far = 180;
    this.camera.updateProjectionMatrix();
  }
  setQuality(high: boolean) {
    this.highQuality = high;
    this.adaptiveScale = 1;
    this.budget?.reset();
    this.renderer.shadowMap.enabled = high;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, high ? 1.35 : 1),
    );
    this.renderer.shadowMap.needsUpdate = true;
    this.resize(this.canvas.parentElement!);
  }
  recenter() {
    this.pan.set(0, 0, 0);
  }
  nameTag(parent: T.Object3D, text: string, y: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 72;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(27,49,38,.88)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 376, 60, 15);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,207,151,.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f1dfb4';
    ctx.font = '500 25px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(text, 192, 43);
    const texture = new T.CanvasTexture(canvas);
    const sprite = new T.Sprite(
      new T.SpriteMaterial({
        map: texture,
        depthTest: false,
        transparent: true,
      }),
    );
    sprite.position.y = y;
    sprite.scale.set(1.8, 0.34, 1);
    sprite.userData.nameTag = true;
    parent.add(sprite);
  }
  makeVillagers() {
    if (this.engine.s.mine) {
      for (const [spot, label, color] of [
        [MINE_LIFT, 'Asansör · Vadiye dön', 0xdeb46f],
        [
          MINE_STAIRS,
          this.engine.s.mine.floor === 5
            ? 'Dağın kalbi · Hazine'
            : 'Alt kata geç',
          0x9ac9df,
        ],
      ] as const) {
        const g = new T.Group();
        g.position.set(spot.x, 0, spot.z);
        g.userData.tile = { x: spot.x, z: spot.z };
        this.box(g, 0x847052, 0, 0.16, 0, 1.3, 0.2, 1.3);
        for (const x of [-0.52, 0.52])
          this.box(g, 0x847052, x, 0.85, 0, 0.15, 1.6, 0.16);
        this.box(g, color, 0, 1.64, 0, 1.2, 0.16, 0.2);
        this.nameTag(g, label, 2.2);
        const light = new T.PointLight(color, 5, 9, 1.2);
        light.position.y = 2;
        g.add(light);
        compactModel(g);
        this.root.add(g);
        this.landmarkGroups.push(g);
      }
      return;
    }
    for (const n of NPCS) {
      const g = new T.Group();
      g.position.set(n.x, tileAt(this.engine.s, n.x, n.z)?.height || 0, n.z);
      this.makeCharacter(g, n.color);
      g.userData.tile = { x: n.x, z: n.z };
      g.userData.npc = n.id;
      g.rotation.y = n.id === 'lale' ? -1 : 0.5;
      if (n.id === 'lale') {
        const pole = this.box(g, 0x755634, 0.34, 0.85, 0.2, 0.035, 1.6, 0.035);
        pole.rotation.x = 0.3;
      } else if (n.id === 'torin') {
        this.box(g, 0x957351, 0.3, 0.6, 0.18, 0.055, 0.6, 0.06);
        this.box(g, 0x86968b, 0.3, 0.94, 0.18, 0.3, 0.16, 0.17);
      }
      compactModel(g);
      this.nameTag(g, n.name, 1.8);
      compactModel(g);
      this.root.add(g);
      this.villagers.push(g);
    }
    for (const l of LANDMARKS) {
      const g = new T.Group();
      g.position.set(l.x, tileAt(this.engine.s, l.x, l.z)?.height || 0, l.z);
      g.userData.tile = { x: l.x, z: l.z };
      g.userData.landmark = l.id;
      if (l.id === 'grove') {
        this.mesh(g, 'cylinder', 0x6c553d, 0, 1.05, -0.3, 0.3, 2.1, 0.3);
        for (let i = 0; i < 5; i++)
          this.mesh(
            g,
            'sphere',
            [0x769858, 0x89ac69, 0x668c54][i % 3],
            Math.sin(i * 2.4) * 0.55,
            2.05 + i * 0.2,
            Math.cos(i * 2.4) * 0.55 - 0.3,
            1.1,
            0.8,
            0.9,
          );
      } else if (l.id === 'ruins') {
        this.nameTag(g, 'Kadim maden · Seviye 3', 2.7);
        for (const x of [-0.85, 0.85]) {
          this.mesh(g, 'cylinder', 0x9fa693, x, 0.9, 0, 0.22, 1.8, 0.22);
          this.box(g, 0xb4b89c, x, 1.85, 0, 0.5, 0.2, 0.5);
        }
        this.box(g, 0x929c8b, 0, 2.07, 0, 2.1, 0.26, 0.5);
        for (let i = 0; i < 4; i++)
          this.mesh(
            g,
            'rock',
            0x9ba28c,
            (i - 1.5) * 0.4,
            0.25,
            0.7,
            0.23,
            0.19,
            0.21,
          );
      } else {
        this.mesh(g, 'cylinder', 0x81684b, -0.4, 1.15, -0.3, 0.055, 2.3, 0.055);
        this.box(g, 0xd1ac6d, -0.05, 2.02, -0.3, 0.66, 0.48, 0.025);
        for (let i = 0; i < 3; i++)
          this.mesh(
            g,
            'rock',
            0xa6ad98,
            0.6,
            0.2 + i * 0.15,
            0,
            0.4 - i * 0.08,
            0.15,
            0.35 - i * 0.08,
          );
      }
      this.box(g, 0x906d40, 0, 0.28, 0.5, 0.65, 0.4, 0.45);
      this.box(g, 0xb99857, 0, 0.5, 0.5, 0.68, 0.13, 0.48);
      for (const x of [-0.24, 0.24])
        this.box(g, 0xd1b776, x, 0.28, 0.74, 0.055, 0.42, 0.035);
      this.box(g, 0xe4c984, 0, 0.4, 0.75, 0.12, 0.12, 0.04);
      this.nameTag(g, l.name, l.id === 'grove' ? 3.7 : 2.55);
      compactModel(g);
      this.root.add(g);
      this.landmarkGroups.push(g);
    }
  }
  makeWeather() {
    const positions = new Float32Array(240 * 6);
    for (let i = 0; i < 240; i++) {
      const x = noise(i, 1, 4) * 40,
        z = noise(i, 2, 7) * 40,
        y = noise(i, 7, 3) * 12;
      positions.set([x, y, z, x - 0.08, y + 0.5, z + 0.05], i * 6);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(positions, 3));
    this.rain = new T.LineSegments(
      geo,
      new T.LineBasicMaterial({
        color: 0xb4d4d2,
        transparent: true,
        opacity: 0.4,
      }),
    );
    this.scene.add(this.rain);
    const fp = new Float32Array(80 * 3);
    for (let i = 0; i < 80; i++)
      fp.set(
        [noise(i, 1, 14) * 36, 0.4 + noise(i, 5, 5) * 1.5, noise(i, 4, 1) * 36],
        i * 3,
      );
    const fg = new T.BufferGeometry();
    fg.setAttribute('position', new T.BufferAttribute(fp, 3));
    this.fireflies = new T.Points(
      fg,
      new T.PointsMaterial({
        color: 0xf0e49a,
        size: 0.06,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    );
    this.scene.add(this.fireflies);
  }
  setZoom(delta: number) {
    this.zoom = T.MathUtils.clamp(this.zoom + delta, 7, 22);
    this.resize(this.canvas.parentElement!);
  }
  burst(x: number, z: number, color = 0xe1c57b) {
    for (let i = 0; i < 7; i++) {
      const m = new T.Mesh(this.geo('box'), this.mat(color));
      m.position.set(x, 0.5, z);
      m.scale.setScalar(0.06);
      this.root.add(m);
      this.effects.push({
        mesh: m,
        life: 0.8,
        velocity: new T.Vector3(
          Math.sin(i * 3) * 1.2,
          1.3 + i * 0.1,
          Math.cos(i * 3) * 1.2,
        ),
      });
    }
  }
  celebrate(x: number, z: number) {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    if (!this.confetti) {
      this.confetti = new T.InstancedMesh(
        this.geo('box'),
        this.mat(0xffffff),
        64,
      );
      this.confetti.frustumCulled = false;
      this.root.add(this.confetti);
    }
    this.confettiLife = 2.4;
    this.confettiPieces = Array.from({ length: 64 }, (_, i) => ({
      x,
      y: (tileAt(this.engine.s, x, z)?.height || 0) + 1.3,
      z,
      vx: Math.sin(i * 2.4) * (1 + (i % 4)),
      vy: 3 + (i % 3),
      vz: Math.cos(i * 2.4) * (1 + (i % 4)),
      spin: i,
    }));
    for (let i = 0; i < 64; i++)
      this.confetti.setColorAt(
        i,
        new T.Color([0xf6d170, 0xa4d6a4, 0xeaa3a0, 0x94c5d2][i % 4]),
      );
    this.confetti.instanceColor!.needsUpdate = true;
  }
  animateHuman(g:T.Group,action:HumanAction,time:number) {
    const pose=humanPose(action,time);
    for(const name of ['leftLeg','rightLeg','leftArm','rightArm'] as const){const limb=g.getObjectByName(name);if(limb)limb.rotation.x=pose[name];}
    const arm=g.getObjectByName('rightArm');if(arm)arm.rotation.z=pose.armSide;
    g.rotation.x=pose.lean;g.position.y+=pose.height;
  }
  syncRemotePlayers(dt:number) {
    const peers=this.engine.network?.peers||[],active=new Set(peers.map(p=>p.id));
    for(const [id,g] of this.remotePlayers)if(!active.has(id)){this.root.remove(g);releaseModel(g);this.remotePlayers.delete(id);}
    for(const peer of peers){
      let g=this.remotePlayers.get(peer.id);
      if(!g){g=new T.Group();this.makeCharacter(g,0xb88bb3);compactModel(g);this.nameTag(g,peer.name,1.9);g.position.set(peer.player.x,0,peer.player.z);this.remotePlayers.set(peer.id,g);this.root.add(g);}
      const moving=Math.hypot(peer.player.x-g.position.x,peer.player.z-g.position.z)>.025;
      g.position.x+=(peer.player.x-g.position.x)*Math.min(1,dt*9);g.position.z+=(peer.player.z-g.position.z)*Math.min(1,dt*9);
      g.position.y=tileAt(this.engine.s,g.position.x,g.position.z)?.height||0;g.rotation.y=peer.player.facing;
      this.animateHuman(g,moving?'walking':'idle',this.time);
    }
  }
  animateNature(daylight:number) {
    if(!this.butterflies){
      this.butterflies=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xf2c66f,side:T.DoubleSide}),24);
      this.fishSchool=new T.InstancedMesh(new T.SphereGeometry(1,6,4),new T.MeshStandardMaterial({color:0xbdd9d9,roughness:.4}),4);
      this.butterflies.frustumCulled=false;this.fishSchool.frustumCulled=false;this.root.add(this.butterflies,this.fishSchool);
      const heart=new T.Shape();heart.moveTo(0,-.55);heart.bezierCurveTo(-1,.05,-.65,.9,0,.4);heart.bezierCurveTo(.65,.9,1,.05,0,-.55);
      this.affectionHearts=new T.InstancedMesh(new T.ShapeGeometry(heart,6),new T.MeshBasicMaterial({color:0xf2a8a6,side:T.DoubleSide}),32);
      this.affectionHearts.frustumCulled=false;this.root.add(this.affectionHearts);
    }
    const s=this.engine.s,p=s.player,d=this.ambienceDummy;
    if(!this.windowLights){this.windowLights=new T.InstancedMesh(new T.BoxGeometry(.19,.22,.008),new T.MeshBasicMaterial({color:0xffcf85}),128);this.root.add(this.windowLights);this.windowLights.frustumCulled=false;}
    this.windowLights.count=0;
    if(daylight<.15)for(const [id] of this.structures){
      const building=s.buildings.find(b=>b.id===id); 
      if(!building || building.type!=='home'||Math.hypot(building.x-p.x,building.z-p.z)>18)continue;
      const angle=(building.rotation||0)*Math.PI/2;
      for(const x of [-.36,.36]){if(this.windowLights.count>=128)break;d.position.set(building.x+x*Math.cos(angle)+.605*Math.sin(angle),(tileAt(s,building.x,building.z)?.height||0)+.94,building.z-x*Math.sin(angle)+.605*Math.cos(angle));d.rotation.set(0,angle,0);d.scale.set(1,1,1);d.updateMatrix();this.windowLights.setMatrixAt(this.windowLights.count++,d.matrix);}
    }
    this.windowLights.instanceMatrix.needsUpdate=true;
    this.affectionHearts!.count=0;
    for(const a of s.animals){if(this.affectionHearts!.count>=32)break;if((this.engine.animalMotion.get(a.id)?.happy||0)<=0||Math.hypot(a.x-p.x,a.z-p.z)>15)continue;
      d.position.set(a.x,(tileAt(s,a.x,a.z)?.height||0)+1.3+Math.sin(this.time*3)*.1,a.z);d.rotation.copy(this.camera.rotation);d.scale.setScalar(.2);d.updateMatrix();this.affectionHearts!.setMatrixAt(this.affectionHearts!.count++,d.matrix);
    }this.affectionHearts!.instanceMatrix.needsUpdate=true;
    this.butterflies.visible=!s.mine&&daylight>.2&&this.budget.tier<3;
    if(this.butterflies.visible){
      for(let i=0;i<24;i++){
        const x=p.x+Math.sin(i*4.7)*10+Math.sin(this.time*.24+i),z=p.z+Math.cos(i*3.2)*10+Math.cos(this.time*.2+i);
        d.position.set(x,(tileAt(s,x,z)?.height||0)+.65+Math.sin(this.time*2+i)*.12,z);
        d.rotation.set(-.4,Math.sin(this.time*12+i),i);d.scale.set(.13,.07,1);d.updateMatrix();this.butterflies.setMatrixAt(i,d.matrix);
      }this.butterflies.instanceMatrix.needsUpdate=true;
    }
    this.fishSchool!.visible=!s.mine&&this.budget.tier<3;this.fishSchool!.count=0;
    if(this.fishSchool!.visible){
      // Four fish at most; tile lookup bounds the effect without scanning the map.
      for(let i=0;i<4;i++){
        const spot=this.waterSpots[(Math.floor(this.time/12)+i*7)%this.waterSpots.length];if(!spot||Math.hypot(spot.x-p.x,spot.z-p.z)>15)continue;
        const phase=(this.time+i*2.7)%12;if(phase>1.2)continue;
        d.position.set(spot.x+phase*.3,.1+Math.sin(phase/1.2*Math.PI)*.6,spot.z);d.rotation.set(0,.6,Math.cos(phase*2.6));d.scale.set(.12,.045,.04);d.updateMatrix();this.fishSchool!.setMatrixAt(this.fishSchool!.count++,d.matrix);
      }this.fishSchool!.instanceMatrix.needsUpdate=true;
    }
  }
  render(dt: number, frameDuration = dt) {
    if (this.contextLost) return;
    if (this.confetti && this.confettiLife > 0) {
      const delta = Math.min(0.08, frameDuration),
        dummy = new T.Object3D();
      this.confettiLife = Math.max(0, this.confettiLife - delta);
      this.confetti.count =
        this.confettiLife > 0 ? this.confettiPieces.length : 0;
      this.confettiPieces.forEach((piece, i) => {
        piece.vy -= delta * 3;
        piece.x += piece.vx * delta;
        piece.y += piece.vy * delta;
        piece.z += piece.vz * delta;
        dummy.position.set(piece.x, piece.y, piece.z);
        dummy.rotation.set(
          piece.spin + this.time * 3,
          piece.spin,
          this.confettiLife * 4,
        );
        dummy.scale.set(0.055, 0.025, 0.09);
        dummy.updateMatrix();
        this.confetti!.setMatrixAt(i, dummy.matrix);
      });
      this.confetti.instanceMatrix.needsUpdate = true;
    }
    this.time += dt;
    this.waterTime.value = this.time;
    this.syncClock += dt;
    if (this.syncClock > 0.25 || this.terrainTiles !== this.engine.s.tiles) {
      this.sync();
      this.syncClock = 0;
    }
    this.flushChunk();
    const s = this.engine.s,
      p = s.player;
    this.player.position.set(
      p.x,
      (tileAt(s, p.x, p.z)?.height || 0) +
        0.04 +
        (this.engine.path.length
          ? Math.abs(Math.sin(this.time * 12)) * 0.045
          : 0),
      p.z,
    );
    this.player.rotation.y = p.facing;
    for (const a of s.animals) {
      const g = this.creatures.get(`a${a.id}`);
      if (g) {
        g.scale.setScalar(s.day - (a.bornDay ?? -3) < 2 ? 0.6 : 1);
        const motion = this.engine.animalMotion.get(a.id);
        const bob = motion?.moving
          ? Math.abs(Math.sin(this.time * 10 + a.id)) * 0.025
          : 0;
        g.position.set(
          a.x,
          (tileAt(s, a.x, a.z)?.height || 0) + 0.04 + bob,
          a.z,
        );
        if (motion) {
          const difference = Math.atan2(
            Math.sin(motion.facing - g.rotation.y),
            Math.cos(motion.facing - g.rotation.y),
          );
          g.rotation.y += difference * Math.min(1, dt * 7);
          const pose=animalPose(motion.mood,this.time+a.id);
          g.rotation.x=pose.pitch;g.rotation.z=pose.roll;g.scale.y*=pose.squash;
          g.position.y=(tileAt(s,a.x,a.z)?.height||0)+.04+pose.height;

        }
      }
    }
    for (const e of s.enemies) {
      const g = this.creatures.get(`e${e.id}`);
      if (g) {
        g.position.set(
          e.x,
          (tileAt(s, e.x, e.z)?.height || 0) +
            0.04 +
            Math.abs(Math.sin(this.time * 10 + e.id)) * 0.035,
          e.z,
        );
        g.rotation.y = Math.atan2(p.x - e.x, p.z - e.z);
        const health = g.getObjectByName('health');
        if (health) {
          health.rotation.y = this.angle - g.rotation.y;
          const fill = health.getObjectByName('fill')!;
          fill.scale.x = 0.79 * Math.max(0.001, e.hp / e.maxHp);
          fill.position.x = -0.395 * (1 - e.hp / e.maxHp);
        }
      }
      if ((e.windup || 0) > 0) {
        let ring = this.warnings.get(e.id);
        if (!ring) {
          ring = new T.Mesh(
            new T.RingGeometry(0.88, 1, 40),
            new T.MeshBasicMaterial({
              color: 0xff785a,
              transparent: true,
              opacity: 0.85,
              side: T.DoubleSide,
              depthWrite: false,
            }),
          );
          ring.rotation.x = -Math.PI / 2;
          this.root.add(ring);
          this.warnings.set(e.id, ring);
        }
        ring.position.set(
          e.aimX!,
          (tileAt(s, e.aimX!, e.aimZ!)?.height || 0) + 0.16,
          e.aimZ!,
        );
        ring.scale.setScalar(ENEMIES[e.kind || 'wolf'].radius);
      }
    }
    for (const [id, ring] of this.warnings)
      if (!s.enemies.some((e) => e.id === id && (e.windup || 0) > 0)) {
        this.root.remove(ring);
        ring.geometry.dispose();
        (ring.material as T.Material).dispose();
        this.warnings.delete(id);
      }
    const moving =
      Math.hypot(p.x - this.lastPlayer.x, p.z - this.lastPlayer.y) > 0.002;
    this.lastPlayer.set(p.x, p.z);
    const action:HumanAction=moving?(this.engine.sprinting?'running':'walking'):this.engine.playerAction.remaining>0?this.engine.playerAction.kind:this.engine.fishing?'fishing':this.engine.resting?'sitting':this.engine.actionCooldown>0?'working':'idle';
    this.animateHuman(this.player,action,action==='standing'?1-this.engine.playerAction.remaining:this.time);
    this.syncRemotePlayers(frameDuration);
    if (this.activeTool !== this.heldTool) {
      this.handTool.clear();
      this.heldTool = this.activeTool;
      if (
        ['axe', 'pickaxe', 'hoe', 'sword', 'fish', 'water', 'build'].includes(
          this.activeTool,
        )
      ) {
        if (this.activeTool === 'water') {
          this.mesh(
            this.handTool,
            'cylinder',
            0x83acb0,
            0,
            -0.05,
            0.12,
            0.16,
            0.23,
            0.16,
          );
          this.box(this.handTool, 0x93bdc0, 0, 0.01, 0.31, 0.06, 0.06, 0.27);
        } else {
          this.box(
            this.handTool,
            this.activeTool === 'sword' ? 0xc1cacc : 0x9b784e,
            0,
            0.14,
            0,
            0.055,
            this.activeTool === 'fish' ? 1.4 : 0.64,
            0.055,
          );
          if (this.activeTool !== 'fish')
            this.box(
              this.handTool,
              this.activeTool === 'axe' ? 0x94a5a3 : 0xbdc5bd,
              this.activeTool === 'sword' ? 0 : 0.08,
              0.43,
              0,
              this.activeTool === 'sword' ? 0.07 : 0.38,
              0.12,
              0.09,
            );
        }
      }
    }
    this.handTool.rotation.x =
      this.engine.actionCooldown > 0
        ? -Math.sin(this.engine.actionCooldown * 8)
        : 0;
    for(const g of this.villagers){
      const actor=this.engine.npcMotion.get(g.userData.npc);
      if(actor){g.position.set(actor.x,tileAt(s,actor.x,actor.z)?.height||0,actor.z);g.rotation.y=actor.facing;g.userData.tile={x:Math.round(actor.x),z:Math.round(actor.z)};this.animateHuman(g,actor.action,this.time);}
      for(const child of g.children)if(child.userData.nameTag)child.visible=Math.hypot(g.position.x-p.x,g.position.z-p.z)<8;
    }
    for (const g of [...this.villagers, ...this.landmarkGroups]) {
      g.visible = !!tileAt(s, g.position.x, g.position.z);
    }
    for (const g of this.landmarkGroups)
      for (const child of g.children)
        if (child.userData.nameTag)
          child.visible =
            Math.hypot(g.position.x - p.x, g.position.z - p.z) < 10;
    if (this.engine.path.length) this.arrivalPending = true;
    else if (this.arrivalPending) { this.arrivalPending = false; this.recenter(); }
    this.target.lerp(
      new T.Vector3(p.x + this.pan.x, 0, p.z + this.pan.z),
      1 - Math.exp(-Math.min(.08, frameDuration) * 6),
    );
    this.camera.position.set(
      this.target.x + Math.sin(this.angle) * 32,
      28,
      this.target.z + Math.cos(this.angle) * 32,
    );
    this.camera.lookAt(this.target);
    this.hover.visible = !!this.hoverTile;
    if (this.hoverTile)
      this.hover.position.set(
        this.hoverTile.x,
        tileAt(s, this.hoverTile.x, this.hoverTile.z)?.height || 0,
        this.hoverTile.z,
      );
    if (`${this.placement}-${this.placementCorner}` !== this.ghostType) {
      this.ghost.traverse((o) => {
        if (o instanceof T.Mesh && o.userData.ghostMaterial)
          (o.material as T.Material).dispose();
      });
      this.ghost.clear();
      this.ghostType = `${this.placement}-${this.placementCorner}`;
      if (this.placement) {
        this.building(
          {
            id: -1,
            corner: this.placementCorner,
            type: this.placement,
            x: 0,
            z: 0,
            level: 1,
            hp: 100,
            timer: 0,
            enabled: true,
          },
          this.ghost,
        );
        this.ghost.traverse((o) => {
          if (o instanceof T.Mesh) {
            o.material = (o.material as T.Material).clone();
            const m = o.material as T.MeshStandardMaterial;
            m.transparent = true;
            m.opacity = 0.45;
            m.depthWrite = false;
            o.castShadow = false;
            o.userData.ghostMaterial = true;
          }
          if (o instanceof T.Light) o.visible = false;
        });
      }
    }
    this.ghost.rotation.y = this.placementRotation * Math.PI / 2;
    this.ghost.visible = !!this.placement && !!this.hoverTile;
    if (this.ghost.visible && this.hoverTile) {
      this.ghost.position.set(
        this.hoverTile.x,
        0.03 + (tileAt(s, this.hoverTile.x, this.hoverTile.z)?.height || 0),
        this.hoverTile.z,
      );
      const tile = tileAt(s, this.hoverTile.x, this.hoverTile.z)!,
        valid =
          tile.terrain === 'grass' &&
          !tile.resource &&
          !tile.crop &&
          !buildingAt(s, tile.x, tile.z) &&
          Math.hypot(p.x - tile.x, p.z - tile.z) > 0.65 &&
          !(Math.round(p.x) === tile.x && Math.round(p.z) === tile.z) &&
          !NPCS.some((n) => n.x === tile.x && n.z === tile.z) &&
          !LANDMARKS.some((n) => Math.hypot(n.x - tile.x, n.z - tile.z) < 1.5);
      this.ghost.traverse((o) => {
        if (o instanceof T.Mesh)
          (o.material as T.MeshStandardMaterial).color.set(
            valid ? 0xbad998 : 0xe59886,
          );
      });
    }
    const light=sunlight(s.time),daylight=light.daylight;
    this.bankLight.value=.13+daylight*.87;
    this.sun.intensity=s.mine?.8:light.direct;
    this.sun.color.set(light.night?0x8aaee8:daylight<.3?0xffbd85:0xffedbf);
    this.ambient.intensity=s.mine?1.9:light.ambient;
    this.buildingShadows.visible=!light.night;
    (this.river.material as T.MeshStandardMaterial).color.set(light.night?0x28436d:daylight<.3?0x699ab0:0x469cbd);
    this.animateNature(daylight);
    const sky = s.mine
      ? new T.Color(0x151c2b)
      : new T.Color(0x0c172e).lerp(
          new T.Color(s.weather === 'rain' ? 0x526e70 : 0xa6b18e),
          daylight,
        );
    this.scene.background = sky;
    (this.scene.fog as T.FogExp2).color.copy(sky);
    for (const wheel of this.wheels) wheel.rotation.z = this.time * 0.35;
    for (const c of this.clouds.children) {
      c.position.x += dt * 0.07;
      if (c.position.x > 48) c.position.x = -10;
      c.visible = !s.mine && s.weather !== 'rain';
    }
    this.rain.visible = !s.mine && s.weather === 'rain';
    if (this.rain.visible) {
      const pos = this.rain.geometry.attributes.position as T.BufferAttribute;
      for (let i = 0; i < pos.count; i += 2) {
        let y = pos.getY(i) - dt * 8;
        if (y < 0) y = 12;
        pos.setY(i, y);
        pos.setY(i + 1, y + 0.5);
      }
      pos.needsUpdate = true;
    }
    this.fireflies.visible = !!s.mine || daylight < 0.4;
    this.fireflies.position.y = Math.sin(this.time * 0.7) * 0.12;
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      e.velocity.y -= dt * 3;
      e.mesh.position.addScaledVector(e.velocity, dt);
      e.mesh.scale.setScalar(Math.max(0, e.life) * 0.1);
      if (e.life <= 0) {
        this.root.remove(e.mesh);
        this.effects.splice(i, 1);
      }
    }
    this.shadowClock += dt;
    if (this.renderer.shadowMap.enabled && this.shadowClock > 0.3) {
      this.renderer.shadowMap.needsUpdate = true;
      this.shadowClock = 0;
    }
    this.sun.position.set(p.x+light.x,light.y,p.z-8);
    this.sun.target.position.set(p.x, 0, p.z);
    this.renderer.render(this.scene, this.camera);
    this.metrics.activeTiles = s.tiles.length;
    this.metrics.drawCalls = this.renderer.info.render.calls;
    this.metrics.triangles = this.renderer.info.render.triangles;
    this.metrics.frameMs = this.frameAverage;
    this.metrics.chunks = this.chunkMeshes.size;
    if (this.budget.sample(frameDuration*1000)) {
      this.adaptiveScale=this.budget.scale;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,this.highQuality ? 1.35 : 1)*this.adaptiveScale);
      this.renderer.shadowMap.enabled=this.highQuality && this.budget.tier<2;
      this.renderer.shadowMap.needsUpdate=true;
      this.flowers.visible=this.budget.tier<3;
      this.clouds.visible=this.budget.tier<4;
      this.resize(this.canvas.parentElement!);
    }
    this.frameAverage=this.budget.average;

  }
  drawMinimap(canvas: HTMLCanvasElement) {
    const c = canvas.getContext('2d');
    if (!c) return;
    const s = this.engine.s,
      k = canvas.width / worldSize(s),
      o = worldOrigin(s);
    c.fillStyle = '#162d2b';
    c.fillRect(0, 0, canvas.width, canvas.height);
    for (const t of s.tiles) {
      if (!t.seen) continue;
      c.fillStyle =
        t.terrain === 'wall'
          ? '#303344'
          : s.mine
            ? t.resource
              ? '#aea5d0'
              : '#78788c'
            : t.terrain === 'water'
              ? '#6dbbb0'
              : t.terrain === 'path'
                ? '#d9b882'
                : t.resource === 'tree'
                  ? '#466f4e'
                  : t.resource === 'crystal'
                    ? '#bca1e5'
                    : t.tilled
                      ? '#a47c59'
                      : '#92aa6a';
      c.fillRect((t.x - o.x) * k, (t.z - o.z) * k, k + 0.5, k + 0.5);
    }
    for (const b of s.buildings) {
      c.fillStyle = b.type === 'home' ? '#eddbab' : '#d49c6b';
      c.fillRect((b.x - o.x) * k - 1, (b.z - o.z) * k - 1, k + 2, k + 2);
    }
    for (const e of s.enemies) {
      c.fillStyle = '#e27066';
      c.fillRect((e.x - o.x) * k, (e.z - o.z) * k, 4, 4);
    }
    c.beginPath();
    c.fillStyle = '#fff1c7';
    c.arc((s.player.x - o.x) * k, (s.player.z - o.z) * k, 3.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#1c4645';
    c.lineWidth = 1.5;
    c.stroke();
  }
  dispose() {
    this.resizeObserver.disconnect();
    this.disposeHandlers.forEach((fn) => fn());
    for (const g of this.geometries.values()) g.dispose();
    for (const m of this.materials.values()) m.dispose();
    for (const t of Object.values(this.textures)) t.dispose();
    this.scene.traverse((o) => {
      if (o instanceof T.InstancedMesh) o.dispose();
      if (o instanceof T.Sprite) {
        o.material.map?.dispose();
        o.material.dispose();
      }
      if (o instanceof T.Mesh || o instanceof T.Line || o instanceof T.Points) {
        if (![...this.geometries.values()].includes(o.geometry))
          o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          m.dispose();
      }
    });
    this.worldBatches?.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }
}
