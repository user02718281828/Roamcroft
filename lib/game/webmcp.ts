import { sourceText } from '../i18n/source.ts';
import { localizeText } from '../i18n/core.ts';
import { subscribeLocale } from '../i18n/locale.ts';
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
      throw new Error(sourceText("m_ffd385958b"));
    return input as Record<string, unknown>;
  };
  return [
    {
      name: 'read_game_state',
      title: sourceText("m_39323e3926"),
      description:
        sourceText("m_b965d4b90a"),
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
      title: sourceText("m_12a80871d4"),
      description:
        sourceText("m_f40f48a753"),
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
        if (isPaused()) throw new Error(sourceText("m_53ac96d9b9"));
        if (
          !Number.isInteger(a.x) ||
          !Number.isInteger(a.z) ||
          !tileAt(engine.s, a.x as number, a.z as number)
        )
          throw new Error(sourceText("m_ab80ea08cd"));
        if (
          typeof a.tool !== 'string' ||
          ![...TOOLS.map((t) => t.id), 'build', 'fertilize'].includes(a.tool)
        )
          throw new Error(sourceText("m_091013ca14"));
        const selection =
          typeof a.selection === 'string' ? a.selection : 'wheat';
        if (
          (a.tool === 'build' && !Object.hasOwn(BUILDINGS, selection)) ||
          (a.tool === 'seed' && !Object.hasOwn(CROPS, selection))
        )
          throw new Error(sourceText("m_c7b854675b"));
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
      title: sourceText("m_00115f4ec9"),
      description:
        sourceText("m_159487bb60"),
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
          throw new Error(sourceText("m_a1e539aec9"));
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
  const context = (document as Document & { modelContext?: Context }).modelContext;
  let lifecycle = new AbortController();
  const register = () => {
    lifecycle.abort();
    lifecycle = new AbortController();
    if (!context?.registerTool) return;
    for (const tool of gameTools(engine, onChange, isPaused)) {
      try {
        void Promise.resolve(
          context.registerTool({...tool, title: localizeText(tool.title), description: localizeText(tool.description)}, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    }
  };
  register();
  const unsubscribe = context?.registerTool ? subscribeLocale(register) : () => {};
  return () => { unsubscribe(); lifecycle.abort(); };
}
