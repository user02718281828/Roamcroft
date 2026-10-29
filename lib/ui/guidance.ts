'use client';
import { useEffect, useSyncExternalStore } from 'react';

export const GUIDANCE_KEY = 'roamcroft.guidance.v1';
export function readGuidance(storage: Pick<Storage, 'getItem'> | undefined): boolean {
  try { return storage?.getItem(GUIDANCE_KEY) !== 'off'; } catch { return true; }
}
let current = true, initialized = false;
const listeners = new Set<() => void>();
function publish(enabled: boolean) { if (current === enabled) return; current = enabled; for (const listener of listeners) listener(); }
export function setGuidance(enabled: boolean) {
  try { window.localStorage.setItem(GUIDANCE_KEY, enabled ? 'on' : 'off'); } catch { /* Session preference still works without storage. */ }
  publish(enabled);
}
export function useGuidance() {
  const enabled = useSyncExternalStore(listener => {listeners.add(listener); return () => {listeners.delete(listener);};}, () => current, () => true);
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    try { publish(readGuidance(window.localStorage)); } catch { publish(true); }
    window.addEventListener('storage', event => {
      if (event.key === GUIDANCE_KEY || event.key === null) {
        try { publish(readGuidance(window.localStorage)); } catch { publish(true); }
      }
    });
  }, []);
  return [enabled, setGuidance] as const;
}
