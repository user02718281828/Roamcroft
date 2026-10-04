import test from 'node:test';
import assert from 'node:assert/strict';
import { indexedDB } from 'fake-indexeddb';
import { createState } from '../lib/game/model.ts';
import { saveStored, loadStored } from '../lib/game/storage.ts';

test('atomic save rotation loads current, retains legacy and recovers the previous valid snapshot', async () => {
  Object.defineProperty(globalThis, 'indexedDB', {
    value: indexedDB,
    configurable: true,
  });
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => values.get(k) || null,
      setItem: (k: string, v: string) => values.set(k, v),
      removeItem: (k: string) => values.delete(k),
    },
    configurable: true,
  });
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('ocak-vadisi-worlds', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saves');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const put = async (key: string, value: unknown) =>
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite');
      tx.objectStore('saves').put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  const get = async (key: string) =>
    new Promise<any>((resolve, reject) => {
      const request = db
        .transaction('saves', 'readonly')
        .objectStore('saves')
        .get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  const state = createState();
  state.gold = 211;
  await put('current', { state: structuredClone(state), savedAt: 1 });
  assert.equal((await loadStored()).state!.gold, 211);
  state.gold = 322;
  assert.equal(await saveStored(state), true);
  assert.deepEqual(await get('head'), {
    current: 'snapshot-a',
    backup: 'current',
  });
  assert.equal((await loadStored()).state!.gold, 322);
  state.gold = 433;
  assert.equal(await saveStored(state), true);
  assert.deepEqual(await get('head'), {
    current: 'snapshot-b',
    backup: 'snapshot-a',
  });
  state.gold = 999; // Subsequent live mutation must not mutate a committed snapshot.
  assert.equal((await loadStored()).state!.gold, 433);
  await put('snapshot-b', { state: { invalid: true }, savedAt: 3 });
  const recovered = await loadStored();
  assert.equal(recovered.state!.gold, 322);
  assert.match(recovered.message, /Yedek/);
  const before = await get('head');
  await new Promise<void>((resolve) => {
    const tx = db.transaction('saves', 'readwrite');
    tx.objectStore('saves').put(
      { current: 'missing', backup: 'missing' },
      'head',
    );
    tx.abort();
    tx.onabort = () => resolve();
  });
  assert.deepEqual(
    await get('head'),
    before,
    'aborted transactions must not publish a new head',
  );
  db.close();
});
