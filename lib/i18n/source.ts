import tr from './tr.json' with { type: 'json' };
import type { Parameters } from './parameters.ts';

export type MessageKey = keyof typeof tr;
export type MessageArgs<K extends MessageKey> = K extends keyof Parameters
  ? [values: Parameters[K]] : [];

/** A callback prevents replacement tokens in player names from being interpreted. */
export function formatMessage(template: string, values: Record<string, unknown> = {}): string {
  return template.replace(/\{(\w+)\}/g, (token, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : token);
}

/** Canonical Turkish remains the language of existing saves and wire messages. */
export function sourceText<K extends MessageKey>(key: K, ...args: MessageArgs<K>): string {
  // Catalog/biome lookups also run in simulation hot paths; labels need no interpolation.
  return args.length ? formatMessage(tr[key], args[0]) : tr[key];
}
