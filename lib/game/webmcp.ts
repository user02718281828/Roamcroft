import { BUILDINGS, CROPS, RECIPES, TOOLS } from './data.ts';
import { tileAt } from './model.ts';
import type { Engine } from './model.ts';
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type Context = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function gameTools(
  engine: Engine,
  onChange: () => void,
  isPaused: () => boolean,
): Tool[] {
  const args = (input: unknown) => {
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new Error('Nesne biçiminde girdi gerekli.');
    return input as Record<string, unknown>;
  };
  return [
    {
      name: 'read_game_state',
      title: 'Vadi durumunu oku',
      description:
        'Karakter, envanter, ilerleme, yapılar, ekinler ve üretim kuyruğunu okur.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => {
        const s = engine.s;
        return {
          day: s.day,
          time: s.time,
          level: s.level,
          region: s.mine
            ? { mineFloor: s.mine.floor }
            : { x: s.world.x, z: s.world.z, width: Math.sqrt(s.tiles.length) },
          player: s.player,
          inventory: s.inventory,
          gold: s.gold,
          jobs: s.jobs,
          buildings: s.buildings,
          crops: s.tiles.filter((t) => t.crop),
          enemies: s.enemies,
          paused: isPaused(),
        };
      },
    },
    {
      name: 'start_tile_action',
      title: 'Arazi eylemine başla',
      description:
        'Karakteri seçilen kareye doğru yürütür ve varınca aracı kullanır. Eylemi başlatır; yürüme ve etkileşim sonraki oyun karelerinde tamamlanır. Duraklatılmış oyunda çalışmaz.',
      inputSchema: {
        type: 'object',
        properties: {
          x: { type: 'integer', minimum: -1000000000, maximum: 1000000000 },
          z: { type: 'integer', minimum: -1000000000, maximum: 1000000000 },
          tool: {
            type: 'string',
            enum: [...TOOLS.map((t) => t.id), 'build', 'fertilize'],
          },
          selection: { type: 'string' },
        },
        required: ['x', 'z', 'tool'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const a = args(input);
        if (isPaused()) throw new Error('Önce oyuna dön.');
        if (
          !Number.isInteger(a.x) ||
          !Number.isInteger(a.z) ||
          !tileAt(engine.s, a.x as number, a.z as number)
        )
          throw new Error('Geçersiz arazi koordinatı.');
        if (
          typeof a.tool !== 'string' ||
          ![...TOOLS.map((t) => t.id), 'build', 'fertilize'].includes(a.tool)
        )
          throw new Error('Geçersiz araç.');
        const selection =
          typeof a.selection === 'string' ? a.selection : 'wheat';
        if (
          (a.tool === 'build' && !Object.hasOwn(BUILDINGS, selection)) ||
          (a.tool === 'seed' && !Object.hasOwn(CROPS, selection))
        )
          throw new Error('Geçersiz yapı veya ekin.');
        engine.go(a.x as number, a.z as number, a.tool, selection);
        onChange();
        return {
          status: engine.pending || engine.path.length ? 'started' : 'resolved',
          pathLength: engine.path.length,
          message: engine.events.at(-1)?.text,
        };
      },
    },
    {
      name: 'queue_crafting',
      title: 'Üretimi sıraya al',
      description:
        'Malzemeyi ve enerjiyi harcayarak tarifi üretim kuyruğuna alır. Ürün, oyun zamanı ilerleyince tamamlanır.',
      inputSchema: {
        type: 'object',
        properties: { recipe: { type: 'string', enum: Object.keys(RECIPES) } },
        required: ['recipe'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const a = args(input);
        if (typeof a.recipe !== 'string' || !Object.hasOwn(RECIPES, a.recipe))
          throw new Error('Geçersiz tarif.');
        const success = engine.craft(a.recipe);
        onChange();
        return {
          success,
          queue: engine.s.jobs,
          message: engine.events.at(-1)?.text,
        };
      },
    },
  ];
}
export function registerGameTools(
  engine: Engine,
  onChange: () => void,
  isPaused: () => boolean,
) {
  const context = (document as Document & { modelContext?: Context })
      .modelContext,
    lifecycle = new AbortController();
  if (context?.registerTool) {
    for (const tool of gameTools(engine, onChange, isPaused)) {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    }
  }
  return () => lifecycle.abort();
}
