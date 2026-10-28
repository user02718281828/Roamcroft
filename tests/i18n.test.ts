import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import tr from '../lib/i18n/tr.json' with { type: 'json' };
import en from '../lib/i18n/en.json' with { type: 'json' };
import { formatMessage, sourceText, type MessageKey } from '../lib/i18n/source.ts';
import { localizeText, translate, translateFor } from '../lib/i18n/core.ts';
import { detectLocale, readLocale, setLocale, getLocale, intlLocale, subscribeLocale, LOCALE_STORAGE_KEY } from '../lib/i18n/locale.ts';
import { createState, Engine, SAVE_VERSION } from '../lib/game/model.ts';
import { serialize, deserialize, SAVE_KEY } from '../lib/game/save.ts';
import { ITEMS, BUILDINGS, CROPS, QUESTS, SEASONS, TALENTS, ANIMALS, RECIPES } from '../lib/game/data.ts';
import { NPCS, LANDMARKS, ACHIEVEMENTS } from '../lib/game/content.ts';
import { FLOOR_NAMES, ENEMIES } from '../lib/game/expedition.ts';
import { SHARED_PROTOCOL } from '../lib/server/shared-protocol.ts';
import { REALTIME_VERSION } from '../lib/coop/realtime-protocol.ts';

test('both dictionaries and generated parameter types/manifests are complete', () => {
  assert.deepEqual(Object.keys(tr).sort(), Object.keys(en).sort());
  for (const key of Object.keys(tr) as MessageKey[]) {
    const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
    assert.ok(tr[key].trim() && en[key].trim(), key);
    assert.deepEqual(params(tr[key]), params(en[key]), key);
  }
  execFileSync(process.execPath, ['scripts/generate-i18n.mjs', '--check'], {cwd: new URL('..', import.meta.url), stdio: 'pipe'});
});

test('all authored catalog labels, descriptions and dialogue have English entries', () => {
  const authored = new Set(Object.values(tr));
  function check(value: unknown, property = '') {
    if (typeof value === 'string') {
      if (['name','desc','description','role','reward'].includes(property) && /[çğıöşüÇĞİÖŞÜ]|\s/.test(value)) assert.ok(authored.has(value), value);
    } else if (Array.isArray(value)) value.forEach(child => check(child, property));
    else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) check(child, key);
  }
  [ITEMS, BUILDINGS, CROPS, QUESTS, TALENTS, ANIMALS, RECIPES, LANDMARKS, ACHIEVEMENTS, ENEMIES].forEach(value => check(value));
  for (const name of [...SEASONS, ...FLOOR_NAMES]) assert.ok(authored.has(name), name);
  for (const npc of NPCS) for (const lines of Object.values(npc.dialogue)) for (const line of lines) assert.ok(authored.has(line), line);
});

test('explicit preference wins; every first visit defaults to English regardless of browser language', () => {
  assert.equal(detectLocale('tr', ['en-US']), 'tr');
  assert.equal(detectLocale('en', ['tr-TR']), 'en');
  assert.equal(detectLocale(null, ['tr-TR']), 'en');
  assert.equal(detectLocale(null, ['TR_tr']), 'en');
  assert.equal(detectLocale(null, ['en-GB']), 'en');
  assert.equal(detectLocale('broken', ['de-DE', 'tr-TR']), 'en');
  assert.equal(detectLocale(null, []), 'en');
  const unavailable = {getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }};
  assert.equal(readLocale(unavailable, ['tr-TR']), 'en');
  assert.equal(readLocale(undefined, ['es']), 'en');
  assert.equal(readLocale({getItem: () => 'en', setItem() {}}, ['tr']), 'en');
});

test('locale preference is saved independently, listeners update once, and blocked storage still permits switching', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const writes: [string, string][] = [];
  let notifications = 0;
  setLocale('en');
  const unsubscribe = subscribeLocale(() => { notifications++; });
  try {
    Object.defineProperty(globalThis, 'window', {configurable: true, value: {localStorage: {setItem(key: string, value: string) {writes.push([key, value]);}}}});
    setLocale('tr'); setLocale('tr');
    assert.equal(getLocale(), 'tr'); assert.equal(intlLocale(), 'tr-TR');
    assert.equal(notifications, 1);
    assert.deepEqual(writes[0], [LOCALE_STORAGE_KEY, 'tr']);
    assert.notEqual(LOCALE_STORAGE_KEY, SAVE_KEY);
    Object.defineProperty(globalThis, 'window', {configurable: true, value: {get localStorage() {throw Error('blocked');}}});
    setLocale('en');
    assert.equal(getLocale(), 'en'); assert.equal(intlLocale(), 'en-US');
    assert.equal(notifications, 2);
    unsubscribe(); setLocale('tr'); assert.equal(notifications, 2);
  } finally {
    unsubscribe();
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    setLocale('en');
  }
});

test('typed templates preserve placeholder order, zeros and literal player replacement tokens', () => {
  assert.equal(translateFor('en', 'hud.calendar', {season: 'Spring', day: 0}), 'Spring · Day 0');
  assert.equal(translateFor('tr', 'hud.calendar', {season: 'İlkbahar', day: 7}), 'İlkbahar · 7. gün');
  assert.equal(formatMessage('{name} {count}', {name: '$& {p0}', count: 0}), '$& {p0} 0');
  // Compile-time contracts are checked by npm run typecheck; this function is never executed.
  const typeContracts = () => {
    // @ts-expect-error Unknown catalog key.
    translate('missing.translation.key');
    // @ts-expect-error A parameterized message requires its parameters.
    translate('hud.calendar');
    // @ts-expect-error Wrong placeholder name.
    translate('hud.calendar', {season: 'Spring', wrong: 1});
    // @ts-expect-error Unparameterized labels do not accept arbitrary values.
    translate('settings.language', {day: 1});
    // @ts-expect-error Templates require printable scalar values, not arbitrary objects.
    translate('hud.calendar', {season: {}, day: 1});
  };
  assert.equal(typeof typeContracts, 'function');
});

test('canonical server events translate with catalog names and preserve player text', () => {
  assert.equal(localizeText('+2 Odun', 'en'), '+2 Wood');
  assert.equal(localizeText('3 Buğday alındı.', 'en'), '3 Wheat bought.');
  assert.equal(localizeText('Seviye 3 gerekli.', 'en'), 'Level 3 required.');
  assert.equal(localizeText('12 odun topla.', 'en'), 'Gather 12 wood.');
  assert.equal(localizeText('12 odun topla.', 'tr'), '12 odun topla.');
  assert.equal(localizeText('İlkbahar, Sonbahar', 'en'), 'Spring, Autumn');
  assert.equal(localizeText('Seviye 3! Yeni tarifler ve yapılar açıldı.', 'en'), 'Level 3! New recipes and buildings unlocked.');
  assert.equal(localizeText('Taş: yuvanın adı kaydedildi.', 'en'), 'Taş: home name saved.');
  assert.equal(localizeText('Odun seninle yakınlaştı.', 'en', 0, ['Odun']), 'Odun grew closer to you.');
  assert.equal(localizeText('Taş · Odun', 'en', 0, ['Taş']), 'Taş · Wood');
  assert.equal(localizeText('🧑 My farm $& {p0}', 'en'), '🧑 My farm $& {p0}');
  const error = {error: 'Ev sahibinin bağlantısı bekleniyor.'};
  assert.equal(localizeText(error.error, 'en'), 'Waiting for the host to connect.');
  assert.equal(error.error, 'Ev sahibinin bağlantısı bekleniyor.');
});

test('switching language re-renders old messages without changing save payload, engine identity or network commands', () => {
  const engine = new Engine(createState(84621)), state = engine.s;
  state.settlement.name = 'Taş';
  const before = JSON.parse(serialize(state));
  const commands: unknown[] = [];
  const network = {guest: true, server: true, shared: true, peers: [], send(method: string, args: unknown[]) { commands.push([method, args]); return true; }};
  engine.network = network;
  setLocale('en');
  assert.equal(sourceText('m_97af3dbd9a', {p0: 3}), 'Seviye 3 gerekli.');
  assert.equal(translate('m_80ad54ad05'), 'Settings');
  engine.renameSettlement('My farm');
  setLocale('tr');
  assert.equal(translate('m_80ad54ad05'), 'Ayarlar');
  assert.equal(localizeText('Level 3 required.', 'tr'), 'Seviye 3 gerekli.');
  engine.renameSettlement('My farm');
  assert.equal(engine.s, state); assert.equal(engine.network, network);
  assert.deepEqual(commands, [['renameSettlement', ['My farm']], ['renameSettlement', ['My farm']]]);
  const after = JSON.parse(serialize(state));
  assert.deepEqual(after.payload, before.payload); assert.equal(after.checksum, before.checksum);
  assert.equal(after.format, 'ocak-vadisi'); assert.equal(SAVE_VERSION, 1);
  assert.equal(SHARED_PROTOCOL, 2); assert.equal(REALTIME_VERSION, 1);
  assert.equal(deserialize(serialize(state)).settlement.name, 'Taş');
  setLocale('en');
});

test('localized PWA manifests preserve origin, installed app identity and offline availability', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.json', import.meta.url), 'utf8'));
  const turkish = JSON.parse(readFileSync(new URL('../public/manifest.tr.json', import.meta.url), 'utf8'));
  assert.equal(manifest.lang, 'en'); assert.equal(turkish.lang, 'tr');
  const {lang: _en, description: _enDescription, ...enIdentity} = manifest;
  const {lang: _tr, description: _trDescription, ...trIdentity} = turkish;
  assert.deepEqual(enIdentity, trIdentity); assert.equal(manifest.id, '/');
  assert.ok(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8').includes("'/manifest.tr.json'"));
});
