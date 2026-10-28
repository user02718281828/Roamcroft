export const LOCALES = ['tr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_STORAGE_KEY = 'roamcroft.locale.v1';
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return value === 'tr' || value === 'en';
}

/** A deliberate user choice wins; every fresh session starts in English. */
export function detectLocale(saved: unknown, _languages: readonly string[] = []): Locale {
  if (isLocale(saved)) return saved;
  return DEFAULT_LOCALE;
}

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;
export function readLocale(storage: PreferenceStorage | undefined, languages: readonly string[]): Locale {
  let saved: unknown;
  try { saved = storage?.getItem(LOCALE_STORAGE_KEY); } catch { /* Storage may be blocked in a portal iframe. */ }
  return detectLocale(saved, languages);
}

let current: Locale = DEFAULT_LOCALE;
let initialized = false;
const listeners = new Set<() => void>();
export function getLocale(): Locale { return current; }
export function intlLocale(): string { return current === 'tr' ? 'tr-TR' : 'en-US'; }
export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function publish(locale: Locale) {
  const changed = locale !== current;
  current = locale;
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
  if (changed) for (const listener of listeners) listener();
}
export function setLocale(locale: Locale): void {
  if (!isLocale(locale)) return;
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch { /* The session still changes language. */ }
  }
  publish(locale);
}
export function initializeLocale(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  let storage: Storage | undefined;
  try { storage = window.localStorage; } catch { /* Private/embedded browser. */ }
  publish(readLocale(storage, navigator.languages?.length ? navigator.languages : [navigator.language]));
  window.addEventListener('storage', event => {
    if (event.key === LOCALE_STORAGE_KEY || event.key === null) {
      publish(readLocale(storage, navigator.languages?.length ? navigator.languages : [navigator.language]));
    }
  });
}
