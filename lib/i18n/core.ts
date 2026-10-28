import tr from './tr.json' with { type: 'json' };
import en from './en.json' with { type: 'json' };
import rawParameters from './raw-parameters.json' with { type: 'json' };
import { formatMessage, type MessageKey, type MessageArgs } from './source.ts';
import { getLocale, type Locale } from './locale.ts';

// Compilation rejects missing or additional English keys.
const english: Record<MessageKey, string> = en;
type ExtraEnglishKeys = Exclude<keyof typeof en, MessageKey>;
const noExtraKeys: Record<ExtraEnglishKeys, never> = {};
void noExtraKeys;

export function translateFor<K extends MessageKey>(locale: Locale, key: K, ...args: MessageArgs<K>): string {
  const text = locale === 'tr' ? tr[key] : english[key];
  return args.length ? formatMessage(text, args[0]) : text;
}
export function translate<K extends MessageKey>(key: K, ...args: MessageArgs<K>): string {
  return translateFor(getLocale(), key, ...args);
}

const exact = { tr: new Map<string, string>(), en: new Map<string, string>() };
const templates: { pattern: RegExp; target: Record<Locale, string>; names: string[]; weight: number; raw: Set<string> }[] = [];
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const key of Object.keys(tr) as MessageKey[]) {
  const target = { tr: tr[key], en: english[key] };
  const names = [...target.tr.matchAll(/\{(p\d+)\}/g)].map(match => match[1]);
  if (!names.length) {
    for (const from of ['tr', 'en'] as const) {
      for (const to of ['tr', 'en'] as const) {
        exact[to].set(target[from], target[to]);
        exact[to].set(target[from].toLocaleUpperCase(from), target[to].toLocaleUpperCase(to));
        exact[to].set(target[from].toLocaleLowerCase(from), target[to].toLocaleLowerCase(to));
      }
    }
  } else {
    for (const from of ['tr', 'en'] as const) {
      const input = target[from];
      const order = [...input.matchAll(/\{(p\d+)\}/g)].map(match => match[1]);
      const segments = input.split(/\{p\d+\}/g);
      // Name-only templates are deliberately not a blanket word translator.
      const weight = segments.join('').length;
      if (!weight) continue;
      templates.push({ pattern: new RegExp('^' + segments.map(escape).join('([\\s\\S]*?)') + '$'), target, names: order, weight, raw: new Set((rawParameters as Record<string, string[]>)[key] || []) });
    }
  }
}
// Case variants must never override an authored spelling. A Turkish sentence
// beginning with a number can already be all-lowercase while its English
// translation starts with a capital letter.
for (const key of Object.keys(tr) as MessageKey[]) {
  if (/\{\w+\}/.test(tr[key])) continue;
  for (const from of ['tr', 'en'] as const) {
    const input = from === 'tr' ? tr[key] : english[key];
    exact.tr.set(input, tr[key]);
    exact.en.set(input, english[key]);
  }
}
templates.sort((a, b) => b.weight - a.weight);
const caches = { tr: new Map<string, string>(), en: new Map<string, string>() };

/** Presentation bridge for canonical data and messages from old/current servers.
 * Call only for authored content, never for a free-form player name or input value.
 * Unknown text passes through. No save, event or response object is mutated.
 */
export function localizeText(text: string, locale: Locale = getLocale(), depth = 0, protectedValues: readonly string[] = []): string {
  if (protectedValues.includes(text)) return text;
  const direct = exact[locale].get(text);
  if (direct !== undefined) return direct;
  if (text.length > 4096 || depth > 4) return text;
  const list = text.split(/( · |, | \+ | → )/);
  if (list.length > 1 && list.every((piece, index) => index % 2 || exact[locale].has(piece) || protectedValues.includes(piece))) {
    return list.map((piece, index) => index % 2 || protectedValues.includes(piece) ? piece : exact[locale].get(piece)!).join('');
  }
  const cached = protectedValues.length ? undefined : caches[locale].get(text);
  if (cached !== undefined) return cached;
  let result = text;
  for (const template of templates) {
    const match = template.pattern.exec(text);
    if (!match) continue;
    const values = Object.fromEntries(template.names.map((name, index) => [name,
      template.raw.has(name) ? match[index + 1] : localizeText(match[index + 1], locale, depth + 1, protectedValues)]));
    result = formatMessage(template.target[locale], values);
    break;
  }
  if (!protectedValues.length) {
    if (caches[locale].size >= 512) caches[locale].clear();
    caches[locale].set(text, result);
  }
  return result;
}

/** JSX expressions can also contain numbers, arrays and React elements. */
export function localize<T>(value: T): T {
  if (typeof value === 'string') return localizeText(value) as T;
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) return value.map(item => localize(item)) as T;
  return value;
}
