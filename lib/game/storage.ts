import { sourceText } from '../i18n/source.ts';
import type { State } from './model.ts';
import {frameProfile} from './profile.ts';
import {
  serialize,
  deserialize,
  loadLocal,
  saveLocal,
  SAVE_KEY,
} from './save.ts';

type Snapshot = { state: State; savedAt: number };
let database: Promise<IDBDatabase> | null = null;
function openDatabase() {
  if (!database)
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('ocak-vadisi-worlds', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('saves');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        database = null;
        reject(request.error);
      };
      request.onblocked = () => {
        database = null;
        reject(new Error(sourceText("m_90bdc26ffd")));
      };
    });
  return database;
}
async function readSnapshot(key: string) {
  const db = await openDatabase();
  return new Promise<Snapshot | undefined>((resolve, reject) => {
    const store=db.transaction('saves','readonly').objectStore('saves'),head=store.get('head');
    head.onerror=()=>reject(head.error);
    head.onsuccess=()=>{
      const pointer=head.result as {current:string;backup:string}|undefined;
      const request=store.get(pointer?(key==='current'?pointer.current:pointer.backup):key);
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    };
  });
}
export async function loadStored() {
  try {
    const current = await readSnapshot('current');
    if (current) {
      // A page-close checkpoint may be newer than the last asynchronous transaction.
      try {
        const local = localStorage.getItem(SAVE_KEY);
        if (local && Date.parse(JSON.parse(local).savedAt) > current.savedAt)
          return {
            state: deserialize(local),
            message: sourceText("m_41dcb7a97e"),
          };
      } catch {}
      try {
        return {
          state: deserialize(serialize(current.state)),
          message: sourceText("m_9fa2f4b871"),
        };
      } catch {
        const backup = await readSnapshot('backup');
        if (backup)
          return {
            state: deserialize(serialize(backup.state)),
            message: sourceText("m_184d1b5f80"),
          };
      }
    }
  } catch {}
  return loadLocal();
}
let writing = false;
export async function saveStored(state: State): Promise<boolean> {
  if (writing) return false;
  writing = true;
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite'),
        store = tx.objectStore('saves');
      // Rotate immutable snapshots by a tiny pointer in the same transaction.
      // The previous save remains the backup; it is never cloned back to JS.
      const previous = store.get('head');
      previous.onsuccess = () => {
        const started=frameProfile.begin();
        const old=previous.result as {current:string;backup:string}|undefined;
        const current=old?.current==='snapshot-a'?'snapshot-b':'snapshot-a';
        store.put({ state, savedAt: Date.now() } satisfies Snapshot,current);
        store.put({current,backup:old?.current||'current'},'head');
        frameProfile.end('saveCloneCpu',started);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return true;
  } catch {
    return saveLocal(state);
  } finally {
    writing = false;
  }
}
